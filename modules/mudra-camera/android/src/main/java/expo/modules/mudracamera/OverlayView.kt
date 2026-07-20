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

data class MudraCheckResult(val isPerfect: Boolean, val feedbackMessage: String)

data class HandStatus(
    var thumbOk: Boolean = false,
    var indexOk: Boolean = false,
    var middleOk: Boolean = false,
    var ringOk: Boolean = false,
    var pinkyOk: Boolean = false
) {
    val isPerfect get() = thumbOk && indexOk && middleOk && ringOk && pinkyOk
}

class OverlayView(context: Context?, attrs: AttributeSet?) : View(context, attrs) {
    var currentMudraId: String = "mudra-gyan" 

    private var results: GestureRecognizerResult? = null
    private var handStatuses = mutableListOf<HandStatus>()
    private var isMudraPerfect = false

    private val jointPaint = Paint().apply { color = Color.WHITE; strokeWidth = 12f; style = Paint.Style.FILL; isAntiAlias = true }
    private val correctBonePaint = Paint().apply { color = Color.GREEN; strokeWidth = 10f; style = Paint.Style.STROKE; isAntiAlias = true }
    private val incorrectBonePaint = Paint().apply { color = Color.RED; strokeWidth = 10f; style = Paint.Style.STROKE; isAntiAlias = true }

    private val handConnections = listOf(
        Pair(0, 1), Pair(1, 2), Pair(2, 3), Pair(3, 4),
        Pair(0, 5), Pair(5, 6), Pair(6, 7), Pair(7, 8),
        Pair(5, 9), Pair(9, 10), Pair(10, 11), Pair(11, 12),
        Pair(9, 13), Pair(13, 14), Pair(14, 15), Pair(15, 16),
        Pair(13, 17), Pair(0, 17), Pair(17, 18), Pair(18, 19), Pair(19, 20)
    )

    init { setWillNotDraw(false) }

    fun clear() {
        results = null; isMudraPerfect = false; handStatuses.clear(); postInvalidate()
    }

    private fun dist(p1: com.google.mediapipe.tasks.components.containers.NormalizedLandmark, p2: com.google.mediapipe.tasks.components.containers.NormalizedLandmark): Double {
        val dx = p1.x() - p2.x()
        val dy = p1.y() - p2.y()
        return sqrt((dx * dx + dy * dy).toDouble())
    }

    fun setResultsAndCheck(gestureRecognizerResult: GestureRecognizerResult): MudraCheckResult {
        results = gestureRecognizerResult
        val landmarks = results?.landmarks()
        
        handStatuses.clear()
        var customErrorMessage: String? = null

        if (!landmarks.isNullOrEmpty()) {
            val isTwoHandedMudra = currentMudraId in listOf("mudra-dhyana", "mudra-pushpaputa", "mudra-naga", "mudra-bhairava", "mudra-anjali", "mudra-garuda")

            if (isTwoHandedMudra) {
                if (landmarks.size >= 2) {
                    val hand1 = landmarks[0]
                    val hand2 = landmarks[1]
                    val status = HandStatus()

                    when (currentMudraId) {
                        "mudra-anjali" -> {
                            val match = dist(hand1[8], hand2[8]) < 0.15 && dist(hand1[0], hand2[0]) < 0.20
                            status.apply { thumbOk = match; indexOk = match; middleOk = match; ringOk = match; pinkyOk = match }
                        }
                        "mudra-dhyana", "mudra-bhairava" -> {
                            val match = dist(hand1[4], hand2[4]) < 0.15 && dist(hand1[0], hand2[0]) < 0.25
                            status.apply { thumbOk = match; indexOk = match; middleOk = match; ringOk = match; pinkyOk = match }
                        }
                        "mudra-pushpaputa" -> {
                            val match = dist(hand1[20], hand2[20]) < 0.20
                            status.apply { thumbOk = match; indexOk = match; middleOk = match; ringOk = match; pinkyOk = match }
                        }
                        "mudra-garuda", "mudra-naga" -> {
                            val match = dist(hand1[0], hand2[0]) < 0.15
                            status.apply { thumbOk = match; indexOk = match; middleOk = match; ringOk = match; pinkyOk = match }
                        }
                    }
                    handStatuses.add(status)
                    handStatuses.add(status)
                } else {
                    handStatuses.add(HandStatus(false, false, false, false, false))
                    customErrorMessage = "Show both hands 🤲"
                }
            } else {
                for (landmark in landmarks) {
                    val status = HandStatus()
                    val wrist = landmark[0]
                    val thumbTip = landmark[4]; val indexTip = landmark[8]; val middleTip = landmark[12]; val ringTip = landmark[16]; val pinkyTip = landmark[20]

                    val isIndexExt = dist(indexTip, wrist) > dist(landmark[5], wrist); val isIndexFolded = !isIndexExt
                    val isMiddleExt = dist(middleTip, wrist) > dist(landmark[9], wrist); val isMiddleFolded = !isMiddleExt
                    val isRingExt = dist(ringTip, wrist) > dist(landmark[13], wrist); val isRingFolded = !isRingExt
                    val isPinkyExt = dist(pinkyTip, wrist) > dist(landmark[17], wrist); val isPinkyFolded = !isPinkyExt
                    val isThumbExt = dist(thumbTip, wrist) > dist(landmark[2], wrist); val isThumbFolded = !isThumbExt

                    val TOUCH_TOLERANCE = 0.09

                    when (currentMudraId) {
                        "mudra-gyan" -> {
                            val match = dist(thumbTip, indexTip) < TOUCH_TOLERANCE
                            status.apply { thumbOk = match; indexOk = match; middleOk = isMiddleExt; ringOk = isRingExt; pinkyOk = isPinkyExt }
                        }
                        "mudra-prana" -> {
                            val match = (dist(thumbTip, ringTip) < TOUCH_TOLERANCE) && (dist(thumbTip, pinkyTip) < TOUCH_TOLERANCE)
                            status.apply { thumbOk = match; indexOk = isIndexExt; middleOk = isMiddleExt; ringOk = match; pinkyOk = match }
                        }
                        "mudra-apana" -> {
                            val match = (dist(thumbTip, middleTip) < TOUCH_TOLERANCE) && (dist(thumbTip, ringTip) < TOUCH_TOLERANCE)
                            status.apply { thumbOk = match; indexOk = isIndexExt; middleOk = match; ringOk = match; pinkyOk = isPinkyExt }
                        }
                        "mudra-vayu" -> {
                            val matchIndex = dist(indexTip, landmark[2]) < 0.12 || dist(indexTip, wrist) < 0.15
                            val matchThumb = dist(thumbTip, landmark[6]) < 0.12
                            status.apply { thumbOk = matchThumb; indexOk = matchIndex; middleOk = isMiddleExt; ringOk = isRingExt; pinkyOk = isPinkyExt }
                        }
                        "mudra-shunya" -> {
                            val matchMiddle = dist(middleTip, landmark[2]) < 0.12 || dist(middleTip, wrist) < 0.15
                            val matchThumb = dist(thumbTip, landmark[10]) < 0.12
                            status.apply { thumbOk = matchThumb; indexOk = isIndexExt; middleOk = matchMiddle; ringOk = isRingExt; pinkyOk = isPinkyExt }
                        }
                        "mudra-surya" -> {
                            val matchRing = dist(ringTip, landmark[2]) < 0.12 || dist(ringTip, wrist) < 0.15
                            val matchThumb = dist(thumbTip, landmark[14]) < 0.12
                            status.apply { thumbOk = matchThumb; indexOk = isIndexExt; middleOk = isMiddleExt; ringOk = matchRing; pinkyOk = isPinkyExt }
                        }
                        "mudra-buddhi", "mudra-varun" -> {
                            val match = dist(thumbTip, pinkyTip) < TOUCH_TOLERANCE
                            status.apply { thumbOk = match; indexOk = isIndexExt; middleOk = isMiddleExt; ringOk = isRingExt; pinkyOk = match }
                        }
                        "mudra-prithvi" -> {
                            val match = dist(thumbTip, ringTip) < TOUCH_TOLERANCE
                            status.apply { thumbOk = match; indexOk = isIndexExt; middleOk = isMiddleExt; ringOk = match; pinkyOk = isPinkyExt }
                        }
                        "mudra-apan-vayu" -> {
                            val matchIndex = dist(indexTip, landmark[2]) < 0.12 || dist(indexTip, wrist) < 0.15
                            val match = (dist(thumbTip, middleTip) < TOUCH_TOLERANCE) && (dist(thumbTip, ringTip) < TOUCH_TOLERANCE)
                            status.apply { thumbOk = match; indexOk = matchIndex; middleOk = match; ringOk = match; pinkyOk = isPinkyExt }
                        }
                        "mudra-adi", "mudra-brahma" -> {
                            val matchThumb = dist(thumbTip, landmark[17]) < 0.15 || dist(thumbTip, landmark[13]) < 0.15
                            status.apply { thumbOk = matchThumb; indexOk = isIndexFolded; middleOk = isMiddleFolded; ringOk = isRingFolded; pinkyOk = isPinkyFolded }
                        }
                        "mudra-linga" -> {
                            status.apply { thumbOk = isThumbExt; indexOk = isIndexFolded; middleOk = isMiddleFolded; ringOk = isRingFolded; pinkyOk = isPinkyFolded }
                        }
                        "mudra-kubera" -> {
                            val match = (dist(thumbTip, indexTip) < TOUCH_TOLERANCE) && (dist(thumbTip, middleTip) < TOUCH_TOLERANCE)
                            status.apply { thumbOk = match; indexOk = match; middleOk = match; ringOk = isRingFolded; pinkyOk = isPinkyFolded }
                        }
                        "mudra-rudra" -> {
                            val match = (dist(thumbTip, indexTip) < TOUCH_TOLERANCE) && (dist(thumbTip, ringTip) < TOUCH_TOLERANCE)
                            status.apply { thumbOk = match; indexOk = match; middleOk = isMiddleExt; ringOk = match; pinkyOk = isPinkyExt }
                        }
                        "mudra-uttarabodhi" -> {
                            status.apply { thumbOk = isThumbFolded; indexOk = isIndexExt; middleOk = isMiddleFolded; ringOk = isRingFolded; pinkyOk = isPinkyFolded }
                        }
                        else -> {
                            status.apply { thumbOk = true; indexOk = true; middleOk = true; ringOk = true; pinkyOk = true }
                        }
                    }
                    handStatuses.add(status)
                }
            }

            isMudraPerfect = handStatuses.isNotEmpty() && handStatuses.all { it.isPerfect }

            val message = if (isMudraPerfect) {
                "Perfect Match! 🟢"
            } else if (customErrorMessage != null) {
                customErrorMessage
            } else {
                val failedHand = handStatuses.firstOrNull { !it.isPerfect }
                if (failedHand != null) {
                    val errors = mutableListOf<String>()
                    if (!failedHand.thumbOk) errors.add("Thumb")
                    if (!failedHand.indexOk) errors.add("Index")
                    if (!failedHand.middleOk) errors.add("Middle")
                    if (!failedHand.ringOk) errors.add("Ring")
                    if (!failedHand.pinkyOk) errors.add("Pinky")
                    "Adjust: ${errors.joinToString(", ")} 🟡"
                } else {
                    "Adjust Fingers... 🟡"
                }
            }

            postInvalidate()
            return MudraCheckResult(isMudraPerfect, message)
        } else {
            isMudraPerfect = false
            postInvalidate()
            return MudraCheckResult(false, "No Hand Detected 🔴")
        }
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        results?.landmarks()?.forEachIndexed { index, landmark ->
            val status = handStatuses.getOrNull(index) ?: HandStatus(true, true, true, true, true)

            for (connection in handConnections) {
                val startX = landmark[connection.first].x() * width
                val startY = landmark[connection.first].y() * height
                val endX = landmark[connection.second].x() * width
                val endY = landmark[connection.second].y() * height

                val p = max(connection.first, connection.second)
                val isFingerOk = when {
                    p <= 4 -> status.thumbOk
                    p <= 8 -> status.indexOk
                    p <= 12 -> status.middleOk
                    p <= 16 -> status.ringOk
                    else -> status.pinkyOk
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