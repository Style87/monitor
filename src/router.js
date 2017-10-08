var Backbone = require('backbone');
import  BaseRouter from './core/BaseRouter.js';
import HomeView from './views/HomeView.js';

var Router = BaseRouter.extend({

    routes : {
        '*default' : 'showHome'
    },
    currentView: null,
    // Routes that need authentication and if user is not authenticated
    // gets redirect to login page
    requresAuth : [],

    // Routes that should not be accessible if user is authenticated
    // for example, login, register, forgetpasword ...
    preventAccessWhenAuth : [],

    before : function(params, next){
      return next();
    },

    after : function(){
        //empty
    },

    changeView : function(view){
        //Close is a method in BaseView
        //that check for childViews and 
        //close them before closing the 
        //parentView
        function setView(self, view){
            if(self.currentView){
                self.currentView.close();
            }
            self.currentView = view;
            view.render();
        }

        setView(this, view);
    },

    fetchError : function(error){},
    
    //... Route handlers …
    showHome:function(){
      this.changeView(new HomeView());
    },
});
  
export default Router;