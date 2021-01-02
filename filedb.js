var fs = require("fs");
var path = require("path");

var dbPath = path.join(__dirname, "db.json");

function update(x) {
    set(Object.assign(read(), x));
}

function read() {
    if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, "utf8"));
    } else {
        return {}
    }
}

function set(x) {
    fs.writeFileSync(dbPath, JSON.stringify(x), "utf8");
}

module.exports = {
    update, read, set
};