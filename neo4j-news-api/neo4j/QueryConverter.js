
const QueryFilter = require('./QueryFilter');

const FULLTEXT_INDEX_NAME = "newsTitleAndContent";

class QueryConverter {
    constructor(params) {
        this.params = params;
        this.queryFilter = new QueryFilter;
    }

    isQueryExist(query) {
        return query.field && query.value;
    }

    isFilterExist(query) {
        return query.filter && true;
    }

    searchByKeyword(query) {
        const keyword = query.field + ":" + query.value;
        const nodeName = "node";
        return `CALL db.index.fulltext.queryNodes("${FULLTEXT_INDEX_NAME}", "${keyword}") YIELD ${nodeName} as news`;
    }

    getNewsById(query) {
        const cypherQuery = query;
        // TBA ...
        return cypherQuery;
    }

    queryRouter(query) {
        if(!this.isQueryExist(query)) {
            return "";
        }

        if(query.field == "content" || query.field == "title") {
            return this.searchByKeyword(query);
        } else if(query.field == "id") {
            return this.getNewsById(query);
        } else {
            console.log(`[ERROR] Can not search from field: ${query.field}`)
            return "";
        }
    }

    filterRouter(query) {
        if(!this.isFilterExist(query)) {
            return this.queryFilter.returnEverything();
        }

        let filterQuery = ``;
        let filters = [];

        // Match
        filterQuery = filterQuery.concat(this.queryFilter.matchNews(), " ");
        // filterQuery = filterQuery.concat(this.queryFilter.matchNewsSentiment(), " ");
        // filterQuery = filterQuery.concat(this.queryFilter.matchNewsSentimentClient(), " ");
        filterQuery = filterQuery.concat("WHERE", " ");

        // Filter
        for (const filterKey in query.filter) {
            if(filterKey == "date") {
                filters.push(this.queryFilter.filterDate(query.filter[filterKey]));                
            } else if(filterKey == "sentiment") {
                filters.push(this.queryFilter.filterSentiment(query.filter[filterKey]));                
            }
        }

        for(let i = 0; i < filters.length; i++) {
            if(i+1 >= filters.length) {
                filterQuery = filterQuery.concat(filters[i], " ");
            } else {
                filterQuery = filterQuery.concat(filters[i], " AND ");
            }
        }

        // Return
        filterQuery = filterQuery.concat(this.queryFilter.returnEverything(), " ");

        // console.log(`filterQuery: ${filterQuery}`);
        return filterQuery;
    }

    toCypher(query) {
        const cypherQuery = this.queryRouter(query);
        if(cypherQuery != ""){            
            return cypherQuery + " " + this.filterRouter(query);
        } else {
            return "";
        }
    }

}

module.exports = QueryConverter;