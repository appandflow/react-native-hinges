import { useLayoutEffect, useMemo } from 'react';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useEvent, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { createHingeObserver, mapHinges, type Hinge } from './HingeObserver';
import { useRootTag } from './useRootTag';
import NativeHinges from './HingesModule';
import type { HingesChangeEvent } from './NativeHinges';

/**
 * Returns root-scoped native hinge snapshots on the UI runtime, without a provider.
 * Read with get() inside worklets; do not write to the value. Angles are raw radians,
 * with null for unavailable readings. No interpolation or sampling rate is imposed.
 * The shared value starts from the native cache and retains its last value after unmount.
 */
export function useAnimatedHinges(): SharedValue<readonly Hinge[]> {
  const rootTag = useRootTag('useAnimatedHinges');
  const observer = useMemo(() => createHingeObserver(rootTag), [rootTag]);
  const hinges = useSharedValue(observer.get());
  const event = useEvent<HingesChangeEvent>(
    (update) => {
      'worklet';
      hinges.set(mapHinges(update.hinges));
    },
    ['onHingesChange', 'topHingesChange'],
  );

  // Reanimated 4.7 useEvent disguises its WorkletEventHandler as a callback; root events have no component prop to attach it.
  const { workletEventHandler } = event as unknown as {
    workletEventHandler: {
      registerForEvents(tag: number): void;
      unregisterFromEvents(tag: number): void;
    };
  };
  useLayoutEffect(() => {
    hinges.set(observer.get());
    workletEventHandler.registerForEvents(rootTag);
    let cancelled = false;
    let started = false;
    const start = () => {
      if (cancelled) return;
      started = true;
      NativeHinges.startObserving(rootTag);
    };
    // Reanimated registers events asynchronously on the UI scheduler. Acquire after it runs so initial replay is observed.
    scheduleOnUI(() => {
      scheduleOnRN(start);
    });
    return () => {
      cancelled = true;
      workletEventHandler.unregisterFromEvents(rootTag);
      if (started) NativeHinges.stopObserving(rootTag);
    };
  }, [rootTag, observer, hinges, workletEventHandler]);
  return hinges;
}
