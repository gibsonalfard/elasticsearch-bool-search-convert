
class CypherInsert {
    constructor(params) {
        this.params = params;
    }

    getInsertNewsQuery(news) {
        let insertQuery = ``;
        if(news == {}) {
            return ``;
        }
        insertQuery = insertQuery.concat(this.createNews(news), " ");
        insertQuery = insertQuery.concat(this.createMeta(news), " ");
        insertQuery = insertQuery.concat(this.mergeNewsMeta(), " ");
        insertQuery = insertQuery.concat(this.createSite(news), " ");
        insertQuery = insertQuery.concat(this.mergeMetaSite(), " ");
        insertQuery = insertQuery.concat(this.createSource(news), " ");
        insertQuery = insertQuery.concat(this.mergeMetaSource(), " ");
        insertQuery = insertQuery.concat(this.createAnalysis(), " ");
        insertQuery = insertQuery.concat(this.mergeNewsAnalyis(), " ");
        insertQuery = insertQuery.concat(this.createQuote(), " ");
        insertQuery = insertQuery.concat(this.mergeAnalysisQuote(), " ");
        insertQuery = insertQuery.concat(this.createQuoteSentiment(), " ");
        insertQuery = insertQuery.concat(this.mergeQuoteQuoteSentiment(), " ");
        insertQuery = insertQuery.concat(this.createTopicFeature(), " ");
        insertQuery = insertQuery.concat(this.mergeAnalysisTopicFeature(), " ");
        insertQuery = insertQuery.concat(this.createVersions(), " ");
        insertQuery = insertQuery.concat(this.mergeAnalysisVersions(), " ");
        insertQuery = insertQuery.concat(this.createLocationId(), " ");
        insertQuery = insertQuery.concat(this.mergeNewsLocationId(), " ");
        insertQuery = insertQuery.concat(this.createLocation(), " ");
        insertQuery = insertQuery.concat(this.mergeNewsLocation(), " ");
        insertQuery = insertQuery.concat(this.createCity(), " ");
        insertQuery = insertQuery.concat(this.mergeLocationCity(), " ");
        insertQuery = insertQuery.concat(this.createCountry(), " ");
        insertQuery = insertQuery.concat(this.mergeLocationCountry(), " ");
        insertQuery = insertQuery.concat(this.createProvince(), " ");
        insertQuery = insertQuery.concat(this.mergeLocationProvince(), " ");
        // insertQuery = insertQuery.concat(this.createSentimentClient(), " ");
        insertQuery = insertQuery.concat(this.returnInsertedNews(), " ");
        return insertQuery;
    }

    createNews(news) {
        if(news._id.$oid) {
            news._id = news._id.$oid;
        }
        news.title = news.title.replace(/\"/g, '\\\"');
        news.content = news.content.replace(/\"/g, '\\\"');
        news.content_html = news.content_html.replace(/\"/g, '\\\"');

        let hashtags = [];
        let images = [];
        let videos = [];

        for(let i = 0; i < news.tags.length; i++) {
            hashtags.push(`"${news.tags[i]}"`);
        }

        for(let i = 0; i < news.images.length; i++) {
            images.push(`"${news.images[i]}"`);
        }

        for(let i = 0; i < news.videos.length; i++) {
            videos.push(`"${news.videos[i]}"`);
        }

        return `
        CREATE (news:News 
            {
                id: "${news._id}",
                url: "${news.url}",
                title: "${news.title}",
                content: "${news.content}",
                content_html: "${news.content_html}",
                keywords: "",
                hashtags: [${hashtags}],
                image: [${images}],
                video: [${videos}],
                priority: "",
                datetime_ms: ${news.datetime_ms}
            }
        )`;        
    }

    createMeta(news) {
        return `
        CREATE (meta:Meta 
            {
                avatar: "",
                mongodb_id: "${news._id}",
                path: "${news.path}",
                prefix: ""
            }
        )`;
    }

    mergeNewsMeta() {
        return `MERGE (news)-[has_meta:HAS_META]->(meta)`
    }

    createSite(news) {
        return `
        CREATE (site:Site
            {
                id: "",
                name: "",
                url: "${news.url}"
            }
        )`;  
    }

    mergeMetaSite() {
        return `MERGE (meta)-[has_site:HAS_SITE]->(site)`;
    }

    createSource(news) {
        return `
        CREATE (source:Source
            {
                code: "",
                country: "",
                geolocation: point({ longitude: 113.921327, latitude: -0.789275 }),
                name: "",
                region: "",
                url: "${news.url}"
            }
        )`;        
    }

    mergeMetaSource() {
        return `MERGE (meta)-[has_source:HAS_SOURCE]->(source)`;
    }

    createAnalysis() {
        return `
        CREATE (analysis:Analysis
            {
                age: "",
                lang: "",
                picture_address: "",
                spammer: "",
                influence_rate: "",
                badword: false,
                block_content: false,
                block_resource: false,
                facility: "",
                gender: "",
                hoax: false,
                influencer: "",
                location: "",
                organization: "",
                person: [],
                question: false,
                quote_speaker: "",
                spoken_person: "",
                timex: "",
                topic: ""
            }
        )`;        
    }

    mergeNewsAnalyis() {
        return `MERGE (news)-[has_analysis:HAS_ANALYSIS]->(analysis)`;
    }

    createQuote() {
        return `
        CREATE (quote:Quote
            {
                age: "",
                speaker: ""
            }
        )`;
    }

    mergeAnalysisQuote() {
        return `MERGE (analysis)-[has_quote:HAS_QUOTE]->(quote)`;
    }

    createQuoteSentiment() {
        return `
        CREATE (quote_sentiment:QuoteSentiment
            {
                features: "",
                sentiment: ""
            }
        )`;        
    }

    mergeQuoteQuoteSentiment() {
        return `MERGE (quote)-[has_quote_sentiment:HAS_QUOTE_SENTIMENT]->(quote_sentiment)`;
    }

    createTopicFeature() {
        return `
        CREATE (topic_feature:TopicFeature
            {
                feature: "",
                topic: ""
            }
        )`;
    }

    mergeAnalysisTopicFeature() {
        return `MERGE (analysis)-[has_topic_feature:HAS_TOPIC_FEATURE]->(topic_feature)`;
    }

    createVersions() {
        return `
        CREATE (versions:Versions
            {
                badword: "",
                cleansing: "",
                gender: "",
                hoax: "",
                lang: "",
                ner: "",
                sentiment: ""
            }
        )`;
    }

    mergeAnalysisVersions() {
        return `MERGE (analysis)-[has_versions:HAS_VERSIONS]->(versions)`;
    }

    createLocationId() {
        return `CREATE (location_id:LocationId
            {
                city_id: "",
                country_code: "",
                province_id: ""
            }
        )`;
    }

    mergeNewsLocationId() {
        return `MERGE (news)-[has_location_id:HAS_LOCATION_ID]->(location_id)`;
    }

    createLocation() {
        return `
        CREATE (location:Location
            {
                
            }
        )`;
    }
    
    mergeNewsLocation() {
        return `MERGE (news)-[has_location:HAS_LOCATION]->(location)`;
    }

    createCity() {
        return `
        CREATE (city:City
            {
                geolocation: "",
                id: "",
                name: ""
            }
        )`;
    }

    mergeLocationCity() {
        return `MERGE (location)-[has_city:HAS_CITY]->(city)`;
    }

    createCountry() {
        return `
        CREATE (country:Country
            {
                code: "",
                name: ""
            }
        )`;
    }

    mergeLocationCountry() {
        return `MERGE (location)-[has_country:HAS_COUNTRY]->(country)`;
    }

    createProvince() {
        return `
        CREATE (province:Province
            {
                geolocation: "",
                id: "",
                name: ""
            }
        )`;
    }

    mergeLocationProvince() {
        return `MERGE (location)-[has_province:HAS_PROVINCE]->(province)`;
    }

    createSentimentClient() {
        return `
        WITH *
        OPTIONAL MATCH (client:Client)
        WITH *, collect(client) as client_collection
        FOREACH (cl IN client_collection | 
            MERGE (analysis)-[has_sentiment:HAS_SENTIMENT]->(sentiment:Sentiment
                {
                    corrected_sentiment: "",
                    sentiment: "net"
                }
            )
            MERGE (sentiment)-[has_feature:HAS_FEATURE]->(feature:Feature
                {
                    neg: "",
                    net: "",
                    pos: ""
                }
            )
            MERGE (sentiment)-[sentiment_for_client:SENTIMENT_FOR_CLIENT]->(cl)
        )`;
    }

    returnInsertedNews() {
        return `
        RETURN news, 
        meta, has_meta, 
        site, has_site, 
        source, has_source,
        analysis, has_analysis,
        quote, has_quote,
        quote_sentiment, has_quote_sentiment,
        topic_feature, has_topic_feature,
        versions, has_versions,
        location_id, has_location_id,
        location, has_location,
        city, has_city,
        country, has_country,
        province, has_province`;
    }

    getInsertSentimentQuery(data) {
        return `
        MERGE (client:Client 
            {
                id: "${data.client_id}"
            }
        )
        WITH *
        MATCH (news:News)-[:HAS_ANALYSIS]-(analysis:Analysis)
        WHERE news.id = "${data.news_id}"
        MERGE (analysis)-[has_sentiment:HAS_SENTIMENT]->(sentiment:Sentiment
            {
                corrected_sentiment: "",
                sentiment: "${data.sentiment}"
            }
        )
        MERGE (sentiment)-[has_feature:HAS_FEATURE]->(feature:Feature
            {
                neg: "",
                net: "",
                pos: ""
            }
        )
        MERGE (sentiment)-[sentiment_for_client:SENTIMENT_FOR_CLIENT]->(client)

        RETURN *
        `
    }

    getInsertClientQuery(client) {
        return `
        MERGE (client:Client 
            {
                id: "${client.id}",
                name: "${client.name}"
            }
        )
        RETURN *`
    }
}

module.exports = CypherInsert;