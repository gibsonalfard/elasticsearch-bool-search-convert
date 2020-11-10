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
    // Convert Request to Elasticsearch Boolean Search
    jsonData = req.body;
    var queryValue = jsonData.request.query.value;
    var queryField = jsonData.request.query.field;
    
    query = converter.moreComplexConverter(queryValue, queryField);

    // Send Request to Elasticsearch
    // data = await getData.searchData(jsonData.request.index, query);

    res.json(query);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});