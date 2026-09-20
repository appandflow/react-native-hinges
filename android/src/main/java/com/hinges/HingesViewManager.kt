package com.hinges

import com.facebook.react.bridge.ReactContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.viewmanagers.HingesViewManagerInterface
import com.facebook.react.viewmanagers.HingesViewManagerDelegate

@ReactModule(name = HingesViewManager.NAME)
class HingesViewManager : ViewGroupManager<HingesView>(),
  HingesViewManagerInterface<HingesView> {
  private val delegate = HingesViewManagerDelegate(this)

  override fun getDelegate() = delegate

  override fun getName() = NAME

  override fun createViewInstance(context: ThemedReactContext) = HingesView(context)

  override fun getExportedCustomDirectEventTypeConstants() =
    mutableMapOf(
      HingesChangeEvent.NAME to mutableMapOf("registrationName" to "onHingesChange"),
    )

  override fun addEventEmitters(reactContext: ThemedReactContext, view: HingesView) {
    super.addEventEmitters(reactContext, view)
    view.setOnHingesChangeHandler { source, hinge ->
      val sourceContext = source.context as ReactContext
      UIManagerHelper.getEventDispatcherForReactTag(sourceContext, source.id)
        ?.dispatchEvent(HingesChangeEvent(UIManagerHelper.getSurfaceId(sourceContext), source.id, hinge))
    }
  }

  companion object {
    const val NAME = "HingesView"
  }
}
