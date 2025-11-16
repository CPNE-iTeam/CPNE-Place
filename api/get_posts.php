<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/database.php");



$db = new Database();
$posts = $db->get_posts();

header('Content-Type: application/json');

$results = [];

foreach ($posts as $post) {
    $results[] = $post->toArray();
}
echo json_encode($results);
