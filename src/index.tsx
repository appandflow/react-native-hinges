import * as React from 'react';
import type { View, ViewProps } from 'react-native';
import {
  createHingeObserver,
  updateHingeObserver,
  type HingeObserver,
  type HingeStatus,
  type Hinge,
} from './HingeObserver';
import { HingesView } from './HingesView';
export { createHingeObserver } from './HingeObserver';
export type { Hinge, HingeStatus, HingeObserver } from './HingeObserver';

const HingeContext = React.createContext<HingeObserver | null>(null);

/** View props for observing hinge state independently of reserved regions. */
export type HingeProviderProps = ViewProps & {
  /** Observer created with createHingeObserver, attached to only this provider. */
  observer?: HingeObserver;
};

/** Observes hinges for this view hierarchy; its bounds do not clip hinge state. */
export const HingeProvider: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<HingeProviderProps> & React.RefAttributes<React.ComponentRef<typeof View>>
> = React.forwardRef<React.ComponentRef<typeof View>, HingeProviderProps>(function HingeProvider(
  { children, observer: suppliedObserver, ...props },
  ref,
) {
  const [defaultObserver] = React.useState(createHingeObserver);
  const observer = suppliedObserver ?? defaultObserver;
  const latestHinges = React.useRef<readonly Hinge[]>([]);
  React.useLayoutEffect(() => {
    updateHingeObserver(observer, latestHinges.current);
    return () => updateHingeObserver(observer, []);
  }, [observer]);
  return (
    <HingeContext.Provider value={observer}>
      <HingesView
        {...props}
        ref={ref}
        onHingesChange={({ nativeEvent: event }) => {
          latestHinges.current = event.hinges.map((hinge) => {
            const status: HingeStatus =
              hinge.status === 'closed' || hinge.status === 'partiallyOpen' || hinge.status === 'fullyOpen'
                ? hinge.status
                : 'unknown';
            return { status, angle: hinge.hasAngle ? hinge.angle : null };
          });
          updateHingeObserver(observer, latestHinges.current);
        }}
      >
        {children}
      </HingesView>
    </HingeContext.Provider>
  );
});

/**
 * Returns the hinges reported for the nearest HingeProvider's hierarchy.
 * Independent of provider bounds or active divisions. Initially empty, and empty
 * on unsupported platforms. Android angles are null for ambiguous sensor mappings.
 * Throws outside HingeProvider.
 */
export function useHinges(): readonly Hinge[] {
  const observer = React.useContext(HingeContext);
  if (observer === null) throw new Error('useHinges must be used inside HingeProvider');
  return React.useSyncExternalStore(observer.subscribe, observer.get, observer.get);
}
