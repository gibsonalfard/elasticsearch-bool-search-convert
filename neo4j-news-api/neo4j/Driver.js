const QueryConverter = require('./QueryConverter');
const RequestParser = require('./RequestParser');
const DataFormatter = require('./DataFormatter');
const neo4jDriver = require('./config');

class Driver {
    constructor(params) {
        this.params = params;
        this.queryConverter = new QueryConverter();
        this.requestParser = new RequestParser();
        this.dataFormatter = new DataFormatter();
    }

    async search(request, matchCode, returnCode) {
        const query = this.requestParser.toQuery(request);
        const cypherQuery = this.queryConverter.toCypher(query, matchCode, returnCode);
        console.log(`\n\n${cypherQuery}`);
        // return cypherQuery;
        const result = await this.executeQuery(cypherQuery);
        const formattedData = this.dataFormatter.formatData(result);
        return formattedData;
    }

    async executeQuery(cypherQuery) {
        const session = neo4jDriver.session({database: 'neo4j'});
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