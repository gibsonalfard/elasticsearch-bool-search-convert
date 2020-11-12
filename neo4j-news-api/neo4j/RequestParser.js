
class RequestParser {
    constructor(params) {
        this.params = params;
    }

    toQuery(request) {
        if(request.request.query) {
            return request.request.query;
        } else {
            console.log("[ERROR] Query doesn't exist!");
            return null;
        }
    }

}

module.exports = RequestParser;