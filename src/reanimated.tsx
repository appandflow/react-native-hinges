import { useEffect, useMemo } from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';
import { createSerializable, getUIRuntimeHolder, getUISchedulerHolder } from 'react-native-worklets';
import NativeHinges from './HingesModule';
import { mapHinges, type Hinge } from './HingeObserver';
import type { NativeHinge } from './NativeHinges';
import { useRootTag } from './useRootTag';

declare global {
  var nativeHingesSubscribe:
    | ((rootTag: number, runtime: object, scheduler: object, callback: object) => () => void)
    | undefined;
}

/**
 * Returns this React root's hinge readings as a shared value without a provider or native view.
 * Seeds from the native cache, then receives native updates directly on the UI runtime.
 * Angles are raw radians, with null for unavailable readings. Read with get() inside worklets;
 * do not write to the value. Unmounting releases observation and retains the last snapshot.
 */
export function useAnimatedHinges(): SharedValue<readonly Hinge[]> {
  const rootTag = useRootTag('useAnimatedHinges');
  const hinges = useMemo(
    () => makeMutable<readonly Hinge[]>(mapHinges(NativeHinges.getSnapshot(rootTag).hinges)),
    [rootTag],
  );
  useEffect(() => {
    if (!globalThis.nativeHingesSubscribe) {
      throw new Error(
        'Hinges Worklets integration is unavailable. Install react-native-worklets and rebuild the native app.',
      );
    }
    return globalThis.nativeHingesSubscribe(
      rootTag,
      getUIRuntimeHolder(),
      getUISchedulerHolder(),
      createSerializable((readings: readonly NativeHinge[]) => {
        'worklet';
        hinges.set(mapHinges(readings));
      }),
    );
  }, [rootTag, hinges]);
  return hinges;
}
