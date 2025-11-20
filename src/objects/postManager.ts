import { API } from './api';
import { HtmlBuilder } from './HtmlBuilder';

export class PostManager {
    private postsSection: HTMLElement;
    private currentOffset: number = 0;
    private loadingPosts: boolean = false;
    private hasMorePosts: boolean = true;
    private PAGE_SIZE: number = 10;
    private observer: IntersectionObserver | null = null;

    constructor(postsSection: HTMLElement) {
        this.postsSection = postsSection;
        this.setupIntersectionObserver();
    }

    private async loadPosts(reset: boolean = false): Promise<void> {
        if (this.loadingPosts) return;
        if (reset) {
            this.currentOffset = 0;
            this.hasMorePosts = true;
            this.postsSection.innerHTML = '';
        }
        if (!this.hasMorePosts) return;

        this.loadingPosts = true;
        try {
            const posts = await API.getPosts(this.PAGE_SIZE, this.currentOffset);
            for (const post of posts) {
                const postElement = HtmlBuilder.createPostElement(post);
                this.postsSection.appendChild(postElement);
            }
            this.currentOffset += posts.length;
            if (posts.length < this.PAGE_SIZE) {
                this.hasMorePosts = false;
            }
        } finally {
            this.loadingPosts = false;
        }
    }

    private setupIntersectionObserver(): void {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1,
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.loadPosts(false);
                }
            });
        }, options);

        const sentinel = document.createElement('div');
        this.postsSection.appendChild(sentinel);
        this.observer.observe(sentinel);
    }

    public reset(): void {
        this.loadPosts(true);
    }
}
