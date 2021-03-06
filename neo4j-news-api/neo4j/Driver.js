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

    // Insert data to neo4j
    async insert(request, insertCode) {
        const data = this.requestParser.getData(request);
        const source = this.requestParser.getSource(request);
        if(data instanceof Array) {
            let result = [];
            for(let i = 0; i < data.length; i++) {
                let insertQuery = this.queryConverter.toCypherInsert(data[i], insertCode);
                result[i] = await this.executeQuery(insertQuery, source);
            }
            return result;
        } else {
            const insertQuery = this.queryConverter.toCypherInsert(data, insertCode);
            const result = await this.executeQuery(insertQuery, source);
            return result;
        }
    }

    // Create query, execute query, and format result
    async search(request, matchCode, returnCode) {
        const query = this.requestParser.getQuery(request);
        const range = this.requestParser.getRange(request, returnCode);
        const source = this.requestParser.getSource(request);
        const select = this.requestParser.getSelect(request);
        const cypherQuery = this.queryConverter.toCypher(query, range, select, matchCode, returnCode);
        const result = await this.executeQuery(cypherQuery, source);
        const formattedData = this.dataFormatter.formatData(result, range, select, matchCode, returnCode);
        return formattedData;
    }

    // Execute neo4j query
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

}

module.exports = Driver;