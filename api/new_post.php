<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
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

const POSTS_TIME_LIMIT_SECONDS = 5;


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
    echo json_encode(["message" => "Post created successfully.", "post_id" => $db->getLastInsertId()]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to create post."]);
}
