
const FULLTEXT_INDEX_NAME = "newsTitleAndContent";

class Cypher {
    constructor(params) {
        this.params = params;
    }

    // Modify full-text search keyword
    modifyKeyword(keyword) {
        // Handle multiple token
        // Replace " with \"
        keyword = keyword.replace(/\"/g, '\\\"');
        keyword = keyword.replace(/\'/g, '\\\"');

        // Replace "(NOT something)" with "NOT something"
        keyword = keyword.replace(/\((NOT \(?[\w\s?]+\)?)\)/g, "$1")

        // Replace "NOT" with "* NOT"
        keyword = keyword.replace(/NOT/g, '* NOT');

        // Add parenthesis
        if(keyword.indexOf('(') != 1 && keyword.indexOf(')') != keyword.length-1){
            keyword = "(" + keyword + ")";
        }

        return keyword;
    }

    getSearchKeyword(query) {
        query.value = this.modifyKeyword(query.value);
        return "(" + query.field + ":" + query.value + ")";
    }

    searchByKeyword(keyword) {
        const nodeName = "node";
        return `CALL db.index.fulltext.queryNodes("${FULLTEXT_INDEX_NAME}", "${keyword}") YIELD ${nodeName} as news, score`;
    }

    // Match News
    matchNews() {
        return `MATCH (news:News)`;
    }

    // Match News and its properties
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

    // Match News and its properties and sentiment
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
                            (sentiment)-[:SENTIMENT_FOR_CLIENT]-(client:Client),
                    (news)-[:HAS_LOCATION_ID]-(location_id:LocationId),
                    (news)-[:HAS_LOCATION]-(location:Location),
                        (location)-[:HAS_PROVINCE]-(province:Province),
                        (location)-[:HAS_COUNTRY]-(country:Country),
                        (location)-[:HAS_CITY]-(city:City)`;        
    }

    // Match News and its properties and sentiment and client
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

    // Add "" to condition if query for string
    whereConditionByType(field, value) {
        if(typeof value == "string") {
            return `${field} = "${value}"`;
        } else {
            return `${field} = ${value}`;
        }
    }

    // Condition if query search for specific date range
    whereConditionDateRange(dateRange) {
        try {
            return `news.datetime_ms >= ${dateRange[0]} 
                    AND news.datetime_ms <= ${dateRange[1]}`
        } catch(err) {
            console.log(`Invalid request.range format!`);
            return ``;
        }
    }

    // Create query for "WHERE" condition
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

            // client
            if(query.field.includes(`client.`)) {
                return this.whereConditionByType(query.field, query.value)
            }

            return this.whereConditionByType(`news.${query.field}`, query.value)
        } catch (err) {
            return ``;
        }
    }

    // Create query for "WHERE" condition
    convertField(field) {
        const dotCount = field.split(".").length - 1;

        // analysis
        if(field.includes(`analysis.`) && dotCount >= 2) {
            field = field.replace("analysis.", "");
            return field;
        } else if(field.includes(`analysis.`)) {
            return field;
        }

        // meta
        if(field.includes(`meta.`) && dotCount >= 2) {
            field = field.replace("meta.", "");
            return field;
        } else if(field.includes(`meta.`)) {
            return field;
        }
            
        // location_id
        if(field.includes(`location_id.`)) {
            return field;
        }

        // client
        if(field.includes(`client.`)) {
            return field;
        }
        
        // Score
        if(field.includes(`score`)) {
            return field;
        }

        field = `news.${field}`;
        return field;
    }

    return() {
        return `\nRETURN `;
    }

    comma() {
        return ", ";
    }

    // Return only specific fields
    returnSelect(fields) { 
        let returnQuery = ``;
        for(let i = 0; i < fields.length; i++) {
            if(returnQuery == ``) {
                returnQuery = returnQuery.concat(this.return(), this.convertField(fields[i]));
            } else {
                returnQuery = returnQuery.concat(this.comma(), this.convertField(fields[i]));
            }
        }
        if(returnQuery == ``) {
            returnQuery = this.returnEverything();
        }
        return returnQuery;
    }

    returnEverything() { 
        return `\nRETURN *`;
    }

    returnHistogram() { 
        return `\nRETURN date(datetime({epochMillis:news.datetime_ms})) as date, sentiment.sentiment as sentiment, COUNT(*) as count ORDER BY date ASC`;
    }

}

module.exports = Cypher;