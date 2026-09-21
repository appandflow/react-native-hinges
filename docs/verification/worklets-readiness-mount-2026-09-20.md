# Readiness-gated Reanimated mount: Worklets FIFO workaround

Tested with React Native `0.88.0-rc.1`, Reanimated `4.7.0`, Worklets `0.13.0`,
and the reserved-regions alpha.2 candidate. This is development-build evidence;
registry publication and npm-installed runtime behavior were not established.

## Reproduction and cause

On Android 16/API 36 emulator-5580, conditionally mounting Field Notes artwork
when `useReservedRegionsReady()` became true failed after cold launch and a clean
Metro reset/reload. Reanimated's `ViewDescriptorsSet.add` reached
`global.__requestMapperRunFinalizer(this.flush)` before that function existed.
With the same unpatched APK and dependencies, the original Field Notes screen
and an always-mounted version of the polished artwork started successfully;
restoring the readiness-gated mount reproduced the error.

Worklets could execute a new UI-thread job immediately while older initialization
work remained queued. The example's
[Worklets patch](../../patches/react-native-worklets@0.13.0.patch) puts all jobs
through the existing FIFO and prevents recursive draining inside a running batch.
It resets the drain guard on exceptions and releases queue locks before callbacks.
The patch changes the shared scheduler and Android/iOS scheduling methods.
Installing either library does not apply this example-only dependency patch to
consumer apps. A consuming app must apply the patch, rebuild its native app,
and validate the integration. Always-mounted rendering avoided the tested trigger; it is not
proof of general compatibility.

## Checks

A standalone C++20 harness compiled actual scheduler/queue code, with only JNI
posting replaced by a counter and the unused CallInvoker include stubbed:

| Ordering scenario                                        | Original | Patched |
| -------------------------------------------------------- | -------- | ------- |
| Older queued initialization before new UI attachment     | Failed   | Passed  |
| Reentrant work after its batch and older queued work     | Failed   | Passed  |
| Exception recovery preserves queued work before new work | Failed   | Passed  |

The harness used `-Wall -Wextra -Werror` and ten-second process timeouts. It
checks scheduling order; it does not compile UIKit/JNI or model the full app.

After the native Android rebuild, the readiness-gated example passed cold launch,
full reload, and a controlled native angle/posture sequence. The measured fold
and native angle readout updated. Fresh error logs after startup and motion were
empty. Preview displayed **SIMULATED ANGLE** while its independently labeled
native readout remained native; returning to native mode worked. Formatting,
lint, type checks, and all eight existing unit tests passed.

The iOS example compiled with Xcode 27.1 beta on the iPhone Duo 27.1 simulator
`EC33DE7B-AFC0-43F4-AEC1-A16960820B4C` (22.5 seconds compilation, 61 seconds total).
It started with Ready, no page division, and a static native 0° hinge reading;
its recent error query was empty. The retained capture is `alpha2-demo/ios-combined.png`.
The synchronous conditional-mount failure was not reproduced on iOS, and changing
native iOS angles were not tested. This establishes compilation and static startup,
not an iOS reproduction-and-fix result.

## Evidence and limits

Android reproduction and patched runs are retained under
`/private/tmp/hinges-launch-alpha2/`: `diagnosis.md`, both provenance JSON files,
startup/reload/motion screenshots, empty error logs, `input.json`, and the native
recording. The scheduler harness and candidate diff are under
`/private/tmp/worklets-fifo-candidate/`. Archive relevant originals for durable
review; temporary files are not release attachments.

The Android input sequence used native emulator sensor commands and a fold
override, not generated app preview. Its approximately 60 commands/second is host
input cadence, not sensor delivery frequency or rendered FPS. No physical-device,
multiple-root, first-frame, or general dependency-compatibility guarantee follows.
The recordings used a local regions candidate tarball. After the iOS build, the
repository switched to Git commit `0c5a9ec`, with identical native library code;
that dependency resolution is a separate installation configuration.
