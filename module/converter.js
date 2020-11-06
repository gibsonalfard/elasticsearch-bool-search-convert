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
    
    return boolOperant;
}

exports.moreComplexConverter = (queryValue, queryField) => {
    regex = /(\([\w\s]+\))/gi
    pattern = queryValue.match(regex);

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

    console.log(JSON.stringify(result));

    return result;
}