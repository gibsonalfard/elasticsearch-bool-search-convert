
class QueryFilter {
    constructor(params) {
        this.params = params;
    }

    matchNews() {
        return `MATCH (news)-[:HAS_META]-(meta:Meta),
                        (meta)-[:HAS_SITE]-(site:Site),
                        (meta)-[:HAS_SOURCE]-(source:Source),
                    (news)-[:HAS_ANALYSIS]-(analysis:Analysis),
                        (analysis)-[:HAS_QUOTE]-(quote:Quote),
                            (quote)-[:HAS_QUOTE_SENTIMENT]-(quote_sentiment:QuoteSentiment),
                        (analysis)-[:HAS_TOPIC_FEATURE]-(topic_feature:TopicFeature),
                        (analysis)-[:HAS_VERSIONS]-(versions:Versions),
                    (news)-[:HAS_LOCATION_ID]-(location_id:LocationId),
                    (news)-[:HAS_LOCATION]-(location:Location),
                        (location)-[:HAS_PROVINCE]-(province:Province),
                        (location)-[:HAS_COUNTRY]-(country:Country),
                        (location)-[:HAS_CITY]-(city:City)`;        
    }

    matchNewsSentiment() {
        return `MATCH (news)-[:HAS_META]-(meta:Meta),
                        (meta)-[:HAS_SITE]-(site:Site),
                        (meta)-[:HAS_SOURCE]-(source:Source),
                    (news)-[:HAS_ANALYSIS]-(analysis:Analysis),
                        (analysis)-[:HAS_QUOTE]-(quote:Quote),
                            (quote)-[:HAS_QUOTE_SENTIMENT]-(quote_sentiment:QuoteSentiment),
                        (analysis)-[:HAS_TOPIC_FEATURE]-(topic_feature:TopicFeature),
                        (analysis)-[:HAS_VERSIONS]-(versions:Versions),
                        (analysis)-[:HAS_SENTIMENT]-(sentiment:Sentiment),
                            (sentiment)-[:HAS_FEATURE]-(feature:Feature),
                    (news)-[:HAS_LOCATION_ID]-(location_id:LocationId),
                    (news)-[:HAS_LOCATION]-(location:Location),
                        (location)-[:HAS_PROVINCE]-(province:Province),
                        (location)-[:HAS_COUNTRY]-(country:Country),
                        (location)-[:HAS_CITY]-(city:City)`;        
    }

    matchNewsSentimentClient() {
        return `MATCH (news)-[:HAS_META]-(meta:Meta),
                        (meta)-[:HAS_SITE]-(site:Site),
                        (meta)-[:HAS_SOURCE]-(source:Source),
                    (news)-[:HAS_ANALYSIS]-(analysis:Analysis),
                        (analysis)-[:HAS_QUOTE]-(quote:Quote),
                            (quote)-[:HAS_QUOTE_SENTIMENT]-(quote_sentiment:QuoteSentiment),
                        (analysis)-[:HAS_TOPIC_FEATURE]-(topic_feature:TopicFeature),
                        (analysis)-[:HAS_VERSIONS]-(versions:Versions),
                        (analysis)-[:HAS_SENTIMENT]-(sentiment:Sentiment),
                            (sentiment)-[:HAS_FEATURE]-(feature:Feature),
                            (sentiment)-[:SENTIMENT_FOR_CLIENT]-(client:Client),
                    (news)-[:HAS_LOCATION_ID]-(location_id:LocationId),
                    (news)-[:HAS_LOCATION]-(location:Location),
                        (location)-[:HAS_PROVINCE]-(province:Province),
                        (location)-[:HAS_COUNTRY]-(country:Country),
                        (location)-[:HAS_CITY]-(city:City)`;        
    }

    filterDate(date) {
        if(date instanceof String){
            return `date(datetime({epochMillis:news.datetime_ms})) = date("${date}")`
        } else if(date instanceof Object) {
            try {
                return `date(datetime({epochMillis:news.datetime_ms})) >= date("${date.start}") 
                        AND date(datetime({epochMillis:news.datetime_ms})) >= date("${date.end}")`
            } catch (err) {
                console.log(`[ERROR] Invalid date format!`);
                return ``;
            }
        }
    }

    filterSentiment(sentiment) {
        return `sentiment.sentiment = "${sentiment}"`;
    }

    returnEverything() { 
        return `RETURN *`;
    }

    returnId(nodeName) {
        return `RETURN ${nodeName}.id as news_id`
    }

}

module.exports = QueryFilter;