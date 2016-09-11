define(["js/data/Collection", "app/model/Design", ], function (Collection, Design) {

    
    return Collection.inherit("app.collection.Designs", {
        $modelFactory: Design,
        size: function () {
            return this.$items.length;
        }.on('change', 'add', 'remove')
     });
});