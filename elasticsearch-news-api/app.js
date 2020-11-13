const getData = require("./elasticsearch/get");
const addOn = require("./module/addOn");
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
    var data = {};
    // Convert Request to Elasticsearch Boolean Search
    try {
        jsonData = req.body;
        
        var query = addOn.queryCondition(jsonData)
        data = await getData.searchData(jsonData.request.index, query);
    } catch (error) {
        console.log("Error - Outside");
        res.json({"Error": error.message});
    }

    res.json(data);
});

app.get("/search/sentiment", async (req, res) => {
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

        data = await getData.searchData(jsonData.request.index, query);
    } catch (error) {
        console.log(error.message);
        res.json({"Error": error.message});
    }

    res.json(data);
});

app.get("/search/sentiment/histogram", (req, res) => {
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
        jsonData = req.body;

        if(req.body.request.range){
            rangeConv = converter.rangeConvert(req.body.request.range);
            to = rangeConv.to;
            from = rangeConv.from;
        }
        
        var query = addOn.queryCondition(jsonData)
        query.aggs = {
            "sentiment_over_time":{
                "date_histogram":{
                    "field": "datetime_ms",
                    "calendar_interval": interval,
                    "format": "yyyy-MM-dd:HH:mm:ss",
                    "time_zone": "+07:00",
                    "keyed": true,
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
        data = await getData.searchData(jsonData.request.index, query);
    } catch (error) {
        console.log("Error - Outside");
        res.json({"Error": error.message});
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});