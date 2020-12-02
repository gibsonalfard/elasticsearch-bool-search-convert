const Driver = require("./neo4j/Driver");
const Logger = require("./neo4j/Logger");

const bodyParser = require("body-parser");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));
app.use(bodyParser.urlencoded({ extended:true,limit:1024*1024*20,type:'application/x-www-form-urlencoded' }));

const driver = new Driver();
const logger = new Logger();

app.get("/search", async (req, res) => {
    const jsonData = req.body;
    const matchCode = 1;
    const returnCode = 1;

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /search", req.body, ip);

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

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /search/sentiment", req.body, ip);

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

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /search/sentiment_client", req.body, ip);

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

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /search/sentiment/histogram", req.body, ip);

    try {
        data = await driver.search(jsonData, matchCode, returnCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});


app.post("/news/add", async (req, res) => {
    const jsonData = req.body;
    const insertCode = 1;

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /news/add", req.body.request.source, ip);

    try {
        data = await driver.insert(jsonData, insertCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.post("/sentiment/add", async (req, res) => {
    const jsonData = req.body;
    const insertCode = 2;

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /sentiment/add", req.body.request.source, ip);

    try {
        data = await driver.insert(jsonData, insertCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.post("/client/add", async (req, res) => {
    const jsonData = req.body;
    const insertCode = 3;

    // Logging Variable
    var ip = req.headers['x-forwarded-for'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress ||
                (req.connection.socket ? req.connection.socket.remoteAddress : null);

    logger.logAccess("[GET] /client/add", req.body.request.source, ip);

    try {
        data = await driver.insert(jsonData, insertCode);
    } catch (err) {
        console.log(err);
        res.json(err);;
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});