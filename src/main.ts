import { API } from './objects/api';
import { Config } from './objects/config';
import { PostManager } from './objects/postManager';
import { CommentManager } from './objects/commentManager';
import { MediaPreviewManager } from './objects/mediaPreviewManager';
import { AuthManager } from './objects/authManager';
import { FormManager } from './objects/formManager';

import "altcha";

document.addEventListener('DOMContentLoaded', async () => {
    const backendConfig = await API.getConfig();

    // Initialisation des éléments DOM
    const signinButton = document.getElementById('signinButton') as HTMLElement;
    const signupButton = document.getElementById('signupButton') as HTMLElement;
    const signoutButton = document.getElementById('signoutButton') as HTMLElement;
    const publishButton = document.getElementById('publishButton') as HTMLElement;
    const settingsButton = document.getElementById('settingsButton') as HTMLElement;
    const postsSection = document.getElementById('postsSection') as HTMLElement;
    const commentsSection = document.getElementById('commentsSection') as HTMLElement;
    const commentFatherPostId = document.getElementById('commentFatherPostId') as HTMLInputElement;
    const postMediaPreviewContainer = document.getElementById('postMediaPreviewContainer') as HTMLElement;
    const postMediasInput = document.getElementById('postMedias') as HTMLInputElement;
    const commentMediasInput = document.getElementById('commentMedias') as HTMLInputElement;

    // Initialisation des formulaires
    const signupForm = document.getElementById('signupForm') as HTMLFormElement;
    const signinForm = document.getElementById('signinForm') as HTMLFormElement;
    const publishForm = document.getElementById('publishForm') as HTMLFormElement;
    const commentForm = document.getElementById('commentForm') as HTMLFormElement;
    const settingsUpdatePasswordForm = document.getElementById('settingsUpdatePasswordForm') as HTMLFormElement;
    const settingsUpdateUsernameForm = document.getElementById('settingsUpdateUsernameForm') as HTMLFormElement;
    const settingsUpdatePictureForm = document.getElementById('settingsUpdatePictureForm') as HTMLFormElement;

    // Initialisation des managers
    const postManager = new PostManager(postsSection);
    const commentManager = new CommentManager(commentsSection, commentFatherPostId);
    new MediaPreviewManager(postMediasInput, postMediaPreviewContainer, backendConfig);
    const authManager = new AuthManager(signinButton, signupButton, signoutButton, publishButton, settingsButton);
    new FormManager(
        signupForm, signinForm, publishForm, commentForm,
        settingsUpdatePasswordForm, settingsUpdateUsernameForm, settingsUpdatePictureForm,
        postMediaPreviewContainer, postMediasInput, commentMediasInput,
        postManager,
        authManager,
        commentManager
    );

    // Chargement initial des données
    await authManager.loadLoginData();
    await postManager.reset();

    // Configuration des écouteurs d'événements
    authManager.setupEventListeners();

    // Configuration des CAPTCHAs
    const captchas = [
        document.getElementById('signupAltcha'),
        document.getElementById('publishAltcha'),
        document.getElementById('commentAltcha'),
        document.getElementById('signinAltcha'),
        document.getElementById('updatePasswordAltcha')
    ].filter(Boolean) as any[];

    for (const captcha of captchas) {
        captcha.challengeurl = Config.API_BASE_URL + '/captcha.php';
    }

    document.addEventListener("loadComments", async (event: any) => {
        const fatherPostId = event.detail.postId;
        await commentManager.loadComments(fatherPostId);
    });

    document.addEventListener("postDeleted", async (event: any) => {
        postManager.reset();
        commentManager.loadComments(event.detail.postId);
    });
});
