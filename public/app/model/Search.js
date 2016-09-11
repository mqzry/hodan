define(["js/data/Entity"], function (Entity) {
 
    return Entity.inherit("app.model.Search", {
        schema: {
            keyword: String
        },
        defaults: {
            keyword: ""
        }
    });
});