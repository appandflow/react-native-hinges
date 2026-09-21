package com.appandflow.hinges

import android.content.Context
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.views.view.ReactViewGroup

internal class HingesChangeEvent(surfaceId: Int, viewTag: Int, private val data: WritableMap) :
  Event<HingesChangeEvent>(surfaceId, viewTag) {
  override fun getEventName() = EVENT_NAME

  override fun getEventData() = data

  companion object {
    const val EVENT_NAME = "topHingesChange"
  }
}

class HingesObserverView(context: Context) : ReactViewGroup(context) {
  private val source = HingeSource(context) { emitChange(it) }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    source.start()
  }

  override fun onDetachedFromWindow() {
    source.stop()
    super.onDetachedFromWindow()
  }

  fun refresh() = emitChange(source.hinges)

  private fun emitChange(hinges: List<HingeState>) {
    val reactContext = context as? ReactContext ?: return
    val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id) ?: return
    dispatcher.dispatchEvent(HingesChangeEvent(UIManagerHelper.getSurfaceId(this), id, payload(hinges)))
  }
}
