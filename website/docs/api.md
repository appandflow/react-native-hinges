---
title: API reference
description: Providers, hooks, observers, and documented hinge types.
---

Core exports come from `react-native-hinges`. The optional animated exports come from `react-native-hinges/reanimated`.

## HingeProvider

```ts
type HingeProviderProps = ViewProps & {
  /** Optional observer for this provider's non-React consumers. */
  observer?: HingeObserver;
};

const HingeProvider: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<HingeProviderProps> & React.RefAttributes<React.ComponentRef<typeof View>>
>;
```

A native view providing hinge state to its descendants. UIKit observation is attached to this view hierarchy; Android posture is associated with its Activity window, while angle readings come from the device sensor. Its bounds do not clip hinge state. Accepts React Native `ViewProps`. Pass an observer created by `createHingeObserver()` to share snapshots with non-React code, or omit it to use an internal observer.

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

## AnimatedHingeProvider

Import from `react-native-hinges/reanimated`. Requires the optional Reanimated and Worklets peers.

```ts
function AnimatedHingeProvider(props: HingeProviderProps): React.JSX.Element;
```

Provides a UI-runtime shared value and the ordinary hook/observer interfaces for the same hierarchy. Use it in place of `HingeProvider` for animated consumers.

## useAnimatedHinges

```ts
function useAnimatedHinges(): SharedValue<readonly Hinge[]>;
```

Returns the nearest animated provider's shared value, initially `[]`. Throws outside that provider. Read with `get()` inside worklets and do not mutate it. Angles remain raw radians or `null`; no sampling interval or smoothing is imposed.

A retained shared value currently keeps its last snapshot after provider unmount. This differs from the ordinary observer, which clears. See [Reanimated integration](./reanimated.md) for setup, lifetime, and validation limits.
