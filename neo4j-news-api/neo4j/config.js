
var neo4j = require('neo4j-driver')

const NEO_USERNAME = "neo4j";
const NEO_PASSWORD = "neo4jnew";
const NEO_URL = "neo4j://localhost";

const neo4jDriver = neo4j.driver(
                            NEO_URL, 
                            neo4j.auth.basic(NEO_USERNAME, NEO_PASSWORD),
                            //return integer instead of object (when query integer data from neo4j)
                            { disableLosslessIntegers: true }
                        );

module.exports = neo4jDriver;