<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/database.php");


$father_post_id = intval($_POST['father_post_id']);


$db = new Database();
$comments = $db->get_posts(true, $father_post_id);

header('Content-Type: application/json');

$results = [];

foreach ($comments as $comment) {
    $results[] = [
        "id" => $comment->getId(),
        "content" => $comment->getContent(),
        "author" => [
            "id" => $comment->getAuthor()->getId(),
            "username" => $comment->getAuthor()->getUserName()
        ],
        "created_at" => $comment->getCreatedAt()->format(DateTime::ATOM),
        "likes_count" => $comment->getLikesCount(),
        "dislikes_count" => $comment->getDislikesCount()
    ];
}
echo json_encode($results);
