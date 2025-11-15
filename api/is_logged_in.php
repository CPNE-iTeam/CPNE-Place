<?php


include_once(dirname(__FILE__) . "/src/session.php");
header('Content-Type: application/json');

echo json_encode(["logged_in" => Session::isLoggedIn()]);
