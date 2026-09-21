---
title: React hook
description: Read native hinge state without a provider.
---

Call `useHinges()` anywhere inside a React Native root. No provider or view ref is required.

```tsx
import { Text } from 'react-native';
import { useHinges } from 'react-native-hinges';

export default function HingeSummary() {
  const hinges = useHinges();
  return hinges.map((hinge, index) => (
    <Text key={index}>
      {hinge.status} · {hinge.angle === null ? 'angle unavailable' : `${hinge.angle.toFixed(2)} radians`}
    </Text>
  ));
}
```

## Why no provider?

Hinge readings contain posture and angle, with no view-relative rectangle. Moving
or resizing a panel does not change the angle it observes. The existing React
root provides the native attachment point, so a provider would add no useful
measurement boundary. `useHinges()` subscribes to that root's readings and releases
its subscription on unmount. For code outside React, use
[`createHingeObserver(rootTag)`](./observers.md).

The APIs have different scopes:

| API                                                | What defines its scope?                    | What happens when a child panel moves?                                  |
| -------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `useHinges()`                                      | The existing React root's hierarchy/window | Posture and angle stay the same if the native hinge state is unchanged. |
| `ReservedRegionsProvider` + `useReservedRegions()` | The provider's native view                 | Region frames change with that view's position and bounds.              |

A hinge reading alone cannot tell you where to split a panel or leave room for a
cutout. Use [reserved regions](https://appandflow.github.io/react-native-reserved-regions/docs/usage)
for those layout decisions. You can use both libraries together without a hinge
provider around the region provider.

## Observation scope

The hook reads React Native's existing `RootTagContext`. On iOS, the native module attaches `UIHingeInteraction` to that root's existing UIView. On Android, it observes the root's Activity window and optional hinge-angle sensor. It creates no native view.

Multiple consumers on the same root share native observation. Different roots have separate snapshots. Hinge state follows the React root, including for descendants rendered in a modal; the modal does not automatically establish a different observation scope. Hosts with separate React roots use each root's own scope.

## Initialization and lifetime

The hook returns a read-only array and never suspends. It reads the native cache during rendering and subscribes after mounting. The first uncached render returns `[]`; an empty array can also mean no hinges or unsupported APIs. Initial native readings do not require physical movement, but their delivery is asynchronous.

Subscriptions keep the native observation alive. The last subscriber releases its interaction, sensors, listeners, and cache. Calling `get()` alone does not start observation. A later mount can therefore begin with `[]` again.

## Snapshot values

`status` comes from the native posture: `unknown`, `closed`, `partiallyOpen`, or `fullyOpen`. `angle` is in radians, or `null` when unavailable or ambiguous. The library does not infer posture from angle thresholds or invent angles from posture. Array positions are not stable hardware identities.

Hinges have no view-relative frame. Root bounds do not crop hinge state. Reserved rectangles remain in the separate reserved-regions library.

For non-React code, [create an observer](./observers.md). For animation, use [Reanimated](./reanimated.md). See [platform behavior](./platforms.md) for native mappings.
