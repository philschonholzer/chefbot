"use strict";
if (!process.env.token || !process.env.channel || !process.env.REDIS_URL) {
    console.log("Error: Specify token, channel and REDIS_URL in environment");
    process.exit(1);
}
// import * as moment from "moment";
// if (moment().isoWeekday() > 5) {
//     console.log("It`s weekend for gods sake!");
//     process.exit();
// }
const Botkit = require("botkit");
let redis = require("./redis_storage");
const url = require("url");
const os = require("os");
const schedule = require("node-schedule");
let redisURL = url.parse(process.env.REDIS_URL);
let redisStorage = redis({
    namespace: "botkit-example",
    host: redisURL.hostname,
    port: redisURL.port,
    auth_pass: redisURL.auth.split(":")[1]
});
let controller = Botkit.slackbot({
    debug: true,
    storage: redisStorage,
});
let bot = controller.spawn({
    token: process.env.token
}).startRTM(function (err, bot) {
    if (err) {
        throw new Error(err);
    }
    getUsers(bot);
    // bot.say({
    //     text: "Hey! Woran habt ihr heute gearbeitet? \nEris [1]. \nFür was anderes ist keine Antwort nötig.",
    //     channel: process.env.channel
    // });
    // Heroku stops the worker after 18h anyway    
    // setTimeout(function() {
    //     process.exit();
    // }, 1000 * 60 * 60 * 4); // 4h
    schedule.scheduleJob("0 0 14 * * 1-5", () => {
        getUsers(bot);
    });
});
function getUsers(bot) {
    bot.api.channels.list({ exclude_archived: 1 }, (err, res) => {
        let users = {};
        for (let channel of res.channels) {
            if (channel.is_member) {
                bot.botkit.log(`Members of ${channel.name} are ${channel.members}`, err);
                for (let user of channel.members) {
                    if (!users[user]) {
                        users[user] = [];
                    }
                    users[user].push(channel);
                }
            }
        }
        bot.botkit.log(`Users ${users}`, err);
        let channels = "";
        for (let channel of users["U02615Q0J"]) {
            channels = channels + channel.name;
        }
        bot.api.im.open({ user: "U02615Q0J" }, (err, res) => {
            bot.say({
                text: `An was arbeitest du? \n ${channels}`,
                channel: res.channel.id
            });
        });
    });
}
;
controller.on("channel_joined", (bot, message) => {
    bot.say({
        text: "Cool! Ich werde von nun an fragen, ob du am Projekt " + message.channel.name + " arbeitest.",
        channel: message.channel.id
    });
});
controller.hears(["1", "eris"], "ambient", function (bot, message) {
    if (message.channel === process.env.channel) {
        controller.storage.projects.get("eris", function (err, project) {
            if (!project) {
                project = {
                    id: "eris",
                    days: 0,
                };
            }
            project.days++;
            controller.storage.projects.save(project, function (err, id) {
                bot.api.reactions.add({
                    timestamp: message.ts,
                    channel: message.channel,
                    name: "thumbsup",
                }, function (err, res) {
                    if (err) {
                        bot.botkit.log("Failed to add emoji reaction :(", err);
                    }
                });
            });
        });
    }
});
controller.hears(["übersicht", "total", "projekt", "tage", "arbeit"], "direct_message,direct_mention,mention", function (bot, message) {
    controller.storage.projects.get("eris", function (err, project) {
        if (project) {
            bot.reply(message, "Bisher wurde " + project.days + " Tage an Eris gearbeitet.");
        }
        else {
            bot.reply(message, "Ich habe noch keine Projektdaten...");
        }
    });
});
controller.hears(["hello", "hi"], "direct_message,direct_mention,mention", function (bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: "robot_face",
    }, function (err, res) {
        if (err) {
            bot.botkit.log("Failed to add emoji reaction :(", err);
        }
    });
    controller.storage.users.get(message.user, function (err, user) {
        if (user && user.name) {
            bot.reply(message, "Hello " + user.name + "!!");
        }
        else {
            bot.reply(message, "Hello. You posted in channel " + message.channel + " and your name is " + message.user + ".");
        }
    });
});
controller.hears(["call me (.*)"], "direct_message,direct_mention,mention", function (bot, message) {
    let matches = message.text.match(/call me (.*)/i);
    let name = matches[1];
    controller.storage.users.get(message.user, function (err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function (err, id) {
            bot.reply(message, "Got it. I will call you " + user.name + " from now on.");
        });
    });
});
controller.hears(["what is my name", "who am i"], "direct_message,direct_mention,mention", function (bot, message) {
    controller.storage.users.get(message.user, function (err, user) {
        if (user && user.name) {
            bot.reply(message, "Your name is " + user.name);
        }
        else {
            bot.reply(message, "I don\"t know yet!");
        }
    });
});
controller.hears(["shutdown"], "direct_message,direct_mention,mention", function (bot, message) {
    bot.startConversation(message, function (err, convo) {
        convo.ask("Are you sure you want me to shutdown?", [
            {
                pattern: bot.utterances.yes,
                callback: function (response, convo) {
                    convo.say("Bye!");
                    convo.next();
                    setTimeout(function () {
                        process.exit();
                    }, 3000);
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function (response, convo) {
                    convo.say("*Phew!*");
                    convo.next();
                }
            }
        ]);
    });
});
controller.hears(["uptime", "identify yourself", "who are you", "what is your name"], "direct_message,direct_mention,mention", function (bot, message) {
    let hostname = os.hostname();
    let uptime = formatUptime(process.uptime());
    bot.reply(message, ":robot_face: I am a bot named <@" + bot.identity.name + ">. I have been running for " + uptime + " on " + hostname + ".");
});
function formatUptime(uptime) {
    let unit = "second";
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = "minute";
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = "hour";
    }
    if (uptime !== 1) {
        unit = unit + "s";
    }
    uptime = uptime + " " + unit;
    return uptime;
}
//# sourceMappingURL=bot.js.map