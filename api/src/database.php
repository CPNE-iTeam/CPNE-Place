<?php

declare(strict_types=1);

include_once(dirname(__FILE__) . "/../env.php");
include_once(dirname(__FILE__) . "/models/user.php");
include_once(dirname(__FILE__) . "/models/reaction.php");

class Database
{
    private mysqli $conn;

    public function __construct()
    {
        $this->conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
        if ($this->conn->connect_error) {
            throw new RuntimeException("Connection failed: " . $this->conn->connect_error);
            exit();
        }
    }

    public function select(string $sql, array $params = []): array
    {
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new RuntimeException("Prepare failed: " . $this->conn->error);
            exit();
        }
        if (!empty($params)) {
            $stmt->bind_param(str_repeat('s', count($params)), ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        return $data;
    }

    public function query(string $sql, array $params = []): bool
    {
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new RuntimeException("Prepare failed: " . $this->conn->error);
            exit();
        }
        if (!empty($params)) {
            $stmt->bind_param(str_repeat('s', count($params)), ...$params);
        }
        return $stmt->execute();
    }

    public function closeConnection(): void
    {
        $this->conn->close();
    }

    public function __destruct()
    {
        $this->closeConnection();
    }


    public function create_user(User $user)
    {
        $username = $user->getUsername();
        $passwordHash = $user->getPasswordHash();
        if ($username === null || $passwordHash === null) {
            throw new InvalidArgumentException("Username and password hash cannot be null.");
            exit();
        }
        $sql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
        return $this->query($sql, [$username, $passwordHash]);
    }

    public function get_user($userID = null, $username = null): User
    {
        if ($userID !== null) {
            $sql = "SELECT * FROM users WHERE id = ?";
            $result = $this->select($sql, [strval($userID)]);
        } elseif ($username !== null) {
            $sql = "SELECT * FROM users WHERE username = ?";
            $result = $this->select($sql, [$username]);
        } else {
            throw new InvalidArgumentException("User must have either id or username set.");
            exit();
        }
        if (count($result) === 0) {
            throw new RuntimeException("User not found.");
            exit();
        }

        $row = $result[0];
        return new User(
            intval($row['ID']),
            $row['username'],
            $row['password_hash'],
        );
    }

    public function create_post(Post $post): bool
    {
        $content = $post->getContent();
        $authorId = $post->getAuthor()->getId();
        $createdAt = $post->getCreatedAt()->format('Y-m-d H:i:s');

        if ($content === null || $authorId === null || $createdAt === null) {
            throw new InvalidArgumentException("Post content, author ID, and creation date cannot be null.");
            exit();
        }

        if ($post->getFatherPostId() !== null) {
            $fatherPostId = $post->getFatherPostId();
            $sql = "INSERT INTO posts (content, user_ID, created_at, father_post_id) VALUES (?, ?, ?, ?)";
            return $this->query($sql, [$content, strval($authorId), $createdAt, strval($fatherPostId)]);
        }

        $sql = "INSERT INTO posts (content, user_ID, created_at) VALUES (?, ?, ?)";
        return $this->query($sql, [$content, strval($authorId), $createdAt]);
    }


    public function get_posts(?bool $getComments = false, ?int $fatherPostId = null): array
    {
        if ($getComments) {
            if ($fatherPostId === null) {
                throw new InvalidArgumentException("Father post ID must be provided to get comments.");
                exit();
            }
            $sql = "
                SELECT
                    posts.ID AS ID,
                    posts.content AS content,
                    posts.created_at AS created_at,
                    posts.user_ID AS user_ID,
                    posts.father_post_id AS father_post_ID,
                    users.username AS username,
                    users.password_hash AS password_hash,
                    COALESCE(SUM(CASE WHEN reactions.reaction_type = 1 THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN reactions.reaction_type = -1 THEN 1 ELSE 0 END), 0) AS dislikes_count
                FROM posts
                LEFT JOIN users ON users.ID = posts.user_ID
                LEFT JOIN reactions ON reactions.post_ID = posts.ID
                WHERE posts.father_post_id = ?
                GROUP BY posts.ID, posts.content, posts.created_at, posts.user_ID, users.username, users.password_hash
                ORDER BY posts.created_at DESC
            ";
            $result = $this->select($sql, [strval($fatherPostId)]);
        } else {
            $sql = "
                SELECT
                    posts.ID AS ID,
                    posts.content AS content,
                    posts.created_at AS created_at,
                    posts.user_ID AS user_ID,
                    users.username AS username,
                    users.password_hash AS password_hash,
                    COALESCE(SUM(CASE WHEN reactions.reaction_type = 1 THEN 1 ELSE 0 END), 0) AS likes_count,
                    COALESCE(SUM(CASE WHEN reactions.reaction_type = -1 THEN 1 ELSE 0 END), 0) AS dislikes_count
                FROM posts
                LEFT JOIN users ON users.ID = posts.user_ID
                LEFT JOIN reactions ON reactions.post_ID = posts.ID
                WHERE posts.father_post_id IS NULL
                GROUP BY posts.ID, posts.content, posts.created_at, posts.user_ID, users.username, users.password_hash
                ORDER BY posts.created_at DESC
            ";
            $result = $this->select($sql);
        }


        $posts = [];
        foreach ($result as $row) {
            if ($row['username'] === null) {
                throw new RuntimeException("Author not found for post " . intval($row['ID']));
                exit();
            }

            $author = new User(
                intval($row['user_ID']),
                $row['username'],
                $row['password_hash']
            );

            $post = new Post(
                intval($row['ID']),
                $row['content'],
                $author,
                new DateTime($row['created_at']),
                $getComments ? intval($row['father_post_ID']) : null,
                intval($row['likes_count']),
                intval($row['dislikes_count'])
            );
            $posts[] = $post;
        }
        return $posts;
    }

    public function get_post(int $ID): Post
    {

        $sql = "
            SELECT
                posts.ID AS ID,
                posts.content AS content,
                posts.created_at AS created_at,
                posts.user_ID AS user_ID,
                posts.father_post_ID AS father_post_ID,
                users.username AS username,
                users.password_hash AS password_hash,
                COALESCE(SUM(CASE WHEN reactions.reaction_type = 1 THEN 1 ELSE 0 END), 0) AS likes_count,
                COALESCE(SUM(CASE WHEN reactions.reaction_type = -1 THEN 1 ELSE 0 END), 0) AS dislikes_count
            FROM posts
            LEFT JOIN users ON users.ID = posts.user_ID
            LEFT JOIN reactions ON reactions.post_ID = posts.ID
            WHERE posts.ID = ?
            GROUP BY posts.ID, posts.content, posts.created_at, posts.user_ID, users.username, users.password_hash
            ORDER BY posts.created_at DESC
            ";
        $result = $this->select($sql, [strval($ID)]);

        if (count($result) === 0) {
            throw new RuntimeException("Post not found.");
            exit();
        }

        $row = $result[0];
        if ($row['username'] === null) {
            throw new RuntimeException("Author not found for post " . intval($row['ID']));
            exit();
        }

        $author = new User(
            intval($row['user_ID']),
            $row['username'],
            $row['password_hash']
        );

        $post = new Post(
            intval($row['ID']),
            $row['content'],
            $author,
            new DateTime($row['created_at']),
            $row['father_post_ID'] !== null ? intval($row['father_post_ID']) : null,
            intval($row['likes_count']),
            intval($row['dislikes_count'])
        );

        return $post;
    }




    // public function get_comments(int $fatherPostId): array
    // {
    //     $sql = "SELECT * FROM posts WHERE father_post_id = ? ORDER BY created_at ASC";
    //     $result = $this->select($sql, [strval($fatherPostId)]);
    //     $comments = [];
    //     foreach ($result as $row) {
    //         $author = $this->get_user(intval($row['user_ID']));
    //         $comment = new Post(
    //             intval($row['ID']),
    //             $row['content'],
    //             $author,
    //             new DateTime($row['created_at']),
    //             intval($row['father_post_ID'])
    //         );
    //         $comments[] = $comment;
    //     }
    //     return $comments;
    // }




    public function new_reaction(Reaction $reaction): bool
    {
        if ($reaction->getUserID() === null || $reaction->getPostID() === null || $reaction->getReactionType() === null) {
            throw new InvalidArgumentException("Reaction must have user ID, reaction type, and post ID set.");
            exit();
        }

        $userId = strval($reaction->getUserID());
        $postId = strval($reaction->getPostID());
        $newType = strval($reaction->getReactionType());

        // Check existing reaction
        $sql = "SELECT reaction_type FROM reactions WHERE user_ID = ? AND post_ID = ?";
        $result = $this->select($sql, [$userId, $postId]);

        if (count($result) > 0) {
            $existingType = strval($result[0]['reaction_type']);
            if ($existingType === $newType) {
                // Same reaction again -> remove it
                $sql = "DELETE FROM reactions WHERE user_ID = ? AND post_ID = ?";
                return $this->query($sql, [$userId, $postId]);
            } else {
                // Different reaction -> update it
                $sql = "UPDATE reactions SET reaction_type = ? WHERE user_ID = ? AND post_ID = ?";
                return $this->query($sql, [$newType, $userId, $postId]);
            }
        } else {
            // No existing reaction -> insert
            $sql = "INSERT INTO reactions (user_ID, post_ID, reaction_type) VALUES (?, ?, ?)";
            return $this->query($sql, [$userId, $postId, $newType]);
        }
    }
}
