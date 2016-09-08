define(["js/data/DataSource"], function (DataSource) {
    return DataSource.Processor.inherit("app.processors.DesignsProcessor", {
        _getIdForValue: function(value, factory){
            return value['@attributes'].id;
        }
    })
});