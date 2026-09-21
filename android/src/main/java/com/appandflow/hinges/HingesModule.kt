package com.appandflow.hinges

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.view.View
import androidx.core.content.ContextCompat
import androidx.core.util.Consumer
import androidx.window.WindowSdkExtensions
import androidx.window.java.layout.WindowInfoTrackerCallbackAdapter
import androidx.window.layout.FoldingFeature
import androidx.window.layout.WindowInfoTracker
import androidx.window.layout.WindowLayoutInfo
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerHelper
import java.util.concurrent.ConcurrentHashMap

private data class HingeState(val status: String, val angle: Double?)

@ReactModule(name = HingesModule.NAME)
class HingesModule(context: ReactApplicationContext) : NativeHingesSpec(context) {
  private val observations = mutableMapOf<Int, Observation>()
  private val snapshots = ConcurrentHashMap<Int, List<HingeState>>()
  @Volatile private var invalidated = false

  override fun getName() = NAME

  override fun getSnapshot(rootTag: Double): WritableMap =
    payload(snapshots[rootTag.toInt()] ?: emptyList())

  override fun startObserving(rootTag: Double) {
    UiThreadUtil.runOnUiThread {
      if (invalidated) return@runOnUiThread
      val tag = rootTag.toInt()
      val existing = observations[tag]
      if (existing != null) {
        existing.retainCount += 1
        emit(tag, snapshots[tag] ?: emptyList())
        return@runOnUiThread
      }
      val root = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, tag)?.resolveView(tag)
      if (root == null) {
        emit(tag, emptyList())
        return@runOnUiThread
      }
      val observation = Observation(tag, root)
      observations[tag] = observation
      root.addOnAttachStateChangeListener(observation)
      if (root.isAttachedToWindow) observation.start()
      emit(tag, snapshots[tag] ?: emptyList())
    }
  }

  override fun stopObserving(rootTag: Double) {
    UiThreadUtil.runOnUiThread {
      val tag = rootTag.toInt()
      val observation = observations[tag] ?: return@runOnUiThread
      observation.retainCount -= 1
      if (observation.retainCount == 0) {
        observations.remove(tag)
        observation.root.removeOnAttachStateChangeListener(observation)
        observation.stop()
        snapshots.remove(tag)
      }
    }
  }

  override fun invalidate() {
    invalidated = true
    UiThreadUtil.runOnUiThread {
      observations.values.forEach { observation ->
        observation.root.removeOnAttachStateChangeListener(observation)
        observation.stop()
      }
      observations.clear()
      snapshots.clear()
    }
    super.invalidate()
  }

  private fun emit(rootTag: Int, hinges: List<HingeState>) {
    if (invalidated) return
    UIManagerHelper.getEventDispatcher(reactApplicationContext)
      ?.dispatchEvent(HingesChangeEvent(rootTag, payload(hinges)))
    emitOnHingesChange(payload(hinges).apply { putDouble("rootTag", rootTag.toDouble()) })
  }

  private inner class Observation(val rootTag: Int, val root: View) :
    SensorEventListener, View.OnAttachStateChangeListener {
    var retainCount = 1
    private val sensorManager = root.context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
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
      val activity = root.context.findActivity() ?: return
      active = true
      if (Build.VERSION.SDK_INT >= 30) {
        hingeSensor = sensorManager.getSensorList(Sensor.TYPE_HINGE_ANGLE).singleOrNull()
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
    }

    override fun onViewAttachedToWindow(view: View) = start()

    override fun onViewDetachedFromWindow(view: View) {
      stop()
      snapshots[rootTag] = emptyList()
      emit(rootTag, emptyList())
    }

    override fun onSensorChanged(event: SensorEvent) {
      if (!active) return
      hingeAngle = Math.toRadians(event.values[0].toDouble())
      update()
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun update() {
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
      if (snapshots[rootTag] != hinges) {
        snapshots[rootTag] = hinges
        emit(rootTag, hinges)
      }
    }
  }

  companion object {
    const val NAME = "NativeHinges"
  }
}

private fun Context.findActivity(): Activity? = when (this) {
  is Activity -> this
  is ContextWrapper -> baseContext.findActivity()
  else -> null
}

private fun payload(hinges: List<HingeState>): WritableMap = Arguments.createMap().apply {
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
