import { User } from "./user";

export class Post {
    private id: number;
    private content: string;
    private author: User;
    private createdAt: Date;
    private fatherPostId?: number;
    private likesCount: number;
    private dislikesCount: number;
    private images: string[];

    constructor(id: number, content: string, author: User, createdAt: Date, fatherPostId?: number, likesCount: number = 0, dislikesCount: number = 0, images: string[] = []) {
        this.id = id;
        this.content = content;
        this.author = author;
        this.createdAt = createdAt;
        this.fatherPostId = fatherPostId;
        this.likesCount = likesCount;
        this.dislikesCount = dislikesCount;
        this.images = images;
    }

    get Id(): number {
        return this.id;
    }

    get Content(): string {
        return this.content;
    }

    get Author(): User {
        return this.author;
    }

    get CreatedAt(): Date {
        return this.createdAt;
    }

    get FatherPostId(): number | null {
        return this.fatherPostId ?? null;
    }

    get LikesCount(): number {
        return this.likesCount;
    }

    get DislikesCount(): number {
        return this.dislikesCount;
    }

    get Images(): string[] {
        return this.images;
    }
}