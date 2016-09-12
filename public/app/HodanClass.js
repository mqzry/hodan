define(["js/data/Query", "js/core/Application","js/data/DataSource", 
    "app/data/XmlRestDataSource", "app/collection/Designs", "app/model/Design",
    "app/model/Search", "js/core/List", "app/data/VotingList", "app/model/VotingListModel", "js/data/Model"], 
    function (Query, Application, DataSource, RestDataSource, Designs, Design, 
        Search, List, VotingList, VotingListModel, Model) {
        var ENTER_KEY = 13;
        
        return Application.inherit({
            
            defaults: {
                appName: 'Hodan'
            },
            currentKeyword: "",
            initialize: function () {
                this.set('designs', null);
                this.set('filteredDesigns', null);
                this.set('votingMatrix', null);
                this.callBase();
            },

            /***
             * Starts the application
             * @param parameter
             * @param callback
             */
            start: function (parameter, callback) {
                var designs = this.$.api.createCollection(Designs);
                var search = new Search();
                var votingMatrix = new List();
                
                this.set('designs', designs);
                this.set('votingMatrix', votingMatrix);
                
                this.callBase(parameter, false);
                callback();
            },
            Vote: function (design, event) {
                if(!(design instanceof Design)) 
                    return;
                console.log(event);
                design.set("like", event.$.vote);
                this.addVotedOnDesign(this.currentKeyword, design);
            },
            Search: function(event) {
                if (event.domEvent.keyCode === ENTER_KEY) {
                    
                    var keyword = event.target.get("value").trim();
                    this.currentKeyword = keyword;

                    var expression = new Query.Comparator("like", "name", keyword);
                    var query = Query.query();
                    var where = new Query.Where("and");
                    where.expressions.push(expression);
                    query.query.where = where;
                    
                    var designs = this.get('designs');
                    this.set('filteredDesigns', designs.filter(query));
                }
            },
            addVotedOnDesign: function (key, design){
                self = this;
                var votingMatrix = this.get("votingMatrix");
                
                function keywordComparer(list) {
                        return list.$.keyword === self.currentKeyword;
                }
                
                var votingList = votingMatrix.find(keywordComparer);
                
                if (votingList) {
                    votingList.addDesign(design);
                }
                else {
                    votingList = new VotingListModel();
                    votingList.set("keyword", this.currentKeyword);
                    votingList.addDesign(design)
                    votingMatrix.push(votingList);
                }
            },
    });
});