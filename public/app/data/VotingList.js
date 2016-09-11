define(["js/core/List"], function (List) {
 
    return List.inherit("app.data.VotingList", {
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