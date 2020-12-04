const { query } = require("express");
const addOn = require("./addOn");

/*
Method to handle with nested boolean conditional. Nested boolean usually
come in parentheses format to identify which condition should process first.
This method convert that nested conditional into Elasticsearch boolean search format.
*/
const nestedConvert = function(queryValue, queryField, reference, splitOpr){
    list = queryValue.split(splitOpr);
    parentOperant = [];

    for(item of list){
        if(item[0] == "$"){
            tmp = item.replace("$","");
            childValue = reference[(tmp-1)];
            childValue = childValue.replace("(","").replace(")","");
            
            let childQuery = simpleConverter(childValue, queryField);
            if(childQuery.error){
                return childQuery;
            }

            childQuery = {
                "bool": childQuery
            };
            parentOperant.push(childQuery);
        }else if(item){
            let childQuery = simpleConverter(item, queryField);
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

/*
This method handle conversion of simple boolean condition such as NOT, AND, and OR.
into Elasticsearch boolean search query format.
*/
const simpleConverter = (queryValue, queryField) => {
    let boolOperant = {
        "must": [JSON.parse(`{"term": {"${queryField}":"${queryValue}"}}`)]
    }

    regex = /NOT \w+/gi
    pattern = queryValue.match(regex);

    if(pattern){
        let operant = [];
        queryValue = queryValue.replace(/NOT \w+/gi, "");
        
        for (item of pattern){
            temp = item.replace("NOT ","");
            stringQuery = `{"term": {"${queryField}":"${temp}"}}`
            operant.push(JSON.parse(stringQuery));
        }

        boolOperant = {
            "must_not":  operant
        }

    }

    operator = queryValue.match(/( AND | OR )/gi);

    if(operator){
        if(!boolOperant["must_not"]){
            boolOperant = {};
        }
        if(operator.includes(" AND ") && operator.includes(" OR ")){
            return {"error": "Missing Parentheses in Query Value"}
        }
        
        list = queryValue.split(operator[0]);
        let operant = [];

        for(item of list){
            if(item != " " && item != ""){
                stringQuery = `{"term": {"${queryField}":"${item}"}}`;
                operant.push(JSON.parse(stringQuery));
            }
        }

        key = operator[0] == " AND " ? "must" : "should";
        if(!addOn.isEmpty(operant)){
            boolOperant[key] = operant;

            if(key == "should" && boolOperant["must_not"]){
                boolOperant.should.push({"bool": {"must_not": boolOperant["must_not"]}});
                boolOperant["must_not"] = undefined;
            }
        }
    }

    return boolOperant;
}

/*
This method handle nested not condition. i.e NOT (X OR B). This condition cannot be process using
simple converter because we have to do deMorgan's rule to process this condition into NOT X AND NOT B.
*/
const notConverter = (expr, queryField) =>{
    pattern = expr.match(/( AND | OR )/gi);

    if(pattern){
        if(pattern.includes(" OR ")){
            queryValue = deMorganLaw(expr);
            queryValue = queryValue.replace(/\(/g,"").replace(/\)/g,"");
            return simpleConverter(queryValue, queryField);
        }else{
            // return {"must":[{"has_child":{"type": "sentiment","query": {"bool":{}}}}]}
            queryValue = deMorganLaw(expr);
            queryValue = queryValue.replace(/\(/g,"").replace(/\)/g,"");
            let query = simpleConverter(queryValue, queryField);

            must_not = query.must_not;
            query.must_not = [{"bool":{"must": must_not}}];

            return query;
        }
    }

    return {}
}

const deMorganLaw = (expr) => {
    pattern = expr.match(/(AND|OR)/gi);

    let result = ""
    str = expr;

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

/*
This method handle complex condition, normally nested condition and transform that complex condition
into simpler condition, so simpleconverter and nestedconverter can convert that condition.
*/
const moreComplexConverter = (queryValue, queryField, pattern) => {
    let query;
    if(queryValue.includes("OR")){
        query = nestedConvert(queryValue, queryField, pattern, " OR ");

        query = {
            "should": query
        }
    }else if(queryValue.includes("AND")){
        query = nestedConvert(queryValue, queryField, pattern, " AND ");

        query = {
            "must": query
        }
    }else{
        tmp = queryValue.replace("$","");

        childValue = pattern[(tmp-1)];
        childValue = childValue.replace("(","").replace(")","");

        if(childValue.includes("$")){
            query = moreComplexConverter(childValue, queryField, pattern);
        }else{
            query = simpleConverter(childValue, queryField);
            if(query.error){
                return query;
            }
        }
    }

    return query;
}

/*
This method convert date range from dd/mm/yyyy format into milliseconds format
*/
exports.convertInputRange = (range) => {
    let dateRange = [];

    let dateArr = range.split(" - ");
    for(item in dateArr){
        let itemArr = dateArr[item].split("/");
        let date = new Date(itemArr[2], itemArr[1]-1, itemArr[0]);
        if(item == dateArr.length-1){
            date.setHours(23);
            date.setMinutes(59);
            date.setSeconds(59);
        }

        dateRange.push(date.getTime());
    }

    return dateRange;
}

/*
Main Method to do conversion
*/
exports.convertQuery = (queryValue, queryField) => {
    let result = {};
    try {
        strQueryValue = queryValue;
        regex = /(\([\$\w\s]+\))/gi
        pattern = queryValue.match(regex);
        let query = {}

        if(pattern){
            oldSize = 0;
            patternSize = pattern.length;

            while(patternSize > 0 && patternSize > oldSize){
                let i = 1;
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

            if(strQueryValue.match(/NOT\s?\(+/)){
                query = notConverter(strQueryValue, queryField)
            }else{
                query = moreComplexConverter(queryValue, queryField, pattern);
                
            }
        }else{
            query = simpleConverter(queryValue, queryField);
        }

        if(query.error){
            return query;
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

/*
This method merge 2 conditional query into 1 conditional query in AND conditional manner
*/
exports.andMerge = (query1, query2) => {
    if(query1.query.bool.must){
        query1.query.bool.must.push(query2.query);
    }else{
        query1.query.bool.must = [query2.query];
    }

    return query1;
}

/*
This method merge 2 conditional query into 1 conditional query in OR conditional manner
*/
exports.mergeQuery = (query1, query2) => {
    if(query2.query.bool.must){
        if(query1.query.bool.should){
            query1.query.bool.should.push({"bool":{"must":query2.query.bool.must}});
        }else{
            query1.query.bool.should = [{"bool":{"must":query2.query.bool.must}}];
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