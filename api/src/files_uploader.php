<?php
include_once(dirname(__FILE__) . "/../config.php");

class FileUploader
{
    private string $uploadDir;

    public function __construct(string $uploadDir = UPLOAD_DIR)
    {
        $this->uploadDir = dirname(__FILE__) . "/../../" . rtrim($uploadDir, '/') . '/';
        if (!is_dir($this->uploadDir)) {
            if (!mkdir($this->uploadDir, 0755, true)) {
                throw new Exception("Impossible de créer le répertoire d'upload : " . $this->uploadDir);
            }
        }
    }

    public function uploadImage(array $file, int $newWidth = 800, ?int $newHeight = null, int $quality = 75): string
    {
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            throw new Exception("Erreur : le fichier n'a pas été uploadé correctement.");
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, ALLOWED_IMAGE_TYPES)) {
            throw new Exception("Erreur : type de fichier non autorisé. Types autorisés : " . implode(', ', ALLOWED_IMAGE_TYPES));
        }

        if ($file['size'] > MAX_IMAGE_SIZE) {
            throw new Exception(
                "Erreur : la taille du fichier dépasse la limite maximale de " .
                (MAX_IMAGE_SIZE / (1024 * 1024)) . " Mo."
            );
        }

        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $newFileName = uniqid("tmp1_", true) . "." . $fileExt;
        $destination = $this->uploadDir . $newFileName;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("Erreur : " . $this->codeToMessage($file['error']));
        }

        $compressedFileName = uniqid("img_", true) . "." . $fileExt;
        $compressedDestination = $this->uploadDir . $compressedFileName;

        if (!$this->resizeAndCompressImage($destination, $compressedDestination, $newWidth, $newHeight, $quality)) {
            throw new Exception("Erreur : impossible de redimensionner ou compresser l'image.");
        }

        unlink($destination);
        return $compressedDestination;
    }

    public function resizeAndCompressImage(
        string $source,
        string $destination,
        int $newWidth,
        ?int $newHeight = null,
        int $quality = 80
    ): bool {
        $fileExt = strtolower(pathinfo($source, PATHINFO_EXTENSION));

        if ($fileExt === 'gif') {
            // Use FFmpeg for animated GIFs
            $height = $newHeight ?? -1;
            $command = sprintf(
                'ffmpeg -i %s -vf "scale=%d:%d:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 %s 2>&1',
                escapeshellarg($source),
                $newWidth,
                $height,
                escapeshellarg($destination)
            );
            exec($command, $output, $returnVar);
            if ($returnVar !== 0) {
                error_log("FFmpeg error: " . implode("\n", $output));
            }
            return $returnVar === 0;
        } else {
            $imageInfo = getimagesize($source);
            if ($imageInfo === false) {
                return false;
            }

            list($width, $height, $type) = $imageInfo;
            if ($newHeight === null) {
                $newHeight = intval(($newWidth / $width) * $height);
            }

            $newImage = imagecreatetruecolor($newWidth, $newHeight);
            if ($type === IMAGETYPE_PNG) {
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);
            }

            switch ($type) {
                case IMAGETYPE_JPEG:
                    $sourceImage = imagecreatefromjpeg($source);
                    break;
                case IMAGETYPE_PNG:
                    $sourceImage = imagecreatefrompng($source);
                    break;
                case IMAGETYPE_GIF:
                    $sourceImage = imagecreatefromgif($source);
                    break;
                default:
                    return false;
            }

            imagecopyresampled(
                $newImage, $sourceImage,
                0, 0, 0, 0,
                $newWidth, $newHeight,
                $width, $height
            );

            switch ($type) {
                case IMAGETYPE_JPEG:
                    imagejpeg($newImage, $destination, $quality);
                    break;
                case IMAGETYPE_PNG:
                    imagepng($newImage, $destination, 7);
                    break;
                case IMAGETYPE_GIF:
                    imagegif($newImage, $destination);
                    break;
                default:
                    imagedestroy($newImage);
                    imagedestroy($sourceImage);
                    return false;
            }

            imagedestroy($newImage);
            imagedestroy($sourceImage);
            return true;
        }
    }

    public function deleteFile(string $filePath): bool
    {
        if (file_exists($filePath)) {
            return unlink($filePath);
        }
        return false;
    }

    private function codeToMessage(int $code): string
    {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return 'Le fichier uploadé dépasse la taille maximale autorisée.';
            case UPLOAD_ERR_PARTIAL:
                return 'Le fichier n\'a été que partiellement uploadé.';
            case UPLOAD_ERR_NO_FILE:
                return 'Aucun fichier n\'a été uploadé.';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Dossier temporaire manquant.';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Échec de l\'écriture du fichier sur le disque.';
            case UPLOAD_ERR_EXTENSION:
                return 'Une extension PHP a stoppé l\'upload du fichier.';
            default:
                return 'Erreur inconnue lors de l\'upload.';
        }
    }
}
