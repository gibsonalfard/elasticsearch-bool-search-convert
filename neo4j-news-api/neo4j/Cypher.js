
const FULLTEXT_INDEX_NAME = "newsTitleAndContent";

class Cypher {
    constructor(params) {
        this.params = params;
    }

    getSearchKeyword(query) {
        return "(" + query.field + ":" + query.value + ")";
    }

    searchByKeyword(keyword) {
        const nodeName = "node";
        return `CALL db.index.fulltext.queryNodes("${FULLTEXT_INDEX_NAME}", "${keyword}") YIELD ${nodeName} as news`;
    }

    matchNews() {
        return `MATCH (news:News)`;
    }

    matchNewsProperties() {
        return `\nMATCH (news)-[:HAS_META]-(meta:Meta),
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
        return `\nMATCH (news)-[:HAS_META]-(meta:Meta),
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
        return `\nMATCH (news)-[:HAS_META]-(meta:Meta),
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

    and() {
        return ` AND `;
    }

    or() {
        return ` OR `;
    }

    where() {
        return `\nWHERE `;
    }

    whereConditionByType(field, value) {
        if(typeof value == "string") {
            return `${field} = "${value}"`;
        } else {
            return `${field} = ${value}`;
        }
    }

    whereCondition(query) {
        try {
            const dotCount = query.field.split(".").length - 1;

            // analysis
            if(query.field.includes(`analysis.`) && dotCount >= 2) {
                query.field = query.field.replace("analysis.", "");
                return this.whereConditionByType(query.field, query.value)
            } else if(query.field.includes(`analysis.`)) {
                return this.whereConditionByType(query.field, query.value)
            }

            // meta
            if(query.field.includes(`meta.`) && dotCount >= 2) {
                query.field = query.field.replace("meta.", "");
                return this.whereConditionByType(query.field, query.value)
            } else if(query.field.includes(`meta.`)) {
                return this.whereConditionByType(query.field, query.value)
            }
                
            // location_id
            if(query.field.includes(`location_id.`)) {
                return this.whereConditionByType(query.field, query.value)
            }

            return this.whereConditionByType(`news.${query.field}`, query.value)
        } catch (err) {
            return ``;
        }
    }

    returnEverything() { 
        return `\nRETURN *`;
    }

    returnHistogram() { 
        return `\nRETURN date(datetime({epochMillis:news.datetime_ms})) as date, sentiment.sentiment as sentiment, COUNT(*) as count`;
    }

}

module.exports = Cypher;