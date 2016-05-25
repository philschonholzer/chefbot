import { User } from "./types";

export function getHashesOld(text: string, callback?: (hash: string) => void): string[] {
    let projects: string[] = [], re = /<#([^\\.\s>]+)>/g, project;
    while (project = re.exec(text)) {
        if (callback) callback(project[1]);
        projects.push(project[0]);
    }
    return projects;
}

export function getHashes(text: string) {
    return getOccurrence(text, /<#([^\\.\s>]+)>/g).map(value => { return { valueWithMarkup: value[0], value: value[1] }; });
}

export function getOccurrence(text: string, regex: RegExp) {
    let projects: RegExpExecArray[] = [], project;
    while (project = regex.exec(text)) {
        projects.push(project);
    }
    return projects;
}

export function getUsersFromChannels(channels: Channel[]): User[] {
    return channels
        .filter((channel) => channel.is_member)
        .reduce<User[]>((users, channel, index, array) => {
            channel.members.forEach((member) => {
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