import test from "ava";
import * as moment from "moment";
import { makeTasks, getUsersFromChannels } from "./helper";

test("Get one task from text", t => {
    let tasks = makeTasks("jheh <#dkd> k 2h jsdkf", "user1");
    t.is(tasks.length, 1);
    let task = tasks[0];
    t.is("dkd", task.project);
    t.is("<#dkd>", task.projectMarkup);
    t.is("user1", task.user);
    t.is("jheh <#dkd> k 2h jsdkf", task.text);
    t.deepEqual(task.duration, moment.duration("2:00"));
});

test("Get three task from text", t => {
    let tasks = makeTasks("jheh <#dkd> k <#no>, 3h <#yes>,<#yup>", "user2");
    t.is(tasks.length, 3);
    let task1 = tasks[0];
    t.is("dkd", task1.project);
    t.is("<#dkd>", task1.projectMarkup);
    t.is("user2", task1.user);
    t.is("jheh <#dkd> k <#no>", task1.text);
    t.deepEqual(task1.duration, moment.duration("4:00"));
    let task2 = tasks[1];
    t.is("yes", task2.project);
    t.is("<#yes>", task2.projectMarkup);
    t.is("user2", task2.user);
    t.is("3h <#yes>", task2.text);
    t.deepEqual(task2.duration, moment.duration("3:00"));
    let task3 = tasks[2];
    t.is("yup", task3.project);
    t.is("<#yup>", task3.projectMarkup);
    t.is("user2", task3.user);
    t.is("<#yup>", task3.text);
    t.deepEqual(task3.duration, moment.duration("4:00"));
});

test("Hash thats no channel", t => {
    let tasks = makeTasks("Worked on #thisproject for 5h", "user3");
    t.is(tasks.length, 0);
});

test("Get Users from Channels", t => {
    let channel: Channel = {id: "1", name: "nice", is_member: true, members: ["user1", "user2"]};
    let users = getUsersFromChannels([channel]);
    t.is(users[0].identification, "user1");
    t.is(users[0].channels[0].name, "nice");
    t.is(users[1].identification, "user2");
    t.is(users[1].channels[0].name, "nice");
});
