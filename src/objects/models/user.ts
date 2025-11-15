

export class User {
    private Id: number;
    private Username: string;
    private IsCertified: boolean;

    constructor(id: number, username: string, isCertified: boolean = false) {
        this.Id = id;
        this.Username = username;
        this.IsCertified = isCertified;
    }

    get UserId(): number {
        return this.Id;
    }

    get UserName(): string {
        return this.Username;
    }

    get isCertified(): boolean {
        return this.IsCertified;
    }
}