import * as moment from "moment";

/**
 * Task
 */
export class Task {
    private _id: string;
    constructor(private user: string, private project: string, private text: string) {
        this._id = moment().toISOString();
    }

    get id(): string {
        return this._id;
    }

}

export class User {
    private _channels: Channel[] = [];

    constructor(private id: string) { }

    addChannel(channel: Channel) {
        this._channels.push(channel);
    }

    get channels(): Channel[] {
        return this._channels;
    }

    get identification(): string {
        return this.id;
    }
}