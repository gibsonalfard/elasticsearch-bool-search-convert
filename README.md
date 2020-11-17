# elasticsearch-bool-search-convert
Middleware for convert JSON request query into:
1. Elasticsearch Boolean Search Query
2. Neo4j Boolean Search Query

This application build using [Node.js](https://nodejs.org/en/download/).

## Installation
You need node/npm installed in your machine. If you don't have node/npm you can download it from this [link](https://nodejs.org/en/download/).

After that you can install this application by running this command in either elasticsearch or neo4j directory
```bash
npm install
```

## Usage
You can use this middleware by running this command in terminal / command prompt
```bash
node app.js
```
or using [forever](https://www.npmjs.com/package/forever) library

```bash
forever start app.js
```

### Query Format
There is some JSON format you have to understand before sending request to middleware
Keys | Status |Explanation
------------ | ------------- | -------------
**request** | **required** | Root element of JSON request you send
**request.source** | optional | Array which represent field you want to get from response output
**request.index** | **required** | Contain string represent name of your index
**request.range** | optional | Array represent [start date, end date] in milliseconds format
**request.query** | optional | Array represent query you try to convert 
**request.query.field** | **required** | String represent field for query
**request.query.value** | **required** | String represent boolean search query (i.e google AND apple)
**request.query.andMerge** | optional | Boolean (True/False) represent if the query will merge under **AND** condition

### Query Example
```json
{
    "request":{
        "source": ["productId","productName", "price"],
        "index": "product-0001",
        "range": ["1601909520150","1602262800000"],
        "query": [{
            "field": "category",
            "value": "electronic AND home" 
        },{
            "field": "tags",
            "value": "'best selling'" 
        }]
    }
}
```