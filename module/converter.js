const { query } = require("express");

const nestedConvert = function(queryValue, queryField, reference, splitOpr){
    list = queryValue.split(splitOpr);
    parentOperant = [];

    for(item of list){
        if(item[0] == "$"){
            tmp = item.replace("$","");
            childValue = reference[(tmp-1)];
            childValue = childValue.replace("(","").replace(")","");

            var childQuery = simpleConverter(childValue, queryField);
            childQuery = {
                "bool": childQuery
            };
            parentOperant.push(childQuery);
        }else{
            stringQuery = `{"term": {"${queryField}":"${item}"}}`
            parentOperant.push(JSON.parse(stringQuery));         
        }
    }

    return parentOperant;
}

const simpleConverter = (queryValue, queryField) => {
    boolOperant = {
        "must": JSON.parse(`{"term": {"${queryField}":"${queryValue}"}}`)
    }

    regex = /NOT \w+/gi
    pattern = queryValue.match(regex);

    if(pattern){
        operant = [];
        
        for (item of pattern){
            // queryValue = queryValue.replace(item, `$${i}`);
            // i+= 1;
            temp = item.replace("NOT ","");
            stringQuery = `{"term": {"${queryField}":"${temp}"}}`
            operant.push(JSON.parse(stringQuery));
        }

        boolOperant = {
            "must_not":  operant
        }
        
    }else{
        if(queryValue.includes("AND")){
            list = queryValue.split(" AND ");
            operant = [];
    
            for(item of list){
                stringQuery = `{"term": {"${queryField}":"${item}"}}`
                operant.push(JSON.parse(stringQuery));
            }
    
            boolOperant = {
                "must": operant
            }
        }
    
        if(queryValue.includes("OR")){
            list = queryValue.split(" OR ");
            operant = [];
    
            for(item of list){
                stringQuery = `{"term": {"${queryField}":"${item}"}}`
                operant.push(JSON.parse(stringQuery));
            }
    
            boolOperant = {
                "should": operant
            }
        }
    }

    return boolOperant;
}

const notConverter = (expr, queryField) =>{
    pattern = expr.match(/( AND | OR )/gi);

    if(pattern){
        if(pattern == " OR "){
            queryValue = deMorganLaw(expr);
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
                result = result.concat(pattern[i]).concat(" ");
            }
            i += 1;
        }
    }else{
        // Remove parentheses
        result = str.replace("(","").replace(")","");
    }

    return result;
}

exports.moreComplexConverter = (queryValue, queryField, pattern) => {
    strQueryValue = queryValue;

    var i = 1;
    if(pattern){
        for (item of pattern){
            queryValue = queryValue.replace(item, `$${i}`);
            i+= 1;
        }

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
        }else if(queryValue.includes("NOT")){
            var query = notConverter(strQueryValue, queryField)
        }else{
            tmp = queryValue.replace("$","");

            childValue = pattern[(tmp-1)];
            childValue = childValue.replace("(","").replace(")","");

            var query = simpleConverter(childValue, queryField);
        }
    }else{
        var query = simpleConverter(queryValue, queryField);
    }

    result = {
        "query":{
            "bool": query
        }
    }

    return result;
}

const convertQueury = (queryValue, queryField) => {
    regex = /(\([\w\s]+\))/gi
    pattern = queryValue.match(regex);
}