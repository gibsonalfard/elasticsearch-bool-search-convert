
var neo4j = require('neo4j-driver')

const NEO_USERNAME = "neo4j";
const NEO_PASSWORD = "neo4jnew";
const NEO_URL = "neo4j://localhost";

const neo4jDriver = neo4j.driver(
                            NEO_URL, 
                            neo4j.auth.basic(NEO_USERNAME, NEO_PASSWORD),
                            { disableLosslessIntegers: true } //return integer instead of object
                        );

module.exports = neo4jDriver;