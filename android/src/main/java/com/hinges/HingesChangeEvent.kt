package com.hinges

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

internal data class HingeState(val status: String, val angle: Double?)

internal class HingesChangeEvent(
  surfaceId: Int,
  viewTag: Int,
  private val hinges: List<HingeState>,
) : Event<HingesChangeEvent>(surfaceId, viewTag) {
  override fun getEventName() = NAME

  override fun getEventData(): WritableMap = Arguments.createMap().apply {
    val values = Arguments.createArray()
    for (hinge in hinges) {
      values.pushMap(Arguments.createMap().apply {
        putString("status", hinge.status)
        putDouble("angle", hinge.angle ?: 0.0)
        putBoolean("hasAngle", hinge.angle != null)
      })
    }
    putArray("hinges", values)
  }

  companion object {
    const val NAME = "topHingesChange"
  }
}
