define(["js/data/Collection", "app/model/Design", ], function (Collection, Design) {

    
    return Collection.inherit("app.collection.Designs", {
        $modelFactory: Design,
        currentIndex: 0,
        first: function () {
            if (this.size() > 0) return this.$items[0];
        }.on('change', 'add', 'remove'),
        next: function () {
            if (this.currentIndex < this.size()){
                this.currentIndex++;   
            }
            return this.current();
        },
        current: function () {
            if (this.size() > this.currentIndex ) {
                return this.$items[this.currentIndex];
            }
            else {
                this.currentIndex = 0;
            }
        }.on('change', 'add', 'remove'),
        size: function () {
            return this.$items.length;
        }.on('change', 'add', 'remove')
     });
});