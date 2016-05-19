import test from "ava";
import {Task, User} from "./types";
import * as Botkit from "botkit";

async function fn() {
    return Promise.resolve("foo");
}

test(async (t) => {
    t.is(await fn(), "foo");
});


test("New User", t => {
    let user = new User("3");
    t.deepEqual(user, new User("3"));
    t.is(user.identification, "3");
});

test("Add Channels", t => {
    let user = new User("3");
    user.addChannel({id: "4444", name: "Hallo", is_member: true, members: [] });
    t.is(user.channels[0].id, "4444");
});