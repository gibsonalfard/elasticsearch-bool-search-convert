const { Client } = require('@elastic/elasticsearch')
const esClient = new Client({ node: 'http://203.210.84.102:9210' })

module.exports = esClient;