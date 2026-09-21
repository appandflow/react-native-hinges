# Development workflow

## Set up

The repository uses pnpm 12, TypeScript 7, Oxlint and Oxfmt. The root package is
the publishable library. `example/` and `website/` are private pnpm workspaces.
The hoisted linker keeps the React Native native build paths predictable.

```sh
corepack enable
pnpm install --frozen-lockfile
```

Use the Node version in `.nvmrc`. Build scripts use Bob; unit tests use Jest and
the React Native preset. The example uses React Native 0.88.0-rc.1 and Fabric.

## Plan and implement

1. Reproduce the behavior and identify the affected platform/API.
2. Search existing repository issues and PRs before opening duplicate work.
3. Create a focused `@janic/<change>` branch. Use an isolated worktree when another
   task is using the checkout; preserve its uncommitted work.
4. State what observable check will establish success, then implement the change.
5. Update TypeScript field documentation and the relevant website guide.

Separate unrelated changes and include a regression test when it catches a real
failure. For hinge state, compare native posture and sensor values with the displayed readings.

## Checks

```sh
pnpm run format
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
pnpm pack --pack-destination artifacts
node scripts/check-package.mjs artifacts/*.tgz
```

Use an empty `artifacts/` directory for each candidate so the check receives one
tarball. Generated artifacts, Pods, native builds and documentation builds are
ignored. Commit the pnpm lockfile whenever dependencies change.

## Native verification

If Stim is not installed globally, replace `stim` below with `npx stim`.

```sh
cd example
stim doctor --platform ios
stim doctor --platform android
stim start
stim ios
stim android
stim logs --errors
```

For Duo, use Xcode 27.1 beta and an installed iOS 27.1 runtime:

```sh
DEVELOPER_DIR=/Applications/Xcode-27.1.0-Beta.app/Contents/Developer \
  stim ios --device-type 'iPhone Duo' --runtime 27.1
```

The library compiles with older SDKs, but the iOS 27.1 functionality is compiled
out when those declarations are absent. Test older-runtime fallback separately
from the iOS 27.1 implementation. A generic simulator build in CI verifies
compilation; it does not prove Duo behavior.

The example displays the hinge array, native posture, radians/degrees and
subscription update count. Test unavailable readings on an ordinary emulator,
flat and half-open posture on a foldable emulator, and angle conversion from
Android degrees to public radians. Verify hook and non-React observer updates,
subscription cleanup, and independent root observations. Multiple-hinge mappings
require a suitable device; unit coverage is not hardware verification.

For the optional Reanimated path, keep Native and simulated Preview results
separate. Confirm a fixed-angle cold launch, a changing native angle under
`useAnimatedHinges()`, and ordinary hook/observer updates alongside the shared
value. During a JS-stall check, continue supplying native angle changes; a
self-running preview animation does not establish sensor delivery. The retained
shared value currently keeps its last snapshot after unmount, while the native cache clears when its last subscriber leaves.

Treat event-rate samples as distinct changed-value deliveries for that input
sequence. Record actual elapsed time and gaps; do not equate them with rendered
frames or physical sampling frequency. The
[initial Android emulator report](verification/android-emulator-2026-09-20.md)
records the known method and limitations. Rerun affected behavior for the exact
release candidate if the implementation changes.

Use the device ID reported by Stim for app automation and screenshots. Some Duo
capture tools default to the inactive display; enumerate displays with
`xcrun simctl io <udid> enumerate` and choose the active display explicitly.
Device screen power is not proof of a fold posture change.

After retaining screenshots and logs, use `stim stop` from the example to stop
only its owned local resources.

For CocoaPods, use a Ruby version compatible with `example/Gemfile`, then run
`bundle install` and `bundle exec pod install --project-directory=ios` from
`example/`. Set `LANG=en_US.UTF-8` and `LC_ALL=en_US.UTF-8`.

### Automated Android check

`pnpm e2e:android` drives the example on an attached Android emulator, which
must be an emulator because the hinge sensor is driven through the emulator
console, and needs no Metro server. It builds the example release variant, which the
React Native template signs with the checked-in debug keystore and ships with
the JavaScript bundle embedded, installs it, then cold launches it.

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
E2E_ANDROID_SERIAL=emulator-5590 pnpm e2e:android
```

Set `E2E_ANDROID_SERIAL` when more than one device is attached; with a single
attached device the script uses it. Set `E2E_SKIP_BUILD=1` to reuse the APK that
is already installed. The Gradle build is limited to the ABI the target device
reports.

The check opens the Sensor lab and asserts the mode pill reads `NATIVE HINGE`.
It then drives the hinge with
`adb -s <serial> emu sensor set hinge-angle0 <degrees>` and asserts the native
angle reads `45.0°` with status `partiallyOpen` at 45 degrees, and `180.0°` with
status `fullyOpen` at 180 degrees. It then cold
launches the app again, which lands on Field Notes, and asserts the
`NATIVE 180.0°` readout there. Every asserted state is screenshotted into
`e2e/artifacts/`, which the existing `artifacts/` ignore rule already covers. A
failed assertion exits non-zero and prints the accessibility snapshot.

The return to Field Notes is a relaunch rather than a press on the Sensor lab's
own Back to Field Notes control, because that control occupies the bottom 44dp
of an edge-to-edge window and the system taskbar covers it on a foldable inner
display.

The target needs a hinge sensor. The `pixel_fold` and `pixel_9_pro_fold` AVD
profiles define one hinge over a 0 to 180 degree range with posture bands of
0-30, 30-150 and 150-180. On an ordinary phone emulator there is no
`hinge-angle0` sensor and the check fails at the first angle assertion.

The status assertions need the emulator to publish device states. Confirm with
`adb -s <serial> shell cmd device_state print-states`, which should list
`CLOSED`, `HALF_OPENED` and `OPENED`. An emulator that lists only `DEFAULT` has
not brought up its posture configuration, so the library reports a live angle
with the status left at `unknown` and the status assertions fail. Restarting
that emulator restores the device states.

The check runs `cmd device_state state reset` before it drives the sensor. A
leftover posture override from an earlier session pins the committed state, and
the hinge angle then stops driving it. Posture also lands a few seconds after
the angle does, so the status assertions allow 15 seconds while the angle
assertions allow 5.

`.github/workflows/e2e-android.yml` runs the same script on `workflow_dispatch`
and on pull requests carrying the `e2e-android` label.

## Pull requests

Before committing, run all checks above and the native builds affected by the
diff. Use conventional commit prefixes. Open a draft PR with a concise behavior
summary, testing evidence and any unavailable validation. Keep screenshots with
the review when the example UI changes. Resolve actionable review findings and
rerun affected checks. Merge only after required CI passes and a maintainer
has authorized the merge.

## Documentation

```sh
pnpm run docs:start
pnpm run docs:build
```

Docusaurus serves the site locally; building it does not deploy it. Preview the
landing page and API documentation at desktop and mobile widths after UI edits.
