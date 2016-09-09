define(["js/data/Query", "js/core/Application", "js/data/DataSource", "app/data/XmlRestDataSource", "app/collection/Designs", "app/model/Design"], 
    function (Query, Application, DataSource, RestDataSource, Designs, Design) {
        return Application.inherit({
            
            defaults: {
                appName: 'Hodan'
            },

            initialize: function () {
                this.set('keyword', '');
                this.set('designs', null);
            },

            /***
             * Starts the application
             * @param parameter
             * @param callback
             */
            start: function (parameter, callback) {
                // false - disables autostart
                this.set('designs', this.$.api.createCollection(Designs));
                this.get('designs').fetch(function(err, designs){
                    if(!err){
                        // returns the fully fetched collection with user models
                    }
                });
                this.callBase(parameter, false);
                callback();
            },
            Like: function (design, event) {
                if(!(design instanceof Design)) 
                    return;
                design.set("like", true);
                this.get('designs').addVotedOnDesign(this.get('keyword'), design);
            },
            Dislike: function (design, event) {
                if(!(design instanceof Design)) 
                    return;
                design.set("like", false);
                this.get('designs').addVotedOnDesign(this.get('keyword'), design);
            },
            Search: function(event) {
                var designs = this.get('designs');
                
                var expression = new Query.Comparator("like", "name", this.get("keyword"));
                var query = Query.query();
                var where = new Query.Where("and");
                where.expressions.push(expression);
                query.query.where = where;
                
                designs.filter(query);
            }
        });
    }
);