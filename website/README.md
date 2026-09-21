# Documentation website

Docusaurus 3.10.2. This private pnpm workspace uses the repository's shared lockfile and Ox tooling.

From the repository root:

```sh
pnpm install
pnpm run docs:start
```

Open the URL printed by Docusaurus. The site uses the `/react-native-hinges/` base path.

```sh
pnpm run format:check
pnpm run docs:build
pnpm --filter hinges-docs serve
```

The production build validates internal links and produces `website/build/`. Its URL configuration targets `https://appandflow.github.io/react-native-hinges/`; these commands do not deploy it. Update `url` and `baseUrl` before hosting elsewhere.

Keep the public API reference, native platform mappings, and installation guidance aligned with the published release. The site remains a local build until deployment is separately verified.
