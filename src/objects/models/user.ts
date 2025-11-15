

export class User {
    private Id: number;
    private Username: string;

    constructor(id: number, username: string) {
        this.Id = id;
        this.Username = username;
    }

    get UserId(): number {
        return this.Id;
    }

    get UserName(): string {
        return this.Username;
    }
}