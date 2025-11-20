<?php

declare(strict_types=1);

include_once(dirname(__FILE__) . "/../env.php");
include_once(dirname(__FILE__) . "/models/user.php");
include_once(dirname(__FILE__) . "/models/post.php");
include_once(dirname(__FILE__) . "/models/reaction.php");
include_once(dirname(__FILE__) . "/../config.php");


class Database
{
    private mysqli $conn;

    public function __construct()
    {
        $this->conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
        if ($this->conn->connect_error) {
            throw new RuntimeException("Connection failed: " . $this->conn->connect_error);
        }
    }

    public function select(string $sql, array $params = []): array
    {
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            throw new RuntimeException("Prepare failed: " . $this->conn->error);
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

    public function getLastInsertId(): int
    {
        return $this->conn->insert_id;
    }


    public function create_user(User $user)
    {
        $username = htmlspecialchars($user->getUsername());
        $passwordHash = $user->getPasswordHash();
        if ($username === null || $passwordHash === null) {
            throw new InvalidArgumentException("Username and password hash cannot be null.");
        }
        $sql = "INSERT INTO users (username, password_hash, is_certified, is_moderator, image_filename) VALUES (?, ?, ?, ?, ?)";
        return $this->query($sql, [
            $username,
            $passwordHash,
            $user->getIsCertified() ? '1' : '0',
            $user->getIsModerator() ? '1' : '0',
            $user->getProfileImage() ?? "NULL"
        ]);
    }


    public function update_user(User $user)
    {
        $username = htmlspecialchars($user->getUsername());
        $passwordHash = $user->getPasswordHash();
        if ($username === null || $passwordHash === null) {
            throw new InvalidArgumentException("Username and password hash cannot be null.");
        }
        $id = $user->getID();
        if ($id === null) {
            throw new InvalidArgumentException("User ID cannot be null for update.");
        }

        $sql = "UPDATE users SET username = ?, password_hash = ?, is_certified = ?, is_moderator = ?, image_filename = ? WHERE ID = ?";
        return $this->query($sql, [
            $username,
            $passwordHash,
            $user->getIsCertified() ? '1' : '0',
            $user->getIsModerator() ? '1' : '0',
            $user->getProfileImage() ?? "NULL",
            strval($id)
        ]);
        //$sql = "INSERT INTO users (username, password_hash, is_certified, is_moderator) VALUES (?, ?, ?, ?)";
        //return $this->query($sql, [$username, $passwordHash, $user->isCertified() ? '1' : '0', $user->getIsModerator() ? '1' : '0']);
    }


    public function get_user($userID = null, $username = null): ?User
    {
        if ($userID !== null) {
            $sql = "SELECT * FROM users WHERE ID = ?";
            $result = $this->select($sql, [strval($userID)]);
        } elseif ($username !== null) {
            $sql = "SELECT * FROM users WHERE username = ?";
            $result = $this->select($sql, [$username]);
        } else {
            throw new InvalidArgumentException("User must have either id or username set.");
        }
        if (count($result) === 0) {
            return null;
        }

        $row = $result[0];
        return new User(
            intval($row['ID']),
            $row['username'],
            $row['password_hash'],
            boolval($row['is_certified']),
            boolval($row['is_moderator']),
            $row['image_filename'] !== null && $row['image_filename'] !== 'NULL' ? $row['image_filename'] : null
        );
    }

    public function create_post(Post $post): bool
    {
        $content = htmlspecialchars($post->getContent());
        $authorId = $post->getAuthor()->getId();
        $createdAt = $post->getCreatedAt()->format('Y-m-d H:i:s');

        if ($content === null || $authorId === null || $createdAt === null) {
            throw new InvalidArgumentException("Post content, author ID, and creation date cannot be null.");
        }

        if ($post->getFatherPostId() !== null) {
            $fatherPostId = $post->getFatherPostId();
            $sql = "INSERT INTO posts (content, user_ID, created_at, father_post_id) VALUES (?, ?, ?, ?)";
            return $this->query($sql, [$content, strval($authorId), $createdAt, strval($fatherPostId)]);
        }

        $sql = "INSERT INTO posts (content, user_ID, created_at) VALUES (?, ?, ?)";
        return $this->query($sql, [$content, strval($authorId), $createdAt]);
    }

    private function buildPostQuery(): string
    {
        return "
        SELECT
            posts.ID AS ID,
            posts.content AS content,
            posts.created_at AS created_at,
            posts.user_ID AS user_ID,
            posts.father_post_ID AS father_post_ID,
            users.username AS username,
            users.is_certified AS is_certified,
            users.is_moderator AS is_moderator,
            users.image_filename as user_image_filename,
            COALESCE(SUM(CASE WHEN reactions.reaction_type = 1 THEN 1 END), 0) AS likes_count,
            COALESCE(SUM(CASE WHEN reactions.reaction_type = -1 THEN 1 END), 0) AS dislikes_count
        FROM posts
        LEFT JOIN users ON users.ID = posts.user_ID
        LEFT JOIN reactions ON reactions.post_ID = posts.ID
        /** WHERE_CLAUSE **/
        GROUP BY posts.ID, users.ID
        /** ORDER_CLAUSE **/
    ";
    }

    private function getOrderClause(string $sort): string
    {
        $allowed = [
            "newest" => "posts.created_at DESC",
            "oldest" => "posts.created_at ASC",
            "most_likes" => "likes_count DESC, posts.created_at DESC",
            "most_dislikes" => "dislikes_count DESC, posts.created_at DESC",
        ];

        return $allowed[$sort] ?? $allowed["newest"]; // default fallback
    }



    private function hydratePosts(array $rows): array
    {
        $posts = [];
        $userCache = [];

        // Batch-load images in a single query
        $images = $this->getImagesForPosts(postIds: array_column($rows, 'ID'));
        $videos = $this->getVideosForPosts(postIds: array_column($rows, 'ID'));

        foreach ($rows as $row) {

            $userId = intval($row['user_ID']);

            // Cache user object
            if (!isset($userCache[$userId])) {
                if ($row['username'] === null) {
                    throw new RuntimeException("Author missing for post " . $row['ID']);
                }

                $userCache[$userId] = new User(
                    $userId,
                    $row['username'],
                    "",
                    boolval($row['is_certified']),
                    boolval($row['is_moderator']),
                    $row['user_image_filename'] !== null && $row['user_image_filename'] !== 'NULL' ? (rtrim(UPLOAD_DIR, '/') . '/' . $row['user_image_filename']) : null
                );
            }

            $posts[] = new Post(
                intval($row['ID']),
                $row['content'],
                $userCache[$userId],
                new DateTime($row['created_at']),
                $row['father_post_ID'] !== null ? intval($row['father_post_ID']) : null,
                intval($row['likes_count']),
                intval($row['dislikes_count']),
                $images[$row['ID']] ?? [],
                $videos[$row['ID']] ?? []
            );
        }

        return $posts;
    }


    public function get_posts(
        ?bool $getComments = false,
        ?int $fatherPostId = null,
        ?int $limit = null,
        ?int $offset = null,
        string $sort = "newest"
    ): array {
        $query = $this->buildPostQuery();
        $params = [];

        // WHERE
        if ($getComments) {
            if ($fatherPostId === null) {
                throw new InvalidArgumentException("fatherPostId is required when getting comments.");
            }
            $query = str_replace("/** WHERE_CLAUSE **/", "WHERE posts.father_post_ID = ?", $query);
            $params[] = $fatherPostId;
        } else {
            $query = str_replace("/** WHERE_CLAUSE **/", "WHERE posts.father_post_ID IS NULL", $query);
        }

        // ORDER
        $orderClause = "ORDER BY " . $this->getOrderClause($sort);
        $query = str_replace("/** ORDER_CLAUSE **/", $orderClause, $query);

        // LIMIT/OFFSET
        if ($limit !== null) {
            $query .= " LIMIT ?";
            $params[] = $limit;
            if ($offset !== null) {
                $query .= " OFFSET ?";
                $params[] = $offset;
            }
        }

        $rows = $this->select($query, $params);
        return $this->hydratePosts($rows);
    }

    public function get_post(int $ID): Post
    {
        $query = str_replace("/** WHERE_CLAUSE **/", "WHERE posts.ID = ?", $this->buildPostQuery());
        $rows = $this->select($query, [$ID]);

        if (!$rows) {
            throw new RuntimeException("Post not found.");
        }

        return $this->hydratePosts($rows)[0];
    }


    public function get_user_posts(
        User $user,
        ?int $limit = null,
        ?int $offset = null,
        string $sort = "newest"
    ): array {
        $query = $this->buildPostQuery();
        $query = str_replace("/** WHERE_CLAUSE **/", "WHERE posts.user_ID = ?", $query);

        $orderClause = "ORDER BY " . $this->getOrderClause($sort);
        $query = str_replace("/** ORDER_CLAUSE **/", $orderClause, $query);

        $params = [$user->getID()];

        if ($limit !== null) {
            $query .= " LIMIT ?";
            $params[] = $limit;
            if ($offset !== null) {
                $query .= " OFFSET ?";
                $params[] = $offset;
            }
        }

        $rows = $this->select($query, $params);
        return $this->hydratePosts($rows);
    }


    public function get_images(int $postID): array
    {
        $sql = "SELECT filename FROM images WHERE post_ID = ?";
        $result = $this->select($sql, [strval($postID)]);
        $images = [];
        foreach ($result as $row) {
            $images[] = rtrim(UPLOAD_DIR, '/') . '/' . $row['filename'];
        }
        return $images;
    }

    private function getImagesForPosts(array $postIds): array
    {
        if (empty($postIds))
            return [];

        $placeholders = implode(',', array_fill(0, count($postIds), '?'));

        $sql = "SELECT post_ID, filename FROM images WHERE post_ID IN ($placeholders)";
        $rows = $this->select($sql, $postIds);

        $images = [];
        foreach ($rows as $row) {
            $images[$row['post_ID']][] = rtrim(UPLOAD_DIR, '/') . '/' . $row['filename'];
        }

        return $images;
    }

    public function get_videos(int $postID): array
    {
        $sql = "SELECT filename FROM videos WHERE post_ID = ?";
        $result = $this->select($sql, [strval($postID)]);
        $videos = [];
        foreach ($result as $row) {
            $videos[] = rtrim(UPLOAD_DIR, '/') . '/' . $row['filename'];
        }
        return $videos;
    }

    private function getVideosForPosts(array $postIds): array
    {
        if (empty($postIds))
            return [];

        $placeholders = implode(',', array_fill(0, count($postIds), '?'));

        $sql = "SELECT post_ID, filename FROM videos WHERE post_ID IN ($placeholders)";
        $rows = $this->select($sql, $postIds);

        $videos = [];
        foreach ($rows as $row) {
            $videos[$row['post_ID']][] = rtrim(UPLOAD_DIR, '/') . '/' . $row['filename'];
        }

        return $videos;
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

    public function new_image_upload(int $postID, string $filename): bool
    {
        $sql = "INSERT INTO images (post_ID, filename) VALUES (?, ?)";
        return $this->query($sql, [strval($postID), $filename]);
    }

    public function new_video_upload(int $postID, string $filename): bool
    {
        $sql = "INSERT INTO videos (post_ID, filename) VALUES (?, ?)";
        return $this->query($sql, [strval($postID), $filename]);
    }

    public function delete_post(int $postID): bool
    {

        $sql = "DELETE FROM reactions WHERE post_ID = ?";
        $r = $this->query($sql, [strval($postID)]);


        $sql = "DELETE FROM images WHERE post_ID = ?";
        $r = $this->query($sql, [strval($postID)]) && $r;

        $sql = "DELETE FROM videos WHERE post_ID = ?";
        $r = $this->query($sql, [strval($postID)]) && $r;

        $sql = "DELETE FROM posts WHERE ID = ?";
        $r = $this->query($sql, [strval($postID)]) && $r;

        return $r;
    }

    public function new_banned_user(int $userID, DateTime $banUntil, string $reason, int $moderatorID): bool
    {
        $sql = "INSERT INTO banned_users (user_ID, end_date, reason, moderator_ID) VALUES (?, ?, ?, ?)";
        return $this->query($sql, [strval($userID), $banUntil->format('Y-m-d H:i:s'), htmlspecialchars($reason), strval($moderatorID)]);
    }

    public function get_user_bann(int $userID): array
    {
        $currentTime = new DateTime();

        $sql = "DELETE FROM banned_users WHERE end_date <= ?";
        $this->query($sql, [$currentTime->format('Y-m-d H:i:s')]);

        $sql = "SELECT * FROM banned_users WHERE user_ID = ?";
        $result = $this->select($sql, [strval($userID)]);

        return $result;
    }
}
