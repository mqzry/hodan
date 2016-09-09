define(["js/data/Model"], function (Model) {
 
    return Model.inherit("app.model.Design", {
        schema: {
            id: Number,
            name: String,
            href: String,
           resource: String,
        },
        parse: function (data) {
            data = this.callBase();

            data.href = data['@attributes']['xlink:href'];
            data.name = data.name['#text'];
            data.resource = data.resources.resource['@attributes']['xlink:href'];
            return data;
        }
    });
});