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

interface Bot {
    api: {
        reactions: {
            add(
                options:{timestamp: string; channel: string; name: string;}, 
                error: (err: any, res: any) => void): void;
        }
    };
    botkit: {log(message: string, error: any): void};
    reply(message: Message, text: string): void;
    startConversation(message: Message, callback: (err: any, convo: Conversation) => void): void;
    utterances: {
        yes: any;
        no: any;
    };
    identity: {name: string;};
}

interface Message {
    channel: string;
    ts: string;
    user: string;
    text: string;
}

interface Controller {
    spawn(options?: ControllerOptions);
    hears(words: string[], whereMentioned: string, callback: (bot: Bot, message: Message) => void): void;
    storage: any;
}

interface Botkit {
    slackbot(options?: BotOptions): Controller;
}