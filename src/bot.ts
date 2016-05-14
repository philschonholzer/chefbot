if (!process.env.token || !process.env.channel || !process.env.REDIS_URL) {
    console.log("Error: Specify token, channel and REDIS_URL in environment");
    process.exit(1);
}

import * as moment from "moment";
if (moment().isoWeekday() > 5) {
    console.log("It`s weekend for gods sake!");
    process.exit();
}

import * as Botkit from "botkit";

import Redis from "./redis_storage";
import * as url from "url";
import * as os from "os";
import * as schedule from "node-schedule";

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

    getUsers(bot);

    // bot.say({
    //     text: "Hey! Woran habt ihr heute gearbeitet? \nEris [1]. \nFür was anderes ist keine Antwort nötig.",
    //     channel: process.env.channel
    // });

    schedule.scheduleJob("0 0 14 * * 1-5", () => {
        bot.api.im.open({ user: "U02615Q0J" }, (err, res) => {
            bot.say({
                text: `Guten Morgen!`,
                channel: res.channel.id
            });
        });
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

/**
 * Task
 */
class Task {
    private _id: string;
    constructor(private user: string, private project: string, private text: string) {
        this._id = moment().toISOString();
    }

    get id(): string {
        return this._id;
    }

}

class User {
    private _channels: Channel[] = [];

    constructor(private id: string) { }

    addChannel(channel: Channel) {
        this._channels.push(channel);
    }

    get channels(): Channel[] {
        return this._channels;
    }

    get identification(): string {
        return this.id;
    }
}

function getUsers(bot: Bot) {
    bot.api.channels.list({ exclude_archived: 1 }, (err, res) => {
        let users: User[] = [];
        for (let channel of <Channel[]>res.channels) {
            if (channel.is_member) {
                bot.botkit.log(`Members of ${channel.name} are ${channel.members}`, err);
                channel.members.forEach((member, index, array) => {
                    let currentUser = users.find((user, index, obj) => user.identification === member);
                    if (!currentUser) {
                        currentUser = new User(member);
                        users.push(currentUser);
                    }
                    currentUser.addChannel(channel);
                });
            }
        }
        bot.botkit.log(`Users ${users}`, err);

        let philip = users.find((user, index, obj) => user.identification === "U02615Q0J");

        let channels = philip.channels.map<string>((channel, index, array) => `#${channel.name}`).join(", ");

        bot.api.im.open({ user: "U02615Q0J" }, (err, res) => {
            bot.say({
                text: `An was hast du heute gearbeitet? \n ${channels}`,
                channel: res.channel.id
            });
        });
    });
};

controller.hears(["#"], "direct_message", (bot, message) => {
    bot.startConversation(message, (err, convo) => {
        let projects = [], re = /<#([^\\.\s]+)>/g, project;
        while (project = re.exec(message.text)) {
            projects.push(project[0]);
            controller.storage.tasks.save(new Task(message.user, project[1], message.text), (err, id) => { });
        }
        convo.say(`Toll! Halben Tag an ${projects.join(" und ")} gearbeitet. :thumbsup:`);
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

controller.hears(["1", "eris"], "ambient", function (bot, message) {
    if (message.channel === process.env.channel) {

        controller.storage.projects.get("eris", (err, project) => {
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
