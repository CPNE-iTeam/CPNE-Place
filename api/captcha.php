<?php
include_once(dirname(__FILE__) . "/env.php");


require 'vendor/autoload.php';

use AltchaOrg\Altcha\ChallengeOptions;
use AltchaOrg\Altcha\Altcha;

$altcha = new Altcha(ALTCHA_HMAC_KEY);

// Create a new challenge
$options = new ChallengeOptions(
    maxNumber: 50000, // the maximum random number
    expires: (new \DateTimeImmutable())->add(new \DateInterval('PT10S')),
);

$challenge = $altcha->createChallenge($options);
echo json_encode($challenge);