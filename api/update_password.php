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

require 'vendor/autoload.php';

use AltchaOrg\Altcha\Altcha;

header('Content-Type: application/json');


$altcha = new Altcha(ALTCHA_HMAC_KEY);

$isValid = $altcha->verifySolution($_POST['altcha']);

if (!$isValid) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid captcha."]);
    exit();
}

if (!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Please log in."]);
    exit();
}

$user = Session::getCurrentUser();

$password = $_POST["password"];
$newPassword = $_POST["new_password"];

if (!Crypto::verifyPassword($password, $user->getPasswordHash())) {
    http_response_code(403);
    echo json_encode(["message" => "Current password is incorrect."]);
    exit();
}

$newPasswordHash = Crypto::hashPassword($newPassword);
$newUser = new User(
    id: $user->getId(),
    username: $user->getUsername(),
    passwordHash: $newPasswordHash,
    isCertified: $user->getIsCertified(),
    isModerator: $user->getIsModerator()
);

$db = new Database();
$updated = $db->update_user($newUser);

if ($updated) {
    echo json_encode(["message" => "Password updated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to update password. Please try again later."]);
}
