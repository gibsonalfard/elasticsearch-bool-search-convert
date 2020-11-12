const getData = require("./elasticsearch/get");
const addOn = require("./module/addOn");
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

    res.json(query);
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
    var interval = "day"

    if(req.query.interval){
        interval = req.query.interval;
    }

    try {
        jsonData = req.body;
        
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
                        "min": 1601485200000,
                        "max": 1604077200000
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
        // data = await getData.searchData(jsonData.request.index, query);
    } catch (error) {
        console.log("Error - Outside");
        res.json({"Error": error.message});
    }

    res.json(query);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});