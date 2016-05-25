import test from "ava";
import { getHashes, getUsersFromChannels } from "./helper";

test("Get one hash from text", t => {
    let test = getHashes("jheh <#dkd> k jsdkf");
    t.is(test.length, 1);
    t.is(test[0].valueWithMarkup, "<#dkd>");
    t.is(test[0].value, "dkd");
});

test("Get one hash from start", t => {
    let test = getHashes("<#dkd> k jsdkf");
    t.is(test.length, 1);
    t.is(test[0].valueWithMarkup, "<#dkd>");
    t.is(test[0].value, "dkd");
});

test("Get one hash from end", t => {
    let test = getHashes("jheh <#dkd>");
    t.is(test.length, 1);
    t.is(test[0].valueWithMarkup, "<#dkd>");
    t.is(test[0].value, "dkd");
});

test("Get one hash from special char", t => {
    let test = getHashes("jheh <#dk d> <#dk.d> sdf");
    t.is(test.length, 0);
    t.deepEqual(test, []);
});

test("Get two hashes from text", t => {
    let test = getHashes("jheh <#dkd><#dkd> sdf");
    t.is(test.length, 2);
    t.is(test[0].valueWithMarkup, "<#dkd>");
    t.is(test[0].value, "dkd");
    t.is(test[1].valueWithMarkup, "<#dkd>");
    t.is(test[1].value, "dkd");
});

test("Get no hash from text", t => {
    let test = getHashes("jheh <dkd> k jsdkf");
    t.is(test.length, 0);
    t.deepEqual(test, []);
});

test("Get hashes with no string", t => {
    let test = getHashes("");
    t.is(test.length, 0);
    t.deepEqual(test, []);
});

test("Get Users from Channels", t => {
    let channel: Channel = {id: "1", name: "nice", is_member: true, members: ["user1", "user2"]};
    let users = getUsersFromChannels([channel]);
    t.is(users[0].identification, "user1");
    t.is(users[0].channels[0].name, "nice");
    t.is(users[1].identification, "user2");
    t.is(users[1].channels[0].name, "nice");
});