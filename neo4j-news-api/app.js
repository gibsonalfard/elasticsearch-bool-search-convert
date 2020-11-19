const Driver = require("./neo4j/Driver");

const bodyParser = require("body-parser");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const driver = new Driver();

app.get("/search", async (req, res) => {
    const jsonData = req.body;
    const matchCode = 1;
    const returnCode = 1;

    try {
        data = await driver.search(jsonData, matchCode, returnCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.get("/search/sentiment", async (req, res) => {
    const jsonData = req.body;
    const matchCode = 2;
    const returnCode = 1;

    try {
        data = await driver.search(jsonData, matchCode, returnCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.get("/search/sentiment_client", async (req, res) => {
    const jsonData = req.body;
    const matchCode = 3;
    const returnCode = 1;

    try {
        data = await driver.search(jsonData, matchCode, returnCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.get("/search/sentiment/histogram", async (req, res) => {
    const jsonData = req.body;
    const matchCode = 3;
    const returnCode = 2;

    try {
        data = await driver.search(jsonData, matchCode, returnCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});