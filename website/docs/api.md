---
title: API reference
description: Hooks, observers, and documented hinge types.
---

Core exports come from `react-native-hinges`. The optional animated exports come from `react-native-hinges/reanimated`.

## HingeStatus

```ts
/** Native posture; unknown means no posture reading is available. */
type HingeStatus = 'unknown' | 'closed' | 'partiallyOpen' | 'fullyOpen';
```

The status is not inferred from the angle. Android WindowManager provides flat and half-open states, which map to `fullyOpen` and `partiallyOpen`. A sensor-only observation has status `unknown`.

## Hinge

```ts
/** One hinge reported for the React root's hierarchy or window. */
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

Reads the current React root's native snapshot without a provider or extra view. Initially reads the native cache, then subscribes. Returns `[]` until readings are available and when unsupported. Does not suspend. There is no separate readiness flag.

Throws if rendered outside a React Native root, where `RootTagContext` is still its default of `0`. In tests without an `AppContainer`, wrap the tree in `<RootTagContext.Provider value={1 as unknown as RootTag}>`.

## HingeObserver

```ts
/** Snapshot access for consumers inside or outside React. */
type HingeObserver = Readonly<{
  /** Latest immutable snapshot; initialized from native cache, otherwise empty. */
  get: () => readonly Hinge[];
  /** Subscribe to changes; the returned function removes this listener. */
  subscribe: (listener: () => void) => () => void;
}>;
```

Subscribe callbacks receive no arguments. Read `get()` to obtain the latest snapshot.

## createHingeObserver

```ts
function createHingeObserver(rootTag: number | RootTag): HingeObserver;
```

Creates an observer for an existing React root. Obtain its tag from React Native's `RootTagContext` or a native host integration. Creation reads the native cache once; `get()` returns the latest observed snapshot and subscriptions keep it current. The last native subscriber releases observation and the cache. See [observer usage](./observers.md).

## AnimatedHingesProvider

```tsx
function AnimatedHingesProvider(props: { children?: ReactNode }): ReactNode;
```

Provides one shared value to its subtree and renders one hidden native `HingesObserverView` that observes hinges and emits changes to Reanimated's UI runtime. Requires the optional Reanimated and Worklets peers. Place it above every `useAnimatedHinges()` consumer; one provider per tree is enough.

The view is `0x0`, absolutely positioned and not interactive, so it does not affect layout. Unmounting the provider removes it and ends that observation.

## useAnimatedHinges

```ts
function useAnimatedHinges(): SharedValue<readonly Hinge[]>;
```

Returns the enclosing provider's shared value, seeded with `[]` and updated on the UI runtime when the native view reports a change. Read with `get()` inside worklets and do not mutate it. Throws when rendered outside `AnimatedHingesProvider`.

Every consumer under one provider reads the same shared value. An externally retained shared value keeps its last snapshot after unmount. See [Reanimated integration](./reanimated.md).
