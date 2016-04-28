import * as redis from "redis"; //https://github.com/NodeRedis/node_redis


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
        this.hash = hash;
        this.client = client;
    }
    
    public get = (id: string, cb: (err: any, obj: any) => void) => {
                    this.client.hget(this.config.namespace + ":" + this.hash, id, (err, res) => cb(err, JSON.parse(res)) );
                };
    
    public save = (object, cb) => {
                    if (!object.id) // Silently catch this error?
                        return cb(new Error("The given object must have an id property"), {});
                    this.client.hset(this.config.namespace + ":" + this.hash, object.id, JSON.stringify(object), cb);
                };
    public all = (cb, options) => {
                    this.client.hgetall(this.config.namespace + ":" + this.hash, function(err, res) {
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
     public allById = (cb) => this.all(cb, {type: "object"});
    
}

/**
 * Storage
 */
export default class Storage {

    // this.client is set to late...?
    public teams = new Store("teams", this.client, this.config);
    public users = new Store("users", this.client, this.config);
    public channels = new Store("channels", this.client, this.config);
    public projects = new Store("projects", this.client, this.config);

    private client: redis.RedisClient;

    constructor(private config?: Config) {
        this.config = config || {};
        this.config.namespace = this.config.namespace || "botkit:store";

        this.client = redis.createClient(config); // could pass specific redis config here
    }

}

// module.exports = (config: Config): Storage => {
//     return new Storage(config);
// }

/*
 * All optional
 *
 * config = {
 *  namespace: namespace,
 *  host: host,
 *  port: port
 * }
 * // see
 * https://github.com/NodeRedis/node_redis
 * #options-is-an-object-with-the-following-possible-properties for a full list of the valid options
 */

/*
module.exports = (config: Config) => {
    config = config || {};
    config.namespace = config.namespace || "botkit:store";

    let storage = {},
    client = redis.createClient(config), // could pass specific redis config here
    methods = config.methods || ["teams", "users", "channels", "projects"];

    // Implements required API methods
    for (let i = 0; i < methods.length; i++) {
        storage[methods[i]] = function(hash) {
            return {
                get: (id: string, cb: (err: any, obj: any) => void) => {
                    client.hget(config.namespace + ":" + hash, id, (err, res) => cb(err, JSON.parse(res)) );
                },
                save: (object, cb) => {
                    if (!object.id) // Silently catch this error?
                        return cb(new Error("The given object must have an id property"), {});
                    client.hset(config.namespace + ":" + hash, object.id, JSON.stringify(object), cb);
                },
                all: (cb, options) => {
                    client.hgetall(config.namespace + ":" + hash, function(err, res) {
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
                },
                allById: (cb) => this.all(cb, {type: "object"})
            };
        }(methods[i]);
    }
    return storage;
};
*/
