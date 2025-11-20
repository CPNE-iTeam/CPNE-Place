<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include_once(dirname(__FILE__) . "/env.php");


require 'vendor/autoload.php';

use AltchaOrg\Altcha\ChallengeOptions;
use AltchaOrg\Altcha\Altcha;

$altcha = new Altcha(ALTCHA_HMAC_KEY);

// Create a new challenge
$options = new ChallengeOptions(
    maxNumber: 100000, // the maximum random number
    expires: (new \DateTimeImmutable())->add(new \DateInterval('PT10S')),
);

$challenge = $altcha->createChallenge($options);
echo json_encode($challenge);