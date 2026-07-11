# Project Memory

## 2026-07-11 - Dependency audit cleanup

### What was decided

- Keep the UI background simple and set the app page background to `#141416`.
- Use standard `npm audit fix` first, then targeted major upgrades for `electron` and `electron-builder` to clear the remaining audit findings.
- Harden the packaged Electron `app://` protocol handler with a path-boundary check before serving files from `dist/`.
- Update the Linux desktop-entry metadata to the electron-builder 26 `linux.desktop.entry` shape.

### Why

- The original near-black background was too close to the component surfaces.
- The non-force audit fix resolved most vulnerabilities, while the remaining findings required Electron and electron-builder major upgrades.
- Electron's custom protocol docs recommend checking file paths before serving local resources.
- The electron-builder 26 schema rejected the old flat `linux.desktop` metadata object during a packaging smoke test.

### What was rejected and why

- Leaving Electron/electron-builder on vulnerable versions was rejected because the user asked to fix all audit findings.
- Using `npm audit fix --force` blindly was rejected in favor of targeted upgrades with verification, since npm flagged the remaining fixes as breaking changes.
