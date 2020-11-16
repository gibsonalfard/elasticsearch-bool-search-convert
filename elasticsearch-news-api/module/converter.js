const { query } = require("express");
const addOn = require("./addOn");

const nestedConvert = function(queryValue, queryField, reference, splitOpr){
    list = queryValue.split(splitOpr);
    parentOperant = [];

    for(item of list){
        if(item[0] == "$"){
            tmp = item.replace("$","");
            childValue = reference[(tmp-1)];
            childValue = childValue.replace("(","").replace(")","");
            
            var childQuery = simpleConverter(childValue, queryField);
            if(childQuery.error){
                return childQuery;
            }

            childQuery = {
                "bool": childQuery
            };
            parentOperant.push(childQuery);
        }else if(item){
            var childQuery = simpleConverter(item, queryField);
            if(childQuery.error){
                return childQuery;
            }
            parentOperant.push({
                "bool": childQuery
            });
        }else{
            stringQuery = `{"term": {"${queryField}":"${item}"}}`;
            parentOperant.push(JSON.parse(stringQuery));         
        }
    }

    return parentOperant;
}

const simpleConverter = (queryValue, queryField) => {
    var boolOperant = {
        "must": [JSON.parse(`{"term": {"${queryField}":"${queryValue}"}}`)]
    }

    regex = /NOT \w+/gi
    pattern = queryValue.match(regex);

    if(pattern){
        var operant = [];
        queryValue = queryValue.replace(/NOT \w+/gi, "");
        
        for (item of pattern){
            temp = item.replace("NOT ","");
            stringQuery = `{"term": {"${queryField}":"${temp}"}}`
            operant.push(JSON.parse(stringQuery));
        }

        boolOperant = {
            "must_not":  operant,
            "must":[{
                "has_child":{
                    "type": "sentiment",
                    "query": {
                        "bool":{}
                    }
                }
            }]
        }

    }

    operator = queryValue.match(/( AND | OR )/gi);

    if(operator){
        if(!boolOperant.must_not){
            boolOperant.must = undefined;
        }

        if(operator.includes(" AND ") && operator.includes(" OR ")){
            return {"error": "Missing Parentheses"}
        }

        list = queryValue.split(operator[0]);
        var operant = [];

        for(item of list){
            if(item != " " && item != ""){
                stringQuery = `{"term": {"${queryField}":"${item}"}}`;
                operant.push(JSON.parse(stringQuery));
            }
        }

        key = operator == " AND " ? "must" : "should";
        if(!addOn.isEmpty(operant)){
            if(key == "must" && boolOperant["must_not"]){
                boolOperant[key].push(operant);
            }else{
                boolOperant[key] = operant;
            }
        }
    }

    return boolOperant;
}

const notConverter = (expr, queryField) =>{
    pattern = expr.match(/( AND | OR )/gi);

    if(pattern){
        if(pattern.includes(" OR ")){
            queryValue = deMorganLaw(expr);
            queryValue = queryValue.replace(/\(/g,"").replace(/\)/g,"");
            return simpleConverter(queryValue, queryField);
        }
    }

    return {}
}

const deMorganLaw = (expr) => {
    pattern = expr.match(/(AND|OR)/gi);

    let result = ""
    str = expr;

    console.log(str);

    if(pattern){
        for(item of pattern){
            str = str.replace(item, "^");
        }

        // Remove parentheses
        childValue = str.replace("(","").replace(")","");
        // Remove NOT condition
        childValue = childValue.replace("NOT ","");

        // Split string by ^ symbol
        childList = childValue.split(" ^ ");

        let i = 0;
        for(item of childList){
            raw = "(NOT ".concat(item).concat(")");
            result = result.concat(raw).concat(" ");
            if(pattern[i]){
                negate = pattern[i] == "AND" ? "OR" : "AND";
                result = result.concat(negate).concat(" ");
            }
            i += 1;
        }
    }else{
        // Remove parentheses
        result = str.replace("(","").replace(")","");
    }

    return result;
}

const moreComplexConverter = (queryValue, queryField, pattern) => {
    if(queryValue.includes("OR")){
        var query = nestedConvert(queryValue, queryField, pattern, " OR ");

        query = {
            "should": query
        }
    }else if(queryValue.includes("AND")){
        var query = nestedConvert(queryValue, queryField, pattern, " AND ");

        query = {
            "must": query
        }
    }else{
        tmp = queryValue.replace("$","");

        childValue = pattern[(tmp-1)];
        childValue = childValue.replace("(","").replace(")","");

        if(childValue.includes("$")){
            var query = moreComplexConverter(childValue, queryField, pattern);
        }else{
            var query = simpleConverter(childValue, queryField);
        }
    }

    return query;
}

const convertAggregation = (aggs, index = 0) => {
    var aggrQuery = {}
    try {
        item = aggs[index]

        if(item.field.includes(">")){
            value = item.field.split(">");
            temp = `{"${item.name}": {"${value[0]}": {"type":"${value[1]}"}}}`;
        }else{
            temp = `{"${item.name}": {"terms": {"field": "${item.field}"}}}`;
        }

        aggrQuery = JSON.parse(temp);

        if(index+1 < aggs.length){
            aggrQuery[item.name].aggs = convertAggregation(aggs, index+1);
        }
    } catch (error) {
        console.log(error.message);
    }

    return aggrQuery;
}

exports.rangeConvert = (rangeArr) => {
    var from = rangeArr[0];
    var to = rangeArr[1];
    var d = new Date();
    var currentMs = d.getTime();
    
    if(from == "now"){
        to = from = currentMs;
    }else if(to == "now"){
        to = currentMs;
    }
    
    var range = {
        "from": from,
        "to": to
    };
    
    return range;
}

exports.convertQuery = (queryValue, queryField) => {
    var result = {};
    try {
        strQueryValue = queryValue;
        regex = /(\([\$\w\s]+\))/gi
        pattern = queryValue.match(regex);
        var query = {}

        if(pattern){
            oldSize = 0;
            patternSize = pattern.length;

            while(patternSize > 0 && patternSize > oldSize){
                var i = 1;
                for (item of pattern){
                    queryValue = queryValue.replace(item, `$${i}`);
                    i+= 1;
                }

                temp = queryValue.match(regex);
                if(temp){
                    pattern = pattern.concat(temp);
                }

                oldSize = patternSize;
                patternSize = pattern.length;
            }

            if(queryValue.match(/NOT\s?\(+/)){
                query = notConverter(strQueryValue, queryField)
            }else{
                query = moreComplexConverter(queryValue, queryField, pattern);
            }
        }else{
            query = simpleConverter(queryValue, queryField);

            if(query.error){
                return query;
            }
        }

        result = {
            "query":{
                "bool": query
            }
        }
        
    } catch (error) {
        console.log(error.message);
    }

    return result;
}

exports.andMerge = (query1, query2) => {
    if(query1.query.bool.must){
        query1.query.bool.must.push(query2.query);
    }else{
        query1.query.bool.must = [query2.query];
    }

    return query1;
}

exports.mergeQuery = (query1, query2) => {
    if(query2.query.bool.must){
        for(item of query2.query.bool.must){
            if(query1.query.bool.must){
                query1.query.bool.must.push(item);
            }else{
                query1.query.bool.must = [item];
            }
        }
    }

    if(query2.query.bool.should){
        for(item of query2.query.bool.should){
            if(query1.query.bool.should){
                query1.query.bool.should.push(item);
            }else{
                query1.query.bool.should = [item];
            }
        }
    }

    if(query2.query.bool["must_not"]){
        for(item of query2.query.bool["must_not"]){
            if(query1.query.bool["must_not"]){
                query1.query.bool["must_not"].push(item);
            }else{
                query1.query.bool["must_not"] = [item];
            }
        }
    }

    return query1;
}