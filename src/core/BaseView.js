/***
 *  Exposes
 *    register
 *    unregister
 *    rendered
 *  Consumes
 *    isRegistered
 */
 var _ = require('underscore');
 var Backbone = require('backbone');

var BaseView = Backbone.View.extend({
    name: 'BaseView',
  renderMethodReplace: 'replace',
  renderMethodAppend: 'append',
  renderMethodPrepend: 'prepend',
  childViews: {},
  rendered: false,

  initialize: function(options) {
    this.options = _.extend({}, {
        renderMethod: 'replace',
        rendered: false,
        childViews: {},
    }, this.options, options);

    if (this.name == 'BaseView') {
      console.error('Name not set in view ', this);
    }
    $('body').on(this.name+'.isRegistered', function () {
      return true;
    });
    $('body').trigger(this.name + '.register');
  },
  close : function(){
    if(this.childViews.length > 0){
      for (var key in this.childViews)
      {
        this.childViews[key].close();
      }
    }
    this.remove();
    this.rendered = false;
    $('body').trigger(this.name + '.unregister');
  },
  remove: function() {
      this.unbind();
      this.stopListening();
      this.undelegateEvents();
      this.$el.empty();
      return this;
  },
  render : function(){
    this.beforeRender.apply(this);

    this.$el = $(this.template(this));
    switch (this.options.renderMethod) {
      case this.renderMethodReplace:
        $(this.el).html(this.$el);
        break;
      case this.renderMethodAppend:
        $(this.el).append(this.$el);
        break;
      case this.renderMethodPrepend:
        $(this.el).prepend(this.$el);
        break;
      default:
        $(this.el).html(this.$el);
    }

      this.options.rendered = true;

    if(Object.keys(this.childViews).length > 0){
      for (var key in this.childViews)
      {
        this.childViews[key].render();
      }
    }

    this.afterRender.apply(this);

    this.rebindEvents();

    $('body').trigger(this.name + '.rendered');

    return this;
  },
  beforeRender: function(){},
  afterRender: function(){},

  onRegister: function(object, callback) {
      var registered = $('body').triggerHandler(object+'.isRegistered');
      if (!registered) {
          $('body').one(object+'.register', function () {
              callback();
          });
      }
      else
      {
          callback();
      }
  },

  isRendered: function() {
    return this.options.rendered;
  },

    rebindEvents: function() {
        this.undelegateEvents();
        this.delegateEvents();
    },
});

export default BaseView;