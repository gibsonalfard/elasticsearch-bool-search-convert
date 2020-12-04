const addOn = require("./addOn");

/* 
This method format quotation mark into parentheses mark 
and convert token inside quotation mark in AND relational manner
*/
exports.quoteFormatter = (text, list) => {
    for(item of list){
        replaceRaw = item.replace(/[\"\']/g, "");
        replacement = replaceRaw.replace(/\s/g, " AND ");
        replacement = `(${replacement})`;

        text = text.replace(item,replacement);
    }

    return text;
}

/* 
Format response from Elasticsearch into simpler and readable format
*/
exports.outputJSONFormatter = (elasticResponse) => {
    let jsonData = [];
    let formatData = {};

    // Only return some of field returned by Elasticsearch
    for(hit of elasticResponse.hits.hits){
        formatData = hit._source;
        formatData.score = hit._score;
        if(elasticResponse.aggregations){
            formatData.sentiment = getSentimentById(hit._id, elasticResponse.aggregations);
        }

        jsonData.push(formatData);
    }

    formattedJSON = {
        "data": jsonData
    }

    return formattedJSON;
}

/* 
Format Histogram response from Elasticsearch into simpler and readable format
*/
exports.histogramFormatter = (elasticResponse) => {
    let historamJSON = [];
    let sentimentStr = "";
    let sentimentList = [];

    let emptySentimentList = true;

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
            if(addOn.isEmpty(sentimentList) ? !emptySentimentList : emptySentimentList){
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

/* 
Make JSON object that have zero value for every sentiment in sentimentList
*/
const makeZeroSentiment = (sentimentList) => {
    let sentimentStr = "{";
    let item;
    for(item of sentimentList){
        sentimentStr = sentimentStr.concat(`"${item}": 0, `);
    }
    sentimentStr = sentimentStr.concat("}").replace(", }","}");

    return sentimentStr;
}

/* 
Method to create sentimentList from aggregation data returned by Elasticsearch 
*/
const findSentimentList = (sentimentArr) => {
    let sentimentList = [];
    let item;
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

/*
Find sentiment by sentiment id
*/
const getSentimentById = (id, aggregation) => {
    let sentimentRaw = {};

    for(item of aggregation["by-news-id"].buckets){
        if(id == item.key){
            sentimentRaw = item;
            break;
        }
    }

    let sentimentStr = "{";
    if(sentimentRaw["to-sentiment"]){
        for(item of sentimentRaw["to-sentiment"]["by-sentiment"].buckets){
            sentimentStr = sentimentStr.concat(`"${item.key}": ${item.doc_count}, `);
        }
        sentimentStr = sentimentStr.concat("}").replace(", }","}");
    }else{
        return sentimentRaw;
    }

    return JSON.parse(sentimentStr);
}