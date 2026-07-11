# Project Memory

## 2026-07-11 - Dependency audit cleanup

### What was decided

- Keep the UI background simple and set the app page background to `#111113`.
- Use standard `npm audit fix` first, then targeted major upgrades for `electron` and `electron-builder` to clear the remaining audit findings.
- Harden the packaged Electron `app://` protocol handler with a path-boundary check before serving files from `dist/`.
- Update the Linux desktop-entry metadata to the electron-builder 26 `linux.desktop.entry` shape.
- Use `linux.executableName: promptzy` so Electron Builder 26 does not derive an unsafe Linux executable name from the scoped npm package name.
- Use `desktopName: promptzy.desktop` so Electron Builder can align Linux desktop entries and window association metadata.
- Remove direct R2 download links from README/docs and point users to GitHub Releases instead.
- Keep the docs site npm-compatible by removing pnpm-only `.npmrc` settings, replacing the pnpm-installed `node_modules` tree with an npm install, and adding `website/package-lock.json`.
- Keep the docs site's custom theme aligned with the app's dark charcoal UI, using solid accent colors instead of gradients.

### Why

- The original near-black background was too close to the component surfaces.
- The final background needed to sit between the darkest component interiors and the earlier lighter charcoal.
- The non-force audit fix resolved most vulnerabilities, while the remaining findings required Electron and electron-builder major upgrades.
- Electron's custom protocol docs recommend checking file paths before serving local resources.
- The electron-builder 26 schema rejected the old flat `linux.desktop` metadata object during a packaging smoke test.
- The electron-builder 26 AppImage path validation rejected the scoped npm package name-derived executable.
- The first successful 1.4.4 release build still warned about missing Linux `desktopName`.
- The project owner wants to clean up R2 buckets, so release docs should not depend on direct R2 asset URLs.
- npm 11 crashed in `website/` because it was trying to install into a pnpm-shaped `node_modules/.pnpm` tree; deleting generated `website/node_modules` and reinstalling with npm fixed it.
- The docs still had the old deep navy glassy gradient treatment, which no longer matched the simplified app UI.

### What was rejected and why

- Leaving Electron/electron-builder on vulnerable versions was rejected because the user asked to fix all audit findings.
- Using `npm audit fix --force` blindly was rejected in favor of targeted upgrades with verification, since npm flagged the remaining fixes as breaking changes.
- Keeping gradient docs backgrounds/text was rejected because the current app direction is solid charcoal surfaces with restrained accents.
