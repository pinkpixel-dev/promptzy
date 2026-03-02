'use strict';

/**
 * Promptzy — Electron Main Process
 * ─────────────────────────────────
 * In development: loads http://localhost:8080 (Vite dev server)
 * In production:  serves dist/ via the custom app:// protocol so that
 *                 react-router BrowserRouter can resolve all routes correctly.
 */

const { app, BrowserWindow, protocol, net, shell, Menu, MenuItem } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

// Must be called before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard:        true,
      secure:          true,
      supportFetchAPI: true,
      corsEnabled:     true,
    },
  },
]);

// ── Application menu ────────────────────────────────────────────────────────
function buildAppMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),

    // File
    {
      label: 'File',
      submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // View
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Window
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front' }]
          : [{ role: 'close' }]),
      ],
    },

    // Help
    {
      label: 'Help',
      submenu: [
        {
          label: 'Promptzy on GitHub',
          click: () => shell.openExternal('https://github.com/pinkpixel-dev/promptzy'),
        },
        {
          label: 'Visit Pink Pixel',
          click: () => shell.openExternal('https://pinkpixel.dev'),
        },
        { type: 'separator' },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/pinkpixel-dev/promptzy/issues'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Window factory ───────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width:     1400,
    height:    900,
    minWidth:  1024,
    minHeight: 700,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
    },
    backgroundColor: '#1a1a2e',
    show:            false,
    icon:            path.join(__dirname, '../public/icon.png'),
    titleBarStyle:   process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title:           'Promptzy',
  });

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:8080');
    // Uncomment to auto-open DevTools in dev:
    // win.webContents.openDevTools({ mode: 'undocked' });
  } else {
    win.loadURL('app://promptzy/');
  }

  // Show only once fully rendered (avoids white flash)
  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  // Open all target="_blank" / window.open links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Right-click context menu (copy/paste for editable fields)
  win.webContents.on('context-menu', (_e, params) => {
    const ctxMenu = new Menu();
    if (params.selectionText) {
      ctxMenu.append(new MenuItem({ label: 'Copy',  role: 'copy' }));
    }
    if (params.isEditable) {
      ctxMenu.append(new MenuItem({ label: 'Cut',   role: 'cut' }));
      ctxMenu.append(new MenuItem({ label: 'Paste', role: 'paste' }));
    }
    if (ctxMenu.items.length > 0) ctxMenu.popup();
  });

  return win;
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Register app:// → dist/ mapping for production builds
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    const distPath = path.join(__dirname, '../dist');

    // Serve index.html for "/" and fall back for any unresolvable path (SPA routing)
    const filePath =
      pathname === '/'
        ? path.join(distPath, 'index.html')
        : path.join(distPath, pathname);

    return net
      .fetch(pathToFileURL(filePath).toString())
      .catch(() =>
        net.fetch(pathToFileURL(path.join(distPath, 'index.html')).toString()),
      );
  });

  buildAppMenu();
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit on all-windows-closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
