package com.appandflow.hinges

import android.view.View
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.turbomodule.core.interfaces.BindingsInstallerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModuleWithJSIBindings
import com.facebook.react.uimanager.UIManagerHelper
import java.util.concurrent.ConcurrentHashMap

@ReactModule(name = HingesModule.NAME)
class HingesModule(context: ReactApplicationContext) :
  NativeHingesSpec(context), TurboModuleWithJSIBindings {
  private val observations = mutableMapOf<Int, Observation>()
  private val snapshots = ConcurrentHashMap<Int, List<HingeState>>()
  @field:DoNotStrip private val mHybridData: HybridData = initWorkletsBridge()
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
    invalidateWorkletsBridge()
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
    publishHinges(
      rootTag,
      Array(hinges.size) { hinges[it].status },
      DoubleArray(hinges.size) { hinges[it].angle ?: 0.0 },
      BooleanArray(hinges.size) { hinges[it].angle != null },
    )
    emitOnHingesChange(payload(hinges).apply { putDouble("rootTag", rootTag.toDouble()) })
  }

  @DoNotStrip external override fun getBindingsInstaller(): BindingsInstallerHolder

  private external fun initWorkletsBridge(): HybridData

  private external fun publishHinges(
    rootTag: Int,
    statuses: Array<String>,
    angles: DoubleArray,
    hasAngles: BooleanArray,
  )

  private external fun invalidateWorkletsBridge()

  private inner class Observation(val rootTag: Int, val root: View) : View.OnAttachStateChangeListener {
    var retainCount = 1
    private val source = HingeSource(root.context) { hinges ->
      if (observations[rootTag] !== this) return@HingeSource
      snapshots[rootTag] = hinges
      emit(rootTag, hinges)
    }

    fun start() = source.start()

    fun stop() = source.stop()

    override fun onViewAttachedToWindow(view: View) = source.start()

    override fun onViewDetachedFromWindow(view: View) {
      source.stop()
      snapshots[rootTag] = emptyList()
      emit(rootTag, emptyList())
    }
  }

  companion object {
    init {
      com.facebook.soloader.SoLoader.loadLibrary("hingesworklets")
    }

    const val NAME = "NativeHinges"
  }
}
