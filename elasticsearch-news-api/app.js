const getData = require("./elasticsearch/get");
const addOn = require("./module/addOn");
const formatter = require("./module/formatter");
const converter = require("./module/converter");
const bodyParser = require("body-parser");
const express = require("express");
const { query } = require("express");

const app = express();
const PORT = process.env.PORT || 8080;
var queryCache = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res)=>{
    res.json({ message: "Welcome to Elastisearch Middleware." });
});

app.get("/search", async (req, res) => {
    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[GET] /search", req.body, ip);

    if(queryCache.search[addOn.getSHA1(req.body)]){
        res.json(queryCache.search[addOn.getSHA1(req.body)]);
        return 0;
    }

    var data = {};
    // Convert Request to Elasticsearch Boolean Search
    try {
        jsonData = req.body;
        
        if(!addOn.isValidRequest(jsonData, res)){
            return 0;
        }

        var query = addOn.queryCondition(jsonData)
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

    queryCache.search[addOn.getSHA1(req.body)] = data;
    res.json(data);
});

app.get("/search/sentiment", async (req, res) => {
    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[GET] /search/sentiment", req.body, ip);

    var data = {};

    if(queryCache.sentiment[addOn.getSHA1(req.body)]){
        res.json(queryCache.sentiment[addOn.getSHA1(req.body)]);
        return 0;
    }

    try {
        jsonData = req.body;

        if(!addOn.isValidRequest(jsonData, res)){
            return 0;
        }

        var query = addOn.queryCondition(jsonData)
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

    queryCache.sentiment[addOn.getSHA1(req.body)] = data;
    res.json(data);
});

app.get("/search/sentiment/histogram", async (req, res) => {
    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    var data = {};
    var toDate = new Date();
    var fromDate = new Date();
    var interval = "day";
    var urlLog = "[GET] /search/sentiment/histogram";

    toDate.setDate(30);
    toDate = zeroHour(toDate);
    fromDate.setDate(1);
    fromDate = zeroHour(fromDate);

    to = toDate.getTime();
    from = fromDate.getTime();

    if(req.query.interval){
        interval = req.query.interval;
        urlLog = `[GET] /search/sentiment/histogram?interval=${interval}`;
    }

    addOn.logAccess(urlLog, req.body, ip);

    try {
        if(!addOn.isValidRequest(req.body, res)){
            return 0;
        }

        if(req.body.request.range){
            rangeConv = converter.rangeConvert(req.body.request.range);
            to = rangeConv.to;
            from = rangeConv.from;
        }else{
            req.body.request.range = [from, to];
        }

        req.body.interval = interval;
        if(queryCache.histogram[addOn.getSHA1(req.body)]){
            res.json(queryCache.histogram[addOn.getSHA1(req.body)]);
            return 0;
        }

        jsonData = req.body;
        
        var query = addOn.queryCondition(jsonData)
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

    queryCache.histogram[addOn.getSHA1(req.body)] = data;
    res.json(data);
});

const zeroHour = (date) => {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

const infiniteLoop = async () => {
    const sleep = 1000*60*5;
    var date = new Date();
    date.setHours(date.getHours() + 7);
    var dateStr = date.toISOString();

    while (true){
        console.log(dateStr,"Delete Cache");
        console.log(dateStr,JSON.stringify(queryCache));
        queryCache = {
            "search": {},
            "histogram": {},
            "sentiment": {}
        };
        await new Promise(resolve => setTimeout(resolve, sleep));
    }
}

infiniteLoop();
app.listen(PORT, () => {});