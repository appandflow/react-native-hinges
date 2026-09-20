---
title: Run the example
description: Inspect native hinge observations with the repository example.
---

The repository includes a React Native `0.88.0-rc.1` example that imports the local library source. Use the Node.js and pnpm versions declared by the repository, plus native tooling for that React Native version.

## Install and launch

```sh
git clone https://github.com/appandflow/react-native-hinges.git
cd react-native-hinges
pnpm install
```

For iOS:

```sh
cd example
bundle install
cd ios
bundle exec pod install
cd ../..
```

Start Metro:

```sh
pnpm --filter react-native-hinges-example start
```

In a second terminal at the repository root:

```sh
pnpm --filter react-native-hinges-example ios
# or
pnpm --filter react-native-hinges-example android
```

## Native testing

On iOS, build with the iOS 27.1 SDK or later and run on iOS 27.1 or later. Building against an older SDK compiles out observation even on newer devices.

On Android, choose a foldable emulator profile to exercise posture updates. Angle reporting additionally depends on an available hinge-angle sensor. A missing angle is represented by `null`, not by an estimate based on the posture.

An outer-display screenshot alone does not establish fold-transition behavior. Verify an actual posture change and inspect the new native readings.

[Android emulator controls](https://developer.android.com/studio/run/emulator)

## Checks

From the repository root:

```sh
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
```
