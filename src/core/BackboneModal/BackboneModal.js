/***
 *  Exposes
 *  Consumes
 */
var $ = require('jquery');
window.$ = $;
window.jQuery = $;
var _ = require('underscore');
var Backbone = require('backbone');
import template from './BackboneModalTemplate.js';
import { uuid } from '../uuid';
var Bootstrap = require('bootstrap');

var BackboneModal = Backbone.View.extend({
  el:'body',
  template: _.template(template),
  events:{},
  initialize: function(options) {
    this._id = uuid();
    this.options = _.extend({}, {
      headerTemplate: _.template(''),
      bodyTemplate: _.template(''),
      footerTemplate: _.template(''),
      level: 1,
      beforeRender: function(){},
      afterRender: function(){},
      events: {},

      showCloseButton: true,
      closeButtonClass: 'btn-default',
      closeButtonText: 'Close',
      showAffirmButton: true,
      affirmButtonClass: 'btn-primary',
      affirmButtonText: 'ok',
      closeOnAffirm: false,
    }, options);

    this.events = _.extend({}, this.events, this.options.events);
  },
  open: function() {
    this.render();
    $('#'+this._id).modal('show');
  },
  close : function(){
    $('#'+this._id).modal('hide');
  },
  remove: function() {
    $('#' + this._id).remove();

    this.unbind();
    this.stopListening();
    this.undelegateEvents();
    return this;
  },
  render : function(){
    this.beforeRender();

    this.$el = $(this.template(this));
    $(this.el).append(this.$el);

    this.afterRender();

    this.rebindEvents();

    return this;
  },
  beforeRender: function(){
    this.options.beforeRender.apply(this);
  },
  afterRender: function(){
    var self = this;
    $('#' + this._id).on('hidden.bs.modal', function (e) {
        self.remove();
    })
    this.options.afterRender.apply(this);
  },

  rebindEvents: function() {
    this.undelegateEvents();
    this.delegateEvents();
  },
  setOptions: function(options) {
    this.options = _.extend({}, this.options, options);
    this.events = _.extend({}, this.events, this.options.events);
    this.rebindEvents();
  },
});

export default BackboneModal;