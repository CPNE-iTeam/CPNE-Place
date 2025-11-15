<?php
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/crypto.php");
include_once(dirname(__FILE__) . "/src/session.php");

$username = $_POST['username'];

$password = $_POST['password'];
$passwordHash = Crypto::hashPassword($password);

$user = new User(
    null,
    $username,
    $passwordHash
);

$db = new Database();
$success = $db->create_user($user);

if ($success) {
    Session::login($user);

    http_response_code(201);
    echo json_encode(["message" => "User registered successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to register user."]);
}
