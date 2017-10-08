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
      var self = this;
      this.model = options;
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
        $('#file-style-' + this.model.id).remove();
        this.tailFile.unwatch();
        return this;
    }
});

export default FileView;