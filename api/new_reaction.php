<?php 
include_once(dirname(__FILE__) . "/src/models/reaction.php");
include_once(dirname(__FILE__) . "/src/models/user.php");
include_once(dirname(__FILE__) . "/src/models/post.php");
include_once(dirname(__FILE__) . "/src/database.php");
include_once(dirname(__FILE__) . "/src/session.php");

if(!Session::isLoggedIn()) {
    http_response_code(401);
    echo json_encode(["message" => "Unauthorized. Please log in."]);
    exit();
}

$db = new Database();   

$reaction_type = intval($_POST['reaction_type']);

$post_id = intval($_POST['post_id']);

$user = Session::getCurrentUser();


$reaction = new Reaction(
    null,
    $user->getId(),
    $post_id,
    $reaction_type
);

$success = $db->new_reaction($reaction);
if ($success) {
    http_response_code(200);
    echo json_encode(["message" => "Reaction recorded successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to record reaction."]);
}