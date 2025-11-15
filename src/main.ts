import { API } from './objects/api';
import { HtmlBuilder } from './objects/HtmlBuilder';
import type { GlobalConfig } from './objects/models/global_config';
import { Popup } from './objects/popup';

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

async function loadLoginData() {
    const isLoggedIn: boolean = await API.isLoggedIn();
    if (isLoggedIn) {
        signinButton.style.display = 'none';
        signupButton.style.display = 'none';
        signoutButton.style.display = 'inline-block';
        publishButton.style.display = 'inline-block';
    } else {
        signinButton.style.display = 'inline-block';
        signupButton.style.display = 'inline-block';
        signoutButton.style.display = 'none';
        publishButton.style.display = 'none';
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

const backendConfig: GlobalConfig = await API.getConfig();


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





signupUsername.setAttribute('pattern', backendConfig.UsernamePattern.source);
signupUsername.setAttribute('minlength', backendConfig.MinUsernameLength.toString());
signupUsername.setAttribute('maxlength', backendConfig.MaxUsernameLength.toString());

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

    try {
        const message = await API.registerUser(username, password);
        console.info(message);
        //alert(message);
        Popup.closePopup('signupPopup');
    } catch (error) {
        alert((error as Error).message);
    }
    loadLoginData();
    return false;
});

signinForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = (document.getElementById('signinUsername') as HTMLInputElement).value;
    const password = (document.getElementById('signinPassword') as HTMLInputElement).value;

    try {
        const message = await API.loginUser(username, password);
        console.info(message);
        //alert(message);
        Popup.closePopup('signinPopup');
    } catch (error) {
        alert((error as Error).message);
    }

    loadLoginData();
    return false;

});


publishForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const content = (document.getElementById('postContent') as HTMLTextAreaElement).value;
    const postMedias = (document.getElementById('postMedias') as HTMLInputElement).files;

    try {
        const data = await API.createPost(content);
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
    } catch (error) {
        alert((error as Error).message);
    }

    loadPosts();
    return false;
});


commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const content = (document.getElementById('commentContent') as HTMLTextAreaElement).value;
    const fatherPostId = parseInt(commentFatherPostId.value);

    try {
        const message = await API.createPost(content, fatherPostId);
        console.info(message);
        //alert(message);
        //Popup.closePopup('commentPopup');
        (document.getElementById('commentContent') as HTMLTextAreaElement).value = '';
    } catch (error) {
        alert((error as Error).message);
    }
    loadComments(fatherPostId);

    return false;
});



loadLoginData();
loadPosts();