const orConvert = function(queryValue, queryField, reference){
    list = queryValue.split(" OR ");
    parentOperant = [];

    for(item of list){
        if(item[0] == "$"){
            tmp = item.replace("$","");
            childValue = reference[(tmp-1)];
            childValue = childValue.replace("(","").replace(")","");

            var childQuery = this.simpleConverter(childValue, queryField);
            childQuery = childQuery.query;
            parentOperant.push(childQuery);
        }else{
            stringQuery = `{"term": {"${queryField}":"${item}"}}`
            parentOperant.push(JSON.stringify(stringQuery));         
        }
    }

    return parentOperant;
}

simpleConverter = (queryValue, queryField) => {
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

    // Add query field
    var query = {
        "query":{
            "bool": boolOperant
        }
    }
    
    return query;
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
            var query = orConvert(queryValue, queryField, pattern);

            query = {
                "should": query
            }
        }else{
            tmp = queryValue.replace("$","");

            childValue = pattern[(tmp-1)];
            childValue = childValue.replace("(","").replace(")","");

            var query = this.simpleConverter(childValue, queryField);
        }
    }else{
        var query = this.simpleConverter(queryValue, queryField);
    }

    result = {
        "query":{
            "bool": query
        }
    }

    return result;
}