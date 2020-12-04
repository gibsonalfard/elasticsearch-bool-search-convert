const converter = require("./converter");
const formatter = require("./formatter");
const crypto = require('crypto');
const { json } = require("body-parser");

exports.getSHA1 = (input) => {
    return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex');
}

/* 
Method to validate if a request is valid request. Valid request have some condition
1. Request Body contain 'request' field
2. Request Body contain source of data, define by 'source' field

This method will return HTTP response error. Have 2 parameter. 
first parameter is JSON type parameter and represent request.body.
second parameter is Response type parameter or HTTP response.
*/
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

/* 
Method to convert boolean conditional query into Elasticsearch Boolean search query.
Input for this method is HTTP Request Body in JSON format and return complete Elasticsearch boolean query 
ready to run in Elasticsearch. This method will call another method to convert query and call 
post convertion method to handle another conditional query such as max, select, and range.
*/
exports.queryCondition = (jsonData) => {
    let baseQuery = jsonData.request.query;
    let query = {
        "query": {
            "bool": {}
        }
    };

    let index = 0;
    if (baseQuery) {
        for (listQuery of baseQuery) {
            if (!isValidQuery(listQuery)){
                return { "error": "Query is incomplete"};
            }

            let queryValue = String(listQuery.value).trim();
            let queryField = String(listQuery.field).trim();
            let queryRange = listQuery.range;
            let andMerge = (index > 0 && listQuery.andMerge) ? listQuery.andMerge : false;

            if (queryValue) {
                // Format queryValue
                quotedList = queryValue.match(/([\"][\w\s]+\")?([\'][\w\s]+\')/g);
                if (quotedList) {
                    queryValue = formatter.quoteFormatter(queryValue, quotedList);
                }

                // Convert input query into bool search query for Elasticsearch
                let queryTemp = converter.convertQuery(queryValue, queryField);
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

    query = postConversion(jsonData, query);

    return query;
}

/*
Method to print access log to node.js console. If you run this middlware using forever library this method
will print access log to log file manage by forever. This method have 3 input that will be printed in console.
Endpoint is string that tell what end-point hitted by client
body is Request Body that contain boolean query
ip is client address that hit this middleware
 */
exports.logAccess = (endpoint, body, ip) => {
    let date = new Date();
    // Change Timezone to Asia/Jakarta (+7)
    date.setHours(date.getHours() + 7);
    let dateStr = date.toISOString();

    console.log(dateStr, "IP-ADDRESS", ip);
    console.log(dateStr, "ENDPOINT", endpoint);
    console.log(dateStr, "REQUEST-BODY", JSON.stringify(body));
    console.log("");
}

/*
This method check if two parameter is a same day. This method have 2 date parameter, 
'from' represent start date and 'to' represent end date for date range. Time in 'from' always set to 00:00:00
and time in 'to' always set to 23:59:59.
*/
exports.isSameDay = (from, to) => {
    let fromDate = new Date(from);
    let toDate = new Date(to);

    return (fromDate.getFullYear() == toDate.getFullYear()) 
        && (fromDate.getMonth() == toDate.getMonth()) 
        && (fromDate.getDate() == toDate.getDate());
}

/*
Method to finalize Elasticsearch boolean query. This method process select query to return only 
field define in 'select' field, if 'select' field exist in request body. This method also process limit query 
to limit returned data if 'max' field exist in request body, otherwise Elasticsearch will limit data by Top 10.
This field process range query to limit returned data between two date defined in 'range' field, if 'range' field exist
in request body. And last but not least, this method add parent-child query to return only parent data.
*/
const postConversion = (jsonData, query) => {
    if (!this.isEmpty(jsonData.request.select)) {
        query["_source"] = jsonData.request.select;
    }

    if (jsonData.request.range) {
        // Convert Range Input into Standard Milliseconds
        requestRange = converter.convertInputRange(jsonData.request.range);
        if(isNaN(requestRange[0]) || isNaN(requestRange[1])){
            return {"error": "Input range invalid, please use dd/mm/yyyy format instead"}
        }
        
        range = {
            "range": {
                "datetime_ms": {
                    "gte": requestRange[0],
                    "lte": requestRange[1]
                }
            }
        }
        query = rangeInsert(query, range);
    }

    // Add Parent-Child Relation to return only news data
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

    // Adding max number of return in query
    if(jsonData.request.max) {
        query["size"] = jsonData.request.max;
    }

    return query;
}

/*
This method insert range query process by postConvertion method to Elasticsearch boolean query
*/
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

/*
Method to check if query is valid. 'query' field in request body is not mandatory, 
but if you define that field, you have to define value and field or field and range 
inside 'query' field. If you not meet that condition, middleware will send error message
tell you that your query isn't complete.
*/
const isValidQuery = (query) => {
    return ((query.value && query.field) || (query.field && query.range)) || (!query.field && !query.value && !query.range);
}