define(["app/data/VotingList", "js/data/Model"], function (VotingList, Model) {
 
    return Model.inherit("app.model.VotingListModel", {
        schema: {
            keyword: String,
            designs: VotingList
        },
        addDesign: function (design) {
                    var designsList = this.get('designs');
                    
                    if(!designsList)
                        designsList = new VotingList();
                        
                    if(designsList.indexOf(design) == -1)
                        designsList.push(design);
                    this.set('designs', designsList);
        }
    });
});