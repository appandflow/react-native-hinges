import type { RootTag } from 'react-native';
import NativeHinges from './HingesModule';
import type { NativeHinge } from './NativeHinges';

/** The native hinge posture; unknown means no posture reading is available. */
export type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';

/** State of one hinge associated with a React root. Array order is not an identity. */
export type Hinge = Readonly<{
  /** Native posture. Android maps HALF_OPENED to partiallyOpen and FLAT to fullyOpen. */
  status: HingeStatus;
  /** Angle in radians, or null when no reading can be associated with this hinge. */
  angle: number | null;
}>;

/** A root-scoped snapshot and subscription interface usable outside React. */
export type HingeObserver = Readonly<{
  /** Returns the latest observed snapshot. Empty until a reading is available, and when unsupported. */
  get: () => readonly Hinge[];
  /** Observes this root while subscribed. The last unsubscribe releases native observation. */
  subscribe: (listener: () => void) => () => void;
}>;

const emptyHinges: readonly Hinge[] = Object.freeze([]);

export function mapHinges(hinges: readonly NativeHinge[]): readonly Hinge[] {
  'worklet';
  return hinges.map((hinge) => ({
    status:
      hinge.status === 'closed' || hinge.status === 'partiallyOpen' || hinge.status === 'fullyOpen'
        ? hinge.status
        : 'unknown',
    angle: hinge.hasAngle ? hinge.angle : null,
  }));
}

/**
 * Creates an observer for an existing React root tag (available from RootTagContext).
 * Creation reads the native cache once as a seed; further updates arrive with the
 * onHingesChange event, and subscribing triggers a native replay of the current snapshot.
 * Multiple observers for the same root share native observation. No provider is needed.
 */
export function createHingeObserver(root: number | RootTag): HingeObserver {
  const rootTag = Number(root);
  if (!Number.isInteger(rootTag) || rootTag <= 0) throw new Error('Expected a valid React root tag');
  let snapshot = emptyHinges;
  const listeners = new Set<() => void>();
  let subscription: { remove(): void } | undefined;
  const update = (hinges: readonly NativeHinge[]) => {
    const next = mapHinges(hinges);
    if (
      snapshot.length === next.length &&
      snapshot.every((hinge, index) => hinge.status === next[index]?.status && hinge.angle === next[index]?.angle)
    )
      return false;
    snapshot = Object.freeze(next.map((hinge) => Object.freeze(hinge)));
    return true;
  };
  update(NativeHinges.getSnapshot(rootTag).hinges);
  return {
    get: () => snapshot,
    subscribe: (listener) => {
      const notify = () => listener();
      listeners.add(notify);
      if (listeners.size === 1) {
        subscription = NativeHinges.onHingesChange((event) => {
          if (event.rootTag !== rootTag) return;
          if (update(event.hinges)) {
            for (const callback of listeners) callback();
          }
        });
        NativeHinges.startObserving(rootTag);
      }
      return () => {
        if (!listeners.delete(notify)) return;
        if (listeners.size === 0) {
          subscription?.remove();
          subscription = undefined;
          NativeHinges.stopObserving(rootTag);
        }
      };
    },
  };
}
