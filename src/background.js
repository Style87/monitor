// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from 'path';
import url from 'url';
import { app, Menu } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { applicationMenuTemplate } from './menu/application_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import { fileMenuTemplate } from './menu/file_menu_template';
import createWindow from './helpers/window';

const { BrowserWindow, protocol, ipcMain } = require('electron');
const log = require('electron-log');
const { autoUpdater } = require("electron-updater");

autoUpdater.autoDownload = false;
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

const setApplicationMenu = () => {
  const menus = [];
  if (process.platform == 'darwin') {
    menus.push(applicationMenuTemplate);
    menus.push(editMenuTemplate);
  }

  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }

  Menu.setApplicationMenu(menus.length > 0 ? Menu.buildFromTemplate(menus) : null);
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app.html'),
    protocol: 'file:',
    slashes: true,
  }));

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }
  
  function sendStatusToWindow(text) {
    log.info(text);
    mainWindow.send('update-message', text);
  }

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
  })
  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('<a href="https://github.com/Style87/monitor/releases/latest" class="js-external-link">Update available.</a>');
  })
  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('Up to date.');
  })
  autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater.');
  })
  
  ipcMain.on('check-for-update', function(){
    autoUpdater.checkForUpdates();
  })
});

app.on('window-all-closed', () => {
  app.quit();
});
