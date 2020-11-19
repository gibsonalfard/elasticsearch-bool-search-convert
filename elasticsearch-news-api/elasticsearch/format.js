exports.getMeta = (id, url, path) => {
    var meta = {
        "avatar": "",
        "mongodb_id": id,
        "path": path,
        "prefix": "",
        "site":{
            "id": "",
            "name": "",
            "url" : url
        },
        "source":{
            "code": "",
            "country": "",
            "geolocation":{ 
                "lat": -0.789275,
                "lon": 113.921327
            },
            "name": "",
            "region": "",
            "url" : url
        }
    }

    return meta;
}

exports.getAnalysisNews = () => {
    var analysis = {
        "age": "",
        "lang": "",
        "picture_address": "",
        "spammer": "",
        "influence_rate": "",
        "badword": false,
        "block_content": false,
        "block_resource": false,
        "facility": "",
        "gender": "",
        "hoax": false,
        "influencer": "",
        "location": "",
        "organization":"",
        "person":[],
        "question":false,
        "quote_speaker": "",
        "quotes":[{}],
        "spoken_person": "",
        "timex" : "",
        "topic": "",
        "topic_feature": {
            "feature":"",
            "topic":""
        },
        "versions":{}
    }

    return analysis;
}