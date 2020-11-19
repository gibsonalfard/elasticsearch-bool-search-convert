
const Cypher = require('./Cypher');

class QueryConverter {
    constructor(params) {
        this.params = params;
        this.cypher = new Cypher;
        this.searchQuery = ``;
        this.whereQuery = ``;
    }

    getMatchQuery(matchCode) {
        switch(matchCode) {
            case 1:
                return this.cypher.matchNewsProperties();
            case 2:
                return this.cypher.matchNewsSentiment();
            case 3:
                return this.cypher.matchNewsSentimentClient();
            default:
                return this.cypher.matchNewsProperties();
        }
    }

    getReturnQuery(returnCode, fields) {
        switch(returnCode) {
            case 1:
                if(fields) {
                    return this.cypher.returnSelect(fields);
                } else {
                    return this.cypher.returnEverything();
                }
            case 2:
                return this.cypher.returnHistogram();
            default:
                return this.cypher.returnEverything();
        }
    }

    setQueryArray(queries, dateRange) {
        let doSearch = false; 
        let keywords = ``;
        for(let i = 0; i < queries.length; i++) {
            if(queries[i].field == "content" || queries[i].field == "title") {                    
                doSearch = true;
                if(keywords == ``) {
                    keywords = this.cypher.getSearchKeyword(queries[i]);
                } else {
                    keywords = keywords.concat(this.cypher.and(), this.cypher.getSearchKeyword(queries[i]));
                }
            } else if(JSON.stringify(queries[i]) != "{}") {
                if(this.whereQuery == ``) {
                    this.whereQuery = this.whereQuery.concat(this.cypher.where(), this.cypher.whereCondition(queries[i]));
                } else {
                    this.whereQuery = this.whereQuery.concat(this.cypher.and(), this.cypher.whereCondition(queries[i]));
                }
            }
        }

        if(dateRange) {
            if(this.whereQuery == ``) {
                this.whereQuery = this.whereQuery.concat(this.cypher.where(), this.cypher.whereConditionDateRange(dateRange));
            } else {
                this.whereQuery = this.whereQuery.concat(this.cypher.and(), this.cypher.whereConditionDateRange(dateRange));
            }
        }

        if(doSearch) {                
            this.searchQuery = this.cypher.searchByKeyword(keywords);
        } else {
            this.searchQuery = this.cypher.matchNews();
            if(this.whereQuery == this.cypher.where()) {
                this.whereQuery = ``;
            }
        }
    }

    setQuery(query, dateRange) {
        if(query instanceof Array) {
            this.setQueryArray(query, dateRange);
        } else {
            if(query.field == "content" || query.field == "title") {
                this.searchQuery = this.cypher.searchByKeyword(this.cypher.getSearchKeyword(query));
            } else if(JSON.stringify(query) == "{}") {
                this.searchQuery = this.cypher.matchNews();
            } else {
                if(this.whereQuery == ``) {
                    this.whereQuery = this.whereQuery.concat(this.cypher.where(), this.cypher.whereCondition(query));
                }
            }
            if(dateRange) {
                if(this.whereQuery == ``) {
                    this.whereQuery = this.whereQuery.concat(this.cypher.where(), this.cypher.whereConditionDateRange(dateRange));
                } else {
                    this.whereQuery = this.whereQuery.concat(this.cypher.and(), this.cypher.whereConditionDateRange(dateRange));
                }
            }
        }
    }

    toCypher(query, dateRange, fields, matchCode, returnCode) {
        let cypherQuery = ``;

        this.searchQuery = ``;
        this.whereQuery = ``;

        this.setQuery(query, dateRange);

        cypherQuery = cypherQuery.concat(this.searchQuery, " ");
        cypherQuery = cypherQuery.concat(this.getMatchQuery(matchCode), " ");
        cypherQuery = cypherQuery.concat(this.whereQuery, " ");
        cypherQuery = cypherQuery.concat(this.getReturnQuery(returnCode, fields), " ");
        return cypherQuery;
    }

}

module.exports = QueryConverter;