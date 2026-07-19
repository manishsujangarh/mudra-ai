package expo.modules.mudracamera

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.View
import com.google.mediapipe.tasks.vision.gesturerecognizer.GestureRecognizerResult
import kotlin.math.max
import kotlin.math.sqrt

class OverlayView(context: Context?, attrs: AttributeSet?) : View(context, attrs) {
    var currentMudraId: String = "mudra-gyan" // Default

    private var results: GestureRecognizerResult? = null
    
    // Status trackers for individual fingers
    private var thumbOk = false
    private var indexOk = false
    private var middleOk = false
    private var ringOk = false
    private var pinkyOk = false
    private var isMudraPerfect = false

    private val jointPaint = Paint().apply { color = Color.WHITE; strokeWidth = 12f; style = Paint.Style.FILL; isAntiAlias = true }
    private val correctBonePaint = Paint().apply { color = Color.GREEN; strokeWidth = 10f; style = Paint.Style.STROKE; isAntiAlias = true }
    private val incorrectBonePaint = Paint().apply { color = Color.RED; strokeWidth = 10f; style = Paint.Style.STROKE; isAntiAlias = true }

    // MediaPipe Hand Connections List
    private val handConnections = listOf(
        Pair(0, 1), Pair(1, 2), Pair(2, 3), Pair(3, 4),       // Thumb
        Pair(0, 5), Pair(5, 6), Pair(6, 7), Pair(7, 8),       // Index
        Pair(5, 9), Pair(9, 10), Pair(10, 11), Pair(11, 12),  // Middle
        Pair(9, 13), Pair(13, 14), Pair(14, 15), Pair(15, 16),// Ring
        Pair(13, 17), Pair(0, 17), Pair(17, 18), Pair(18, 19), Pair(19, 20) // Pinky
    )

    init { setWillNotDraw(false) }

    fun clear() { results = null; isMudraPerfect = false; postInvalidate() }

    // Math Function to calculate distance between two landmarks
    private fun dist(p1: com.google.mediapipe.tasks.components.containers.NormalizedLandmark, p2: com.google.mediapipe.tasks.components.containers.NormalizedLandmark): Double {
        val dx = p1.x() - p2.x()
        val dy = p1.y() - p2.y()
        return sqrt((dx * dx + dy * dy).toDouble())
    }

    fun setResultsAndCheck(gestureRecognizerResult: GestureRecognizerResult): Boolean {
        results = gestureRecognizerResult
        
        val landmarks = results?.landmarks()
        if (!landmarks.isNullOrEmpty()) {
            val landmark = landmarks[0]
            val wrist = landmark[0]

            // Finger Tips
            val thumbTip = landmark[4]
            val indexTip = landmark[8]
            val middleTip = landmark[12]
            val ringTip = landmark[16]
            val pinkyTip = landmark[20]

            // ADVANCED LOGIC: Check if fingers are extended or folded based on relative MCP joint distances
            // If the tip is further from the wrist than the knuckle (MCP), it is extended.
            val isIndexExt = dist(indexTip, wrist) > dist(landmark[5], wrist)
            val isIndexFolded = !isIndexExt

            val isMiddleExt = dist(middleTip, wrist) > dist(landmark[9], wrist)
            val isMiddleFolded = !isMiddleExt

            val isRingExt = dist(ringTip, wrist) > dist(landmark[13], wrist)
            val isRingFolded = !isRingExt

            val isPinkyExt = dist(pinkyTip, wrist) > dist(landmark[17], wrist)
            val isPinkyFolded = !isPinkyExt

            val isThumbExt = dist(thumbTip, wrist) > dist(landmark[2], wrist)
            val isThumbFolded = !isThumbExt

            // Touch Tolerance
            val TOUCH_TOLERANCE = 0.09

            // ==========================================
            // MUDRA MASTER LOGIC ROUTER
            // ==========================================
            when (currentMudraId) {
                "mudra-gyan" -> {
                    val match = dist(thumbTip, indexTip) < TOUCH_TOLERANCE
                    thumbOk = match; indexOk = match
                    middleOk = isMiddleExt; ringOk = isRingExt; pinkyOk = isPinkyExt
                }
                "mudra-prana" -> {
                    val match = (dist(thumbTip, ringTip) < TOUCH_TOLERANCE) && (dist(thumbTip, pinkyTip) < TOUCH_TOLERANCE)
                    thumbOk = match; ringOk = match; pinkyOk = match
                    indexOk = isIndexExt; middleOk = isMiddleExt
                }
                "mudra-apana" -> {
                    val match = (dist(thumbTip, middleTip) < TOUCH_TOLERANCE) && (dist(thumbTip, ringTip) < TOUCH_TOLERANCE)
                    thumbOk = match; middleOk = match; ringOk = match
                    indexOk = isIndexExt; pinkyOk = isPinkyExt
                }
                "mudra-vayu" -> {
                    val indexFoldedCorrectly = dist(indexTip, landmark[2]) < 0.12 || dist(indexTip, wrist) < 0.15
                    val thumbPressing = dist(thumbTip, landmark[6]) < 0.12
                    
                    indexOk = indexFoldedCorrectly
                    thumbOk = thumbPressing
                    middleOk = isMiddleExt; ringOk = isRingExt; pinkyOk = isPinkyExt
                }
                "mudra-shunya" -> {
                    val middleFoldedCorrectly = dist(middleTip, landmark[2]) < 0.12 || dist(middleTip, wrist) < 0.15
                    val thumbPressing = dist(thumbTip, landmark[10]) < 0.12

                    middleOk = middleFoldedCorrectly
                    thumbOk = thumbPressing
                    indexOk = isIndexExt; ringOk = isRingExt; pinkyOk = isPinkyExt
                }
                "mudra-surya" -> {
                    val ringFoldedCorrectly = dist(ringTip, landmark[2]) < 0.12 || dist(ringTip, wrist) < 0.15
                    val thumbPressing = dist(thumbTip, landmark[14]) < 0.12

                    ringOk = ringFoldedCorrectly
                    thumbOk = thumbPressing
                    indexOk = isIndexExt; middleOk = isMiddleExt; pinkyOk = isPinkyExt
                }
                "mudra-buddhi", "mudra-varun" -> {
                    val match = dist(thumbTip, pinkyTip) < TOUCH_TOLERANCE
                    thumbOk = match; pinkyOk = match
                    indexOk = isIndexExt; middleOk = isMiddleExt; ringOk = isRingExt
                }
                "mudra-prithvi" -> {
                    val match = dist(thumbTip, ringTip) < TOUCH_TOLERANCE
                    thumbOk = match; ringOk = match
                    indexOk = isIndexExt; middleOk = isMiddleExt; pinkyOk = isPinkyExt
                }
                "mudra-apan-vayu" -> {
                    indexOk = dist(indexTip, landmark[2]) < 0.12 || dist(indexTip, wrist) < 0.15
                    val match = (dist(thumbTip, middleTip) < TOUCH_TOLERANCE) && (dist(thumbTip, ringTip) < TOUCH_TOLERANCE)
                    thumbOk = match; middleOk = match; ringOk = match
                    pinkyOk = isPinkyExt
                }
                "mudra-adi", "mudra-brahma" -> {
                    thumbOk = dist(thumbTip, landmark[17]) < 0.15 || dist(thumbTip, landmark[13]) < 0.15
                    indexOk = isIndexFolded; middleOk = isMiddleFolded; ringOk = isRingFolded; pinkyOk = isPinkyFolded
                }
                "mudra-linga" -> {
                    thumbOk = isThumbExt
                    indexOk = isIndexFolded; middleOk = isMiddleFolded; ringOk = isRingFolded; pinkyOk = isPinkyFolded
                }
                "mudra-kubera" -> {
                    val match = (dist(thumbTip, indexTip) < TOUCH_TOLERANCE) && (dist(thumbTip, middleTip) < TOUCH_TOLERANCE)
                    thumbOk = match; indexOk = match; middleOk = match
                    ringOk = isRingFolded; pinkyOk = isPinkyFolded
                }
                "mudra-rudra" -> {
                    val match = (dist(thumbTip, indexTip) < TOUCH_TOLERANCE) && (dist(thumbTip, ringTip) < TOUCH_TOLERANCE)
                    thumbOk = match; indexOk = match; ringOk = match
                    middleOk = isMiddleExt; pinkyOk = isPinkyExt
                }
                "mudra-uttarabodhi" -> {
                    indexOk = isIndexExt
                    thumbOk = isThumbFolded; middleOk = isMiddleFolded; ringOk = isRingFolded; pinkyOk = isPinkyFolded
                }
                // Default handling for 2-handed flat mudras (Dhyana, Pushpaputa, Naga, Bhairava, Anjali, Garuda)
                "mudra-dhyana", "mudra-pushpaputa", "mudra-naga", "mudra-bhairava", "mudra-anjali", "mudra-garuda" -> {
                    thumbOk = isThumbExt; indexOk = isIndexExt; middleOk = isMiddleExt; ringOk = isRingExt; pinkyOk = isPinkyExt
                }
                else -> {
                    thumbOk = true; indexOk = true; middleOk = true; ringOk = true; pinkyOk = true
                }
            }
            
            // Final Evaluation: Is the whole Mudra correct?
            isMudraPerfect = thumbOk && indexOk && middleOk && ringOk && pinkyOk
        } else {
            isMudraPerfect = false
        }
        postInvalidate()
        return isMudraPerfect
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        results?.landmarks()?.forEach { landmark ->
            for (connection in handConnections) {
                val startX = landmark[connection.first].x() * width
                val startY = landmark[connection.first].y() * height
                val endX = landmark[connection.second].x() * width
                val endY = landmark[connection.second].y() * height
                
                // Color mapping: Determines which finger the current bone belongs to
                val p = max(connection.first, connection.second)
                val isFingerOk = when {
                    p <= 4 -> thumbOk
                    p <= 8 -> indexOk
                    p <= 12 -> middleOk
                    p <= 16 -> ringOk
                    else -> pinkyOk
                }
                
                val currentPaint = if (isFingerOk) correctBonePaint else incorrectBonePaint
                canvas.drawLine(startX, startY, endX, endY, currentPaint)
            }
            
            for (pt in landmark) {
                canvas.drawCircle(pt.x() * width, pt.y() * height, 12f, jointPaint)
            }
        }
    }
}