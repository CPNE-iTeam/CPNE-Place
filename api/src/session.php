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
        }

        $userId = $_SESSION["account_id"];
        $db = new Database();
        $user = $db->get_user($userId);

        return $user;
    }

    public static function isLoggedIn(): bool
    {
        if (isset($_SESSION["account_id"])) {
            $db = new Database();
            $user = $db->get_user($_SESSION["account_id"]);
            $bannedUser = $db->get_user_bann($user->getID());
            if (!empty($bannedUser)) {
                self::logout();
                return false;
            }
        }
        return isset($_SESSION["account_loggedin"]) && $_SESSION["account_loggedin"] === true && isset($_SESSION["account_id"]);
    }
}
