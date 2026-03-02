'use strict';

/**
 * Promptzy — Electron Preload Script
 * ────────────────────────────────────
 * Runs in the renderer process with Node access BEFORE the web page loads.
 * Uses contextBridge to safely expose a minimal API to the renderer.
 * contextIsolation: true and nodeIntegration: false are enforced in main.cjs.
 */

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** Runtime version info (read-only) */
  versions: {
    node:     process.versions.node,
    chrome:   process.versions.chrome,
    electron: process.versions.electron,
  },
  /** Host platform string: 'darwin' | 'win32' | 'linux' */
  platform: process.platform,
  /** True when running from the unpacked app (not dev server) */
  isPackaged: !process.env.NODE_ENV || process.env.NODE_ENV !== 'development',
});
