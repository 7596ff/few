const config = require("../config.json");
const postgres = require("pg");

var pg = new postgres.Client(config.pg);

pg.connect((err) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    pg.query([
        "CREATE TABLE tweets (",
        "id bigint NOT NULL,",
        "word varchar(100) NOT NULL,",
        "PRIMARY KEY (id)",
        ");"
    ].join("\n")).then((res) => {
        console.log(res);
        process.exit(0);
    }).catch((err) => {
        console.log(err);
        process.exit(1);
    });
});
