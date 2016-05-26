declare module "botkit" {
    let botkit: Botkit;
    export = botkit;
}

interface BotOptions {
    debug?: boolean;
    storage?: any;
}

interface ControllerOptions {
    token: string;
}

interface Conversation {
    ask(question: string, callback: (response: any, convo: Conversation) => void): void;
    ask(question: string, answers: any[]): void;
    say(text: string);
    next();
}

interface ChannelResponse {
    ok: boolean;
    channels: Channel[];
}

interface OpenResponse {
    ok: boolean;
    channel: {
        id: string;
    }
}

interface API {
    reactions: {
        add(args: { timestamp: string; channel: Channel; name: string; },
            error: (err: any, res: any) => void): void;
    };
    channels: {
        list(args: {}, callback: (err: any, res: ChannelResponse) => void): void;
        listAsync(args: {}): Promise<ChannelResponse>;
        info(args: {}, callback: (err: any, res: any) => void): void;
    }
    im: {
        open(args: {user: string}, callback: (err: any, res: any) => void): void;
        openAsync(args: {user: string}): Promise<OpenResponse>;
        history(args: {channel: string, count: number}, callback: (err: Error, res: any) => void): void;
    }
}

interface Bot {
    api: API;
    botkit: {log(message: string, error: any): void};
    say(args: {text: string; channel: string}): void;
    reply(message: Message, text: string): void;
    startConversation(message: Message, callback: (err: Error, convo: Conversation) => void): void;
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

interface Store {
    get: (id: string, cb: (err: any, obj: any) => void) => void;
    save: (object: any, cb: (err: Error, id: string) => void) => void;
    all: (callback: (err: Error, object: any) => void, options: any) => void;
    allById: (callback: () => void) => void; 
}

interface RedisStorage {
    users: Store;
    teams: Store;
    channels: Store;
    projects: Store;
}

interface Controller {
    on(channel: "channel_joined" | "direct_message", callback: (bot: Bot, message: Message) => void): void;
    spawn(options?: ControllerOptions): Bot;
    hears(words: string[], whereMentioned: string, callback: (bot: Bot, message: Message) => void): void;
}

interface Botkit {
    slackbot(options?: BotOptions): Controller;
}

declare module "redis" {

    export interface RedisClient extends NodeJS.EventEmitter {
        setAsync(key:string, value:string): Promise<void>;
        getAsync(key:string): Promise<string>;
        saddAsync(args:any[]): Promise<boolean>;
        saddAsync(...args:any[]): Promise<boolean>;
        smembersAsync(args:any[]): Promise<string[]>;
        smembersAsync(...args:any[]): Promise<string[]>;
    }

}