define(["js/data/RestDataSource", "app/processors/XmlFormatProcessor", "app/processors/DesignsProcessor"], 
    function (RestDataSource, XmlFormatProcessor, DesignsProcessor) {
   
    return RestDataSource.inherit("app.data.XmlRestDataSource", {
        initializeFormatProcessors: function () {
            this.callBase();
            var xmlFormatter = new XmlFormatProcessor();
            xmlFormatter.regex = /xml/
            this.$formatProcessors.push(xmlFormatter);
        },
        initializeProcessors: function () {
            this.callBase();
            var designsProcessor = new DesignsProcessor(this);
            this.$processors["app.processors.DesignsProcessor"] = designsProcessor;
            this.$defaultProcessor = designsProcessor;
        }
    })
});