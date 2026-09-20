import { createContext, forwardRef, useContext, type ComponentRef } from 'react';
import type { View } from 'react-native';
import { createAnimatedComponent, useEvent, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { HingeProvider, type HingeProviderProps, type Hinge } from './index';
import type { HingesChangeEvent } from './HingesViewNativeComponent';

const AnimatedHingesContext = createContext<SharedValue<readonly Hinge[]> | null>(null);

type EventSourceProps = HingeProviderProps & {
  onHingesChange?: (event: HingesChangeEvent) => void;
};

// Reanimated useEvent registers on the forwarded native view; the base provider keeps its JS listener.
const EventSource = forwardRef<ComponentRef<typeof View>, EventSourceProps>(function EventSource(
  { onHingesChange: _onHingesChange, ...props },
  ref,
) {
  return <HingeProvider {...props} ref={ref} />;
});
const AnimatedEventSource = createAnimatedComponent(EventSource);

/**
 * Supplies UI-runtime hinge measurements and the regular React/non-React observer APIs.
 * Replaces HingeProvider for an animated hierarchy. Requires Reanimated 4.7 and Worklets 0.13.
 */
export function AnimatedHingeProvider(props: HingeProviderProps) {
  const hinges = useSharedValue<readonly Hinge[]>([]);
  const onHingesChange = useEvent<HingesChangeEvent>(
    (event) => {
      'worklet';
      hinges.set(
        event.hinges.map((hinge): Hinge => ({
          status:
            hinge.status === 'closed' || hinge.status === 'partiallyOpen' || hinge.status === 'fullyOpen'
              ? hinge.status
              : 'unknown',
          angle: hinge.hasAngle ? hinge.angle : null,
        })),
      );
    },
    ['onHingesChange'],
  );

  return (
    <AnimatedHingesContext.Provider value={hinges}>
      <AnimatedEventSource {...props} onHingesChange={onHingesChange} />
    </AnimatedHingesContext.Provider>
  );
}

/**
 * Returns native hinge snapshots as a shared value without React renders per update.
 * Read with get() inside worklets; do not write to the value. Angles remain raw radians,
 * with null for unavailable readings. No interpolation or sampling rate is imposed.
 * Throws outside AnimatedHingeProvider. Ordinary useHinges also works under that provider.
 */
export function useAnimatedHinges(): SharedValue<readonly Hinge[]> {
  const hinges = useContext(AnimatedHingesContext);
  if (hinges === null) throw new Error('useAnimatedHinges must be used inside AnimatedHingeProvider');
  return hinges;
}
