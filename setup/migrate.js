const fs = require("fs");

const config = require("../config.json");
const postgres = require("pg");

var pg = new postgres.Client(config.pg);

pg.connect((err) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    fs.readFile("./tweets.csv", "utf8", (err, data) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        let lines = data.split("\n");
        let promises = [];
        lines.forEach((line) => {
            line = line.split(",");

            if (!line[5]) return;

            let id = line[0].replace(/"/g, "");
            let tweet = line[5].replace(/"/g, "").split(" ")[1];

            if (isNaN(id) || id == undefined || tweet == undefined) {
                console.log(line);
                return;
            }

            if (tweet == "null") {
                console.log(line);
                return;
            }

            promises.push(pg.query({
                "text": "INSERT INTO tweets (id, word) VALUES ($1, $2);",
                "values": [id, tweet]
            }));
        });

        Promise.all(promises).then((res) => {
            console.log(`added ${res.length} tweets.`);
            process.exit(0);
        }).catch((err) => {
            console.log(err);
            process.exit(1);
        });
    });
});
