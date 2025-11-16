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


$result = $post->toArray();

echo json_encode($result);