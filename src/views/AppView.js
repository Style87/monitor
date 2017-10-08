/***
 *  Exposes
 *  Consumes
 */
import 'jquery';
var _ = require('underscore');
var Backbone = require('backbone');
import BaseView from '../core/BaseView.js';
import template from '../templates/AppTemplate.js';
import NavigationView from './NavigationView';

var AppView = BaseView.extend({
  name: 'AppView',
  options: {
      renderMethod: 'append'
  },
  el: 'body',
  childViews: {},
  template: _.template(template),

  beforeRender: function() {
    $('#splash').remove();
    return BaseView.prototype.beforeRender.call(this);
  },

  afterRender: function() {
    var navigationView = new NavigationView();
    navigationView.render();

    return BaseView.prototype.afterRender.call(this);
  }
});

export default AppView;