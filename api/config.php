<?php 

const MAX_POST_LENGTH = 1000;
const MIN_POST_LENGTH = 1;
const CONTENT_PATTERN = '/^.{' . MIN_POST_LENGTH . ',' . MAX_POST_LENGTH . '}$/';

const MAX_USERNAME_LENGTH = 25;
const MIN_USERNAME_LENGTH = 3;
const USERNAME_PATTERN = '/^[a-z0-9_.]{' . MIN_USERNAME_LENGTH . ',' . MAX_USERNAME_LENGTH . '}$/';

const UPLOAD_DIR = 'uploads/';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4 MB
const MAX_MEDIAS_PER_POST = 5;

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 Mo
