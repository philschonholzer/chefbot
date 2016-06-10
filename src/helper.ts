import * as parse from "parse-duration";
import * as moment from "moment";
import { User, Task } from "./types";


// this could be part of Task. Only give the text and the rest the Task takes care of.
export function makeTasks(text: string, user: string) {
    let regex = /<#([^\\.\s>]+)>/;
    return text.split(/[,.;]\s?/)
    .filter(s => s.match(regex) != null) // for hashes not from channels /<#[^\\.\s>]+>|#[^\\.\s>]+/
    .reduce<Task[]>((tasks, part) => {
        let hashes = regex.exec(part);
        let duration = moment.duration(parse(part.replace(regex, "")));
        tasks.push(new Task(hashes[1], part, user, duration));
        return tasks;
    }, []);
}

export function getUsersFromChannels(channels: Channel[]): User[] {
    return channels
        .filter((channel) => channel.is_member)
        .reduce<User[]>((users, channel, index, array) => {
            channel.members.filter(member => member.startsWith("U")).forEach((member) => {
                let currentUser = users.find((user, index, obj) => user.identification === member);
                if (!currentUser) {
                    currentUser = new User(member);
                    users.push(currentUser);
                }
                currentUser.addChannel(channel);
            });
            return users;
        }, []);
};