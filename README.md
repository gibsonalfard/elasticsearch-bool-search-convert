# elasticsearch-bool-search-convert
Middleware for convert JSON request query into:
1. Elasticsearch Boolean Search Query
2. Neo4j Boolean Search Query

This application build using [Node.js](https://nodejs.org/en/download/).

## Installation
You need node/npm installed in your machine. If you don't have node/npm you can download it from this [link](https://nodejs.org/en/download/).

You can install this application by running this command inside either elasticsearch or neo4j directory
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

## End-point API
There are some end-point you can access when using this middleware
End Point | Description
------------ | -------------
**[GET] /search** | This end-point return data from boolean search query.
**[GET] /search/sentiment** | This end-point return data and sentiment for each data returned.
**[GET] /search/sentiment/histogram** | Return series of record. represent aggregation of sentiment. Just like sentiment aggregation, you can add **interval** parameter to define interval of aggregation (**minute**/**hour**/**day**/**week**/**month**/**year**) 

### Query Format
There are some JSON format you have to understand before sending request to middleware
Keys | Status | Description
------------ | ------------- | -------------
**request** | **required** | Root element of JSON request you send
**request.select** | optional | Array which represent field you want to get from response output
**request.source** | **required** | Contain string represent name of source data (index or database)
**request.range** | optional | Array represent [start date, end date] in milliseconds format
**request.query** | optional | Array represent query you try to convert 
**request.query.field** | **required** | String represent field for query
**request.query.value** | **required** | String represent boolean search query (i.e google AND apple)
**request.query.andMerge** | optional | Boolean (True/False) represent if the query will merge under **AND** condition

### Query Example
```json
{
    "request":{
        "select": ["productId","productName", "price"],
        "source": "product-0001",
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

## Contributions
If you found any bugs in this version, you can send an issues to this repository. 
Feel free to fork, improve, and send pull request to this repository.