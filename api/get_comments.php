<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/session.php");


$father_post_id = intval($_POST['father_post_id']);


$db = new Database();
$comments = $db->get_posts(true, $father_post_id);

header('Content-Type: application/json');


$isLoggedIn = Session::isLoggedIn();
if ($isLoggedIn)
    $currentUser = Session::getCurrentUser();


$results = [];

foreach ($comments as $comment) {
    $postArray = $comment->toArray();

    if ($isLoggedIn) {
        $postArray['can_edit'] = ($currentUser->getId() === $comment->getAuthor()->getId() || $currentUser->isModerator());
    } else {
        $postArray['can_edit'] = false;
    }

    $results[] = $postArray;
}
echo json_encode($results);
