const fs = require("fs");
const berita = require("../../../data-transfer-db/models/berita");
const elastic = require("./config");
const format = require("./format");

exports.bulkInsert = async (body) => {
    let { body: bulkResponse } = await elastic.bulk({ refresh: true, body });

    if(bulkResponse.error){
        console.log("Error exist in query, cannot insert data to Elasticsearch");
    }

    return bulkResponse;
}

exports.bulkDataNews = function(index, data){
    // Prepare Bulk data Ready for Elasticsearch
    // Input : Data From MongoDB
    // Output : JSON Format Body for Bulk Insert on Elasticsearch

    let bulkBerita = [];

    for(let berita of data){
        bulkBerita.push(
            {index: {_index: index, _type: '_doc', _id: berita["_id"]}},
            {
                "id": berita["_id"],
                "meta": format.getMeta(berita.id, berita.url, berita.path),
                "url" : berita.url,
                "title" : berita.title,
                "content" : berita.content,
                "content_html" : berita.content_html,
                "analysis": format.getAnalysisNews(),
                "keywords": "",
                "hashtags" : berita.tags,
                "image" : berita.images,
                "video" : berita.videos,
                "location_id": {
                    "city_id": "",
                    "country_code": "",
                    "province_id": ""
                },
                "location": [{
                    "city": {
                        "geolocation":"",
                        "id":"",
                        "name": ""
                    },
                    "country":{
                        "code": "",
                        "name": ""
                    },
                    "province":{
                        "geolocation":"",
                        "id":"",
                        "name": ""
                    }
                }],
                "priority": "",
                "datetime_ms" : berita.datetime_ms,
                "news_join":{
                    "name": "news"
                }
            }
        );
    }

    return bulkBerita;
}

exports.bulkDataSentiment = function(index, data){
    // Prepare Bulk data Ready for Elasticsearch
    // Input : Data From MongoDB
    // Output : JSON Format Body for Bulk Insert Sentiment on Elasticsearch

    let bulkSentiment = [];

    for(let sentiment of data){
        bulkSentiment.push(
            {index: {_index: index, _type: '_doc', _id: sentiment["id"], routing: sentiment["news_join"]["parent"]}},
            sentiment
        );
    }

    return bulkSentiment;
}