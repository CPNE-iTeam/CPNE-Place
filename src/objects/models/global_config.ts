

export class GlobalConfig {
    private maxPostLength: number;
    private minPostLength: number;
    private contentPattern: RegExp;
    private maxUsernameLength: number;
    private minUsernameLength: number;
    private usernamePattern: RegExp;
    private allowedImageTypes: string[];
    private maxImageSize: number
    private maxImagesPerPost: number;

    constructor(maxPostLength: number, minPostLength: number, contentPattern: RegExp, maxUsernameLength: number, minUsernameLength: number, usernamePattern: RegExp, allowedImageTypes: string[], maxImageSize: number, maxImagesPerPost: number) {
        this.maxPostLength = maxPostLength;
        this.minPostLength = minPostLength;
        this.contentPattern = contentPattern;
        this.maxUsernameLength = maxUsernameLength;
        this.minUsernameLength = minUsernameLength;
        this.usernamePattern = usernamePattern;
        this.allowedImageTypes = allowedImageTypes;
        this.maxImageSize = maxImageSize;
        this.maxImagesPerPost = maxImagesPerPost;
    }

    get MaxPostLength(): number {
        return this.maxPostLength;
    }

    get MinPostLength(): number {
        return this.minPostLength;
    }

    get ContentPattern(): RegExp {
        return this.contentPattern;
    }

    get MaxUsernameLength(): number {
        return this.maxUsernameLength;
    }

    get MinUsernameLength(): number {
        return this.minUsernameLength;
    }

    get UsernamePattern(): RegExp {
        return this.usernamePattern;
    }

    get AllowedImageTypes(): string[] {
        return this.allowedImageTypes;
    }

    get MaxImageSize(): number {
        return this.maxImageSize;
    }

    get MaxImagesPerPost(): number {
        return this.maxImagesPerPost;
    }
}