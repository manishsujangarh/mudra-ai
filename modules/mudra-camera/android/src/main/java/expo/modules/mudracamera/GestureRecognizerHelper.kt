package expo.modules.mudracamera

import android.content.Context
import android.os.SystemClock
import android.util.Log
import androidx.camera.core.ImageProxy
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.gesturerecognizer.GestureRecognizer
import com.google.mediapipe.tasks.vision.gesturerecognizer.GestureRecognizerResult

class GestureRecognizerHelper(
    var minHandDetectionConfidence: Float = 0.5f,
    var minHandTrackingConfidence: Float = 0.5f,
    var minHandPresenceConfidence: Float = 0.5f,
    var currentDelegate: Int = DELEGATE_CPU,
    var runningMode: RunningMode = RunningMode.LIVE_STREAM,
    val context: Context,
    val gestureRecognizerListener: GestureRecognizerListener? = null
) {
    private var gestureRecognizer: GestureRecognizer? = null
    
    private var lastFrameTime = 0L

    init {
        setupGestureRecognizer()
    }

    fun clearGestureRecognizer() {
        gestureRecognizer?.close()
        gestureRecognizer = null
    }

    fun setupGestureRecognizer() {
        val baseOptionBuilder = BaseOptions.builder()

        when (currentDelegate) {
            DELEGATE_CPU -> baseOptionBuilder.setDelegate(Delegate.CPU)
            DELEGATE_GPU -> baseOptionBuilder.setDelegate(Delegate.GPU)
        }

        baseOptionBuilder.setModelAssetPath("gesture_recognizer.task")

        try {
            val baseOptions = baseOptionBuilder.build()
            val optionsBuilder =
                GestureRecognizer.GestureRecognizerOptions.builder()
                    .setBaseOptions(baseOptions)
                    .setMinHandDetectionConfidence(minHandDetectionConfidence)
                    .setMinTrackingConfidence(minHandTrackingConfidence)
                    .setMinHandPresenceConfidence(minHandPresenceConfidence)
                    .setRunningMode(runningMode)
                    .setNumHands(2)

            if (runningMode == RunningMode.LIVE_STREAM) {
                optionsBuilder
                    .setResultListener(this::returnLivestreamResult)
                    .setErrorListener(this::returnLivestreamError)
            }

            val options = optionsBuilder.build()
            gestureRecognizer = GestureRecognizer.createFromOptions(context, options)
        } catch (e: Exception) {
            gestureRecognizerListener?.onError("Gesture recognizer failed to initialize")
            Log.e(TAG, "MediaPipe setup error: ", e)
        }
    }

    fun recognizeLiveStream(imageProxy: ImageProxy, isFrontCamera: Boolean = true) {
        val frameTime = SystemClock.uptimeMillis()
        
        if (frameTime <= lastFrameTime) {
            imageProxy.close()
            return
        }
        lastFrameTime = frameTime

        val bitmapBuffer = android.graphics.Bitmap.createBitmap(
            imageProxy.width,
            imageProxy.height,
            android.graphics.Bitmap.Config.ARGB_8888
        )
        imageProxy.use { bitmapBuffer.copyPixelsFromBuffer(imageProxy.planes[0].buffer) }
        imageProxy.close()

        val matrix = android.graphics.Matrix().apply {
            postRotate(imageProxy.imageInfo.rotationDegrees.toFloat())
            if (isFrontCamera) {
                postScale(-1f, 1f, imageProxy.width.toFloat(), imageProxy.height.toFloat())
            }
        }

        val rotatedBitmap = android.graphics.Bitmap.createBitmap(
            bitmapBuffer, 0, 0, bitmapBuffer.width, bitmapBuffer.height, matrix, true
        )

        val mpImage = BitmapImageBuilder(rotatedBitmap).build()
        recognizeAsync(mpImage, frameTime)
    }

    private fun recognizeAsync(mpImage: MPImage, frameTime: Long) {
        try {
            gestureRecognizer?.recognizeAsync(mpImage, frameTime)
        } catch (e: Exception) {
            Log.e(TAG, "MediaPipe Exception handled securely!", e)
            clearGestureRecognizer()
            setupGestureRecognizer()
        }
    }

    private fun returnLivestreamResult(result: GestureRecognizerResult, input: MPImage) {
        val finishTimeMs = SystemClock.uptimeMillis()
        val inferenceTime = finishTimeMs - result.timestampMs()
        gestureRecognizerListener?.onResults(ResultBundle(listOf(result), inferenceTime, input.height, input.width))
    }

    private fun returnLivestreamError(error: RuntimeException) {
        gestureRecognizerListener?.onError(error.message ?: "Unknown error")
    }

    companion object {
        const val TAG = "GestureRecognizerHelper"
        const val DELEGATE_CPU = 0
        const val DELEGATE_GPU = 1
    }

    data class ResultBundle(val results: List<GestureRecognizerResult>, val inferenceTime: Long, val inputImageHeight: Int, val inputImageWidth: Int)

    interface GestureRecognizerListener {
        fun onError(error: String)
        fun onResults(resultBundle: ResultBundle)
    }
}