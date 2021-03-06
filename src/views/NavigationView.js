/***
 *  Exposes
 *      NavigationView.onPlayFile
 *      NavigationView.onPauseFile
 *      NavigationView.onRemoveFile
 *      NavigationView.toggleScrollToBottom
 *      FileModalView.onFileAdded
 *      FileModalView.onFileEdited
 *      FileModalView.`id`.onFileEdited
 *      FileModalView.onFileSaved
 *      FileModalView.`id`.onFileSaved
 *      SettingsModalView.onSettingsChanged
 *  Consumes
 *      FileModalView.onFileSaved
 *      FileView.onFileSaved
 */
 var $ = require('jquery');
 window.$ = $;
 window.jQuery = $;
var _ = require('underscore');
var Backbone = require('backbone');
import BaseView from '../core/BaseView.js';
import template from '../templates/NavigationTemplate.js';

import { template as AddFileModalHeaderTemplate } from '../templates/AddFileModalHeaderTemplate.js';
import { template as AddFileModalBodyTemplate } from '../templates/AddFileModalBodyTemplate.js';
import { template as AddFileModalFooterTemplate } from '../templates/AddFileModalFooterTemplate.js';

import { template as SettingsModalHeaderTemplate } from '../templates/SettingsModalHeaderTemplate.js';
import { template as SettingsModalBodyTemplate } from '../templates/SettingsModalBodyTemplate.js';
import { template as SettingsModalFooterTemplate } from '../templates/SettingsModalFooterTemplate.js';

import { template as SearchModalHeaderTemplate } from '../templates/SearchModalHeaderTemplate.js';
import { template as SearchModalBodyTemplate } from '../templates/SearchModalBodyTemplate.js';
import { template as SearchModalFooterTemplate } from '../templates/SearchModalFooterTemplate.js';

import BackboneModal from '../core/BackboneModal/BackboneModal.js';

import { remote } from 'electron';
import lowdb from 'lowdb';
import path from 'path';
import fs from 'fs';
import jetpack from 'fs-jetpack';
import env from '../env';

const {ipcRenderer} = require('electron')
const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
const manifest = appDir.read('package.json', 'json');
import 'bootstrap-colorpicker';
var Bootstrap = require('bootstrap');

const dbFile = path.join(app.getPath('userData'), 'db.json');

var NavigationView = BaseView.extend({
    name:'NavigationView',
    el: '#navigation-content',

    childViews: {},

    template: _.template(template),

    events: {
        'click #add-file' : 'onBtnAddFile',
        'click #settings' : 'onBtnSettings',
        'click .btn-file-search' : 'onBtnSearch',
        'click .file' : 'onEditFile',
        'click .btn-control' : 'onFileAction',
        'click #scroll-to-bottom' : 'onBtnScrollToBottom',
        'click #btn-clear-all' : 'onBtnClearAll',
    },

    initialize: function () {
        var self = this;
        this.env = env;

        $('body').on('FileModalView.onFileSaved', function(e, id){
            self.render();
        });

        $('body').on('FileView.onFileSaved', function(e, id){
            self.render();
        });

        return BaseView.prototype.initialize.call(this);
    },

    render: function () {
        var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') });
        this.collection = db.get('files').value();
        return BaseView.prototype.render.call(this);
    },

    afterRender: function () {
        var self = this;
        $('[data-toggle="tooltip"]').tooltip({
          delay: { "show": 1000, "hide": 100 },
          container: 'body'
        });
        this.mModal = new BackboneModal({
            headerTemplate: _.template(AddFileModalHeaderTemplate),
            bodyTemplate: _.template(AddFileModalBodyTemplate),
            footerTemplate: _.template(AddFileModalFooterTemplate),
            events: {
                'click #checkbox-is-remote' : function (e) {
                  e.stopPropagation();
                  var isChecked = $('#checkbox-is-remote').is(':checked');
                  if (isChecked) {
                    $('#fullPath').val('');
                    $('.local-file').addClass('hide');
                    $('.remote-file').removeClass('hide');
                  }
                  else {
                    $('#remoteHost').val('');
                    $('#remotePort').val('');
                    $('#remoteChannel').val('');
                    $('.remote-file').addClass('hide');
                    $('.local-file').removeClass('hide');
                  }
                },
                'click #btn-save-file' : function(e) {
                    e.stopPropagation();

                    var id = parseInt($('#id').val())
                        , nickname = $('#nickname').val()
                        , isRemote = $('#checkbox-is-remote').is(':checked')
                        , fullPath = path.resolve($('#fullPath').val())
                        , fullPathGroup = $('#fullPath').closest('.form-group')
                        , remoteHost = $('#remoteHost').val()
                        , remotePort = $('#remotePort').val()
                        , remoteChannel = $('#remoteChannel').val()
                        , remoteToken = $('#remoteToken').val()
                        , jsonFormat = $('#jsonFormat').val()
                        , color = $('#colorpicker input').val()
                        , logLength = $('#logLength').val()
                        , filter = $('#filter').val()
                        , fileName = path.basename(fullPath)
                        , fileExists = fs.existsSync(fullPath)
                        , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
                        , mSelf = this;

                    fullPathGroup.removeClass('has-error');
                    fullPathGroup.find('.help-block').hide();

                    if (!isRemote && !fileExists) {
                        console.error("File doesn't exist.");
                        fullPathGroup.addClass('has-error');
                        fullPathGroup.find('.help-block').show();
                        return false;
                    }

                    if (isNaN(id)) {
                        var file = {
                            id : Date.now(),
                            color: color,
                            logLength: logLength,
                            fileName: fileName,
                            fullPath: fullPath,
                            jsonFormat: jsonFormat,
                            play: true,
                            nickname: nickname,
                            filter: filter,
                            error: false,
                            isRemote: isRemote,
                            remoteHost: remoteHost,
                            remotePort: remotePort,
                            remoteChannel: remoteChannel,
                            remoteToken: remoteToken
                        };

                        db
                            .get('files')
                            .push(file)
                            .write()
                            .then(function(){
                                $('body').trigger('FileModalView.onFileSaved', [file.id]);
                                $('body').trigger('FileModalView.onFileAdded', [file.id, file]);
                                mSelf.close();
                            });

                    }
                    else {
                        var oldFile = Object.assign({}, db
                            .get('files')
                            .find({ id: id })
                            .value())
                          , file = db
                              .get('files')
                              .find({ id: id })
                              .value()
                          , duplicateFile = db
                              .get('files')
                              .find({
                                isRemote: isRemote,
                                remoteHost: remoteHost,
                                remotePort: remotePort,
                                remoteChannel: remoteChannel
                              })
                              .value();
                        if (duplicateFile && duplicateFile.id != id) {
                          // TODO: Output an error message about the duplicate.
                          return false;
                        }
                        file.jsonFormat = jsonFormat;
                        file.nickname = nickname;
                        file.color = color;
                        file.logLength = logLength;
                        file.filter = filter;
                        file.fileName = fileName;
                        file.fullPath = fullPath;
                        file.isRemote = isRemote;
                        file.remoteHost = remoteHost;
                        file.remotePort = remotePort;
                        file.remoteChannel = remoteChannel;
                        file.remoteToken = remoteToken;

                        db
                            .get('files')
                            .find({ id: id })
                            .assign(file)
                            .write()
                            .then(function(){
                                $('body').trigger('FileModalView.onFileSaved', [file.id]);
                                $('body').trigger(`FileModalView.${file.id}.onFileSaved`, [file.id]);
                                $('body').trigger('FileModalView.onFileEdited', [file.id, file, oldFile]);
                                $('body').trigger(`FileModalView.${file.id}.onFileEdited`, [file, oldFile]);
                                mSelf.close();
                            });
                    }
                },
            },
            afterRender: function() {
              $('#colorpicker').colorpicker();
            },
            generateRandomColor: function (mix) {
                var red = Math.random() * 256 >> 0;
                var green = Math.random() * 256 >> 0;
                var blue = Math.random() * 256 >> 0;

                // mix the color
                if (mix != null) {
                    red = (red + mix.red) / 2 >> 0;
                    green = (green + mix.green) / 2 >> 0;
                    blue = (blue + mix.blue) / 2 >> 0;
                }
                var rr = red.toString(16);
                if (rr.length === 1) {
                    rr = "0"+rr[0];
                }
                var gg = green.toString(16);
                if (gg.length === 1) {
                    gg = "0"+gg[0];
                }
                var bb = blue.toString(16);
                if (bb.length === 1) {
                    bb = "0"+bb[0];
                }
                return "#"+ rr + gg + bb;
            },
        });
        
        this.sModal = new BackboneModal({
          headerTemplate: _.template(SettingsModalHeaderTemplate),
          bodyTemplate: _.template(SettingsModalBodyTemplate),
          footerTemplate: _.template(SettingsModalFooterTemplate),
          version: manifest.version,
          events: {
            'click #btn-save-settings' : function(e) {
              e.stopPropagation();
              var color = $('#colorpicker input').val()
                , filter = $('#filter').val()
                , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
                , mSelf = this;

              var settings = db
                  .get('settings')
                  .value();
              settings.color = color;
              settings.filter = filter;

              db
                  .get('settings')
                  .assign(settings)
                  .write()
                  .then(function(){
                      $('body').trigger('SettingsModalView.onSettingsChanged');
                      mSelf.close();
                  });
            },
            'click #download-update': function() {

            },
            'click #check-update': function(){

            }
          },
          afterRender: function() {
            $('#colorpicker').colorpicker();

            ipcRenderer.on('update-message', function(e, text){
              $('#action').html(text);
            });

            ipcRenderer.send('check-for-update');
          },
        });
        
        this.searchModal = new BackboneModal({
            headerTemplate: _.template(SearchModalHeaderTemplate),
            bodyTemplate: _.template(SearchModalBodyTemplate),
            footerTemplate: _.template(SearchModalFooterTemplate),
            events: {
                'click #btn-save-search' : function(e) {
                    e.stopPropagation();

                    var id = parseInt($('#id').val())
                        , fileFilter = $('#file-filter').val()
                        , globalFilter = $('#global-filter').val()
                        , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
                        , mSelf = this
                        , file = db
                            .get('files')
                            .find({ id: id })
                            .value()
                        , settings = db
                            .get('settings')
                            .value();

                    file.filter = fileFilter;
                    settings.filter = globalFilter;

                    db
                        .get('settings')
                        .assign(settings)
                        .write()
                        .then(function(){
                            $('body').trigger('SettingsModalView.onSettingsChanged');
                            db
                                .get('files')
                                .find({ id: id })
                                .assign(file)
                                .write()
                                .then(function(){
                                    $('body').trigger('FileModalView.onFileSaved', [file.id]);
                                    $('body').trigger('FileModalView.onFileEdited', [file.id]);
                                    mSelf.close();
                                });
                        });
                },
            },
        });
        
        return BaseView.prototype.afterRender.call(this);
    },

    onBtnAddFile: function(e) {
        e.stopPropagation();
        this.mModal.setOptions({
            file: null
        });
        this.mModal.open();
    },

    onBtnSettings: function(e) {
        e.stopPropagation();
        var db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
            , settings = db.get('settings').value();

        this.sModal.setOptions({
            settings: settings,
            env: env
        });
        this.sModal.open();
    },

    onBtnScrollToBottom: function(e) {
        e.stopPropagation();
        $('body').trigger('NavigationView.toggleScrollToBottom');
    },

    onBtnClearAll: function() {
      $('.file-line').remove();
    },

    onEditFile: function(e) {
        e.stopPropagation();
        var id = $(e.currentTarget).data('id')
            , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
            , file = db.get('files').find({id: id}).value();

        this.mModal.setOptions({
            file: file
        });
        this.mModal.open();
    },

    onBtnSearch: function(e) {
        e.stopPropagation();
        var id = $(e.currentTarget).data('id')
            , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') })
            , file = db.get('files').find({id: id}).value()
            , settings = db.get('settings').value();
        this.searchModal.setOptions({
            file: file,
            settings: settings,
        });
        this.searchModal.open();
    },

    onFileAction: function(e) {
        e.stopPropagation();
        var self = this
            , id = $(e.currentTarget).data('id')
            , db = lowdb(dbFile, { storage: require('lowdb/lib/storages/file-async') });
        switch ($(e.currentTarget).data('action'))
        {
            case 'play':
                db.get('files')
                    .find({id: id})
                    .assign({play:true})
                    .write()
                    .then(function(){
                        $(e.currentTarget)
                            .data('action', 'pause')
                            .removeClass('fa-play')
                            .addClass('fa-pause');
                        $('body').trigger(`NavigationView.${id}.onPlayFile`, [id]);
                    });
                break;
            case 'pause':
                db.get('files')
                    .find({id: id})
                    .assign({play:false})
                    .write()
                    .then(function(){
                        $(e.currentTarget)
                            .data('action', 'play')
                            .removeClass('fa-pause')
                            .addClass('fa-play');
                        $('body').trigger(`NavigationView.${id}.onPauseFile`, [id]);
                    });;
                break;
            case 'remove':
                db
                    .get('files')
                    .remove({id: id})
                    .write()
                    .then(function(){
                        self.render();
                        $('.file-' + id).remove();
                        $('body').trigger('NavigationView.onRemoveFile', [id]);
                    });
                break;
            case 'clear':
                 $('.file-' + id).remove();
                break;
            default:
                console.error('Unhandled case ' + $(e.currentTarget).data('action'));
        }
    },

});

export default NavigationView;
