<?php 


class Reaction {
    private ?int $id;
    private int $user_ID;
    private int $post_ID;
    private int $reaction_type; // 1 for like, -1 for dislike

    public function __construct(?int $id, int $user_ID, int $post_ID, int $reaction_type)
    {
        $this->id = $id;
        $this->user_ID = $user_ID;
        $this->post_ID = $post_ID;

        if (!in_array($reaction_type, [1, -1])) {
            throw new InvalidArgumentException("Reaction type must be 1 (like) or -1 (dislike).");
            exit();
        }
        $this->reaction_type = $reaction_type;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUserID(): int
    {
        return $this->user_ID;
    }

    public function getPostID(): int
    {
        return $this->post_ID;
    }

    public function getReactionType(): int
    {
        return $this->reaction_type;
    }
}