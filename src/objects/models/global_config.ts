

export class GlobalConfig {
    private maxPostLength: number;
    private minPostLength: number;
    private contentPattern: RegExp;
    private maxUsernameLength: number;
    private minUsernameLength: number;
    private usernamePattern: RegExp;

    constructor(maxPostLength: number, minPostLength: number, contentPattern: RegExp, maxUsernameLength: number, minUsernameLength: number, usernamePattern: RegExp) {
        this.maxPostLength = maxPostLength;
        this.minPostLength = minPostLength;
        this.contentPattern = contentPattern;
        this.maxUsernameLength = maxUsernameLength;
        this.minUsernameLength = minUsernameLength;
        this.usernamePattern = usernamePattern;
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
}