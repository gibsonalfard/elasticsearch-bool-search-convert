
// Format data returned from Neo4j
class DataFormatter {
    constructor(params) {
        this.params = params;
    }

    wrapData(data) {
        return {
            "data": data
        }
    }

    // Create news object
    createNews(object) {
        let news = object["News"];

        news.meta = object["Meta"];
        news.meta.site = object["Site"];
        news.meta.source = object["Site"];

        news.analysis = object["Analysis"];
        news.analysis.topic_feature = object["TopicFeature"];
        news.analysis.quotes = [object["Quote"]];
        news.analysis.quotes[0].quote_sentiment = object["QuoteSentiment"];
        news.analysis.versions = object["Versions"];

        if(object["Sentiment"]) {
            news.analysis.sentiment = object["Sentiment"];
            news.analysis.sentiment.feature = object["Feature"];
            if(object["Client"]) {
                news.analysis.sentiment.client = object["Client"];
            }
        }

        news.location_id = object["LocationId"];

        news.location = [object["Location"]];
        news.location[0].province = object["Province"];
        news.location[0].country = object["Country"];
        news.location[0].city = object["City"];

        if(object["score"]) {
            news.score = object["score"];
        }

        return news;
    }

    // Return data with specific fields only (may duplicate)
    formatFields(fields, data) {
        let formattedData = [];
        // For every data returned from Neo4j
        for(let i = 0; i < data.length; i++) {
            let obj = {};
            // For every fields
            for(let j = 0; j < data[i]._fields.length; j++) {
                let key = fields[j];
                obj[key] = data[i]._fields[j];
            }
            formattedData.push(obj);
        }
        return this.wrapData(formattedData);
    }

    // Return news data with sentiment merged into array (news.analysis.sentiment)
    formatNewsDataSentiment(data) {
        let formattedData = [];
        // For every data returned from Neo4j
        for(let i = 0; i < data.length; i++) {
            let obj = {};
            let news = {};
            // For every fields
            for(let j = 0; j < data[i]._fields.length; j++) {
                if(data[i].keys[j] == "score") {
                    let key = "score";
                    obj[key] = data[i]._fields[j];
                    continue;
                }
                let key = data[i]._fields[j].labels[0];
                if(key == "Sentiment") {
                    let feature = data[i]._fields.filter(o => {
                        if(o.labels && o.labels[0] === "Feature") {
                            return o.properties;
                        }
                    })
                    let sentiment = data[i]._fields[j].properties;
                    sentiment.feature = feature[0].properties;
                    sentiment.count = 1;
                    if(!obj[key]) {
                        obj[key] = [];
                        obj[key].push(sentiment);
                    } else {
                        obj[key].push(sentiment);
                    }                 
                } else if(key == "News"){
                    news = data[i]._fields[j].properties;
                    obj[key] = data[i]._fields[j].properties;
                } else {
                    obj[key] = data[i]._fields[j].properties;
                }
            }
            for(let k = i+1; k < data.length; k++) {
                let array = data[k]._fields.filter(o => 
                    o.labels && o.labels[0] == "News" && JSON.stringify(o.properties) === JSON.stringify(news));
                if(array.length > 0) {
                    let sentiment = data[k]._fields.filter(o => {
                        if(o.labels && o.labels[0] === "Sentiment") {
                            return o.properties;
                        }
                    })
                    let feature = data[k]._fields.filter(o => {
                        if(o.labels && o.labels[0] === "Feature") {
                            return o.properties;
                        }
                    })
                    sentiment[0].properties.feature = feature[0].properties;
                    sentiment[0].properties.count = 1;
                    obj["Sentiment"].push(sentiment[0].properties);
                    i++;
                }
            }
        
            for(let j = 0; j < obj["Sentiment"].length; j++) {
                let deleteList = [];
                for(let k = j+1; k < obj["Sentiment"].length; k++) {
                    if(obj["Sentiment"][j].sentiment === obj["Sentiment"][k].sentiment) {
                        obj["Sentiment"][j].count += 1;
                        deleteList.push(k);
                    }
                }
                deleteList.sort().reverse();
                for(let k = 0; k < deleteList.length; k++) {
                    obj["Sentiment"].splice(deleteList[k], 1);
                }                
            }

            formattedData.push(this.createNews(obj));
        }
        return this.wrapData(formattedData);
    }

    // Return simple news data (may duplicate)
    formatNewsData(data) {
        let formattedData = [];
        // For every data returned from Neo4j
        for(let i = 0; i < data.length; i++) {
            let obj = {};
            // For every fields
            for(let j = 0; j < data[i]._fields.length; j++) {
                if(data[i].keys[j] == "score") {
                    let key = "score";
                    obj[key] = data[i]._fields[j];
                    continue;
                }
                let key = data[i]._fields[j].labels[0];
                obj[key] = data[i]._fields[j].properties;    
            }
            formattedData.push(this.createNews(obj));
        }
        return this.wrapData(formattedData);
    }

    // Initiate histogram data
    setHistogramData(dateRange) {
        let histogramData = [];
        let histogramDataIndex = 0;
        let firstDay = new Date(Number(dateRange[0]));
        let lastDay = new Date(Number(dateRange[1]));
        firstDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
        lastDay = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());

        let day = firstDay;
        while(day.getTime() <= lastDay.getTime()) {
            let timestamp = day.getTime();
            let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            let timestamp_str = (new Date(timestamp - tzoffset)).toISOString().slice(0, -1) + "+07:00";
            histogramData[histogramDataIndex] = {
                "timestamps": day.getTime(),
                "timestamps_str": timestamp_str,
                "sentiment_total": 0,
                "sentiment": {}
            };
            day.setDate(day.getDate()+1);
            histogramDataIndex += 1;
        }

        return histogramData;
    }

    formatHistogramData(data, dateRange) {
        let histogramData = this.setHistogramData(dateRange);

        // For every data returned from Neo4j
        for(let i = 0; i < data.length; i++) {

            // Get data
            let date = new Date(data[i]._fields[0].year, data[i]._fields[0].month - 1, data[i]._fields[0].day);
            let timestamp = date.getTime();
            let sentiment = data[i]._fields[1];
            let count = data[i]._fields[2];

            // Save data to histogram
            for(let j = 0; j < histogramData.length; j++) {
                if(histogramData[j].timestamps == timestamp) {
                    histogramData[j].sentiment_total += count;
                    histogramData[j].sentiment[sentiment] = count;
                    break;
                }
            }
        }

        return histogramData;
    }

    formatData(data, dateRange, select, matchCode, returnCode) {
        // If no data or error when getting data from Neo4j
        if(!data) {
            // Return empty array
            return this.wrapData([]);
        }
        switch(returnCode) {
            case 1:
                if(select) {
                    return this.formatFields(select, data);
                } else {        
                    switch(matchCode) {
                        case 1: 
                            return this.formatNewsData(data);
                        case 2:
                            return this.formatNewsDataSentiment(data);
                        case 3:
                            return this.formatNewsData(data);
                        default:
                            return this.formatNewsData(data);
                    }
                }
            case 2:
                return this.formatHistogramData(data, dateRange);
            default:
                return data;
        }
    }

}

module.exports = DataFormatter;