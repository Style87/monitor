// Here is the starting point for your application code.

var $ = require('jquery');
window.$ = $;
window.jQuery = $;
require('bootstrap');

var Backbone = require('backbone');

import Router from './router.js';
import AppView from './views/AppView.js';
import lowdb from 'lowdb';
import path from 'path';

const fileAsync = require('lowdb/lib/storages/file-async')

// Small helpers you might want to keep
import './helpers/context_menu.js';
import './helpers/external_links.js';

// All stuff below is just to show you how it works. You can delete all of it.
import { remote } from 'electron';
import jetpack from 'fs-jetpack';
// import { greet } from './hello_world/hello_world';
import env from './env';

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files form disk like it's node.js! Welcome to Electron world :)
const manifest = appDir.read('package.json', 'json');

const osMap = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux',
};

// Start database using file-async storage
// For ease of use, read is synchronous
const db = lowdb(path.join(app.getPath('userData'), 'db.json'), {
  storage: fileAsync
});

db.defaults({ settings: {
    "color": "#FFF",
    "filter": ""
  }, files: [] }).write()
  .then(function(){
    var contentView = new AppView();
    contentView.render();
    
    var router = new Router();
    Backbone.history.start();
  });