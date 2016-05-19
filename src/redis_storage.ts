import {Task} from "./types";
import * as redis from "redis"; // https://github.com/NodeRedis/node_redis
// switch to 'ioredis' because of bluebird https://github.com/luin/ioredis#basic-usage

import * as Promise from "bluebird";



// https://github.com/NodeRedis/node_redis
// #options-is-an-object-with-the-following-possible-properties for a full list of the valid options
interface Config {
    namespace?: string;
    host?: string;
    port?: string;
    methods?: string;
    auth_pass?: string;
}

/**
 * Store
 */
class Store {

    constructor(private hash: string, private client: redis.RedisClient, private config: Config) {

    }

    public get = (id: string, cb: (err: any, obj: any) => void) => {
        this.client.hget(this.config.namespace + ":" + this.hash, id, (err, res) => cb(err, JSON.parse(res)));
    };

    public save = (object, cb) => {
        if (!object.id) // Silently catch this error?
            return cb(new Error("The given object must have an id property"), {});
        this.client.hset(this.config.namespace + ":" + this.hash, object.id, JSON.stringify(object), cb);
    };

    add = (key: string, value: string): PromiseLike<boolean> => {
        return this.client.saddAsync(this.config.namespace + ":" + this.hash + ":" + key, value).then((res) => { return res; });
    };

    members = (key: string): PromiseLike<string[]> => {
        return this.client.smembersAsync(this.config.namespace + ":" + this.hash + ":" + key).then((res) => { return res; });
    };

    public all = (cb, options) => {
        this.client.hgetall(this.config.namespace + ":" + this.hash, function (err, res) {
            if (err)
                return cb(err, {});

            if (null === res)
                return cb(err, res);

            let parsed;
            let array = [];

            for (let i in res) {
                parsed = JSON.parse(res[i]);
                res[i] = parsed;
                array.push(parsed);
            }

            cb(err, options && options.type === "object" ? res : array);
        });
    };
    public allById = (cb) => this.all(cb, { type: "object" });

}

/**
 * Storage
 */
export default class Storage {

    private client: redis.RedisClient;

    constructor(private config?: Config) {
        this.config = config || {};
        this.config.namespace = this.config.namespace || "botkit:store";

        this.client = redis.createClient(config); // could pass specific redis config here
        Promise.promisifyAll(this.client);
    }

    public get teams(): Store {
        return new Store("teams", this.client, this.config);
    }

    public get users(): Store {
        return new Store("users", this.client, this.config);
    }

    public get channels(): Store {
        return new Store("channels", this.client, this.config);
    }

    public get projects(): Store {
        return new Store("projects", this.client, this.config);
    }

    public get tasks(): Store {
        return new Store("tasks", this.client, this.config);
    }


}

declare global {
    interface Controller {
        storage: Storage;
    }
}
