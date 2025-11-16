<?php

include_once __DIR__ . '/models/Post.php';
include_once __DIR__ . '/models/User.php';
include_once __DIR__ . '/src/database.php';
include_once __DIR__ . '/src/session.php';

if (!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit();
}

$user = Session::getCurrentUser();
$post_id = $_POST['post_id'] ?? null;

if ($post_id === null) {
    http_response_code(400);
    echo json_encode(["error" => "Post ID is required"]);
    exit();
}
$database = new Database();

try {
    $post = $database->get_post(intval($post_id));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Failed to retrieve post"]);
    exit();
}

if ($post->getAuthor()->getId() !== $user->getId() && !$user->isModerator()) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit();
}

$success = $database->delete_post(intval($post_id));
if ($success) {
    echo json_encode(["message" => "Post deleted successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to delete post"]);
}
?>