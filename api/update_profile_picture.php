<?php
include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/session.php");
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/files_uploader.php");

header('Content-Type: application/json');


if (!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Please log in."]);
    exit();
}

if(!isset($_FILES["profile_picture"])) {
    http_response_code(400);
    echo json_encode(["message" => "No profile picture uploaded."]);
    exit();
}

$image = $_FILES["profile_picture"];

$uploader = new FileUploader();

$user = Session::getCurrentUser();


$filepath = $uploader->uploadImage($image, 100, 100, 50);

$filename = basename($filepath);

$db = new Database();

$newUser = new User(
    id: $user->getId(),
    username: $user->getUsername(),
    passwordHash: $user->getPasswordHash(),
    isCertified: $user->getIsCertified(),
    isModerator: $user->getIsModerator(),
    profileImage: $filename
);

$updated = $db->update_user($newUser);

if ($updated) {
    echo json_encode(["message" => "Profile picture updated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to update profile picture. Please try again later."]);
}