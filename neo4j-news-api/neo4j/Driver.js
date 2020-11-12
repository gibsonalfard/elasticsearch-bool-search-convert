const QueryConverter = require('./QueryConverter');
const RequestParser = require('./RequestParser');
const neo4jDriver = require('./config');

class Driver {
    constructor(params) {
        this.params = params;
        this.queryConverter = new QueryConverter();
        this.requestParser = new RequestParser();
    }

    async search(request) {
        const query = this.requestParser.toQuery(request);
        const cypherQuery = this.queryConverter.toCypher(query);
        // console.log(`\n\ncypherQuery: ${cypherQuery}`);
        // return cypherQuery;
        const result = await this.executeQuery(cypherQuery);
        return result;
    }

    async executeQuery(cypherQuery) {
        const session = neo4jDriver.session();
        let result;

        try {
            result = await session.run(cypherQuery);
        } finally {
            await session.close();
        }
        
        return result.records;
    }

    async close() {
       await neo4jDriver.close();
    }
}

module.exports = Driver;