const getData = require("./elasticsearch/get");
const insertData = require("./elasticsearch/insert");

const addOn = require("./module/addOn");
const formatter = require("./module/formatter");
const converter = require("./module/converter");
const bodyParser = require("body-parser");
const express = require("express");
const { query } = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));
app.use(bodyParser.urlencoded({ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoded' }));

app.get("/", (req, res)=>{
    res.json({ message: "Welcome to Elastisearch Middleware." });
});

app.get("/search", async (req, res) => {
    // Logging Variable
    let ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[GET] /search", req.body, ip);

    let data = {};
    let query;
    // Convert Request to Elasticsearch Boolean Search
    try {
        jsonData = req.body;
        
        if(!addOn.isValidRequest(jsonData, res)){
            return 0;
        }

        query = addOn.queryCondition(jsonData)
        if(query.error){
            console.log(query.error);
            res.json(query);
            return 0;
        }
        responseData = await getData.searchData(jsonData.request.source, query);

        // Convert Elasticsearch Response to Simpler JSON Format
        data = formatter.outputJSONFormatter(responseData);
    } catch (error) {
        console.log(error.message);
        data = {"error": error.message}
    }

    res.json(query);
});

app.get("/search/sentiment", async (req, res) => {
    // Logging Variable
    let ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[GET] /search/sentiment", req.body, ip);

    let data = {};

    try {
        jsonData = req.body;

        if(!addOn.isValidRequest(jsonData, res)){
            return 0;
        }

        let query = addOn.queryCondition(jsonData)
        if(query.error){
            console.log(query.error);
            res.json(query);
            return 0;
        }
        query.aggs = {
            "by-news-id":{
                "terms":{
                    "field": "id"
                },
                "aggs":{
                    "to-sentiment":{
                        "children":{
                            "type": "sentiment"
                        },
                        "aggs":{
                            "by-sentiment":{
                                "terms":{
                                    "field": "analysis.sentiment.sentiment"
                                }
                            }
                        }
                    }
                }
            }
        }

        responseData = await getData.searchData(jsonData.request.source, query);

        // Convert Elasticsearch Response to Simpler JSON Format
        data = formatter.outputJSONFormatter(responseData);
    } catch (error) {
        console.log(error.message);
        data = {"error": error.message};
    }

    res.json(data);
});

app.get("/search/sentiment/histogram", async (req, res) => {
    // Logging Variable
    let ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    let data = {};
    let toDate = new Date();
    let fromDate = new Date();
    let urlLog = "[GET] /search/sentiment/histogram";

    toDate.setDate(30);
    toDate = zeroHour(toDate);
    fromDate.setDate(1);
    fromDate = zeroHour(fromDate);

    to = toDate.getTime();
    from = fromDate.getTime();

    try {
        if(!addOn.isValidRequest(req.body, res)){
            return 0;
        }

        if(req.body.request.range){
            rangeConv = converter.convertInputRange(req.body.request.range);
            to = rangeConv[1];
            from = rangeConv[0];
        }else{
            req.body.request.range = [from, to];
        }

        let interval = addOn.isSameDay(from, to) ? "hour" : "week";
        if(req.query.interval){
            interval = req.query.interval;
            urlLog = `[GET] /search/sentiment/histogram?interval=${interval}`;
        }
        addOn.logAccess(urlLog, req.body, ip);

        req.body.interval = interval;

        jsonData = req.body;
        
        let query = addOn.queryCondition(jsonData)
        if(query.error){
            console.log(query.error);
            res.json(query);
            return 0;
        }

        query.aggs = {
            "sentiment_over_time":{
                "date_histogram":{
                    "field": "datetime_ms",
                    "calendar_interval": interval,
                    "time_zone": "+07:00",
                    "extended_bounds": {
                        "min": from,
                        "max": to
                    }
                },
                "aggs":{
                    "to-sentiment":{
                        "children":{
                            "type": "sentiment"
                        },
                        "aggs":{
                            "sentiment":{
                                "terms":{
                                    "field": "analysis.sentiment.sentiment"
                                }
                            }
                        }
                    }
                }
            }
        }

        try {
            response = await getData.searchData(jsonData.request.source, query);

            // Convert Elasticsearch Response to Simpler JSON Format
            data = formatter.histogramFormatter(response);
        } catch (error) {
            data = {"error": "Invalid range for interval parameter"};
        }
    } catch (error) {
        console.log(error.message);
        data = {"error": error.message};
    }

    res.json(data);
});

app.post("/news/add", async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[POST] /news/add/", req.body.request.source, ip);

    let requestBody = req.body.request;
    let data = requestBody.data;
    let index = requestBody.source;

    // Format Data 
    let body = insertData.bulkDataNews(index, data);
    // Do bulk Insert
    let response = await insertData.bulkInsert(body);

    res.json(response);
});

app.post("/sentiment/add", async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[POST] /sentiment/add/", req.body.request.source, ip);

    let requestBody = req.body.request;
    let data = requestBody.data;
    let index = requestBody.source;

    // Format Data 
    let body = insertData.bulkDataSentiment(index, data);
    // Do bulk Insert
    let response = await insertData.bulkInsert(body);

    res.json(response);
});

const zeroHour = (date) => {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

app.listen(PORT, () => {});