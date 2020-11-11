const getData = require("./elasticsearch/get");
const converter = require("./module/converter");
const bodyParser = require("body-parser");
const express = require("express");

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
        var queryValue = jsonData.request.query.value;
        var queryField = jsonData.request.query.field;
        var aggrField = jsonData.request.aggs;

        //  Convert input query into bool search query for Elasticsearch
        query = converter.convertQuery(queryValue, queryField, aggrField);

        // Send Request to Elasticsearch
        data = await getData.searchData(jsonData.request.index, query);
    } catch (error) {
        console.log(error);
        res.json({"Error": error.message});
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});