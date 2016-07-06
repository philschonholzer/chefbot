if (!process.env.token || !process.env.admin || !process.env.REDIS_URL) {
    console.log("Error: Specify token, admin (user-id) and REDIS_URL in environment");
    process.exit(1);
}

import * as Botkit from "botkit";

import Redis from "./redis_storage";
import {User, Task} from "./types";
import { makeTasks, getUsersFromChannels } from "./helper";

import * as url from "url";
import * as os from "os";
import * as moment from "moment";
import * as schedule from "node-schedule";
import * as Promise from "bluebird";

let redisURL = url.parse(process.env.REDIS_URL);
let auth = redisURL.auth || ":";
let redisStorage = new Redis({
    host: redisURL.hostname,
    port: Number(redisURL.port),
    password: auth.split(":")[1]
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
        bot.api.im.open({ user: process.env.admin }, (err, res) => {
            bot.say({
                text: `Hallo!`,
                channel: res.channel.id
            });
        });
    }

    schedule.scheduleJob("0 0 14 * * 1-5", () => {
        askForTasks();
    });
});

Promise.promisifyAll(bot.api.channels);
Promise.promisifyAll(bot.api.im);
Promise.promisifyAll(bot.api.users);

function askForTasks() {
    getChannels()
        .then(getUsersFromChannels)
        .then(filterBotUsers)
        .then(askAllUsers);
}

function askAllUsers(users: User[]) {
    users.forEach(user => {
            let channels = user.channels.map<string>(channel => `<#${channel.id}>`).join(", ");
            let channelId = bot.api.im.openAsync({ user: user.identification }).then(result => result.channel.id);

            Promise.join(channels, channelId, (channels, channelId) => {
                bot.say({
                    text: `An was hast du heute gearbeitet? \n${channels}`,
                    channel: channelId
                });
            });
        });
}

function filterBotUsers(users: User[]) {
    return bot.api.users.listAsync({})
        .then(res => res.members.filter(member => member.is_bot))
        .then(bots => users.filter(user => !bots.some(bot => bot.id === user.identification)));
}

function getChannels() {
    return bot.api.channels.listAsync({ exclude_archived: 1 }).then((res) => { return res.channels; });
}

controller.hears(["#"], "direct_message", (bot, message) => {
    bot.startConversation(message, (err, convo) => {
        let tasks = makeTasks(message.text, message.user);
        tasks.forEach(task => {
            controller.storage.tasks.save(task, (err, id) => { });
            controller.storage.tasks.add(task.project, task.id);
            controller.storage.tasks.increment(task.project, task.duration.asMilliseconds());
        });
        if (tasks.length > 0) {
            let channels = tasks.map(task => task.projectMarkup);
            let duration = tasks.reduce<moment.Duration>((duration, task) => duration.add(task.duration), moment.duration());
            convo.say(`Toll! ${duration.asHours()}h an ${channels.join(" und ")} gearbeitet. :thumbsup:`);
            convo.next();
        } else {
            convo.say("Genial! ... Damit ich mir dies merken kann, muss du ein Slack-Channel erwähnen, wie beispielsweise '#dashboard-notaufnahme'.");
            convo.next();
        }
    });
});

controller.on("channel_joined", (bot, message) => {
    bot.say({
        text: "Cool! Ich werde von nun an fragen, ob du am Projekt " + message.channel.name + " arbeitest.",
        channel: message.channel.id
    });
});

controller.hears(["übersicht", "total", "projekt", "tage", "arbeit"], "direct_message,direct_mention,mention", function (bot, message) {
    getChannels().then((channels) => channels.filter((channel) => channel.is_member).forEach((channel) => {
        controller.storage.tasks.duration(channel.id).then(duration => {
            let days = (moment.duration(Number(duration)).asHours() / 8).toFixed(2);
            bot.reply(message, `Bisher wurde ${days} Tage an <#${channel.id}> gearbeitet.`);
        });
    }));
});

/* Original reactions */

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
