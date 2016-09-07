define(["js/data/DataSource"], function (DataSource) {
    return DataSource.Processor.inherit("app.processors.DesignsProcessor", {
        _getValueForKey: function (data, key, schemaType, schemaDefinition) {
            //This function is only used for schema elements that are arrays, 
            //entities, collections and dates..
            switch (key) {
                case "id": return data['@attributes'].id;
                case "href": return data['@attributes']['xlink:href'];
                case "name": return data.name['#name'];
                case "resource": return data.resources.resource['@attributes']['xlink:href'];
            }
        },
        _getIdForValue: function(value, factory){
            return value['@attributes'].id;
        }
    })
});