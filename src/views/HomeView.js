/***
 *  Exposes
 *      HomeView.*.onLine (* is the name of any channel)
 *  Consumes
 *      FileModalView.onFileAdded
 *      FileModalView.onFileEdited
 *      FileView.output
 *      NavigationView.onRemoveFile
 *      NavigationView.toggleScrollToBottom
 */
import 'jquery';
var _ = require('underscore');
var Backbone = require('backbone');
import BaseView from '../core/BaseView.js';

import FileView from './FileView.js';
import template from '../templates/HomeTemplate.js';
import { template as styleTemplate } from '../templates/HomeStyleTemplate.js';
import lowdb from 'lowdb';
import path from 'path';
import jetpack from 'fs-jetpack';
import { remote } from 'electron';
import env from '../env';
import io from 'socket.io-client';

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
const manifest = appDir.read('package.json', 'json');
const dbFile = path.join(app.getPath('userData'), 'db.json');

var HomeView = BaseView.extend({
  name: 'HomeView',
  childViews: {},
  el: '#content',

  template: _.template(template),
  styleTemplate: _.template(styleTemplate),

  scrollToBottom: true,

  watchers: {},

  events: {
  },

  initialize: function() {
    var self = this
        , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') });
    
    $('body')
      .on('FileModalView.onFileAdded', function(e, id){
          var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
              , file = db.get('files').find({id: id}).value();
          if (file.isRemote) {
            self.addWatcher(file);
          }
          self.childViews[id] = new FileView(file);
      })
      .on('FileModalView.onFileEdited', function(e, id){
          var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
              , file = db.get('files').find({id: id}).value();
          self.childViews[id].close();
          delete self.childViews[id];
          self.childViews[id] = new FileView(file);
      })
      .on('NavigationView.onRemoveFile', function(e, id){
          var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
              , file = db.get('files').find({id: id}).value();
          self.childViews[id].close();
          delete self.childViews[id];
      })
      .on('FileView.output', function(e){
          if (!self.scrollToBottom) {
              return true;
          }
          var element = document.getElementById("file-output");
          element.scrollTop = element.scrollHeight;
      })
      .on('NavigationView.toggleScrollToBottom', function(e){
          self.scrollToBottom = !self.scrollToBottom;
      })
      .on('SettingsModalView.onSettingsChanged', function(e){
        var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
            , settings = db.get('settings').value();
        $('#home-style').remove();
        $('body').append(self.styleTemplate(settings));
        
        $('.file-line.settings-hidden').removeClass('settings-hidden');
        if (settings.filter != '') {
          var regex = new RegExp(settings.filter, 'i');
          $('.file-line').each(function(k, v){
            var regex = new RegExp(settings.filter, 'i');
            if (!$(this).text().match(regex)) {
                $(this).addClass('settings-hidden');
            }
          });
        }
      });

    var settings = db.get('settings').value();
    $('body').append(this.styleTemplate(settings));

    var files = db.get('files').value();
    _.forEach(files, function(file, index) {
      if (file.isRemote) {
        self.addWatcher(file);
      }
      self.childViews[file.id] = new FileView(file);
    });

    return BaseView.prototype.initialize.call(this);
  },

  afterRender: function(){
    $(window).on('resize', function(){
      $('#file-output').css({
          'height' : '100%',
          'width' : ($(this).outerWidth() - $('#navigation').outerWidth()) + 'px',
       })
    });
    $(window).resize();

    return BaseView.prototype.afterRender.call(this);
  },

  addWatcher: function(file) {
    var self = this;
    if (!(file.remoteHost in this.watchers)) {
      var watcher = {
        socket: io(file.remoteHost + ':' + file.remotePort + '?token=' + file.remoteToken),
        channels: Array()
      }
      this.watchers[file.remoteHost] = watcher;
      this.watchers[file.remoteHost].channels.push(file.remoteChannel);
      watcher.socket.on('connect', function(data) {
        watcher.socket.emit('watch', file.remoteChannel);
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onClearError`, [data]);
      });
      watcher.socket.on(`${file.remoteChannel}-line` , function(data) {
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onLine`, [data]);
      });

      watcher.socket.on(`${file.remoteChannel}-closed`, function(data) {
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onChannelClosed`, [data]);
      });

      watcher.socket.on(`${file.remoteChannel}-error`, function(data) {
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onError`, [data]);
      });

      watcher.socket.on('disconnect', function() {
        self.onSocketError(file.remoteHost, 'Disconnected.');
      });

      watcher.socket.on('connect_error', function(data) {
        self.onSocketError(file.remoteHost, 'Connection error.');
      });

      watcher.socket.on('reconnect', function(data) {
        self.onSocketError(file.remoteHost, `Reconnecting attempt ${data}`);
      });

      watcher.socket.connect();
    }
    else {
      this.watchers[file.remoteHost].socket.emit('watch', file.remoteChannel);
      this.watchers[file.remoteHost].channels.push(file.remoteChannel);
      this.watchers[file.remoteHost].socket.on(`${file.remoteChannel}-line` , function(data) {
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onLine`, [data]);
      });
      this.watchers[file.remoteHost].socket.on(`${file.remoteChannel}-closed`, function(data) {
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onChannelClosed`, [data]);
      });

      this.watchers[file.remoteHost].socket.on(`${file.remoteChannel}-error`, function(data) {
        var room = `${file.remoteHost}.${file.remoteChannel}`;
        $('body').trigger(`HomeView.${room}.onError`, [data]);
      });
    }

    $('body')
        .on('FileModalView.onFileEdited', function(e, id, newFile, oldFile){
            id = parseInt(id);
            if (id != file.id) {
                return;
            }

            if (
              oldFile.remoteHost != newFile.remoteHost
              || oldFile.remotePort != newFile.remotePort
              || oldFile.remoteChannel != newFile.remoteChannel
            ) {
              if (self.removeWatchedChannel(oldFile.remoteHost, oldFile.remoteChannel) == 0) {
                self.closeHost(oldFile.remoteHost);
              }

              self.addWatcher(newFile);
            }

        })

  },

  onSocketError: function(host, error) {
    _.forEach(this.watchers[host].channels, function(channel, index) {
      var room = `${host}.${channel}`;
      $('body').trigger(`HomeView.${room}.onError`, [error]);
    });
  },

  removeWatchedChannel: function(host, channel) {
    this.watchers[host].socket.off(`${channel}-line`);
    this.watchers[host].socket.off(`${channel}-closed`);
    this.watchers[host].socket.off(`${channel}-error`);

    var room = `${host}.${channel}`;
    $('body').trigger(`HomeView.${room}.onChannelClosed`, [channel]);

    let i = this.watchers[host].channels.indexOf(channel);
    this.watchers[host].channels.splice(i, 1);
    return this.watchers[host].channels.length;
  },

  closeHost: function(host) {
    this.watchers[host].socket.disconnect();
    delete this.watchers[host].socket;
    delete this.watchers[host];
  }
});

export default HomeView;
