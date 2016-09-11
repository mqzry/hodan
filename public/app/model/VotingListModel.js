define(["app/data/VotingList", "js/data/Model"], function (VotingList, Model) {
 
    return Model.inherit("app.model.VotingListModel", {
        schema: {
            keyword: String,
            designs: VotingList
        },
        defaults: {
            keyword: "",
        }
    });
});