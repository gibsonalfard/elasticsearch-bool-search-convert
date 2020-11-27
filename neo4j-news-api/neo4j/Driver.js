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
        const query = this.requestParser.getQuery(request);
        const range = this.requestParser.getRange(request, returnCode);
        const source = this.requestParser.getSource(request);
        const select = this.requestParser.getSelect(request);
        const cypherQuery = this.queryConverter.toCypher(query, range, select, matchCode, returnCode);
        console.log(`\n\n${cypherQuery}`);
        // return cypherQuery;
        const result = await this.executeQuery(cypherQuery, source);
        const formattedData = this.dataFormatter.formatData(result, range, select, matchCode, returnCode);
        return formattedData;
    }

    async executeQuery(cypherQuery, dbName) {
        const session = neo4jDriver.session({database: dbName});
        let result;

        try {
            result = await session.run(cypherQuery);
        } catch (err) {
            // console.log(err);
        } finally {
            await session.close();
        }

        if(result) {
            return result.records;
        } else {
            return null;
        }
    }

    async close() {
       await neo4jDriver.close();
    }
}

module.exports = Driver;