---
title: API reference
description: Providers, hooks, observers, and documented hinge types.
---

All public exports come from `react-native-hinges`.

## HingeProvider

```ts
type HingeProviderProps = ViewProps & {
  /** Optional observer for this provider's non-React consumers. */
  observer?: HingeObserver;
};

function HingeProvider(props: HingeProviderProps): React.JSX.Element;
```

A native view providing hinge state to its descendants. Accepts React Native `ViewProps`. Pass an observer created by `createHingeObserver()` to share snapshots with non-React code, or omit it to use an internal observer.

## HingeStatus

```ts
/** Native posture; unknown means no posture reading is available. */
type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
```

The status is not inferred from the angle. Android WindowManager provides flat and half-open states, which map to `fullyOpen` and `partiallyOpen`. A sensor-only observation has status `unknown`.

## Hinge

```ts
/** One hinge reported for the provider's native hierarchy or window. */
type Hinge = Readonly<{
  /** Native posture, independent of whether display content is hidden. */
  status: HingeStatus;
  /** Angle in radians, or null if no reading can be associated. */
  angle: number | null;
}>;
```

A hinge has no rectangle or stable ID. Array positions are not hardware identities. Native support determines how many hinges are reported.

## useHinges

```ts
function useHinges(): readonly Hinge[];
```

Reads the nearest `HingeProvider`'s snapshot. Initially empty, and empty when unsupported or unavailable. Throws outside a provider. There is no separate readiness flag.

## HingeObserver

```ts
/** Snapshot access for consumers inside or outside React. */
type HingeObserver = Readonly<{
  /** Latest immutable snapshot; initially empty. */
  get: () => readonly Hinge[];
  /** Subscribe to changes; the returned function removes this listener. */
  subscribe: (listener: () => void) => () => void;
}>;
```

Subscribe callbacks receive no arguments. Read `get()` to obtain the latest snapshot.

## createHingeObserver

```ts
function createHingeObserver(): HingeObserver;
```

Creates an observer for one provider. Pass it through that provider's `observer` prop. It has no native source until attached, and its snapshot is cleared when the provider unmounts.

See [observer usage](./observers.md) and [platform behavior](./platforms.md).
