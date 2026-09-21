package com.appandflow.hinges;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;

final class HingesChangeEvent extends Event<HingesChangeEvent> {
  private final WritableMap payload;

  HingesChangeEvent(int rootTag, WritableMap payload) {
    super(rootTag, rootTag);
    this.payload = payload;
  }

  @Override
  public String getEventName() {
    return "topHingesChange";
  }

  @Override
  protected WritableMap getEventData() {
    return payload;
  }

  @Override
  public void dispatchModern(RCTModernEventEmitter emitter) {
    // RN 0.88 notifies native event observers before FabricEventEmitter. The root
    // has no hinges prop/event emitter; only observers such as Reanimated consume this event.
    if (!(emitter instanceof FabricEventEmitter)) {
      super.dispatchModern(emitter);
    }
  }
}
