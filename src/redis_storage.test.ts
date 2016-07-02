import test from "ava";
import Redis from "./redis_storage";

let red: Redis;

test.before(t => {
    red = new Redis({
        keyPrefix: "chefbot-test:",
        host: "docker",
        port: 6379
    });
});

test("Add a key", t => {
    t.plan(2);
    t.pass();
    console.log("Start");
    red.tasks.add("foo", "bars").done( v => {
        console.log(`Done:  ${v}`);
    }, e => {
        console.log(`Error: ${e}`);
    });
    t.pass();
});

test("Promise", t => {
    t.plan(1);

    return Promise.resolve(3).then(n => {
        console.log("Resolve promise");
        t.is(n, 3);
    });
});


test("Add a duration", t => {
    t.plan(1);
    red.tasks.increment("foo", 10).then(value => {
        red.tasks.duration("foo").then((obj) => {
            console.log("read from redis " + obj);
            t.is(obj, "10");
            t.pass("read from redis");
        });
    });
});