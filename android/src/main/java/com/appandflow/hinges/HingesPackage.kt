package com.appandflow.hinges

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class HingesViewPackage : BaseReactPackage() {
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
    listOf(HingesObserverViewManager())

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == HingesModule.NAME) HingesModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(HingesModule.NAME to ReactModuleInfo(
      HingesModule.NAME,
      HingesModule::class.java.name,
      false,
      false,
      false,
      true,
    ))
  }
}
