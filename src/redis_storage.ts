import {Task} from "./types";
import * as Redis from "ioredis";
import * as moment from "moment";


/**
 * Store
 */
class Store {

    constructor(private hash: string, private client: IORedis.Redis) {

    }

    public get = (id: string, cb: (err: any, obj: any) => void) => {
        this.client.hget(this.hash, id, (err, res) => cb(err, JSON.parse(res)));
    };

    public save = (object, cb) => {
        if (!object.id) // Silently catch this error?
            return cb(new Error("The given object must have an id property"), {});
        this.client.hset(this.hash, object.id, JSON.stringify(object), cb);
    };

    add = (key: string, value: string): Promise<boolean> => {
        return this.client.sadd(this.hash + ":" + key, value);
    };

    members = (key: string): PromiseLike<string[]> => {
        return this.client.smembers(this.hash + ":" + key);
    };

    increment = (key: string, value: number): PromiseLike<number> => {
        return this.client.incrby(this.hash + ":" + key + ":duration", value);
    };

    duration = (key: string): PromiseLike<string> => {
        return this.client.get(this.hash + ":" + key + ":duration");
    };

    public all = (cb, options) => {
        this.client.hgetall(this.hash, function (err, res) {
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

    private redis: IORedis.Redis;

    constructor(private config?: IORedis.RedisOptions) {
        this.config = config || {};
        this.config.keyPrefix = this.config.keyPrefix || "chefbot-store:";

        this.redis = new Redis(this.config); // could pass specific redis config here
    }

    public get teams(): Store {
        return new Store("teams", this.redis);
    }

    public get users(): Store {
        return new Store("users", this.redis);
    }

    public get channels(): Store {
        return new Store("channels", this.redis);
    }

    public get projects(): Store {
        return new Store("projects", this.redis);
    }

    public get tasks(): Store {
        return new Store("tasks", this.redis);
    }

}

declare global {
    interface Controller {
        storage: Storage;
    }
}
