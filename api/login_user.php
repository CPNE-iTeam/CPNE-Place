<?php
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/crypto.php");
include_once(dirname(__FILE__) . "/src/session.php");

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
