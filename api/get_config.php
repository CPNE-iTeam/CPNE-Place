<?php 

include_once __DIR__ . '/config.php';

$response = [
    'max_post_length' => MAX_POST_LENGTH,
    'min_post_length' => MIN_POST_LENGTH,
    'content_pattern' => CONTENT_PATTERN,
    'max_username_length' => MAX_USERNAME_LENGTH,
    'min_username_length' => MIN_USERNAME_LENGTH,
    'username_pattern' => USERNAME_PATTERN,
    'allowed_image_types' => ALLOWED_IMAGE_TYPES,
    'max_image_size' => MAX_IMAGE_SIZE,
    'max_images_per_post' => MAX_IMAGES_PER_POST,
];  

echo json_encode($response);