const driver = require("./config"); 

exports.searchData = async (query, params) => {
    const session = driver.session();
    
    try {
        const result = await session.run(query);

        // const singleRecord = result.records[0]
        // const node = singleRecord.get(0)

        length = result.records.length;
        // console.log(result.records);
        // console.log(`length: ${length}`);

        // Print news id
        for(i = 0; i < length; i++){
            console.log(result.records[i].get(0).properties.id)
        }
    } finally {
        await session.close();
    }
    
    // on application exit:
    await driver.close();
}