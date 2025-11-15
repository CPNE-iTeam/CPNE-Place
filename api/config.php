<?php 

const MAX_POST_LENGTH = 1000;
const MIN_POST_LENGTH = 1;
const CONTENT_PATTERN = '/^.{' . MIN_POST_LENGTH . ',' . MAX_POST_LENGTH . '}$/';

const MAX_USERNAME_LENGTH = 25;
const MIN_USERNAME_LENGTH = 3;
const USERNAME_PATTERN = '/^[a-z0-9_.]{' . MIN_USERNAME_LENGTH . ',' . MAX_USERNAME_LENGTH . '}$/';

const UPLOAD_DIR = 'uploads/';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB