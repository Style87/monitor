/***
 *  Exposes
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

  events: {
  },

  initialize: function() {
    var self = this
        , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') });
    
    $('body')
      .on('FileModalView.onFileAdded', function(e, id){
          var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
              , file = db.get('files').find({id: id}).value();
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
});

export default HomeView;