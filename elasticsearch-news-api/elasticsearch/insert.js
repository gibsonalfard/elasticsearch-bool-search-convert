const fs = require("fs");
const elastic = require("config");

exports.bulkInsertNews = async (index, data) => {
    var body = data.flatMap(doc => [{ index: { _index: index } }, doc]);
    var { body: bulkResponse } = await elastic.bulk({ refresh: true, body });

    if(bulkResponse.error){
        console.log("Error exist in query, cannot insert data to Elasticsearch");
    }
}

// exports.bulkInsertSentiment = async (index, data) => {
//     var body = data.flatMap(doc => [{ index: { _index: index } }, doc]);
//     var { body: bulkResponse } = await elastic.bulk({ refresh: true, body });

//     if(bulkResponse.error){
//         console.log("Error exist in query, cannot insert data to Elasticsearch");
//     }
// }