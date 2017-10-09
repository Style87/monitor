import { app } from 'electron';

export const applicationMenuTemplate = {
  label: 'Application',
  submenu: [
    { label: "Quit", accelerator: "CmdOrCtrl+Q", click: function() { app.quit(); }}
  ]
};
