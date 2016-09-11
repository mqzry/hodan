define(["js/lib/query/composer/RestQueryComposer", "js/data/Query"], function(RestQueryComposer, Query){
    var SprdQueryComposer = RestQueryComposer.RestQueryComposer;
    SprdQueryComposer.compose = function (query) {
        if (query instanceof Query) {
            var exp = query.query.where.expressions;
            if (exp.length === 1) {
                return {query: exp.pop().value};   
            }
        }
        
    };
    return SprdQueryComposer;
});