<?php 
include_once(dirname(__FILE__) . "/src/session.php");
header('Content-Type: application/json');

Session::logout();

echo json_encode(["message" => "User signed out successfully."]);