const { isEmpty } = require("./addOn");

exports.outputJSONFormatter = (elasticResponse) => {
    var jsonData = [];
    var formatData = {};

    // Only return some of field returned by Elasticsearch
    for(hit of elasticResponse.hits.hits){
        formatData = hit._source;
        formatData.score = hit._score;
        formatData.sentiment = getSentimentById(hit._id, elasticResponse.aggregations);

        jsonData.push(formatData);
    }

    formattedJSON = {
        "data": jsonData
    }

    return formattedJSON;
}

exports.histogramFormatter = (elasticResponse) => {
    var historamJSON = [];
    var sentimentStr = "";
    var sentimentList = [];

    var emptySentimentList = true;

    // Get Only Histogram Aggregation Data
    for(item of elasticResponse.aggregations["sentiment_over_time"].buckets){
        if(item["to-sentiment"]["doc_count"] > 0){
            sentimentStr = "{";
            for(sentimentItem of item["to-sentiment"].sentiment.buckets){
                sentimentStr = sentimentStr.concat(`"${sentimentItem.key}": ${sentimentItem.doc_count}, `);

                if(emptySentimentList){
                    sentimentList.push(sentimentItem.key);
                }
            }
            sentimentStr = sentimentStr.concat("}").replace(", }","}");
            if(isEmpty(sentimentList) ? !emptySentimentList : emptySentimentList){
                emptySentimentList = false;
            }
        }else{
            if(emptySentimentList){
                sentimentList = findSentimentList(elasticResponse.aggregations["sentiment_over_time"].buckets);
            }
            sentimentStr = makeZeroSentiment(sentimentList);
        }

        historamJSON.push({
            "timestamps": item.key,
            "timestamps_str": item["key_as_string"],
            "sentiment_total": item["to-sentiment"]["doc_count"],
            "sentiment": JSON.parse(sentimentStr)
        });
    }

    return historamJSON;
}

const makeZeroSentiment = (sentimentList) => {
    var sentimentStr = "{";
    var item;
    for(item of sentimentList){
        sentimentStr = sentimentStr.concat(`"${item}": 0, `);
    }
    sentimentStr = sentimentStr.concat("}").replace(", }","}");

    return sentimentStr;
}

const findSentimentList = (sentimentArr) => {
    var sentimentList = [];
    var item;
    for(item of sentimentArr){
        if(item["to-sentiment"]["doc_count"] > 0){
            for(sentimentItem of item["to-sentiment"].sentiment.buckets){
                sentimentList.push(sentimentItem.key);
            }
            break;
        }
    }

    return sentimentList;
}

const getSentimentById = (id, aggregation) => {
    var sentimentRaw = {};

    for(item of aggregation["by-news-id"].buckets){
        if(id == item.key){
            sentimentRaw = item;
            break;
        }
    }

    // console.log(sentimentRaw);

    var sentimentStr = "{";
    for(item of sentimentRaw["to-sentiment"]["by-sentiment"].buckets){
        sentimentStr = sentimentStr.concat(`"${item.key}": ${item.doc_count}, `);
    }
    sentimentStr = sentimentStr.concat("}").replace(", }","}");

    return JSON.parse(sentimentStr);
}