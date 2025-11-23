import { API } from './api';
import type { AuthManager } from './authManager';
import type { CommentManager } from './commentManager';
import { Popup } from './popup';
import { PostManager } from './postManager';

export class FormManager {
    private signupForm: HTMLFormElement;
    private signinForm: HTMLFormElement;
    private publishForm: HTMLFormElement;
    private commentForm: HTMLFormElement;
    private settingsUpdatePasswordForm: HTMLFormElement;
    private settingsUpdateUsernameForm: HTMLFormElement;
    private settingsUpdatePictureForm: HTMLFormElement;
    private postMediaPreviewContainer: HTMLElement;
    private postMediasInput: HTMLInputElement;
    private commentMediasInput: HTMLInputElement;
    private postManager: PostManager;
    private authManager: AuthManager;
    private commentManager: CommentManager;

    constructor(
        signupForm: HTMLFormElement,
        signinForm: HTMLFormElement,
        publishForm: HTMLFormElement,
        commentForm: HTMLFormElement,
        settingsUpdatePasswordForm: HTMLFormElement,
        settingsUpdateUsernameForm: HTMLFormElement,
        settingsUpdatePictureForm: HTMLFormElement,
        postMediaPreviewContainer: HTMLElement,
        postMediasInput: HTMLInputElement,
        commentMediasInput: HTMLInputElement,
        postManager: PostManager,
        authManager: AuthManager,
        commentManager: CommentManager
    ) {
        this.signupForm = signupForm;
        this.signinForm = signinForm;
        this.publishForm = publishForm;
        this.commentForm = commentForm;
        this.settingsUpdatePasswordForm = settingsUpdatePasswordForm;
        this.settingsUpdateUsernameForm = settingsUpdateUsernameForm;
        this.settingsUpdatePictureForm = settingsUpdatePictureForm;
        this.postMediaPreviewContainer = postMediaPreviewContainer;
        this.postMediasInput = postMediasInput;
        this.commentMediasInput = commentMediasInput;
        this.postManager = postManager;
        this.authManager = authManager;
        this.commentManager = commentManager;

        this.setupFormListeners();
    }

    private setupFormListeners(): void {
        this.signupForm.addEventListener('submit', (event) => this.handleSignup(event));
        this.signinForm.addEventListener('submit', (event) => this.handleSignin(event));
        this.publishForm.addEventListener('submit', (event) => this.handlePublish(event));
        this.commentForm.addEventListener('submit', (event) => this.handleComment(event));
        this.settingsUpdatePasswordForm.addEventListener('submit', (event) => this.handleUpdatePassword(event));
        this.settingsUpdateUsernameForm.addEventListener('submit', (event) => this.handleUpdateUsername(event));
        this.settingsUpdatePictureForm.addEventListener('submit', (event) => this.handleUpdatePicture(event));
    }

    private async handleSignup(event: Event): Promise<void> {
        event.preventDefault();
        const username = (this.signupForm.querySelector('#signupUsername') as HTMLInputElement).value;
        const password = (this.signupForm.querySelector('#signupPassword') as HTMLInputElement).value;
        const altchaToken = (this.signupForm.querySelector('[name=altcha]') as HTMLInputElement).value;

        try {
            const message = await API.registerUser(username, password, altchaToken);
            console.info(message);
            Popup.closePopup('signupPopup');
            this.authManager.loadLoginData();
            this.signupForm.reset();
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private async handleSignin(event: Event): Promise<void> {
        event.preventDefault();
        const username = (this.signinForm.querySelector('#signinUsername') as HTMLInputElement).value;
        const password = (this.signinForm.querySelector('#signinPassword') as HTMLInputElement).value;
        const altchaToken = (this.signinForm.querySelector('[name=altcha]') as HTMLInputElement).value;

        try {
            const data = await API.loginUser(username, password, altchaToken);
            if (data.is_banned) {
                this.loadBannData(data.ban_reason, data.ban_end_date);
                Popup.openPopup('bannedPopup');
            } else {
                Popup.closePopup('signinPopup');
                this.authManager.loadLoginData();
                this.signinForm.reset();
            }
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private async handlePublish(event: Event): Promise<void> {
        event.preventDefault();
        const content = (this.publishForm.querySelector('#postContent') as HTMLTextAreaElement).value;
        const postMediasFiles = this.postMediasInput.files;
        const altchaToken = (this.publishForm.querySelector('[name=altcha]') as HTMLInputElement).value;

        try {
            const data = await API.createPost(content, altchaToken);
            if (postMediasFiles) {
                for (let i = 0; i < postMediasFiles.length; i++) {
                    if (postMediasFiles[i].type.startsWith('video/')) {
                        await API.uploadVideo(postMediasFiles[i], data.post_id);
                    } else {
                        await API.uploadImage(postMediasFiles[i], data.post_id);
                    }
                }
            }
            Popup.closePopup('publishPopup');
            this.publishForm.reset();
            this.postMediaPreviewContainer.innerHTML = '';
            this.postManager.reset();
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private async handleComment(event: Event): Promise<void> {
        event.preventDefault();
        const commentMedias = this.commentMediasInput.files;
        const content = (this.commentForm.querySelector('#commentContent') as HTMLTextAreaElement).value;
        const fatherPostId = parseInt((document.querySelector('#commentFatherPostId') as HTMLInputElement).value);
        const altchaToken = (this.commentForm.querySelector('[name=altcha]') as HTMLInputElement).value;

        try {
            const data = await API.createPost(content, altchaToken, fatherPostId);
            if (commentMedias) {
                for (let i = 0; i < commentMedias.length; i++) {
                    await API.uploadImage(commentMedias[i], data.post_id);
                }
            }
            this.commentForm.reset();
            this.commentManager.loadComments(fatherPostId);
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private async handleUpdatePassword(event: Event): Promise<void> {
        event.preventDefault();
        const currentPassword = (this.settingsUpdatePasswordForm.querySelector('#currentPasswordInput') as HTMLInputElement).value;
        const newPassword = (this.settingsUpdatePasswordForm.querySelector('#newPasswordInput') as HTMLInputElement).value;
        const altchaToken = (this.settingsUpdatePasswordForm.querySelector('[name=altcha]') as HTMLInputElement).value;

        try {
            const message = await API.updateUserPassword(currentPassword, newPassword, altchaToken);
            alert(message);
            this.settingsUpdatePasswordForm.reset();
            Popup.closePopup('settingsPopup');
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private async handleUpdateUsername(event: Event): Promise<void> {
        event.preventDefault();
        const newUsername = (this.settingsUpdateUsernameForm.querySelector('#newUsernameInput') as HTMLInputElement).value;

        try {
            const message = await API.updateUserUsername(newUsername);
            alert(message);
            this.settingsUpdateUsernameForm.reset();
            Popup.closePopup('settingsPopup');
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private async handleUpdatePicture(event: Event): Promise<void> {
        event.preventDefault();
        const newPictureFile = (this.settingsUpdatePictureForm.querySelector('#newProfilePictureInput') as HTMLInputElement).files;

        if (!newPictureFile || newPictureFile.length === 0) {
            alert('Please select a picture to upload.');
            return;
        }

        try {
            const message = await API.updateUserProfilePicture(newPictureFile[0]);
            alert(message);
            this.settingsUpdatePictureForm.reset();
            this.postManager.reset();
            Popup.closePopup('settingsPopup');
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private loadBannData(reason: string, endDate: string): void {
        (document.getElementById('banReason') as HTMLSpanElement).textContent = reason;
        (document.getElementById('banEndDate') as HTMLSpanElement).textContent = new Date(parseInt(endDate) * 1000).toLocaleString();
    }
}
