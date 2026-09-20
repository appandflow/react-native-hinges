/** The native hinge posture; unknown means no posture reading is available. */
export type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';

/** State of one hinge reported for the provider's hierarchy. Array order is not an identity. */
export type Hinge = Readonly<{
  /** Native posture. Android maps HALF_OPENED to partiallyOpen and FLAT to fullyOpen. */
  status: HingeStatus;
  /** Angle in radians, or null when no reading can be associated with this hinge. */
  angle: number | null;
}>;

/** A snapshot and subscription interface usable outside React. */
export type HingeObserver = Readonly<{
  /** Returns the latest immutable snapshot; initially empty, and empty when unavailable. */
  get: () => readonly Hinge[];
  /** Listens for snapshot changes. Returns a function that removes this listener. */
  subscribe: (listener: () => void) => () => void;
}>;

const emptyHinges: readonly Hinge[] = Object.freeze([]);
const writers = new WeakMap<HingeObserver, (hinges: readonly Hinge[]) => void>();

/**
 * Creates an observer for one HingeProvider. Pass it as observer.
 * get()/subscribe() can then be used outside React. Create a separate observer for
 * each provider; unmounting its provider clears the snapshot.
 */
export function createHingeObserver(): HingeObserver {
  let snapshot = emptyHinges;
  const listeners = new Set<() => void>();
  const observer: HingeObserver = {
    get: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  writers.set(observer, (hinges) => {
    if (
      snapshot.length === hinges.length &&
      snapshot.every((hinge, index) => hinge.status === hinges[index]?.status && hinge.angle === hinges[index]?.angle)
    )
      return;
    snapshot = Object.freeze(hinges.map((hinge) => Object.freeze({ ...hinge })));
    for (const listener of listeners) listener();
  });
  return observer;
}

export function updateHingeObserver(observer: HingeObserver, hinges: readonly Hinge[]): void {
  const update = writers.get(observer);
  if (!update) throw new Error('hingeObserver must be created with createHingeObserver');
  update(hinges);
}
