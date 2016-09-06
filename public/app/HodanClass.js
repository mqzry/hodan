define(["js/core/Application"], function (Application) {

        return Application.inherit({
            
            defaults: {
                appName: 'Hodan'
            },
            
            initialize: function () {
                this.set('keyword', '');
                this.set('designs', null)
            },

            /***
             * Starts the application
             * @param parameter
             * @param callback
             */
            start: function (parameter, callback) {
                // false - disables autostart
                this.callBase(parameter, false);

                callback();
            },
            fetch_designs: function () {
                var dataSource = this.$.dataSource; // some dataSource
                var designs = dataSource.createCollection(Collection.of(Design)); // creates a user collection instance
                designs.fetch({
                  offset: 100,
                  limit: 2
                  }, function(err, userPage){
                
                  // returns a collection page with exact 2 users.

                });
            }
        });
    }
);