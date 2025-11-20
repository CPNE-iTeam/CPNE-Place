import { API } from './api';
import { HtmlBuilder } from './HtmlBuilder';

export class CommentManager {
    private commentsSection: HTMLElement;
    private commentFatherPostId: HTMLInputElement;

    constructor(commentsSection: HTMLElement, commentFatherPostId: HTMLInputElement) {
        this.commentsSection = commentsSection;
        this.commentFatherPostId = commentFatherPostId;
    }

    public async loadComments(fatherPostId: number): Promise<void> {
        const comments = await API.getComments(fatherPostId);
        this.commentsSection.innerHTML = '';
        for (const comment of comments) {
            const commentElement = HtmlBuilder.createPostElement(comment);
            this.commentsSection.appendChild(commentElement);
        }
        this.commentFatherPostId.value = fatherPostId.toString();
    }
}
