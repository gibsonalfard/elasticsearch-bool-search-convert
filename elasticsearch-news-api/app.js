const getData = require("./elasticsearch/get");
const addOn = require("./module/addOn");
const formatter = require("./module/formatter");
const converter = require("./module/converter");
const bodyParser = require("body-parser");
const express = require("express");
const { query } = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res)=>{
    res.json({ message: "Welcome to GibsonAlfard application." });
});

app.get("/search", async (req, res) => {
    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[GET] /search", req.body, ip);

    var data = {};
    // Convert Request to Elasticsearch Boolean Search
    try {
        jsonData = req.body;
        
        var query = addOn.queryCondition(jsonData)
        responseData = await getData.searchData(jsonData.request.index, query);

        // Convert Elasticsearch Response to Simpler JSON Format
        data = formatter.outputJSONFormatter(responseData);
    } catch (error) {
        console.log("Error - Outside");
        data = {"Error": error.message}
    }

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

    try {
        jsonData = req.body;

        var query = addOn.queryCondition(jsonData)
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

        responseData = await getData.searchData(jsonData.request.index, query);

        // Convert Elasticsearch Response to Simpler JSON Format
        data = formatter.outputJSONFormatter(responseData);
    } catch (error) {
        console.log(error.message);
        data = {"Error": error.message};
    }

    res.json(data);
});

app.get("/search/sentiment/histogram", async (req, res) => {
    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    addOn.logAccess("[GET] /search/sentiment/histogram", req.body, ip);

    var data = {};
    var toDate = new Date();
    toDate.setDate(30);
    var fromDate = new Date();
    fromDate.setDate(1);

    var interval = "day"
    to = toDate.getTime();
    from = fromDate.getTime();

    if(req.query.interval){
        interval = req.query.interval;
    }

    try {
        if(req.body.request.range){
            rangeConv = converter.rangeConvert(req.body.request.range);
            to = rangeConv.to;
            from = rangeConv.from;
        }else{
            req.body.request.range = [from, to];
        }

        jsonData = req.body;
        
        var query = addOn.queryCondition(jsonData)
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
        response = await getData.searchData(jsonData.request.index, query);

        // Convert Elasticsearch Response to Simpler JSON Format
        data = formatter.histogramFormatter(response);
    } catch (error) {
        console.log("Error - Outside");
        data = {"Error": error.message};
    }

    res.json(data);
});

app.listen(PORT, () => {});