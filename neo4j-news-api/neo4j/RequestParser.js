
class RequestParser {
    constructor(params) {
        this.params = params;
    }

    getQuery(request) {
        if(request.request.query) {
            return request.request.query;
        } else {
            return {};
        }
    }

    getSelect(request) {
        if(request.request.select) {
            return request.request.select;
        } else {
            return null;
        }
    }

    getSource(request) {
        if(request.request.source) {
            return request.request.source;
        } else {
            return `neo4j`;
        }
    }

    getDateRangeThisMonth() {
        let dateRange = [];
        let date = new Date();
        let firstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        let lastDay = new Date(date.getFullYear(), date.getMonth(), 0);
        dateRange[0] = firstDay.getTime();
        dateRange[1] = lastDay.getTime();
        return dateRange;
    }

    getRange(request, returnCode) {
        if(!request.request.range && returnCode == 2){
            return this.getDateRangeThisMonth();
        } else if(request.request.range){
            return request.request.range;
        } else {
            return null;
        }
    }
}

module.exports = RequestParser;