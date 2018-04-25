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
      this.tailFile.unwatch();

      return this;
    },

    initializeFile: function() {
      var self = this;
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
      this.play = this.model.play;

      if (this.model.jsonFormat != '') {
          this.format = this.model.jsonFormat.match(/:[a-z]+:/gi);
      }

      this.tailFile.on("line", function (data) {
          self.render(data);
      });

      this.tailFile.on("error", function(error) {
          console.error('Error with file:', self.model);
          console.error(error);
      });

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
                  console.log('PAUSE FILE');
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
    }
});

export default FileView;
