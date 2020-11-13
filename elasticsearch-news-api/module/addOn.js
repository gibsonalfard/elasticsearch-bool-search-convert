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
    var baseQuery = jsonData.request.query;
    var query = {
        "query":{
            "bool":{}
        }
    };

    for(listQuery of baseQuery){
        var queryValue = listQuery.value;
        var queryField = listQuery.field;

        //  Convert input query into bool search query for Elasticsearch
        var queryTemp = converter.convertQuery(queryValue, queryField);
        query = converter.mergeQuery(query, queryTemp);
    }

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