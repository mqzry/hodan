define(["js/data/Collection", "app/model/Design", ], function (Collection, Design) {
    return Collection.inherit("app.data.VotingList", {
        $modelFactory: Design,
        size: function(){
            return this.$items.length;
        }.on('change', 'add', 'remove'),
        _countVotes: function (list, kind) {
                var total = 0;
                for (var item of list){
                    var like = item.get('like');
                    var expr = kind ? like : !like 
                    if (expr) 
                        total++;
                }
                return total;
        },
        countLikes: function () {
            return this._countVotes(this.$items, true);  
        }.on("*"),
        countDislikes: function () {
            return this._countVotes(this.$items, false);
        }.on("*")
    });
});