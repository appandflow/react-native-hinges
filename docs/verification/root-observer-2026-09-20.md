# Android root observer verification — September 20, 2026

## Configuration

- React Native 0.88.0-rc.1, Reanimated 4.7.0, Worklets 0.13.0.
- Android 16/API 36; app `hinges.example`, Metro port 8090.
- Stim-owned emulator `emulator-5582` for build/install verification; task-owned foldable emulator `emulator-5580` for sensor tests.
- Native mode, raw motion. Fold geometry uses the AOSP `display_features` test override. Hinge angles are injected through the emulator's native sensor console.

## Build and initial state

Stim doctor passed. The Android native build passed in 13.8 seconds, including Java access to RN's internal `FabricEventEmitter`. A stale generated autolinking file referenced the previous codegen target; regenerating that ignored file resolved the initial build failure.

Stim installed and launched the app on emulator-5582. Its bundle-request check reported unverified; agent-device then confirmed live Field Notes and Sensor Lab. The same APK was installed on emulator-5580.

An initial prototype missed animated startup values because Reanimated installs handlers asynchronously. After adding the UI scheduler registration handshake, a cold process launch with the hinge held at **111°** delivered `partiallyOpen` and **1.937 radians** to the React hook and explicit observer, and **111.0°** to the animated hook, without further sensor movement. Telemetry publishes once per second; this does not establish a populated first visible frame.

## Shared observation and remount

Sensor Lab concurrently used the animated hook, React hook and explicit observer. Returning to Field Notes removed those consumers and attached its animated consumer. Android sensorservice showed one library sensor connection after navigation. Setting 60° in Field Notes and reopening Sensor Lab delivered **60.0° / 1.047 radians** consistently without further movement.

## Continuous updates during JavaScript stall

The retained run injected 960 distinct native angles over 15.98 seconds at nominal 60 Hz. Measurement began at 2.000 seconds; the existing control that spins JavaScript for one second was tapped at 7.000 seconds and acknowledged at 7.921 seconds.

| UI-runtime measurement          |        Result |
| ------------------------------- | ------------: |
| Distinct angle changes          |           641 |
| Measurement duration            | 10,683.043 ms |
| Updates per second              |      60.00163 |
| Mean gap                        |    16.6665 ms |
| Maximum gap, including JS stall |    41.1235 ms |

This supports native-to-Reanimated delivery without a JavaScript first hop. It does not establish physical-device frequency, frame rate or latency. The library still requests `SENSOR_DELAY_NORMAL`; other emulator sensor subscribers can affect delivery frequency.

## Remaining checks

A follow-up run after fixing the React snapshot cache showed no fresh client warnings or errors: `stim logs --source client --level warn --since 2m --json` exited 0 with empty output. The final metrics above are from that run with all three consumer types mounted. No Android native crash was observed. Concurrent iOS build diagnostics were excluded from this Android client check.

Multiple roots/windows, concurrent animated hooks, real hardware, release/R8 and older Window SDK extension implementations were not exercised. Observation starts with the subscription, not before React renders. Android event forwarding currently depends on RN 0.88's internal Fabric dispatcher/emitter ordering.

Local evidence is in the task's `root-hinges-android` artifact directory: `fixed-111-cold.txt`, `remount-60.txt`, `60hz-stall-input.json`, `stable-store-benchmark.ndjson`, `stable-store-warnings.ndjson`, `stable-store.txt`, `stable-store.png` and `sensorservice-after-navigation.txt`.
