package com.appandflow.hinges

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.WindowSdkExtensions
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

internal data class HingeState(val status: String, val angle: Double?)

/**
 * Observes the Activity window's folding features and the default hinge-angle sensor
 * while started, reporting a deduplicated snapshot to [onChange].
 */
internal class HingeSource(private val context: Context, private val onChange: (List<HingeState>) -> Unit) :
  SensorEventListener {
  var hinges: List<HingeState> = emptyList()
    private set

  private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private var hingeSensor: Sensor? = null
  private var hingeAngle: Double? = null
  private var tracker: WindowInfoTrackerCallbackAdapter? = null
  private var foldingFeatures: List<FoldingFeature> = emptyList()
  private var active = false
  private val layoutInfoConsumer = Consumer<WindowLayoutInfo> { info ->
    if (active) {
      foldingFeatures = info.displayFeatures.filterIsInstance<FoldingFeature>()
      update()
    }
  }

  fun start() {
    if (active) return
    val activity = context.findActivity() ?: return
    active = true
    if (Build.VERSION.SDK_INT >= 30) {
      hingeSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HINGE_ANGLE)
      hingeSensor?.let { sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_NORMAL) }
    }
    val windowTracker = WindowInfoTracker.getOrCreate(activity)
    if (WindowSdkExtensions.getInstance().extensionVersion >= 9) {
      foldingFeatures = windowTracker.getCurrentWindowLayoutInfo(activity)
        .displayFeatures.filterIsInstance<FoldingFeature>()
    }
    tracker = WindowInfoTrackerCallbackAdapter(windowTracker).also {
      it.addWindowLayoutInfoListener(activity, ContextCompat.getMainExecutor(activity), layoutInfoConsumer)
    }
    update()
  }

  fun stop() {
    active = false
    tracker?.removeWindowLayoutInfoListener(layoutInfoConsumer)
    tracker = null
    sensorManager.unregisterListener(this)
    hingeSensor = null
    hingeAngle = null
    foldingFeatures = emptyList()
    hinges = emptyList()
  }

  override fun onSensorChanged(event: SensorEvent) {
    if (!active) return
    hingeAngle = Math.toRadians(event.values[0].toDouble())
    update()
  }

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

  private fun update() {
    // Android sensors have no WindowManager feature ID; do not associate multiple hinges.
    val next = foldingFeatures.map { feature ->
      val status = when (feature.state) {
        FoldingFeature.State.FLAT -> "fullyOpen"
        FoldingFeature.State.HALF_OPENED -> "partiallyOpen"
        else -> "unknown"
      }
      HingeState(status, if (foldingFeatures.size == 1) hingeAngle else null)
    }.ifEmpty {
      if (hingeSensor != null) listOf(HingeState("unknown", hingeAngle)) else emptyList()
    }
    if (hinges == next) return
    hinges = next
    onChange(next)
  }
}

internal fun Context.findActivity(): Activity? = when (this) {
  is Activity -> this
  is ContextWrapper -> baseContext.findActivity()
  else -> null
}

internal fun payload(hinges: List<HingeState>): WritableMap = Arguments.createMap().apply {
  putArray("hinges", Arguments.createArray().apply {
    hinges.forEach { hinge ->
      pushMap(Arguments.createMap().apply {
        putString("status", hinge.status)
        putDouble("angle", hinge.angle ?: 0.0)
        putBoolean("hasAngle", hinge.angle != null)
      })
    }
  })
}
