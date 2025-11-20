<?php
include_once(dirname(__FILE__) . "/src/session.php");
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/files_uploader.php");

header('Content-Type: application/json');

if (!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Please log in."]);
    exit();
}

if (!isset($_POST['post_id'])) {
    http_response_code(400);
    echo json_encode(["message" => "No post ID provided."]);
    exit();
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(["message" => "No image file provided."]);
    exit();
}



$postid = intval($_POST['post_id']);
$db = new Database();

$user = Session::getCurrentUser();

try {
    $post = $db->get_post($postid);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Database error: " . $e->getMessage()]);
    exit();
}

if ($post->getAuthor()->getId() !== $user->getId()) {
    http_response_code(403);
    echo json_encode(["message" => "Forbidden. You do not have permission."]);
    exit();
}

if (count($db->get_images($postid)) >= MAX_IMAGES_PER_POST) {
    http_response_code(400);
    echo json_encode(["message" => "Maximum number of images reached for this post."]);
    exit();
}

$uploader = new FileUploader();

try {
    $path = $uploader->uploadImage($_FILES['image']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "File upload error: " . $e->getMessage()]);
    exit();
}

$db = new Database();
$db->new_image_upload($postid, basename($path));

http_response_code(200);
echo json_encode(["message" => "Image uploaded successfully.", "path" => $path]);
