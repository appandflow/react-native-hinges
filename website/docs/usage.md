---
title: Provider and hook
description: Read native hinge state in React.
---

Place a `HingeProvider` in the native view hierarchy you want to observe. Descendants read its current snapshot with `useHinges()`.

```tsx
import { Text } from 'react-native';
import { HingeProvider, useHinges } from 'react-native-hinges';

function HingeSummary() {
  const hinges = useHinges();

  return hinges.map((hinge, index) => (
    <Text key={index}>
      {hinge.status}
      {' · '}
      {hinge.angle === null ? 'angle unavailable' : `${((hinge.angle * 180) / Math.PI).toFixed(1)}°`}
    </Text>
  ));
}

export default function App() {
  return (
    <HingeProvider style={{ flex: 1 }}>
      <HingeSummary />
    </HingeProvider>
  );
}
```

The provider accepts standard React Native `View` props and renders a native view. A nested provider establishes a separate scope; a hook consumer reads its nearest one. Hinge observations are associated with the native hierarchy or window, rather than a process-wide singleton.

## Why does hinge state need a provider?

The native sources have different scopes:

| Source                        | Native scope            |
| ----------------------------- | ----------------------- |
| iOS `UIHingeInteraction`      | Attached view hierarchy |
| Android WindowManager posture | Activity window         |
| Android hinge-angle sensor    | Device                  |

The provider supplies the hierarchy/window needed for a complete observation. A device sensor alone does not describe the native posture of each app window, and UIKit's interaction needs an attached view. A process-wide value would have to choose a hierarchy when an app has more than one window.

Provider bounds are not measurement coordinates: resizing or moving the view does not crop a hinge or change its angle. Use one provider for the intended hierarchy, then share its observer with [non-React consumers](./observers.md) when needed.

## Understand the snapshot

The hook returns a read-only array, initially `[]`. An empty array can also mean that the platform reports no hinges or does not support the API. Calling the hook outside a provider throws.

`status` comes from the native posture: `unknown`, `closed`, `partiallyOpen`, or `fullyOpen`. `angle` is in **radians**, or `null` when a reading is unavailable or cannot be associated with one hinge. The library does not infer posture from angle thresholds or invent angles from posture.

An array supports multiple hinges. Its positions are not stable hardware identities. Native platform capabilities determine how many hinges are reported and which have angle readings.

## Hinge state and layout

Hinge state has no view-relative frame. Moving or resizing a provider does not clip a hinge or create new angle coordinates. A hinge can exist even when there is no active display division in the provider's bounds.

For a non-React consumer, [create an observer](./observers.md). For animated styles, use [the optional Reanimated integration](./reanimated.md). For platform-specific mappings, see [native behavior](./platforms.md).
