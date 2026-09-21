#!/usr/bin/env node
/**
 * Android end-to-end check for the example app.
 *
 * The example is installed as a release build. The React Native template signs
 * the release variant with the checked-in debug keystore and embeds the
 * JavaScript bundle, so the run never needs a Metro server. That is the reason
 * assembleRelease is used here instead of a bundled debug variant.
 *
 * Environment:
 *   E2E_ANDROID_SERIAL  adb serial to drive. Required when more than one device
 *                       is attached; otherwise the sole attached device is used.
 *   E2E_SKIP_BUILD=1    reuse the already installed APK and skip build/install.
 *
 * Screenshots are written to e2e/artifacts/.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'example', 'android');
const apk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const artifacts = path.join(root, 'e2e', 'artifacts');
const appId = 'hinges.example';
const session = 'hinges-e2e-android';
const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
const adbBin = sdk ? path.join(sdk, 'platform-tools', 'adb') : 'adb';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

// adb blocks indefinitely against a wedged server or a flapping emulator, so bound every call.
function adb(args) {
  return run(adbBin, args, { timeout: 60000 });
}

function ad(args, options = {}) {
  return run('agent-device', [...args, '--platform', 'android', '--device', avdName, '--session', session], options);
}

function fail(message, detail) {
  console.error(`FAIL ${message}`);
  if (detail) console.error(detail.trim());
  const snapshot = ad(['snapshot', '-i']);
  console.error('--- accessibility snapshot ---');
  console.error((snapshot.stdout || snapshot.stderr || '(snapshot unavailable)').trim());
  ad(['close']);
  process.exit(1);
}

function resolveSerial() {
  const listed = adb(['devices']);
  if (listed.status !== 0) {
    console.error(`FAIL adb devices exited with ${listed.status}`);
    console.error((listed.stderr || '').trim());
    process.exit(1);
  }
  const attached = listed.stdout
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split('\t'))
    .filter((parts) => parts[1] === 'device')
    .map((parts) => parts[0]);
  const requested = process.env.E2E_ANDROID_SERIAL;
  if (requested) {
    if (!attached.includes(requested)) {
      console.error(`FAIL E2E_ANDROID_SERIAL=${requested} is not attached. Attached: ${attached.join(', ') || 'none'}`);
      process.exit(1);
    }
    return requested;
  }
  if (attached.length !== 1) {
    console.error(`FAIL set E2E_ANDROID_SERIAL. Attached devices: ${attached.join(', ') || 'none'}`);
    process.exit(1);
  }
  return attached[0];
}

const serial = resolveSerial();

// agent-device selects Android emulators by AVD name, while the hinge sensor is driven by adb serial.
function resolveAvdName() {
  const named = adb(['-s', serial, 'emu', 'avd', 'name']);
  const name = named.stdout.split('\n')[0].trim();
  if (named.status !== 0 || !name || name === 'KO') {
    console.error(`FAIL ${serial} is not an emulator with a readable AVD name; the hinge sensor cannot be driven`);
    process.exit(1);
  }
  return name;
}

const avdName = resolveAvdName();

// A leftover `cmd device_state state <id>` override pins the committed posture, so the hinge angle
// stops driving it and the status assertions read whatever the previous session left behind.
function clearDeviceStateOverride() {
  adb(['-s', serial, 'shell', 'cmd', 'device_state', 'state', 'reset']);
}

function setHingeAngle(degrees) {
  const result = adb(['-s', serial, 'emu', 'sensor', 'set', 'hinge-angle0', String(degrees)]);
  if (result.status !== 0 || !result.stdout.includes('OK')) {
    fail(`could not set hinge-angle0 to ${degrees}`, result.stdout + result.stderr);
  }
  console.log(`hinge-angle0 set to ${degrees} degrees on ${serial}`);
}

function expectText(label, text, timeoutMs = 5000) {
  const result = ad(['wait', 'text', text, String(timeoutMs)]);
  if (result.status !== 0) {
    fail(`${label}: ${JSON.stringify(text)} not visible within ${timeoutMs}ms`, result.stdout + result.stderr);
  }
  console.log(`PASS ${label}: ${JSON.stringify(text)}`);
}

let captured = 0;
function capture(name) {
  captured += 1;
  const file = path.join(artifacts, `${String(captured).padStart(2, '0')}-${name}.png`);
  const result = ad(['screenshot', file]);
  if (result.status !== 0) fail(`screenshot ${name}`, result.stdout + result.stderr);
  console.log(`SHOT ${file}`);
}

function press(label, target) {
  const result = ad(['press', target, '--settle']);
  if (result.status !== 0) fail(`${label}: could not press ${target}`, result.stdout + result.stderr);
}

function coldLaunch(label) {
  const result = ad(['open', appId, '--relaunch', '--foreground']);
  if (result.status !== 0) {
    console.error(`FAIL ${label}: cold launch`);
    console.error((result.stdout + result.stderr).trim());
    process.exit(1);
  }
  console.log(`LAUNCH ${label}: ${appId} on ${serial} (${avdName})`);
}

mkdirSync(artifacts, { recursive: true });

if (process.env.E2E_SKIP_BUILD !== '1') {
  const abi = adb(['-s', serial, 'shell', 'getprop', 'ro.product.cpu.abi']).stdout.trim();
  if (!/^[a-z0-9_-]+$/.test(abi)) {
    console.error(`FAIL could not read ro.product.cpu.abi from ${serial}`);
    process.exit(1);
  }
  console.log(`Building the example release APK for ${serial} (${abi})`);
  const built = run(path.join(androidDir, 'gradlew'), [':app:assembleRelease', `-PreactNativeArchitectures=${abi}`], {
    cwd: androidDir,
    stdio: 'inherit',
  });
  if (built.status !== 0) {
    console.error('FAIL gradle assembleRelease');
    process.exit(1);
  }
  const installed = run(adbBin, ['-s', serial, 'install', '-r', apk], { stdio: 'inherit' });
  if (installed.status !== 0) {
    console.error('FAIL adb install');
    process.exit(1);
  }
}

clearDeviceStateOverride();
setHingeAngle(180);

coldLaunch('open field notes');
expectText('field notes ready', 'Sensor lab ↗', 20000);
press('open sensor lab', 'text="Sensor lab ↗"');

expectText('sensor lab reads the native hinge', 'NATIVE HINGE', 15000);
capture('sensor-lab-native-hinge');

setHingeAngle(45);
expectText('native angle at 45 degrees', '45.0°');
expectText('status at 45 degrees', 'partiallyOpen', 15000);
capture('sensor-lab-hinge-45');

setHingeAngle(180);
expectText('native angle at 180 degrees', '180.0°');
expectText('status at 180 degrees', 'fullyOpen', 15000);
capture('sensor-lab-hinge-180');

// Field Notes is the launch screen, and the example's own Back to Field Notes control sits in the
// bottom 44dp of an edge-to-edge window, under the system taskbar, so it is not hittable here.
coldLaunch('return to field notes');
expectText('field notes native readout', 'NATIVE 180.0°', 20000);
capture('field-notes-native-180');

ad(['close']);
console.log(`e2e:android passed on ${serial}. Screenshots in ${artifacts}`);
