import { createContext, useContext, useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { createAnimatedComponent, useEvent, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { mapHinges, type Hinge } from './HingeObserver';
import HingesObserverView, {
  Commands,
  type HingesObserverChangeEvent,
  type NativeProps,
} from './HingesObserverViewNativeComponent';

const HingesSharedValueContext = createContext<SharedValue<readonly Hinge[]> | null>(null);
const AnimatedHingesObserverView = createAnimatedComponent(HingesObserverView);
const styles = StyleSheet.create({
  observer: { position: 'absolute', width: 0, height: 0 },
});

/**
 * Observes hinges for its subtree and publishes them to a Reanimated shared value.
 * Renders one hidden native view that delivers native updates straight to the UI runtime.
 * Read the value with useAnimatedHinges.
 */
export function AnimatedHingesProvider({ children }: { children?: ReactNode }) {
  const hinges = useSharedValue<readonly Hinge[]>([]);
  const view = useRef<ComponentRef<typeof HingesObserverView> | null>(null);
  const onHingesChange = useEvent<HingesObserverChangeEvent>(
    (event) => {
      'worklet';
      hinges.set(mapHinges(event.hinges));
    },
    ['onHingesChange'],
  );

  useEffect(() => {
    let cancelled = false;
    // Worklets only accepts a function defined on the React Native runtime in scheduleOnRN.
    const requestSnapshot = () => {
      if (cancelled || view.current === null) return;
      Commands.refresh(view.current);
    };
    // Reanimated registers worklet event handlers on the UI runtime asynchronously; ask for the
    // current snapshot only after a hop through it, so the handler exists when the view re-emits.
    scheduleOnUI(() => {
      scheduleOnRN(requestSnapshot);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HingesSharedValueContext.Provider value={hinges}>
      {children}
      <AnimatedHingesObserverView
        ref={view}
        style={styles.observer}
        pointerEvents="none"
        // Reanimated's useEvent handler receives the raw payload, while codegen types the prop as a NativeSyntheticEvent.
        onHingesChange={onHingesChange as unknown as NativeProps['onHingesChange']}
      />
    </HingesSharedValueContext.Provider>
  );
}

/**
 * Returns this provider's native hinge snapshots as a shared value on the UI runtime.
 * Read with get() inside worklets; do not write to the value. Angles are raw radians,
 * with null for unavailable readings. No interpolation or sampling rate is imposed.
 */
export function useAnimatedHinges(): SharedValue<readonly Hinge[]> {
  const hinges = useContext(HingesSharedValueContext);
  if (hinges === null) {
    throw new Error(
      'useAnimatedHinges must render inside an AnimatedHingesProvider from react-native-hinges/reanimated. ' +
        'Wrap the tree in <AnimatedHingesProvider> at or above this component.',
    );
  }
  return hinges;
}
