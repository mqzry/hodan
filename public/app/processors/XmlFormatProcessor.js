define(["js/data/DataSource"], function (DataSource) {
    var xmlToJson = function (xml) {
    	// Create the return object
    	var obj = {};
    
    	if (xml.nodeType == 1) { // element
    		// do attributes
    		if (xml.attributes.length > 0) {
    		obj["@attributes"] = {};
    			for (var j = 0; j < xml.attributes.length; j++) {
    				var attribute = xml.attributes.item(j);
    				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
    			}
    		}
    	} else if (xml.nodeType == 3) { // text
    		obj = xml.nodeValue;
    	}
    
    	// do children
    	if (xml.hasChildNodes()) {
    		for(var i = 0; i < xml.childNodes.length; i++) {
    			var item = xml.childNodes.item(i);
    			var nodeName = item.nodeName;
    			if (typeof(obj[nodeName]) == "undefined") {
    				obj[nodeName] = xmlToJson(item);
    			} else {
    				if (typeof(obj[nodeName].push) == "undefined") {
    					var old = obj[nodeName];
    					obj[nodeName] = [];
    					obj[nodeName].push(old);
    				}
    				obj[nodeName].push(xmlToJson(item));
    			}
    		}
    	}
    	return obj;
    };
    
    return DataSource.FormatProcessor.inherit("app.processors.XmlFormatProcessor", {
            serialize: function (data) {
                return "";
            },
            deserialize: function (text) {
                //Hack to remove root
                return xmlToJson(new DOMParser().parseFromString(text, 'text/xml')).designs;
            }
        });
});