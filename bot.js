// 'C0VPK9BGA' = "rapport", 'C0XJG50EN' = "bot_test"

if (!process.env.token && !process.env.channel && !process.env.REDIS_URL) {
    console.log('Error: Specify token, channel and REDIS_URL in environment');
    process.exit(1);
}

var moment = require('moment');
if (moment().isoWeekday() > 5) {
    console.log('It`s weekend for gods sake!');
    // process.exit();
}

var Botkit = require('botkit');
var redis = require('./redis_storage');
var url = require('url');
var os = require('os');

var redisURL = url.parse(process.env.REDIS_URL);
var redisStorage = redis({
    namespace: 'botkit-example',
    host: redisURL.hostname,
    port: redisURL.port,
    auth_pass: redisURL.auth.split(":")[1]
});

var controller = Botkit.slackbot({
    debug: true,
    storage: redisStorage,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM(function(err, bot) {
    if (err) {
        throw new Error(err);
    }

    bot.say({
        text: 'Hey! Woran habt ihr heute gearbeitet? \nEris [1]. \nAn was anderem (keine Antwort nötig).',
        channel: process.env.channel
    });

    // Heroku stops the worker after 18h anyway    
    setTimeout(function() {
        process.exit();
    }, 1000 * 60 * 60 * 4); // 4h

});

controller.hears(['1', 'eris'], 'ambient', function(bot, message) {
    if (message.channel == process.env.channel) {
        
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
                    name: 'thumbsup',
                }, function(err, res) {
                    if (err) {
                        bot.botkit.log('Failed to add emoji reaction :(', err);
                    }
                });
                
            });
        });
    }
})

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello. You posted in channel ' + message.channel + ' and your name is ' + message.user + '.');
        }
    });
});

controller.hears(['call me (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var matches = message.text.match(/call me (.*)/i);
    var name = matches[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.reply(message, 'I don\'t know yet!');
        }
    });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function(response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
            }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'], 'direct_message,direct_mention,mention', function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message, ':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');

});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}

