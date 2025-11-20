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
const signinAltcha = document.getElementById('signinAltcha') as any;
const updatePasswordAltcha = document.getElementById('updatePasswordAltcha') as any;
const settingsButton = document.getElementById('settingsButton') as HTMLElement;
const newUsernameInput = document.getElementById('newUsernameInput') as HTMLInputElement;
const settingsUpdatePasswordForm = document.getElementById('settingsUpdatePasswordForm') as HTMLFormElement;
const settingsUpdateUsernameForm = document.getElementById('settingsUpdateUsernameForm') as HTMLFormElement;
const settingsUpdatePictureForm = document.getElementById('settingsUpdatePictureForm') as HTMLFormElement;
const postMediasInput = document.getElementById('postMedias') as HTMLInputElement;
const commentMediasInput = document.getElementById('commentMedias') as HTMLInputElement;
const mediaInputs = [postMediasInput, commentMediasInput];
const postMediaPreviewContainer = document.getElementById('postMediaPreviewContainer') as HTMLElement;


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




// --- Infinite scroll / paginated posts ---
const PAGE_SIZE = 10;
let currentOffset = 0;
let loadingPosts = false;
let hasMorePosts = true;

async function loadPostsPaginated(reset: boolean = false) {
    if (loadingPosts) return;
    if (reset) {
        currentOffset = 0;
        hasMorePosts = true;
        postsSection.innerHTML = '';
    }
    if (!hasMorePosts) return;

    loadingPosts = true;
    try {
        const posts = await API.getPosts(PAGE_SIZE, currentOffset);
        for (const post of posts) {
            const postElement = HtmlBuilder.createPostElement(post);
            postsSection.appendChild(postElement);
        }

        currentOffset += posts.length;
        if (posts.length < PAGE_SIZE) {
            hasMorePosts = false;
        }
    } finally {
        loadingPosts = false;
    }
}

let scrollThrottle: number | null = null;
window.addEventListener('scroll', () => {
    if (scrollThrottle !== null) return;
    scrollThrottle = window.setTimeout(() => {
        scrollThrottle = null;
        const scrollPos = window.innerHeight + window.scrollY;
        const threshold = document.body.offsetHeight - 400;
        if (scrollPos >= threshold) {
            loadPostsPaginated(false);
        }
    }, 150);
});


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

const captchas = [signupAltcha, publishAltcha, commentAltcha, signinAltcha, updatePasswordAltcha];
for (const captcha of captchas) {
    captcha.challengeurl = Config.API_BASE_URL + '/captcha.php';
}

for (const mediaInput of mediaInputs) {
    mediaInput.setAttribute('accept', backendConfig.AllowedImageTypes.join(','));
    mediaInput.setAttribute('multiple', 'true');

    mediaInput.addEventListener('change', () => {
        const files = mediaInput.files;
        if (!files || files.length === 0) return;

        // Vérifie le nombre maximal de fichiers
        if (files.length > backendConfig.MaxImagesPerPost) {
            alert(`You can only select a maximum of ${backendConfig.MaxImagesPerPost} files.`);
            mediaInput.value = '';
            postMediaPreviewContainer.innerHTML = ''; // Nettoie les aperçus
            return;
        }

        // Vérifie la taille de chaque fichier
        for (let i = 0; i < files.length; i++) {
            if (files[i].size > backendConfig.MaxImageSize) {
                alert(`File "${files[i].name}" exceeds the maximum size of ${(backendConfig.MaxImageSize / 1024 / 1024).toFixed(2)} MB.`);
                mediaInput.value = '';
                postMediaPreviewContainer.innerHTML = '';
                return;
            }
        }

        // Nettoie les aperçus précédents
        postMediaPreviewContainer.innerHTML = '';

        // Affiche un aperçu pour chaque image
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';

            const img = document.createElement('img');
            img.className = 'image-preview';
            //img.file = file;

            // Utilise FileReader pour lire le fichier et afficher l'aperçu
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target!.result!.toString();
            };
            reader.readAsDataURL(file);

            // Ajoute un bouton pour supprimer l'image
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-image-button';
            removeButton.innerHTML = '×';
            removeButton.addEventListener('click', () => {
                previewItem.remove();
                // Convertit la FileList en tableau pour manipuler les fichiers
                const filesArray = Array.from(files);
                // Retire le fichier correspondant
                filesArray.splice(i, 1);
                // Crée une nouvelle FileList (simulée via DataTransfer)
                const dataTransfer = new DataTransfer();
                filesArray.forEach(file => dataTransfer.items.add(file));
                mediaInput.files = dataTransfer.files;
            });

            // Ajoute l'image et le bouton au conteneur
            previewItem.appendChild(img);
            previewItem.appendChild(removeButton);
            postMediaPreviewContainer.appendChild(previewItem);
        }
    });
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
    await loadPostsPaginated(true);

    signupAltcha.reset();

    return false;
});

signinForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = (document.getElementById('signinUsername') as HTMLInputElement).value;
    const password = (document.getElementById('signinPassword') as HTMLInputElement).value;
    const altchaToken = (signinForm.querySelector('[name=altcha]') as HTMLInputElement).value;

    try {
        const data = await API.loginUser(username, password, altchaToken);

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
    await loadPostsPaginated(true);

    return false;

});


publishForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const content = (document.getElementById('postContent') as HTMLTextAreaElement).value;
    const postMediasFiles = (postMediasInput as HTMLInputElement).files;
    const altchaToken = (publishForm.querySelector('[name=altcha]') as HTMLInputElement).value;

    try {
        const data = await API.createPost(content, altchaToken);
        console.info(data);
        try {
            if (postMediasFiles) {
                for (let i = 0; i < postMediasFiles.length; i++) {
                    const file = postMediasFiles[i];
                    const uploadMessage = await API.uploadImage(file, data.post_id);
                    console.info(uploadMessage);
                }
            }
        } catch (error) {
            API.deletePost(data.post_id);
            alert((error as Error).message);
        }
    } catch (error) {
        alert((error as Error).message);
    }



    //alert(message);
    Popup.closePopup('publishPopup');
    (document.getElementById('postContent') as HTMLTextAreaElement).value = '';
    (postMediasInput as HTMLInputElement).value = '';



    await loadPostsPaginated(true);
    publishAltcha.reset();
    return false;
});


commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const commentMedias = (commentMediasInput as HTMLInputElement).files;
    const content = (document.getElementById('commentContent') as HTMLTextAreaElement).value;
    const fatherPostId = parseInt(commentFatherPostId.value);
    const altchaToken = (commentForm.querySelector('[name=altcha]') as HTMLInputElement).value;


    try {
        const data = await API.createPost(content, altchaToken, fatherPostId);
        console.info(data);

        try {
            if (commentMedias) {
                for (let i = 0; i < commentMedias.length; i++) {
                    const file = commentMedias[i];
                    const uploadMessage = await API.uploadImage(file, data.post_id);
                    console.info(uploadMessage);
                }
            }
        } catch (error) {
            API.deletePost(data.post_id);
            alert((error as Error).message);
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
    const altchaToken = (settingsUpdatePasswordForm.querySelector('[name=altcha]') as HTMLInputElement).value;

    try {
        const message = await API.updateUserPassword(currentPassword, newPassword, altchaToken);
        console.info(message);
        alert(message);
        settingsUpdatePasswordForm.reset();
        Popup.closePopup('settingsPopup');
    } catch (error) {
        alert((error as Error).message);
    }
});


settingsUpdateUsernameForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const newUsername = (document.getElementById('newUsernameInput') as HTMLInputElement).value;

    try {
        const message = await API.updateUserUsername(newUsername);
        console.info(message);
        alert(message);
        settingsUpdateUsernameForm.reset();
        await loadPostsPaginated(true);
        Popup.closePopup('settingsPopup');
    } catch (error) {
        alert((error as Error).message);
    }
});

settingsUpdatePictureForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const newPictureFile = (document.getElementById('newProfilePictureInput') as HTMLInputElement).files;

    if (newPictureFile && newPictureFile.length > 0) {
        try {
            const message = await API.updateUserProfilePicture(newPictureFile[0]);
            console.info(message);
            alert(message);
            settingsUpdatePictureForm.reset();
            await loadPostsPaginated(true);
            Popup.closePopup('settingsPopup');
        } catch (error) {
            alert((error as Error).message);
        }
    } else {
        alert('Please select a picture to upload.');
    }
});

loadLoginData();
await loadPostsPaginated(true);