package com.appandflow.hinges;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.fabric.events.FabricEventEmitter;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTModernEventEmitter;

/**
 * This file is Java, not Kotlin, because {@code FabricEventEmitter} is declared {@code internal} in
 * react-native's Kotlin sources: Java can reference it, Kotlin cannot.
 *
 * <p>Without the {@link #dispatchModern} override, react-native routes this root-tag event through
 * {@code FabricUIManager.receiveEvent} into
 * {@code fabric/mounting/SurfaceMountingManager.kt#dispatchEvent}, which appends events for a
 * {@code ViewState} with no {@code eventEmitter} to {@code pendingEventQueue}. That queue is only
 * drained by {@code updateEventEmitter}, which never runs for the root tag, so every hinge update
 * would accumulate there without bound.
 */
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
