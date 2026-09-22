# Release process

This repository publishes one package, `react-native-hinges`. The
example and documentation site are private. Keep this document aligned with
[the Release workflow](.github/workflows/release.yml).

## First functional alpha readiness

`0.1.0-alpha.0` is a name-reservation placeholder. `0.1.0-alpha.2` is the first
functional alpha described in [the release notes](docs/releases/0.1.0-alpha.2.md).
Confirm registry publication with the commands below; a source commit is not proof
that the version was published.

Before tagging that candidate:

- [x] Final API and optional Reanimated entry point reviewed and merged.
- [x] All required CI passes on the exact candidate commit, including native builds.
- [x] Packed root and `/reanimated` imports/declarations verified; the core import
      works without installing the optional Reanimated and Worklets peers.
- [x] Runtime evidence and unavailable checks recorded in the candidate notes.
      Keep simulated preview, simulator-native events, and physical-device results
      distinct. Record the SDK and runtime for iOS verification.
- [x] npm trusted publishing configured and verified for this exact repository,
      workflow, and environment. The alpha.2 workflow completed a trusted publish.
- [x] GitHub `release` environment approval/tag restrictions verified in GitHub.
- [x] Candidate version, release notes, tarball contents, and dist-tag reviewed.
- [x] Functional publish and registry integrity/dist-tag verified after the
      authorized tag is pushed. A successful source build is not a publish.
- [x] Launch links checked. Docusaurus is currently local only; use repository
      links until a documentation deployment has been completed and checked.

Use [docs/launch.md](docs/launch.md) for the draft announcement and video plan.
It does not authorize posting or claim that a release has happened.

## Alpha.2 publication record

`0.1.0-alpha.2` is published on npm's `next` tag. The alpha.1 Git tag remains
unchanged; that version was never published to npm.

- Commit: `bde6e969ff3ccc822cbc7d121fc72608bc90894d`.
- [Exact-tag verification and trusted publish](https://github.com/appandflow/react-native-hinges/actions/runs/35555247798) passed.
- [GitHub prerelease](https://github.com/appandflow/react-native-hinges/releases/tag/v0.1.0-alpha.2).
- Registry tarball bytes match `dist.integrity`; the provenance subject matches
  those bytes and identifies this repository, `release.yml`, the tag and commit.
- `npm audit signatures` verified the registry signature and attestation in an
  isolated fixture containing the published package, with install scripts disabled.
- Documentation sites remain local builds. Native validation and the consumer
  Worklets patch requirement are recorded in the release notes.

Registry integrity:

```text
sha512-oHaYz/l7kYu7G0ZiFOm5QIsjT941O7fGJBSmRb4yPemK+rfIF0dq8N8aTd5rmxqG1lSu7s2AwtS30kRCXHv7nA==
```

## One-time trusted-publisher setup

The package already exists on npm. In its npm settings, configure GitHub Actions:

| Field             | Value                                |
| ----------------- | ------------------------------------ |
| Organization      | `appandflow`                         |
| Repository        | `react-native-hinges`                |
| Workflow filename | `release.yml`                        |
| Environment       | `release`                            |
| Allowed action    | Direct publishing with `npm publish` |

The workflow needs `id-token: write` and a GitHub-hosted runner. Node 24 supplies
a compatible npm CLI (trusted publishing requires npm 11.5.1 or newer). No npm
write token is stored in GitHub. See [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).

Create the GitHub `release` environment, require a maintainer review, and restrict
its deployment branches/tags to release tags (`v*`). Verify these settings in
GitHub; declaring `environment: release` in YAML does not create review rules.
The npm trust relationship is also configured separately from the repository.

## Alpha.3 distribution tags

For `0.1.0-alpha.3`, the maintainer explicitly selected both `next` and `latest`.
The trusted Release workflow publishes the prerelease to `next`. After that
publish is verified, use an authenticated npm CLI to point `latest` at the same
version, then verify both tags. npm trusted publishing currently does not
support `npm dist-tag add`; do not add a long-lived CI token to work around it.

```sh
npm dist-tag add react-native-hinges@0.1.0-alpha.3 latest
npm view react-native-hinges dist-tags --json
```

## Prepare a candidate

Start from reviewed, up-to-date `main`. Check the registry rather than assuming
that a local tag was published:

```sh
git fetch origin --tags
npm view react-native-hinges dist-tags --json
npm view react-native-hinges versions --json
```

Choose the next semver version. Use `X.Y.Z-alpha.N` or `X.Y.Z-rc.N` for prereleases.
All prereleases publish to `next`; stable versions publish to `latest`. This
keeps prerelease publishing from replacing a stable default installation.

```sh
pnpm version X.Y.Z --no-git-tag-version
```

Write `docs/releases/X.Y.Z.md` with relevant sections: New, Fixes, Breaking
changes, Migration, and Verification. Record native device/runtime evidence and
any unavailable checks. Do not claim a beta API was verified on hardware when
only a simulator was used.

## Verify the exact candidate

```sh
pnpm install --frozen-lockfile
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs:build
pnpm pack --pack-destination artifacts
node scripts/check-package.mjs artifacts/*.tgz
node scripts/check-release.mjs vX.Y.Z
```

Use an empty `artifacts/` directory for the candidate. `check-package` verifies
compiled JS/declarations, native sources, the podspec, README/license and package
identity, and rejects repository-only content and unresolved workspace ranges.
Inspect the tarball as well. Only this package's intended files should ship.

Run the native verification described in [docs/workflow.md](docs/workflow.md) for
affected platforms. Verify old-SDK compilation and old-runtime fallback when SDK
guards change. Verify the RN example after dependency or codegen changes. Missing
native evidence is an explicit release limitation, not a passing check.

## Tag and publish

1. Commit the candidate version and notes. Submit the release PR and get review.
2. Merge after required CI passes. Wait for CI on the exact resulting `main`
   commit before tagging; a passing PR head is not the merge commit.
3. Create an immutable annotated tag and push it:

   ```sh
   git tag -a vX.Y.Z -m 'vX.Y.Z'
   git push origin vX.Y.Z
   ```

4. The Release workflow repeats CI, including native builds, for the tag. It
   refuses a tag/manifest mismatch, missing release notes or a commit outside
   `main`. It then waits for the `release` environment approval when that
   protection is configured. Give the approver the direct Actions run URL.
5. Approve the release after reviewing the checks. The job builds and packs with
   pnpm, validates the tarball, and publishes that tarball with npm provenance.
6. Verify the version and dist-tag in the run and registry:

   ```sh
   npm view react-native-hinges@X.Y.Z version dist.integrity --json
   npm view react-native-hinges dist-tags --json
   ```

7. Create a GitHub release using the committed notes:

   ```sh
   gh release create vX.Y.Z --title vX.Y.Z --notes-file docs/releases/X.Y.Z.md
   ```

   Add `--prerelease` for a prerelease version. Keep the package manifest at the
   released version until the next release preparation.

## Recovery

- Authentication failure: verify the exact owner, repo, workflow filename and
  environment in npm's trusted-publisher settings. Do not add a long-lived token
  as a workaround. Complete any account approval in npm directly.
- Failed checks: fix and verify on `main`, then prepare a new immutable version
  and tag. Never move a pushed release tag.
- Interrupted publish: first query the exact registry version. The workflow skips
  an already-existing version and verifies its dist-tag. It refuses registry
  lookup errors other than E404 before publishing.
- A newer release has moved the dist-tag: do not rerun an old release to move it
  backwards. Verify the older version separately and preserve the newer tag.
- A release cannot be overwritten on npm. Fix the code and publish a new version.

Setting up this workflow does not publish a version. Pushing a release tag is
a separate release action.
