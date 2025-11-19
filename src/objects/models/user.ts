

export class User {
    private Id: number;
    private Username: string;
    private IsCertified: boolean;
    private profilePicture?: string;

    constructor(id: number, username: string, isCertified: boolean = false, profilePicture?: string) {
        this.Id = id;
        this.Username = username;
        this.IsCertified = isCertified;
        this.profilePicture = profilePicture;
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

    get ProfilePicture(): string | undefined {
        return this.profilePicture;
    }
}   