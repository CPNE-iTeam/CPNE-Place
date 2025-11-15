<?php
include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/session.php");
include_once(dirname(__FILE__) . "/src/database.php");

header('Content-Type: application/json');

if (!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Please log in."]);
    exit();
}


$content = $_POST['content'];
$father_post_id = isset($_POST['father_post_id']) ? intval($_POST['father_post_id']) : null;

$author = Session::getCurrentUser();

$createdAt = new DateTime();

$post = new Post(
    null,
    $content,
    $author,
    $createdAt,
    $father_post_id,
    0,
    0
);

$db = new Database();
$success = $db->create_post($post);

if ($success) {
    http_response_code(201);
    echo json_encode(["message" => "Post created successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to create post."]);
}
