package com.hinges

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.views.view.ReactViewGroup

class HingesView(context: Context) : ReactViewGroup(context), SensorEventListener {
  private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private var hingeSensor: Sensor? = null
  private var hingeAngle: Double? = null
  private var lastHinges: List<HingeState> = emptyList()
  private var onHingesChange: ((HingesView, List<HingeState>) -> Unit)? = null
  private var tracker: WindowInfoTrackerCallbackAdapter? = null
  private val layoutInfoConsumer = Consumer<WindowLayoutInfo> { info ->
    foldingFeatures = info.displayFeatures.filterIsInstance<FoldingFeature>()
    updateHinge()
  }
  private var foldingFeatures: List<FoldingFeature> = emptyList()

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    startHingeSensor()
    val activity = (context as? ThemedReactContext)?.currentActivity
    if (activity != null) {
      tracker = WindowInfoTrackerCallbackAdapter(WindowInfoTracker.getOrCreate(context))
      tracker?.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(context), layoutInfoConsumer)
    }
  }

  override fun onDetachedFromWindow() {
    tracker?.removeWindowLayoutInfoListener(layoutInfoConsumer)
    tracker = null
    sensorManager.unregisterListener(this)
    hingeSensor = null
    hingeAngle = null
    foldingFeatures = emptyList()
    updateHinge()
    super.onDetachedFromWindow()
  }

  private fun startHingeSensor() {
    if (!isAttachedToWindow) return
    if (hingeSensor == null && Build.VERSION.SDK_INT >= 30) {
      hingeSensor = sensorManager.getSensorList(Sensor.TYPE_HINGE_ANGLE).singleOrNull()
      hingeSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL) }
    }
    updateHinge()
  }

  override fun onSensorChanged(event: SensorEvent) {
    hingeAngle = Math.toRadians(event.values[0].toDouble())
    updateHinge()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  internal fun setOnHingesChangeHandler(handler: (HingesView, List<HingeState>) -> Unit) {
    onHingesChange = handler
    handler(this, lastHinges)
  }

  private fun updateHinge() {
    // Android sensors have no WindowManager feature ID; do not associate multiple hinges.
    val hinges = foldingFeatures.map { feature ->
      val status = when (feature.state) {
        FoldingFeature.State.FLAT -> "fullyOpen"
        FoldingFeature.State.HALF_OPENED -> "partiallyOpen"
        else -> "unknown"
      }
      HingeState(status, if (foldingFeatures.size == 1) hingeAngle else null)
    }.ifEmpty {
      if (hingeSensor != null) listOf(HingeState("unknown", hingeAngle)) else emptyList()
    }
    if (hinges != lastHinges) {
      lastHinges = hinges
      onHingesChange?.invoke(this, hinges)
    }
  }

}
