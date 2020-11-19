const converter = require("./converter");
const formatter = require("./formatter");
const crypto = require('crypto');
const { json } = require("body-parser");

exports.getSHA1 = (input) => {
    return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex');
}

exports.isValidRequest = (jsonData, res) => {
    if (jsonData.request == undefined) {
        data = { "error": "Request Body Undefined" };
        res.json(data);
        return false;
    } else if (jsonData.request.source === undefined) {
        data = { "error": "Source of Data Not Defined" };
        res.json(data);
        return false
    }

    return true;
}

exports.isEmpty = (obj) => {
    if (obj != null) {
        return Object.keys(obj).length === 0;
    } else {
        return true;
    }
}

exports.queryCondition = (jsonData) => {
    // jsonData = req.body;
    var baseQuery = jsonData.request.query;
    var query = {
        "query": {
            "bool": {}
        }
    };

    var index = 0;
    if (baseQuery) {
        for (listQuery of baseQuery) {
            var queryValue = listQuery.value;
            var queryField = listQuery.field;
            var queryRange = listQuery.range;
            var andMerge = (index > 0 && listQuery.andMerge) ? listQuery.andMerge : false;

            if (queryValue) {
                // Format queryValue
                quotedList = queryValue.match(/([\"][\w\s]+\")?([\'][\w\s]+\')/g);
                if (quotedList) {
                    queryValue = formatter.quoteFormatter(queryValue, quotedList);
                }

                // Convert input query into bool search query for Elasticsearch
                var queryTemp = converter.convertQuery(queryValue, queryField);
                if (queryTemp.error) {
                    return queryTemp;
                }

                if (this.isEmpty(query.query.bool)) {
                    query = queryTemp;
                } else if (andMerge) {
                    query = converter.andMerge(query, queryTemp);
                } else {
                    query = converter.mergeQuery(query, queryTemp);
                }
            } else if (queryRange) {
                rangeConv = converter.numberRangeConvert(queryRange);
                range = `{ "range":{"${queryField}": ${JSON.stringify(rangeConv)}}}`;

                query = rangeInsert(query, JSON.parse(range));
            }
            index += 1;
        }
    }

    query = postConvertion(jsonData, query);

    return query;
}

exports.logAccess = (endpoint, body, ip) => {
    var date = new Date();
    // Change Timezone to Asia/Jakarta (+7)
    date.setHours(date.getHours() + 7);
    var dateStr = date.toISOString();

    console.log(dateStr, "IP-ADDRESS:", ip);
    console.log(dateStr, "ENDPOINT", endpoint);
    console.log(dateStr, "REQUEST-BODY", JSON.stringify(body));
    console.log("");
}

const postConvertion = (jsonData, query) => {
    if (!this.isEmpty(jsonData.request.select)) {
        query["_source"] = jsonData.request.select;
    }

    if (jsonData.request.range) {
        rangeConv = converter.rangeConvert(jsonData.request.range);
        range = {
            "range": {
                "datetime_ms": {
                    "gte": rangeConv.from,
                    "lte": rangeConv.to
                }
            }
        }
        query = rangeInsert(query, range);
    }

    // Add Parent-Child Relation to return only news data
    console.log(JSON.stringify(query));
    parentQuery = {
        "exists": {
            "field": "analysis.sentiment"
        }
    }
    if (query.query.bool.must_not) {
        query.query.bool.must_not.push(parentQuery);
    }else{
        query.query.bool.must_not = [parentQuery];
    }

    return query;
}

const rangeInsert = (query, range) => {
    if (query.query.bool.must) {
        query.query.bool.must.push(range);
    } else {
        if (query.query.bool.should) {
            query.query.bool.must = [range, { "bool": { "should": query.query.bool.should } }];
            query.query.bool.should = undefined;
        } else {
            query.query.bool.must = [range];
        }
    }

    return query;
}