import { API } from './api';
import { Config } from './config';
import { Post } from './models/post';
import { Popup } from './popup';

export class HtmlBuilder {
    /**
     * Crée un élément DOM pour un post ou un commentaire.
     * @param post Le post ou commentaire à afficher.
     * @returns L'élément DOM représentant le post.
     */
    static createPostElement(post: Post): HTMLElement {
        // --- Conteneur principal ---
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.postId = post.Id.toString();

        // --- En-tête du post ---
        const headerElement = this._createPostHeader(post);
        postElement.appendChild(headerElement);

        // --- Contenu multimédia (images) ---
        if (post.Images.length > 0) {
            const imagesContainer = this._createImagesContainer(post.Images);
            postElement.appendChild(imagesContainer);
        }

        // --- Contenu textuel ---
        const contentElement = this._createContentElement(post.Content);
        postElement.appendChild(contentElement);

        // --- Pied du post (boutons et réactions) ---
        const bottomElement = this._createPostBottom(post);
        postElement.appendChild(bottomElement);

        return postElement;
    }

    // --- Méthodes privées pour créer les sous-éléments ---
    private static _createPostHeader(post: Post): HTMLElement {
        const headerElement = document.createElement('div');
        headerElement.className = 'post-header';

        // --- Auteur ---
        const postAuthor = this._createAuthorElement(post.Author);
        headerElement.appendChild(postAuthor);

        // --- Date ---
        const postDate = document.createElement('span');
        postDate.className = 'post-date';
        postDate.textContent = post.CreatedAt.toLocaleString();
        headerElement.appendChild(postDate);

        return headerElement;
    }

    private static _createAuthorElement(author: Post['Author']): HTMLElement {
        const authorContainer = document.createElement('div');
        authorContainer.className = 'post-author-container';

        // --- Photo de profil ---
        if (author.ProfilePicture) {
            const postAuthorImage = document.createElement('img');
            postAuthorImage.className = 'post-author-image';
            postAuthorImage.src = `${Config.API_BASE_URL}/../${author.ProfilePicture}`;
            postAuthorImage.alt = `Photo de profil de @${author.UserName}`;
            postAuthorImage.title = `@${author.UserName}`;
            authorContainer.appendChild(postAuthorImage);
        }

        // --- Nom d'utilisateur ---
        const postAuthor = document.createElement('span');
        postAuthor.className = 'post-author';
        postAuthor.textContent = `@${author.UserName}` + (author.isCertified ? " ✅" : "");

        // --- Logique de bannissement (6 clics) ---
        let authorClickCounter = 0;
        postAuthor.addEventListener('click', () => {
            authorClickCounter++;
            if (authorClickCounter >= 6) {
                this._handleBanUser(author.UserId, author.UserName);
                authorClickCounter = 0;
            }
        });

        authorContainer.appendChild(postAuthor);
        return authorContainer;
    }

    private static async _handleBanUser(userId: number, userName: string): Promise<void> {
        const durationInput = prompt(`Pour combien de jours voulez-vous bannir @${userName} ? (Entrez 0 pour annuler)`, "5");
        if (durationInput === null) return;

        const days = parseInt(durationInput);
        if (isNaN(days) || days <= 0) return;

        const reason = prompt(`Quelle est la raison du bannissement de @${userName} ?`, "Comportement inapproprié") ?? "";
        const endDate = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;

        try {
            const message = await API.banUser(userId, endDate, reason);
            alert(message);
        } catch (error) {
            alert((error as Error).message);
        }
    }

    private static _createImagesContainer(images: string[]): HTMLElement {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'post-images-container';

        for (const imageUrl of images) {
            const imgElement = document.createElement('img');
            imgElement.src = `${Config.API_BASE_URL}/../${imageUrl}`;
            imgElement.className = 'post-image';
            imgElement.loading = 'lazy'; // Chargement paresseux pour améliorer les performances
            imagesContainer.appendChild(imgElement);
        }

        return imagesContainer;
    }

    private static _createContentElement(content: string): HTMLElement {
        const contentElement = document.createElement('p');
        contentElement.className = 'post-content';
        contentElement.textContent = content; // Utilise textContent au lieu de innerHTML pour éviter les attaques XSS
        return contentElement;
    }

    private static _createPostBottom(post: Post): HTMLElement {
        const bottomElement = document.createElement('div');
        bottomElement.className = 'post-bottom';

        // --- Bouton de commentaire (uniquement pour les posts principaux) ---
        if (post.FatherPostId === null) {
            const commentButton = document.createElement('button');
            commentButton.className = 'comment-button';
            commentButton.textContent = 'Commentaires';
            commentButton.addEventListener('click', () => {
                Popup.openPopup('commentsPopup');
                // Le chargement des commentaires est géré par un autre module (ex: CommentManager)
                const event = new CustomEvent('loadComments', { detail: { postId: post.Id } });
                document.dispatchEvent(event);
            });
            bottomElement.appendChild(commentButton);
        }

        // --- Bouton de suppression (si l'utilisateur a les droits) ---
        if (post.CanEdit) {
            const deleteButton = this._createDeleteButton(post.Id);
            bottomElement.appendChild(deleteButton);
        }

        // --- Réactions (likes/dislikes) ---
        const reactionsElement = this._createReactionsElement(post);
        bottomElement.appendChild(reactionsElement);

        return bottomElement;
    }

    private static _createDeleteButton(postId: number): HTMLElement {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-post-button';
        deleteButton.textContent = '🗑️';
        deleteButton.addEventListener('click', async () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
                try {
                    await API.deletePost(postId);
                    // Déclenche un événement pour rafraîchir la liste des posts
                    const event = new CustomEvent('postDeleted', { detail: { postId } });
                    document.dispatchEvent(event);
                } catch (error) {
                    alert((error as Error).message);
                }
            }
        });
        return deleteButton;
    }

    private static _createReactionsElement(post: Post): HTMLElement {
        const reactionsElement = document.createElement('div');
        reactionsElement.className = 'post-reactions';

        // --- Bouton "Like" ---
        const likeElement = document.createElement('button');
        likeElement.className = 'like-button';
        likeElement.textContent = `👍 ${post.LikesCount}`;
        likeElement.addEventListener('click', async () => {
            try {
                await API.reactToPost(post.Id, 1);
                this._updateReactionCounts(likeElement, post.Id, 'like');
            } catch (error) {
                alert((error as Error).message);
            }
        });

        // --- Bouton "Dislike" ---
        const dislikeElement = document.createElement('button');
        dislikeElement.className = 'dislike-button';
        dislikeElement.textContent = `👎 ${post.DislikesCount}`;
        dislikeElement.addEventListener('click', async () => {
            try {
                await API.reactToPost(post.Id, -1);
                this._updateReactionCounts(dislikeElement, post.Id, 'dislike');
            } catch (error) {
                alert((error as Error).message);
            }
        });

        reactionsElement.appendChild(likeElement);
        reactionsElement.appendChild(dislikeElement);
        return reactionsElement;
    }

    private static async _updateReactionCounts(
        button: HTMLElement,
        postId: number,
        type: 'like' | 'dislike'
    ): Promise<void> {
        try {
            const newPost = await API.getPost(postId);
            if (type === 'like') {
                button.textContent = `👍 ${newPost.LikesCount}`;
            } else {
                button.textContent = `👎 ${newPost.DislikesCount}`;
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour des réactions :", error);
        }
    }
}
