<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/database.php");



$db = new Database();

$ID = intval($_POST['ID']);
$post = $db->get_post($ID);

header('Content-Type: application/json');


$result = [
    "id" => $post->getId(),
    "content" => $post->getContent(),
    "author" => [
        "id" => $post->getAuthor()->getId(),
        "username" => $post->getAuthor()->getUserName(),
        "is_certified" => $post->getAuthor()->isCertified(),
    ],
    "created_at" => $post->getCreatedAt()->format(DateTime::ATOM),
    "likes_count" => $post->getLikesCount(),
    "dislikes_count" => $post->getDislikesCount(),
    "images" => $post->getImages()
];

echo json_encode($result);