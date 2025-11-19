<?php
include_once(dirname(__FILE__) . "/../../config.php");

class User
{
    private ?int $id;
    private string $username;
    private string $passwordHash;
    private bool $isCertified;
    private bool $isModerator;
    private ?string $profileImage;

    public function __construct(?int $id, string $username, string $passwordHash, bool $isCertified = false, bool $isModerator = false, ?string $profileImage = null)
    {
        $this->id = $id;

        if ($username != null && $this->validateUsername($username) === false) {
            throw new InvalidArgumentException("Username must be between " . MIN_USERNAME_LENGTH . " and " . MAX_USERNAME_LENGTH . " characters and contain only letters, numbers, underscores, or hyphens.");
        }
        
        $this->username = $username;
        $this->passwordHash = $passwordHash;
        $this->isCertified = $isCertified;
        $this->isModerator = $isModerator;
        $this->profileImage = $profileImage;
    }


    private function validateUsername(string $username): bool
    {
        if (filter_var($username, FILTER_VALIDATE_REGEXP, ['options' => ['regexp' => USERNAME_PATTERN]]) === false) {
            return false; 
        }

        return true;
    }

    public function getId(): ?int
    {
        return $this->id;
    }
    public function getUsername(): string
    {
        return $this->username;
    }
    public function getPasswordHash(): string
    {
        return $this->passwordHash;
    }
    public function getIsCertified(): bool
    {
        return $this->isCertified;
    }
    public function getIsModerator(): bool
    {
        return $this->isModerator;
    }
    public function getProfileImage(): ?string
    {
        return $this->profileImage;
    }
}
