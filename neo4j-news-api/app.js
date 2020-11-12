const Driver = require("./neo4j/Driver");

const bodyParser = require("body-parser");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/search", async (req, res) => {
    const jsonData = req.body;

    // driver jadikan singleton?
    const driver = new Driver();

    try {
        data = await driver.search(jsonData);
    } catch (err) {
        console.log(err);
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});