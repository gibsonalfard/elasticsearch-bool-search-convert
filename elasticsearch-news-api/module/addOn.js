const converter = require("./converter");

exports.isEmpty = (obj) => {
    if(obj != null){
        return Object.keys(obj).length === 0;
    }else{
        return true;
    }
}

exports.queryCondition = (jsonData) => {
    // jsonData = req.body;
    var queryValue = jsonData.request.query.value;
    var queryField = jsonData.request.query.field;
    var aggrField = jsonData.request.aggs;

    //  Convert input query into bool search query for Elasticsearch
    var query = converter.convertQuery(queryValue, queryField, aggrField);

    // Send Request to Elasticsearch
    if(!this.isEmpty(jsonData.request.source)){
        query["_source"] = jsonData.request.source;
    }

    if(jsonData.request.range){
        rangeConv = converter.rangeConvert(jsonData.request.range);
        range = {
            "range": {
                "datetime_ms": {
                    "gte": rangeConv.from,
                    "lte": rangeConv.to
                }
            }
        }
        
        if(query.query.bool.must){
            query.query.bool.must.push(range);
        }else{
            query.query.bool.must = range;
        }
    }

    return query;
}