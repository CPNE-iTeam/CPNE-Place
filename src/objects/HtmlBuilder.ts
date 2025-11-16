import { loadComments } from '../main';
import { API } from './api';
import { Config } from './config';
import { Post } from './models/post';
import { Popup } from './popup';


export class HtmlBuilder {

    static createPostElement(post: Post): HTMLElement {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        const headerElement = document.createElement('div');
        headerElement.className = 'post-header';

        const postAuthor = document.createElement('span');
        postAuthor.className = 'post-author';
        postAuthor.textContent = `@${post.Author.UserName}` + (post.Author.isCertified ? " ✅" : "");

        const postDate = document.createElement('span');
        postDate.className = 'post-date';
        postDate.textContent = post.CreatedAt.toLocaleString();

        headerElement.appendChild(postAuthor);
        headerElement.appendChild(postDate);
        postElement.appendChild(headerElement);

        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'post-images-container';
        for (const imageUrl of post.Images) {
            const imgElement = document.createElement('img');
            imgElement.src = `${Config.API_BASE_URL}/../${imageUrl}`;
            imgElement.className = 'post-image';
            imagesContainer.appendChild(imgElement);
        }
        postElement.appendChild(imagesContainer);

        const contentElement = document.createElement('p');
        contentElement.innerHTML = post.Content;
        contentElement.className = 'post-content';
        postElement.appendChild(contentElement);

        const bottomElement = document.createElement('div');
        bottomElement.className = 'post-bottom';

        if (post.FatherPostId === null) {
            const commentButton = document.createElement('button');
            commentButton.className = 'comment-button';
            commentButton.textContent = 'Commentaires';
            commentButton.addEventListener('click', () => {
                loadComments(post.Id);
                Popup.openPopup('commentsPopup');
            });
            bottomElement.appendChild(commentButton);

        }

        const reactionsElement = document.createElement('div');
        reactionsElement.className = 'post-reactions';

        const likeElement = document.createElement('button');
        likeElement.className = 'like-button';
        likeElement.textContent = `👍 ${post.LikesCount}`;
        reactionsElement.appendChild(likeElement);

        const dislikeElement = document.createElement('button');
        dislikeElement.className = 'dislike-button';
        dislikeElement.textContent = `👎 ${post.DislikesCount}`;
        reactionsElement.appendChild(dislikeElement);


        likeElement.addEventListener('click', async () => {
            try {
                const message = await API.reactToPost(post.Id, 1);
                console.info(message);
            } catch (error) {
                alert((error as Error).message);
            }
            const newPost = await API.getPost(post.Id);
            likeElement.textContent = `👍 ${newPost.LikesCount}`;
            dislikeElement.textContent = `👎 ${newPost.DislikesCount}`;
        });

        dislikeElement.addEventListener('click', async () => {
            try {
                const message = await API.reactToPost(post.Id, -1);
                console.info(message);
            } catch (error) {
                alert((error as Error).message);
            }
            const newPost = await API.getPost(post.Id);
            dislikeElement.textContent = `👎 ${newPost.DislikesCount}`;
            likeElement.textContent = `👍 ${newPost.LikesCount}`;
        });

        bottomElement.appendChild(reactionsElement);
        postElement.appendChild(bottomElement);

        return postElement;
    }
}