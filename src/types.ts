import * as moment from "moment";

export class Task {
    private _id: string;

    constructor(public project?: string, public text?: string, public user?: string, public _duration?: moment.Duration) {
        this._id = moment().toISOString();
    }

    get id(): string {
        return this._id;
    }

    get projectMarkup(): string {
        return `<#${this.project}>`;
    }

    get duration(): moment.Duration {
        return this._duration || moment.duration(4, "hours");
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