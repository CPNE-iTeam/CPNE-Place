import { Config } from "./config";
import { GlobalConfig } from "./models/global_config";
import { Post } from "./models/post";
import { User } from "./models/user";

export class API {
    static async getConfig(): Promise<GlobalConfig> {
        const response = await fetch(`${Config.API_BASE_URL}/get_config.php`)
        const data = await response.json();

        console.log(data);
        return new GlobalConfig(
            data.max_post_length,
            data.min_post_length,
            new RegExp(data.content_pattern.substring(1, data.content_pattern.length - 1)),
            data.max_username_length,
            data.min_username_length,
            new RegExp(data.username_pattern.substring(1, data.username_pattern.length - 1))
        );
    }


    static async registerUser(username: string, password: string, altcha: string): Promise<string> {
        let formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('altcha', altcha);

        const response = await fetch(`${Config.API_BASE_URL}/register_user.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        return data.message;
    }

    static async loginUser(username: string, password: string, altcha: string): Promise<any> {
        let formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('altcha', altcha);

        const response = await fetch(`${Config.API_BASE_URL}/login_user.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        return data;
    }

    static async isLoggedIn(): Promise<boolean> {
        const response = await fetch(`${Config.API_BASE_URL}/is_logged_in.php`, {
            credentials: "include"
        });
        const data = await response.json();
        return data.logged_in;
    }

    static async logout(): Promise<string> {
        const response = await fetch(`${Config.API_BASE_URL}/signout.php`, {
            method: 'POST',
            credentials: "include"
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Logout failed');
        }
        return data.message;
    }

    static async createPost(content: string, altcha: string, fatherPostId?: number): Promise<any> {
        let formData = new FormData();
        formData.append('content', content);
        formData.append('altcha', altcha);  
        if (fatherPostId !== undefined) {
            formData.append('father_post_id', fatherPostId.toString());
        }

        const response = await fetch(`${Config.API_BASE_URL}/new_post.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Create post failed');
        }
        return data;
    }


    static async getPosts(limit: number = 10, offset: number = 0): Promise<Post[]> {

        const url = new URL(`${Config.API_BASE_URL}/get_posts.php`);
        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('offset', offset.toString());

        const response = await fetch(url.toString(), {
            credentials: "include"
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Get posts failed');
        }

        return data.map((postData: any) => new Post(
            postData.id,
            postData.content,
            new User(
                postData.author.id,
                postData.author.username,
                postData.author.is_certified,
                postData.author.profile_image
            ),
            new Date(postData.created_at),
            undefined,
            postData.likes_count,
            postData.dislikes_count,
            postData.images,
            postData.can_edit
        ));
    }

    static async getPost(postId: number): Promise<Post> {

        let formData = new FormData();
        formData.append('ID', postId.toString());

        const response = await fetch(`${Config.API_BASE_URL}/get_post.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Get post failed');
        }

        return new Post(
            data.id,
            data.content,
            new User(
                data.author.id,
                data.author.username,
                data.author.is_certified,
                data.author.profile_image
            ),
            new Date(data.created_at),
            data.father_post_id,
            data.likes_count,
            data.dislikes_count,
            data.images,
            data.can_edit
        );
    }


    static async getComments(fatherPostId: number): Promise<Post[]> {
        let formData = new FormData();
        formData.append('father_post_id', fatherPostId.toString());

        const response = await fetch(`${Config.API_BASE_URL}/get_comments.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Get comments failed');
        }

        return data.map((postData: any) => new Post(
            postData.id,
            postData.content,
            new User(
                postData.author.id,
                postData.author.username
            ),
            new Date(postData.created_at),
            fatherPostId,
            postData.likes_count,
            postData.dislikes_count,
            postData.images,
            postData.can_edit
        ));
    }


    static async reactToPost(postId: number, reactionType: number): Promise<string> {
        let formData = new FormData();
        formData.append('post_id', postId.toString());
        formData.append('reaction_type', reactionType.toString());

        const response = await fetch(`${Config.API_BASE_URL}/new_reaction.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'React to post failed');
        }
        return data.message;
    }

    static async uploadImage(imageFile: File, postId: number): Promise<string> {
        let formData = new FormData();
        formData.append('image', imageFile);
        formData.append('post_id', postId.toString());

        const response = await fetch(`${Config.API_BASE_URL}/upload_image.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Image upload failed');
        }
        return data.message;
    }

    static async deletePost(Id: number) {
        let formData = new FormData();
        formData.append('post_id', Id.toString());

        const response = await fetch(`${Config.API_BASE_URL}/delete_post.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Delete post failed');
        }
        return data.message;
    }

    static async banUser(userId: number, endDate: number, reason: string): Promise<string> {
        let formData = new FormData();
        formData.append('user_id', userId.toString());
        formData.append('end_date', endDate.toString());
        formData.append('reason', reason);

        const response = await fetch(`${Config.API_BASE_URL}/bann_user.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Ban user failed');
        }
        return data.message;
    }

    static async updateUserPassword(currentPassword: string, newPassword: string, altcha: string): Promise<string> {
        let formData = new FormData();
        formData.append('password', currentPassword);
        formData.append('new_password', newPassword);
        formData.append('altcha', altcha);
        
        const response = await fetch(`${Config.API_BASE_URL}/update_password.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Update password failed');
        }
        return data.message;
    }

    static async updateUserUsername(newUsername: string): Promise<string> {
        let formData = new FormData();
        formData.append('new_username', newUsername);

        const response = await fetch(`${Config.API_BASE_URL}/update_username.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Update username failed');
        }
        return data.message;
    }

    static async updateUserProfilePicture(imageFile: File): Promise<string> {
        let formData = new FormData();
        formData.append('profile_picture', imageFile);

        const response = await fetch(`${Config.API_BASE_URL}/update_profile_picture.php`, {
            method: 'POST',
            credentials: "include",
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Update profile picture failed');
        }
        return data.message;
    }

}