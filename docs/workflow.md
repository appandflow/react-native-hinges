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
provider unmount cleanup, and independent observers. Multiple-hinge mappings
require a suitable device; unit coverage is not hardware verification.

Use the device ID reported by Stim for app automation and screenshots. Some Duo
capture tools default to the inactive display; enumerate displays with
`xcrun simctl io <udid> enumerate` and choose the active display explicitly.
Device screen power is not proof of a fold posture change.

After retaining screenshots and logs, use `stim stop` from the example to stop
only its owned local resources.

For CocoaPods, use a Ruby version compatible with `example/Gemfile`, then run
`bundle install` and `bundle exec pod install --project-directory=ios` from
`example/`. Set `LANG=en_US.UTF-8` and `LC_ALL=en_US.UTF-8`.

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
