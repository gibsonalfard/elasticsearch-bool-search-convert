const converter = require("./converter");

exports.isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
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

    return query;
}