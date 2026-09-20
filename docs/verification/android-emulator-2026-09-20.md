# Android emulator hinge delivery — 2026-09-20

Working-tree validation of the initial animated integration, before the final
release candidate. Device: Android 16 / API 36, `emulator-5580`, app
`hinges.example`, Reanimated 4.7.0 and Worklets 0.13.0. The demo used **Native**
and **Raw motion**. Input came from the emulator's hinge-angle sensor, not the
app's simulated-preview animation. No physical-device result is established.

## Observations

| Requested host input     | Actual injection /s | App angle changes | App window | Changes /s |  Mean gap | Maximum gap |
| ------------------------ | ------------------: | ----------------: | ---------: | ---------: | --------: | ----------: |
| 20 Hz                    |              19.989 |               219 |   10.942 s |     20.015 | 50.016 ms |   71.503 ms |
| 60 Hz                    |              59.986 |               638 |   10.647 s |     59.921 | 16.666 ms |   31.700 ms |
| 60 Hz + JS-stall control |              59.994 |               642 |   10.728 s |     59.843 | 16.718 ms |   32.379 ms |

The input sequence scheduled distinct angles from 40 to 150 degrees, wrapping
in one-degree increments, for 16 seconds. Measurement started after injection
was already running and ended before injection stopped.

UI-runtime telemetry counted distinct, non-null angle changes with
`useAnimatedReaction`. Summaries were published about once per second using
`useFrameCallback`, so nominal ten-second measurement windows ran longer than
ten seconds. Counts are delivered angle changes, not sensor callback counts or
rendered frames. Host and device clocks were not synchronized for latency tests.

The JS-stall control was tapped about five seconds into its measurement. Its
implementation blocks JavaScript for 1,000 ms. The measured 32.379 ms maximum
UI-event gap supports continued native-to-UI-runtime updates in this run. The
control invocation succeeded; the test did not independently time the stall.

Two cold process relaunches with the sensor fixed at 111 degrees both settled to
111.0 degrees, `partiallyOpen`, and one reading without additional angle input.
The initial UI readout remained empty until telemetry first published. This
covers those relaunches, not every component-remount timing or a race stress test.

After input stopped, the displayed changed-value rate fell to zero. The
measurement agent's final `stim logs --errors --since 10m` check found no matching
errors.

## Limits on interpreting the rate

The Goldfish hinge sensor was on-change. The library requested
`SENSOR_DELAY_NORMAL` (200,000 µs), while Android's `DeviceStateProvider` also
subscribed at a faster rate; sensor service showed a selected HAL period of
1 ms. Fast emulator delivery therefore cannot be attributed to the library
requesting 60 Hz.

These observations support this Android emulator's native event path and its
behavior during the JS-stall test. They do not establish physical-device
sampling rate, display-refresh synchronization, animation FPS, end-to-end
latency, or guaranteed smoothness. iOS native cadence and multiple-hinge hardware
remain unmeasured.

Android explains the on-change sensor reporting model in its
[report-mode documentation](https://source.android.com/docs/core/interaction/sensors/report-modes).

## Retained evidence

The original local capture directory is `/private/tmp/hinges-cadence/`, containing
`report.md`, `measure.py`, `20hz.json`, `60hz.json`, `60hz-stall.json`,
`benchmarks.ndjson`, `sensorservice.txt`, `60hz-stall.png`, and fixed-relaunch
snapshots. Attach or archive the required originals with the release review;
local temporary files are not durable release attachments.

Rerun the affected measurements if native registration, event delivery, or the
animated integration changes before the final candidate. Record that candidate's
exact commit with the rerun.
