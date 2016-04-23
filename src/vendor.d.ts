declare module "botkit" {
    let botkit: Botkit;
    export = botkit;
}

interface RedisStorage {
    namespace?: string;
    host?: string;
    port?: string;
    auth_pass?: string;
}

interface BotOptions {
    debug?: boolean;
    storage?: RedisStorage;
}

interface ControllerOptions {
    token: string;
}

interface Conversation {
    ask(question: string, answer: any[]): void;
}

interface API {
    reactions: {
        add(args: { timestamp: string; channel: Channel; name: string; },
            error: (err: any, res: any) => void): void;
    };
    channels: {
        list(args: {}, callback: (err: any, res: any) => void): void;
    }
    im: {
        open(args: {user: string}, callback: (err: any, res: any) => void): void;
    }
}

interface Bot {
    api: API;
    botkit: {log(message: string, error: any): void};
    say(args: {text: string; channel: string}): void;
    reply(message: Message, text: string): void;
    startConversation(message: Message, callback: (err: any, convo: Conversation) => void): void;
    utterances: {
        yes: any;
        no: any;
    };
    identity: {name: string;};
    startRTM(callback: (err: any, bot: Bot) => void): Bot;
}

interface Channel {
    id: string;
    name: string;
    is_member: boolean;
    members: string[];
}

interface Message {
    channel: Channel;
    ts: string;
    user: string;
    text: string;
}

interface Controller {
    on(channel: string, callback: (bot: Bot, message: Message) => void): void;
    spawn(options?: ControllerOptions): Bot;
    hears(words: string[], whereMentioned: string, callback: (bot: Bot, message: Message) => void): void;
    storage: any;
}

interface Botkit {
    slackbot(options?: BotOptions): Controller;
}