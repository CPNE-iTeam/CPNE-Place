<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/session.php");
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/crypto.php");

header('Content-Type: application/json');


if (!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Please log in."]);
    exit();
}

$user = Session::getCurrentUser();

$newUsername = $_POST["new_username"];


$newUser = new User(
    id: $user->getId(),
    username: $newUsername,
    passwordHash: $user->getPasswordHash(),
    isCertified: $user->getIsCertified(),
    isModerator: $user->getIsModerator()
);

$db = new Database();

$sameNameUser = $db->get_user(username: $newUsername);
if ($sameNameUser !== null) {
    http_response_code(409);
    echo json_encode(["message" => "Username already taken."]);
    exit();
}

$updated = $db->update_user($newUser);

if ($updated) {
    echo json_encode(["message" => "Username updated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to update username. Please try again later."]);
}
