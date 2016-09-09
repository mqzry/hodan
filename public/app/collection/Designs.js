define(["js/data/Collection", "app/model/Design", ], function (Collection, Design) {

    
    return Collection.inherit("app.collection.Designs", {
        $modelFactory: Design,
        likedMap: {},
        addVotedOnDesign: function (key, design){
            this.likedMap[key] = design;
        },
        countVotedOn: function () {
            var total = 0;
            for (var item of this.$items){
                if (typeof item.get('like') != 'undefined') 
                    total++;
            }
            return total;
        },
        countLiked: function () {
            var total = 0;
            for (var item of this.$items){
                if (item.get('like')) 
                    total++;
            }
            return total;
            
        },
        countNotLiked: function () {
            var total = 0;
            for (var item of this.$items){
                var like = item.get('like');
                if (typeof like != 'undefined' && !like) 
                    total++;
            }
            return total;
        },
        size: function () {
            return this.$items.length;
        }.on('change', 'add', 'remove')
     });
});