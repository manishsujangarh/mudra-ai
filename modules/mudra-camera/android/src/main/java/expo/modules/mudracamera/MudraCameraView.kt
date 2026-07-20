package expo.modules.mudracamera

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.util.Log
import android.widget.FrameLayout
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

@SuppressLint("ViewConstructor")
class MudraCameraView(context: Context, appContext: AppContext) : ExpoView(context, appContext),
    GestureRecognizerHelper.GestureRecognizerListener {

    private val onAIStatusChange by EventDispatcher()

    private var previewView: PreviewView = PreviewView(context)
    private var overlayView: OverlayView = OverlayView(context, null)
    private var gestureRecognizerHelper: GestureRecognizerHelper? = null
    private var cameraProvider: ProcessCameraProvider? = null
    private var imageAnalyzer: ImageAnalysis? = null
    private var backgroundExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    private var isFrontCamera: Boolean = true

    init {
        previewView.layoutParams =
            FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        overlayView.layoutParams =
            FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT)
        previewView.scaleType = PreviewView.ScaleType.FILL_CENTER
        previewView.implementationMode = PreviewView.ImplementationMode.COMPATIBLE
        overlayView.setBackgroundColor(Color.TRANSPARENT)
        overlayView.elevation = 10f

        addView(previewView)
        addView(overlayView)

        sendStatusToJS("Loading AI Model...")
    }

    fun setMudraId(id: String) {
        overlayView.currentMudraId = id
    }

    fun setCameraType(type: String) {
        val newIsFront = (type == "front")
        if (isFrontCamera != newIsFront) {
            isFrontCamera = newIsFront
            
            imageAnalyzer?.clearAnalyzer()
            cameraProvider?.unbindAll()
            
            gestureRecognizerHelper?.clearGestureRecognizer()
            gestureRecognizerHelper?.setupGestureRecognizer()
            
            bindCameraUseCases()
        }
    }

    private fun sendStatusToJS(status: String) {
        onAIStatusChange(mapOf("status" to status))
    }

    override fun requestLayout() {
        super.requestLayout()
        post {
            measure(
                MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
            )
            layout(left, top, right, bottom)
            previewView.layout(0, 0, width, height)
            overlayView.layout(0, 0, width, height)
            overlayView.bringToFront()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        post { setupCamera() }
    }

    private fun setupCamera() {
        gestureRecognizerHelper = GestureRecognizerHelper(context = context, gestureRecognizerListener = this)
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            bindCameraUseCases()
        }, ContextCompat.getMainExecutor(context))
    }

    @SuppressLint("UnsafeOptInUsageError")
    private fun bindCameraUseCases() {
        val cameraProvider = cameraProvider ?: return

        val lensFacing = if (isFrontCamera) CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
        val cameraSelector = CameraSelector.Builder().requireLensFacing(lensFacing).build()

        val preview = Preview.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
            .build()
            .also { it.setSurfaceProvider(previewView.surfaceProvider) }

        imageAnalyzer = ImageAnalysis.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_4_3)
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
            .build()
            .also {
                it.setAnalyzer(backgroundExecutor) { imageProxy ->
                    gestureRecognizerHelper?.recognizeLiveStream(imageProxy, isFrontCamera)
                }
            }

        cameraProvider.unbindAll()

        try {
            val lifecycleOwner = (context as? LifecycleOwner) ?: (appContext.currentActivity as? LifecycleOwner)
            if (lifecycleOwner != null) {
                cameraProvider.bindToLifecycle(lifecycleOwner, cameraSelector, preview, imageAnalyzer)
            } else {
                sendStatusToJS("Error: Lifecycle not found")
            }
        } catch (exc: Exception) {
            sendStatusToJS("Camera Blocked: ${exc.message}")
        }
    }

    override fun onError(error: String) {
        sendStatusToJS("AI Error: $error")
    }

    override fun onResults(resultBundle: GestureRecognizerHelper.ResultBundle) {
        post {
            if (resultBundle.results.isNotEmpty() && resultBundle.results[0].landmarks().isNotEmpty()) {
                val result = resultBundle.results[0]
                val checkResult = overlayView.setResultsAndCheck(result)
                sendStatusToJS(checkResult.feedbackMessage)
            } else {
                overlayView.clear()
                sendStatusToJS("No Hand Detected 🔴")
            }
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        backgroundExecutor.shutdown()
        gestureRecognizerHelper?.clearGestureRecognizer()
    }
}