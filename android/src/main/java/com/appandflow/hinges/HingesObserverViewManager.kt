package com.appandflow.hinges

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.HingesObserverViewManagerDelegate
import com.facebook.react.viewmanagers.HingesObserverViewManagerInterface

@ReactModule(name = HingesObserverViewManager.NAME)
class HingesObserverViewManager :
  SimpleViewManager<HingesObserverView>(), HingesObserverViewManagerInterface<HingesObserverView> {
  private val delegate = HingesObserverViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<HingesObserverView> = delegate

  override fun getName() = NAME

  override fun createViewInstance(context: ThemedReactContext) = HingesObserverView(context)

  override fun refresh(view: HingesObserverView) = view.refresh()

  override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
    mutableMapOf(HingesChangeEvent.EVENT_NAME to mutableMapOf("registrationName" to "onHingesChange"))

  companion object {
    const val NAME = "HingesObserverView"
  }
}
