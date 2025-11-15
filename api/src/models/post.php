<?php

class Post
{
    private ?int $id;
    private string $content;
    private User $author;
    private DateTime $created_at;
    private ?int $father_post_id;
    private int $likes_count;
    private int $dislikes_count;
    private array $images;

    public function __construct(?int $id, string $content, User $author, DateTime $created_at, ?int $father_post_id, int $likes_count, int $dislikes_count, array $images = [])
    {
        $this->id = $id;

        if ($content == null || $this->validateContent($content) === false) {
            throw new InvalidArgumentException("Content must be between " . MIN_POST_LENGTH . " and " . MAX_POST_LENGTH . " characters.");
        }
        $this->content = $this->correctContent($content);
        $this->author = $author;
        $this->created_at = $created_at;
        $this->father_post_id = $father_post_id;
        $this->likes_count = $likes_count;
        $this->dislikes_count = $dislikes_count;
        $this->images = $images;
    }


    private function correctContent(string $content): string
    {
        return htmlspecialchars(strtolower($content));
    }

    private function validateContent(string $content): bool
    {
        if (filter_var($content, FILTER_VALIDATE_REGEXP, ['options' => ['regexp' => CONTENT_PATTERN]]) === false) {
            return false;
        }

        return true;
    }

    public function getId(): ?int
    {
        return $this->id;
    }
    public function getContent(): string
    {
        return $this->content;
    }
    public function getAuthor(): User
    {
        return $this->author;
    }
    public function getCreatedAt(): DateTime
    {
        return $this->created_at;
    }
    public function getFatherPostId(): ?int
    {
        return $this->father_post_id;
    }
    public function getLikesCount(): int
    {
        return $this->likes_count;
    }
    public function getDislikesCount(): int
    {
        return $this->dislikes_count;
    }
    public function getImages(): array
    {
        return $this->images;
    }
}
