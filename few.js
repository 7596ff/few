const config = require("./config.json");
const postgres = require("pg");
const fs = require("fs");
const CronJob = require("cron").CronJob;
const Twitter = require("twitter");

var pg = new postgres.Client(config.pg);
var twitter = new Twitter(config.twitter);
var words = fs.readFileSync("./words.txt", "utf8");
words = words.split("\n");

var job = new CronJob("*/30 * * * *", () => {
    pg.query("SELECT * FROM tweets ORDER BY id DESC LIMIT 1;").then((res) => {
        let word = words[words.indexOf(res.rows[0].word) + 1];
        if (!word) {
            console.log("out of words!");
            return;
        }

        client.post("statuses/update", {
            status: "fuck " + word
        }, (err, tweet, response) => {
            if (err) return console.error(err);

            pg.query({
                text: "INSERT INTO tweets (id, word) VALUES ($1, $2);",
                values: [tweet.id_str, word]
            });

            console.log(`inserted ${tweet.id_str}/${word}`);
        });
    });
}, null, true);

pg.connect((err) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
});
