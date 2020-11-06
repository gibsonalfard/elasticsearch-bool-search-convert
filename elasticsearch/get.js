const fs = require("fs");
const elastic = require("./config");

exports.searchData = async (index, query) => {
    // console.log(query);
    const { body } = await elastic.search({
        "index": index,
        "body": query
    })

    return body
}