import { API } from './objects/api';
import { Config } from './objects/config';
import { HtmlBuilder } from './objects/HtmlBuilder';
import type { GlobalConfig } from './objects/models/global_config';
import { Popup } from './objects/popup';
import "altcha";

const signinButton = document.getElementById('signinButton') as HTMLElement;
const signupButton = document.getElementById('signupButton') as HTMLElement;
const signoutButton = document.getElementById('signoutButton') as HTMLElement;
const publishButton = document.getElementById('publishButton') as HTMLElement;
const signupUsername = document.getElementById('signupUsername') as HTMLInputElement;
const signupForm = document.getElementById('signupForm') as HTMLFormElement;
const signinForm = document.getElementById('signinForm') as HTMLFormElement;
const postContent = document.getElementById('postContent') as HTMLTextAreaElement;
const publishForm = document.getElementById('publishForm') as HTMLFormElement;
const postsSection = document.getElementById('postsSection') as HTMLElement;
const commentContent = document.getElementById('commentContent') as HTMLTextAreaElement;
const commentForm = document.getElementById('commentForm') as HTMLFormElement;
const commentsSection = document.getElementById('commentsSection') as HTMLElement;
const commentFatherPostId = document.getElementById('commentFatherPostId') as HTMLInputElement;
const signupAltcha = document.getElementById('signupAltcha') as any;
const publishAltcha = document.getElementById('publishAltcha') as any;
const commentAltcha = document.getElementById('commentAltcha') as any;
const settingsButton = document.getElementById('settingsButton') as HTMLElement;
const newUsernameInput = document.getElementById('newUsernameInput') as HTMLInputElement;
const settingsUpdatePasswordForm = document.getElementById('settingsUpdatePasswordForm') as HTMLFormElement;
const settingsUpdateUsernameForm = document.getElementById('settingsUpdateUsernameForm') as HTMLFormElement;
const settingsUpdatePictureForm = document.getElementById('settingsUpdatePictureForm') as HTMLFormElement;


async function loadLoginData() {
    const isLoggedIn: boolean = await API.isLoggedIn();
    if (isLoggedIn) {
        signinButton.style.display = 'none';
        signupButton.style.display = 'none';
        signoutButton.style.display = 'inline-block';
        publishButton.style.display = 'inline-block';
        settingsButton.style.display = 'inline-block';
    } else {
        signinButton.style.display = 'inline-block';
        signupButton.style.display = 'inline-block';
        signoutButton.style.display = 'none';
        publishButton.style.display = 'none';
        settingsButton.style.display = 'none';
    }
}


async function loadPosts() {
    const posts = await API.getPosts();
    postsSection.innerHTML = '';
    for (const post of posts) {
        const postElement = HtmlBuilder.createPostElement(post);
        postsSection.appendChild(postElement);
    }
}


export async function loadComments(fatherPostId: number) {
    const comments = await API.getComments(fatherPostId);
    commentsSection.innerHTML = '';
    for (const comment of comments) {
        const commentElement = HtmlBuilder.createPostElement(comment);
        commentsSection.appendChild(commentElement);
    }
    commentFatherPostId.value = fatherPostId.toString();
    console.log(commentFatherPostId.value)
}

function loadBannData(reason: string, endDate: string) {
    (document.getElementById('banReason') as HTMLSpanElement).textContent = reason;
    (document.getElementById('banEndDate') as HTMLSpanElement).textContent = new Date(parseInt(endDate) * 1000).toLocaleString();
}

const backendConfig: GlobalConfig = await API.getConfig();

const captchas = [signupAltcha, publishAltcha, commentAltcha];
for (const captcha of captchas) {
    captcha.challengeurl = Config.API_BASE_URL + '/captcha.php';
}


signinButton.addEventListener('click', () => {
    Popup.openPopup('signinPopup');
});

signupButton.addEventListener('click', () => {
    Popup.openPopup('signupPopup');
});

publishButton.addEventListener('click', () => {
    Popup.openPopup('publishPopup');
});

signoutButton.addEventListener('click', async () => {
    try {
        await API.logout();
        location.reload();
    } catch (error) {
        alert((error as Error).message);
    }
});

settingsButton.addEventListener('click', () => {
    Popup.openPopup('settingsPopup');
});



signupUsername.setAttribute('pattern', backendConfig.UsernamePattern.source);
signupUsername.setAttribute('minlength', backendConfig.MinUsernameLength.toString());
signupUsername.setAttribute('maxlength', backendConfig.MaxUsernameLength.toString());

newUsernameInput.setAttribute('pattern', backendConfig.UsernamePattern.source);
newUsernameInput.setAttribute('minlength', backendConfig.MinUsernameLength.toString());
newUsernameInput.setAttribute('maxlength', backendConfig.MaxUsernameLength.toString());

postContent.setAttribute('pattern', backendConfig.ContentPattern.source);
postContent.setAttribute('maxlength', backendConfig.MaxPostLength.toString());
postContent.setAttribute('minlength', backendConfig.MinPostLength.toString());

commentContent.setAttribute('pattern', backendConfig.ContentPattern.source);
commentContent.setAttribute('maxlength', backendConfig.MaxPostLength.toString());
commentContent.setAttribute('minlength', backendConfig.MinPostLength.toString());

signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = (document.getElementById('signupUsername') as HTMLInputElement).value;
    const password = (document.getElementById('signupPassword') as HTMLInputElement).value;
    const altchaToken = (signupForm.querySelector('[name=altcha]') as HTMLInputElement).value;
    try {
        const message = await API.registerUser(username, password, altchaToken);
        console.info(message);
        //alert(message);
        Popup.closePopup('signupPopup');
    } catch (error) {
        alert((error as Error).message);
    }
    loadLoginData();
    loadPosts();

    signupAltcha.reset();

    return false;
});

signinForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = (document.getElementById('signinUsername') as HTMLInputElement).value;
    const password = (document.getElementById('signinPassword') as HTMLInputElement).value;

    try {
        const data = await API.loginUser(username, password);

        if (data.is_banned) {
            console.log(data.message)

            loadBannData(data.ban_reason, data.ban_end_date);
            Popup.openPopup('bannedPopup');
        } else {
            alert(data.message);
        }

        console.info(data.message);
        //alert(message);
        Popup.closePopup('signinPopup');
    } catch (error) {

        alert((error as Error).message);
    }

    loadLoginData();
    loadPosts();

    return false;

});


publishForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const content = (document.getElementById('postContent') as HTMLTextAreaElement).value;
    const postMedias = (document.getElementById('postMedias') as HTMLInputElement).files;
    const altchaToken = (publishForm.querySelector('[name=altcha]') as HTMLInputElement).value;
    
    try {
        const data = await API.createPost(content, altchaToken);
        console.info(data);

        if (postMedias) {
            for (let i = 0; i < postMedias.length; i++) {
                const file = postMedias[i];
                const uploadMessage = await API.uploadImage(file, data.post_id);
                console.info(uploadMessage);
            }
        }

        //alert(message);
        Popup.closePopup('publishPopup');
        (document.getElementById('postContent') as HTMLTextAreaElement).value = '';
        (document.getElementById('postMedias') as HTMLInputElement).value = '';

    } catch (error) {
        alert((error as Error).message);
    }

    loadPosts();
    publishAltcha.reset();
    return false;
});


commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const commentMedias = (document.getElementById('commentMedias') as HTMLInputElement).files;
    const content = (document.getElementById('commentContent') as HTMLTextAreaElement).value;
    const fatherPostId = parseInt(commentFatherPostId.value);
    const altchaToken = (commentForm.querySelector('[name=altcha]') as HTMLInputElement).value;


    try {
        const data = await API.createPost(content, altchaToken, fatherPostId);
        console.info(data);


        if (commentMedias) {
            for (let i = 0; i < commentMedias.length; i++) {
                const file = commentMedias[i];
                const uploadMessage = await API.uploadImage(file, data.post_id);
                console.info(uploadMessage);
            }
        }

        //alert(message);
        //Popup.closePopup('commentPopup');
        (document.getElementById('commentContent') as HTMLTextAreaElement).value = '';
    } catch (error) {
        alert((error as Error).message);
    }
    loadComments(fatherPostId);
    commentAltcha.reset();
    return false;
});

settingsUpdatePasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentPassword = (document.getElementById('currentPasswordInput') as HTMLInputElement).value;
    const newPassword = (document.getElementById('newPasswordInput') as HTMLInputElement).value;

    try {
        const message = await API.updateUserPassword(currentPassword, newPassword);
        console.info(message);
        alert(message);
        settingsUpdatePasswordForm.reset();
        Popup.closePopup('settingsPopup');
    } catch (error) {
        alert((error as Error).message);
    }
});


loadLoginData();
loadPosts();