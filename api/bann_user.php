<?php 
require_once __DIR__ . '/src/database.php';
require_once __DIR__ . '/src/session.php';


if (!Session::isLoggedIn()){
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit();
}

$user = Session::getCurrentUser();

if (!$user->isModerator()){
    http_response_code(403);
    echo json_encode(['message' => 'Forbidden']);
    exit();
}

$user_id = $_POST['user_id'] ?? null;
$endDate = $_POST['end_date'] ?? null;
$reason = $_POST['reason'] ?? null;

if (!$user_id || !$endDate || !$reason){
    http_response_code(400);
    echo json_encode(['message' => 'Bad Request']);
    exit();
}

$db = new Database();

$success = $db->new_banned_user(intval($user_id), intval($endDate), $reason, $user->getID());

if ($success){
    http_response_code(200);
    echo json_encode(['message' => 'User banned successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Internal Server Error']);
}