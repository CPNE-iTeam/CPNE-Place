<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/crypto.php");
include_once(dirname(__FILE__) . "/src/session.php");
include_once(dirname(__FILE__) . "/env.php");

require 'vendor/autoload.php';

use AltchaOrg\Altcha\Altcha;


$altcha = new Altcha(ALTCHA_HMAC_KEY);

$isValid = $altcha->verifySolution($_POST['altcha']);

if (!$isValid) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid captcha."]);
    exit();
}

$username = $_POST['username'];

$password = $_POST['password'];
$passwordHash = Crypto::hashPassword($password);

$user = new User(
    null,
    $username,
    $passwordHash
);

$db = new Database();

$sameNameUser = $db->get_user(username: $username);
if ($sameNameUser !== null) {
    http_response_code(409);
    echo json_encode(["message" => "Username already taken."]);
    exit;
}

$success = $db->create_user($user);

$userID = $db->getLastInsertId();
$user = new User(
    $userID,
    $username,
    $passwordHash
);


if ($success) {
    Session::login($user);
    http_response_code(201);
    echo json_encode(["message" => "User registered successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to register user."]);
}
