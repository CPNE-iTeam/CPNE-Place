<?php

require_once(dirname(__FILE__) . "/models/user.php");
include_once(dirname(__FILE__) . "/database.php");

session_start();


class Session
{
    public static function login(User $user)
    {
        $_SESSION["account_loggedin"] = true;
        $_SESSION["account_id"] = $user->getId();
    }

    public static function logout()
    {

        session_unset();
        session_destroy();
    }

    public static function getCurrentUser(): ?User
    {
        if (!self::isLoggedIn()) {
            throw new Exception("No user is currently logged in.");
            exit();
        }

        $userId = $_SESSION["account_id"];
        $db = new Database();
        $user = $db->get_user($userId);
        
        return new User($userId, $user->getUsername(), $user->getPasswordHash());
    }

    public static function isLoggedIn(): bool
    {
        return isset($_SESSION["account_loggedin"]) && $_SESSION["account_loggedin"] === true && isset($_SESSION["account_id"]);
    }
}
