import test from "ava";
import Redis from "./redis_storage";

let red: Redis;

test.before(t => {
    red = new Redis({
        keyPrefix: "chefbot-test:",
        host: "localhost",
        port: 6379,
        db: 9
    });
    red.flush();
});

test("Add a key", async (t) => {
    await red.tasks.add("foo", "bars").then(async (v) => {
        await red.tasks.members("foo").then(members => {
            t.is(members.length, 1);
            t.is(members[0], "bars");
        });
    });
});

test("Add a duration", async (t) => {
    await red.tasks.increment("foo", 10).then(async (value) => {
        await red.tasks.duration("foo").then((obj) => {
            t.is(obj, "10");
        });
    });
});
