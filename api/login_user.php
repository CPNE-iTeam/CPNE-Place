<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/crypto.php");
include_once(dirname(__FILE__) . "/src/session.php");

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


$username = $_POST['username'];
$password = $_POST['password'];

$db = new Database();

try {
    $user = $db->get_user(null, $username);
} catch (Exception $e) {
    // echo $e->getMessage();
    http_response_code(401);
    echo json_encode(["message" => "Invalid username."]);
    exit();
}

if ($user == null) {
    http_response_code(401);
    echo json_encode(["message" => "Invalid username."]);
    exit();
}

$bannedUser = $db->get_user_bann($user->getID());

if (count($bannedUser) > 0) {
    http_response_code(200);
    echo json_encode(["message" => "You are banned until " . date('Y-m-d H:i:s', strtotime($bannedUser[0]['end_date'])) . ". Reason: " . $bannedUser[0]['reason'], "is_banned" => true, "ban_end_date" => strtotime($bannedUser[0]['end_date']), "ban_reason" => $bannedUser[0]['reason']]);
    exit();
}

if (Crypto::verifyPassword($password, $user->getPasswordHash())) {
    Session::login($user);

    http_response_code(200);
    echo json_encode(["message" => "Login successful."]);
    exit();
} else {
    http_response_code(401);
    echo json_encode(["message" => "Invalid password."]);
    exit();
}
