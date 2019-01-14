/***
 *  Exposes
 *      FileView.output
 *  Consumes
 *      NavigationView.onPlayFile
 *      NavigationView.onPauseFile
 */
 import 'jquery';
 var _ = require('underscore');
 var Backbone = require('backbone');
import template from '../templates/FileTemplate.js';
import { template as styleTemplate} from '../templates/FileStyleTemplate.js';
import tail from 'tail';
import lowdb from 'lowdb';
import path from 'path';
import fs from 'fs';
import { remote } from 'electron';
import io from 'socket.io-client';

const app = remote.app;
const dbFile = path.join(app.getPath('userData'), 'db.json');

var FileView = Backbone.View.extend({
    el: '#file-output',
    template: _.template(template),
    styleTemplate: _.template(styleTemplate),
    play: false,
    events: {},

  initialize: function(options) {
      this.model = options;

      this.initializeFile();
  },

    render: function(data) {
      var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
          , settings = db.get('settings').value();
        if (typeof data == 'undefined' || !this.play) {
            return false;
        }

        if (this.model.jsonFormat != '') {
            var line = this.model.jsonFormat
                , jsonData = JSON.parse(data)
                , template = _.template(this.model.jsonFormat);
            data = template(jsonData);
        }

        var filtered = '';
        if (this.model.filter != '') {
          var regex = new RegExp(this.model.filter, 'i');
          if (data.match(regex) === null) {
            filtered = 'file-hidden';
          }
        }

        if (settings.filter != '') {
          var regex = new RegExp(settings.filter, 'i');
          if (data.match(regex) === null) {
            filtered += ' settings-hidden';
          }
        }

        this.$el = this.template({model: this.model, line: data, filtered: filtered});

        $('#file-output').append(this.$el);

        $('body').trigger('FileView.output');
    },

    close: function() {
      clearInterval(this.interval);
      $('#file-style-' + this.model.id).remove();
      if (!this.model.isRemote) {
        this.tailFile.unwatch();
      }
      else {
        this.socket.emit('unwatch', this.model.remoteChannel);
        this.socket.close();
      }

      return this;
    },

    initializeFile: function() {
      var self = this;
      if (!this.model.isRemote) {
        if (!fs.existsSync(this.model.fullPath)) {
          console.error("File doesn't exist.");
          var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') }),
            file = db
                .get('files')
                .find({ id: this.model.id })
                .value();
          file.error = true;
          file.errorMessage = 'File does not exist.';
          db
              .get('files')
              .find({ id: this.model.id })
              .assign(file)
              .write()
              .then(function(){
                  $('body').trigger('FileView.onFileSaved', [self.model.id]);
              });

          setTimeout(function(){ self.initializeFile(); }, 5000);
          return false;
        }

        this.tailFile = new tail.Tail(this.model.fullPath);

        this.tailFile.on("line", function (data) {
            self.render(data);
        });

        this.tailFile.on("error", function(error) {
            console.error('Error with file:', self.model);
            console.error(error);
        });
      }
      else {
        var URL_SERVER = this.model.remoteHost + ':' + this.model.remotePort + '?token=' + this.model.remoteToken;
        this.socket = io(URL_SERVER);

        this.socket.on('connected', function(data) {
          self.socket.emit('watch', self.model.remoteChannel);
          if (self.model.error) {
            self.clearError();
          }
        });

        this.socket.on('line', function(data) {
          self.render(data);
        });

        this.socket.on('channel-closed', function(data) {
          self.close();
        });

        this.socket.on('channel-error', function(data) {
          console.error('Error with file:', self.model);
          console.error(data);

          self.setError(data);
        });

        this.socket.on('disconnect', function() {
          self.setError('Disconnected.');
        });

        this.socket.connect();
      }

      this.play = this.model.play;

      if (this.model.jsonFormat != '') {
          this.format = this.model.jsonFormat.match(/:[a-z]+:/gi);
      }

      $('body')
          .on('NavigationView.onPlayFile', function(e, id){
              id = parseInt(id);
              if (id == self.model.id) {
                  self.play = true;
              }
          })
          .on('NavigationView.onPauseFile', function(e, id){
              id = parseInt(id);
              if (id == self.model.id) {
                  self.play = false;
              }
          });
      $('body').append(this.styleTemplate(this));

      $('.file-' + this.model.id+'.file-hidden').removeClass('file-hidden');
      if (this.model.filter != '') {
        var regex = new RegExp(this.model.filter, 'i');
        $('.file-' + this.model.id).each(function(k, v){
          var regex = new RegExp(self.model.filter, 'i');
          if (!$(this).text().match(regex)) {
              $(this).addClass('file-hidden');
          }
        });
      }

      if (this.model.error) {
        var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') }),
          file = db
              .get('files')
              .find({ id: this.model.id })
              .value();
        file.error = false;
        file.errorMessage = '';
        db
            .get('files')
            .find({ id: this.model.id })
            .assign(file)
            .write()
            .then(function(){
                $('body').trigger('FileView.onFileSaved', [self.model.id]);
            });
      }

      this.interval = setInterval(function(){
        var logLength = self.model.logLength || 100;
        if ($(".file-" + self.model.id).length > logLength) {
          var toDelete = $(".file-" + self.model.id).length - logLength;
          $(".file-" + self.model.id + ':lt('+toDelete+')').remove();
        }
      }, 5000);
    },

    setError: function(errorMessage) {
      var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') }),
        file = db
            .get('files')
            .find({ id: this.model.id })
            .value(),
        self = this;
      this.model.error = true;
      this.model.errorMessage = errorMessage;
      db
          .get('files')
          .find({ id: this.model.id })
          .assign(this.model)
          .write()
          .then(function(){
              $('body').trigger('FileView.onFileSaved', [self.model.id]);
          });
      if (errorMessage == 'Disconnected.') {

      }
    },

    clearError: function() {
      var self = this
        , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
        , file = db
            .get('files')
            .find({ id: this.model.id })
            .value();
      file.error = false;
      file.errorMessage = '';
      db
          .get('files')
          .find({ id: this.model.id })
          .assign(file)
          .write()
          .then(function(){
              $('body').trigger('FileView.onFileSaved', [self.model.id]);
          });
    }
});

export default FileView;
