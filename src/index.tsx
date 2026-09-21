import { useContext, useMemo, useSyncExternalStore } from 'react';
import { RootTagContext } from 'react-native';
import { createHingeObserver, type Hinge } from './HingeObserver';
export { createHingeObserver } from './HingeObserver';
export type { Hinge, HingeStatus, HingeObserver } from './HingeObserver';

/**
 * Returns the latest hinges for this React root without a provider or extra native view.
 * Seeds its store from the native cache, then subscribes to changes. Empty until a reading is
 * available and on unsupported platforms. Angles remain null when unavailable or ambiguous.
 */
export function useHinges(): readonly Hinge[] {
  const rootTag = useContext(RootTagContext);
  const observer = useMemo(() => createHingeObserver(rootTag), [rootTag]);
  return useSyncExternalStore(observer.subscribe, observer.get, observer.get);
}
