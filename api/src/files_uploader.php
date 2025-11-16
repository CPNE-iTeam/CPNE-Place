<?php
include_once(dirname(__FILE__) . "/../config.php");


class FileUploader
{
    private $uploadDir;

    public function __construct($uploadDir = UPLOAD_DIR)
    {
        $this->uploadDir = dirname(__FILE__) . "/../../" . rtrim($uploadDir, '/') . '/';
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    public function uploadImage($file)
    {
        if (!in_array($file['type'], ALLOWED_IMAGE_TYPES)) {
            throw new Exception("Error: Invalid file type!");
        }
        if ($file['size'] > MAX_IMAGE_SIZE) {
            throw new Exception("Error: File size exceeds the maximum limit: " . (MAX_IMAGE_SIZE / (1024 * 1024)) . " MB");
        }

        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $newFileName = uniqid("tmp1_", true) . "." . $fileExt;
        $destination = $this->uploadDir . $newFileName;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("Error: " . $this->codeToMessage($file['error']));
        }

        // Compress and resize
        $compressedFileName = uniqid("img_", true) . "." . $fileExt;
        $compressedDestination = $this->uploadDir . $compressedFileName;
        $this->resizeAndCompressImage($destination, $compressedDestination, 800, 75);

        // Clean up
        unlink($destination);

        return $compressedDestination;
    }


    function resizeAndCompressImage($source, $destination, $newWidth, $quality = 80)
    {
        list($width, $height, $type) = getimagesize($source);
        $newHeight = ($newWidth / $width) * $height; // Maintain aspect ratio
        $newImage = imagecreatetruecolor($newWidth, $newHeight);

        switch ($type) {
            case IMAGETYPE_JPEG:
                $sourceImage = imagecreatefromjpeg($source);
                break;
            case IMAGETYPE_PNG:
                $sourceImage = imagecreatefrompng($source);
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);
                break;
            case IMAGETYPE_GIF:
                $sourceImage = imagecreatefromgif($source);
                break;
            default:
                return false; // Unsupported format
        }

        imagecopyresampled($newImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Save with specified quality
        if ($type == IMAGETYPE_JPEG) {
            imagejpeg($newImage, $destination, $quality);
        } elseif ($type == IMAGETYPE_PNG) {
            imagepng($newImage, $destination, 7); // Compression level 7
        } elseif ($type == IMAGETYPE_GIF) {
            imagegif($newImage, $destination);
        }

        imagedestroy($newImage);
        imagedestroy($sourceImage);
    }

    public function deleteFile($filePath)
    {
        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }


    private function codeToMessage($code)
    {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'The uploaded file exceeds the maximum size limit.';
            case UPLOAD_ERR_PARTIAL:
                return 'The uploaded file was only partially uploaded.';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded.';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Missing a temporary folder.';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Failed to write file to disk.';
            case UPLOAD_ERR_EXTENSION:
                return 'A PHP extension stopped the file upload.';
            default:
                return 'Unknown upload error.';
        }
    }
}
