const getData = require("./neo4j/get");

const bodyParser = require("body-parser");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/search", async (req, res) => {
    jsonData = req.body;

    try {
        // Params example: news_id, etc 
        params = "";

        // Query example: "MATCH (n:News) RETURN n LIMIT 25"
        data = await getData.searchData(jsonData.query, params);
    } catch (err) {
        console.log(err);
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});