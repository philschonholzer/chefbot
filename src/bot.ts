if (!process.env.token || !process.env.channel || !process.env.REDIS_URL) {
    console.log("Error: Specify token, channel and REDIS_URL in environment");
    process.exit(1);
}

import * as moment from "moment";
if (moment().isoWeekday() > 5 && process.env.NODE_ENV !== "development") {
    console.log("It`s weekend for gods sake!");
    process.exit();
}

import * as Botkit from "botkit";

import Redis from "./redis_storage";
import {User, Task} from "./types";
import { getHashes, getHashesOld, getUsersFromChannels } from "./helper";

import * as url from "url";
import * as os from "os";
import * as schedule from "node-schedule";
import * as Promise from "bluebird";

let redisURL = url.parse(process.env.REDIS_URL);
let redisStorage = new Redis({
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

    if (process.env.NODE_ENV === "development") {
        askForTasks();
    } else {
        bot.api.im.open({ user: "U02615Q0J" }, (err, res) => {
            bot.say({
                text: `Guten Morgen!`,
                channel: res.channel.id
            });
        });
    }

    schedule.scheduleJob("0 0 14 * * 1-5", () => {
        askForTasks();
    });

    schedule.scheduleJob("0 0 21 * * 1-5", () => {
        bot.api.im.open({ user: "U02615Q0J" }, (err, res) => {
            bot.say({
                text: `Gut Nacht!`,
                channel: res.channel.id
            });
        });
        setTimeout(function () {
            process.exit();
        }, 3000);
    });
});

Promise.promisifyAll(bot.api);

function askForTasks() {
    let channels = getUsers()
        .then((users) => users.find((user, index, obj) => user.identification === "U02615Q0J"))
        .then((user) => user.channels.map<string>((channel, index, array) => `<#${channel.id}>`).join(", "));

    let channelId = bot.api.im.openAsync({ user: "U02615Q0J" }).then(result => result.channel.id);

    Promise.join(channels, channelId, (channels, channelId) => {
        bot.say({
            text: `An was hast du heute gearbeitet? \n ${channels}`,
            channel: channelId
        });
    });
}

function getChannels() {
    return bot.api.channels.listAsync({ exclude_archived: 1 }).then((res) => { return res.channels; });
}

function getUsers() {
    return getChannels().then(getUsersFromChannels);
};

controller.hears(["#"], "direct_message", (bot, message) => {
    bot.startConversation(message, (err, convo) => {
        getHashes(message.text).forEach(v => {
            let task = new Task(message.user, v.value, message.text);
            controller.storage.tasks.save(task, (err, id) => { });
            controller.storage.tasks.add(v.value, task.id);
        });
        let channels = getHashesOld(message.text, (hash) => {
            let task = new Task(message.user, hash, message.text);
            controller.storage.tasks.save(task, (err, id) => { });
            controller.storage.tasks.add(hash, task.id);
        });
        convo.say(`Toll! Halben Tag an ${channels.join(" und ")} gearbeitet. :thumbsup:`);
        convo.next();
    });
});

// controller.on("direct_message", (bot, message) => {
//     if (message.text.includes("#")) {
//         bot.startConversation(message, (err, convo) => {
//             convo.say("Sehr schön!");
//             convo.next();
//         });
//     }
// });

controller.on("channel_joined", (bot, message) => {
    bot.say({
        text: "Cool! Ich werde von nun an fragen, ob du am Projekt " + message.channel.name + " arbeitest.",
        channel: message.channel.id
    });
});

controller.hears(["übersicht", "total", "projekt", "tage", "arbeit"], "direct_message,direct_mention,mention", function (bot, message) {
    getChannels().then((channels) => channels.filter((channel) => channel.is_member).forEach((channel) => {
        controller.storage.tasks.members(channel.id).then((value) => {
            bot.reply(message, `Bisher wurde ${value.length / 2} Tage an <#${channel.id}> gearbeitet.`);
        });
    }));
    controller.storage.tasks.all((err, tasks: Task[]) => {
        if (tasks) {
            bot.reply(message, `Bisher wurde ${tasks.length / 2} Tage gearbeitet.`);
        }
    }, {});
    controller.storage.projects.get("eris", function (err, project) {
        if (project) {
            bot.reply(message, "Bisher wurde " + project.days + " Tage an Eris gearbeitet.");
        } else {
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
        } else {
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
        } else {
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
