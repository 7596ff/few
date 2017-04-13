const config = require("../config.json");
const postgres = require("pg");
const Twitter = require("twitter");
const Bignumber = require("bignumber.js");

var pg = new postgres.Client(config.pg);
var twitter = new Twitter(config.twitter);

async function getTweets(since, max) {
    return twitter.get("statuses/user_timeline", {
        "screen_name": config.screen_name,
        "since_id": since,
        "max_id": max,
        "exclude_replies": true,
        "include_rts": false,
        "count": 200
    });
}

async function getLastTweet() {
    return twitter.get("statuses/user_timeline", {
        "screen_name": config.screen_name,
        "count": 1,
        "exclude_replies": true,
        "include_rts": false
    });
}

async function update() {
    try {
        let max = await pg.query("SELECT MAX(id) FROM tweets;");
        let firstTweetID = max.rows[0].max;

        let lastTweet = await getLastTweet();
        let lastTweetID = lastTweet[0].id_str;
        
        while (new Bignumber(firstTweetID).lte(lastTweetID)) {
            let tweets = await getTweets(firstTweetID, lastTweetID);
            let promises = [];
            console.log(`got ${tweets.length} new tweets.`);

            tweets.forEach((tweet) => {
                let text = tweet.text.split(" ");
                promises.push(pg.query({
                    "text": "INSERT INTO tweets (id, word) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET id = $1, word = $2 WHERE tweets.id = $1;",
                    "values": [tweet.id_str, text[text.length - 1]]
                }));
            });

            let results = await Promise.all(promises);

            console.log(`added ${results.length} new tweets.`);

            lastTweetID = tweets[tweets.length - 1].id_str;
            if (tweets.length == 1) firstTweetID = lastTweetID; // meme break the loop
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

pg.connect((err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    update();
});

