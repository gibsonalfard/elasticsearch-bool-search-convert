
class Logger {
    constructor(params) {
        this.params = params;
    }

    logAccess(endpoint, body, ip) {
        var date = new Date();
        // Change Timezone to Asia/Jakarta (+7)
        date.setHours(date.getHours() + 7);
        var dateStr = date.toISOString();
    
        console.log(dateStr,"IP-ADDRESS:",ip);
        console.log(dateStr,"ENDPOINT",endpoint);
        console.log(dateStr,"REQUEST-BODY",JSON.stringify(body));
        console.log("");
    }
}

module.exports = Logger;