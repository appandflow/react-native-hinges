# Field Notes cutout and fold showcase

Verified on the task-owned Android 16/API 36 emulator, with RN 0.88.0-rc.1,
Reanimated 4.7.0, Worklets 0.13.0 and the example's existing FIFO patch.

## App behavior

- The full-screen reserved-regions provider measures occlusions. The header uses
  its largest clear horizontal interval with 12 points of clearance. Narrow
  intervals omit the brand and constrain the Sensor lab button.
- The nested provider still measures the journal's fold in journal coordinates.
- The pages have no perspective or rotation transforms. Native angle changes
  affect lighting; secondary text and the footer fade and slide down between
  120 and 60 degrees. Reduced motion disables translation.
- Amber bounds highlight the native occlusion rectangle. This API does not identify
  the camera or report its exact shape.

## Capture

The retained `fold-showcase/native-screen.mp4` is the native app capture, cropped
from the emulator's 2076 x 2424 video to its 2076 x 2152 content rectangle at
(0, 136). The original capture lasts 18.530256 seconds.

The emulator's corner-cutout overlay reports x=803.6923, y=0, width=48, height=48
in provider points. At density 2.4375 this is the pixel rectangle (1959, 0) to
(2076, 117). The Sensor lab button stays beside that area.

Posture remains HALF_OPENED for the entire recording so the native fold region
stays visible. The emulator's independent native hinge sensor sweeps
180 -> 120 -> 90 -> 60 -> 120 -> 180 degrees. This is a controlled emulator
setup, not evidence that physical hardware reports half-open posture at 180 degrees.
The app's generated Preview mode is disabled.

Cold launch and the native sequence passed; the recent runtime error log was
empty. Formatting, lint, types, eight unit tests, package build and Docusaurus
build passed. Fresh Astra review caught the narrow-header overflow; it was fixed
and the reviewer confirmed the change. The wide capture is unaffected by that fix.

## 3D composition

Use native video timestamps for angle synchronization. The retained
`steady-angles.json` samples the on-screen native angle every 100ms using Vision
OCR and records both requested video time and the actual reused source-frame time.
Interpolate these presentation keyframes; they are not a sensor-frequency benchmark.

The selected asset is [RHModels' free rigged Galaxy Z Fold 3](https://www.cgtrader.com/free-3d-models/electronics/phone/samsung-galaxy-z-fold-3-black-free-3d-model).
The user supplied its archive; Blender imports its original rig and materials.
The generic phone and camera close-up stills are composition prototypes, not
renders of that asset. The illustrated camera shape is separate from the measured native bounds.

The planned video shows the phone folding, then zooms to identify the steady fold
region and the cutout clearance. Keep the device rendering distinct from the native
app recording. This report does not claim that the final 3D video is complete.
