const converter = require("./converter");
const formatter = require("./formatter");

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

    var index = 0;
    for(listQuery of baseQuery){
        var queryValue = listQuery.value;
        var queryField = listQuery.field;
        var andMerge = (index > 0 && listQuery.and_merge) ? listQuery.and_merge : false;

        // Format queryValue
        quotedList = queryValue.match(/([\"][\w\s]+\")?([\'][\w\s]+\')/g);
        if(quotedList){
            queryValue = formatter.quoteFormatter(queryValue, quotedList);
        }

        // Convert input query into bool search query for Elasticsearch
        var queryTemp = converter.convertQuery(queryValue, queryField);
        if(queryTemp.error){
            return queryTemp;
        }

        if(andMerge){
            query = converter.andMerge(query, queryTemp);
        }else{
            query = converter.mergeQuery(query, queryTemp);
        }
        index += 1;
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
            if(query.query.bool.should){
                query.query.bool.must = [range, {"bool": {"should": query.query.bool.should}}];
                query.query.bool.should = undefined;
                // query.query.bool.should.push({"bool": {"must": range}});
            }else{
                query.query.bool.must = [range];
            }
        }
    }

    return query;
}

exports.logAccess = (endpoint, body, ip) => {
    var date = new Date();
    // Change Timezone to Asia/Jakarta (+7)
    date.setHours(date.getHours() + 7);
    var dateStr = date.toISOString();

    console.log(dateStr,"IP-ADDRESS:",ip);
    console.log(dateStr,"ENDPOINT",endpoint);
    console.log(dateStr,"REQUEST-BODY",JSON.stringify(body));
    console.log("");
}