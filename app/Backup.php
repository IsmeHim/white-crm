<?php

declare(strict_types=1);

namespace CRM;

use FilesystemIterator;
use InvalidArgumentException;
use PDO;
use PharData;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use Throwable;

/**
 * Encrypted Storage Backup Service (WCCRM2BKP1 format).
 *
 * Produces an authenticated XChaCha20-Poly1305 encrypted tar archive (.wcb)
 * containing a consistent SQLite snapshot and private file uploads,
 * fully compatible with scripts/restore.php.
 */
final class Backup
{
    public static function isEncryptionSupported(): bool
    {
        return extension_loaded('sodium') && class_exists(PharData::class);
    }

    /**
     * Create an encrypted .wcb backup file at $destPath and return its byte size.
     */
    public static function createEncrypted(string $password, string $destPath, ?PDO $pdo = null, string $storageDir = CRM_STORAGE): int
    {
        if (!extension_loaded('sodium')) {
            throw new RuntimeException('เซิร์ฟเวอร์ยังไม่เปิดใช้งานส่วนขยาย PHP sodium สำหรับการเข้ารหัสไฟล์สำรอง');
        }
        if (!class_exists(PharData::class)) {
            throw new RuntimeException('เซิร์ฟเวอร์ไม่รองรับ PharData สำหรับบีบอัดไฟล์สำรอง');
        }
        if (mb_strlen($password, 'UTF-8') < 12 || strlen($password) < 12) {
            throw new InvalidArgumentException('รหัสผ่านเข้ารหัสไฟล์สำรองต้องมีความยาวอย่างน้อย 12 ตัวอักษร');
        }
        if (file_exists($destPath)) {
            throw new RuntimeException('พบไฟล์สำรองชื่อซ้ำอยู่แล้ว กรุณาลองใหม่อีกครั้ง');
        }

        $storageDir = rtrim($storageDir, '/\\');
        $locksDir = $storageDir . '/locks';
        if (!is_dir($locksDir)) {
            @mkdir($locksDir, 0700, true);
        }

        $rand = bin2hex(random_bytes(8));
        $tmpSnap = sys_get_temp_dir() . '/wc-crm-bkp-snap-' . $rand . '.sqlite';
        $tmpTar = sys_get_temp_dir() . '/wc-crm-bkp-arch-' . $rand . '.tar';

        try {
            $guard = fopen($locksDir . '/global.lock', 'c+');
            if (!$guard || !flock($guard, LOCK_EX)) {
                throw new RuntimeException('ไม่สามารถล็อกสถานะฐานข้อมูลชั่วคราวเพื่อสำรองข้อมูลได้');
            }

            try {
                $dbFile = $storageDir . '/crm.sqlite';
                if (!is_file($dbFile)) {
                    throw new RuntimeException('ไม่พบไฟล์ฐานข้อมูลหลัก crm.sqlite');
                }

                $localPdo = $pdo;
                if ($localPdo === null) {
                    $localPdo = new PDO('sqlite:' . $dbFile, null, null, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    ]);
                    $localPdo->exec('PRAGMA busy_timeout = 5000');
                }

                // Flush WAL frames safely and produce an atomic SQLite snapshot
                try {
                    $localPdo->exec('PRAGMA wal_checkpoint(PASSIVE)');
                    $escapedSnap = str_replace("'", "''", $tmpSnap);
                    $localPdo->exec("VACUUM INTO '{$escapedSnap}'");
                } catch (Throwable) {
                    if (!@copy($dbFile, $tmpSnap)) {
                        throw new RuntimeException('ไม่สามารถสร้างสแนปช็อตฐานข้อมูล SQLite ได้');
                    }
                }

                if ($pdo === null) {
                    $localPdo = null;
                }

                $archive = new PharData($tmpTar);
                // Place crm.sqlite at archive root as required by scripts/restore.php
                $archive->addFile($tmpSnap, 'crm.sqlite');

                foreach (['.htaccess', '.gitkeep'] as $metaFile) {
                    $metaPath = $storageDir . '/' . $metaFile;
                    if (is_file($metaPath)) {
                        $archive->addFile($metaPath, $metaFile);
                    }
                }

                $uploadsDir = $storageDir . '/uploads';
                if (is_dir($uploadsDir)) {
                    $addedUpload = false;
                    $it = new RecursiveIteratorIterator(
                        new RecursiveDirectoryIterator($uploadsDir, FilesystemIterator::SKIP_DOTS)
                    );
                    foreach ($it as $fileInfo) {
                        if (!$fileInfo->isFile()) {
                            continue;
                        }
                        $relPath = str_replace('\\', '/', substr($fileInfo->getPathname(), strlen($uploadsDir) + 1));
                        if ($relPath === '' || str_contains($relPath, '..') || str_starts_with($relPath, '/')) {
                            continue;
                        }
                        $archive->addFile($fileInfo->getPathname(), 'uploads/' . $relPath);
                        $addedUpload = true;
                    }
                    if (!$addedUpload) {
                        $archive->addEmptyDir('uploads');
                    }
                } else {
                    $archive->addEmptyDir('uploads');
                }

                unset($archive);
            } finally {
                flock($guard, LOCK_UN);
                fclose($guard);
            }

            $in = fopen($tmpTar, 'rb');
            $out = fopen($destPath, 'xb');
            if (!$in || !$out) {
                if (is_resource($in)) {
                    fclose($in);
                }
                if (is_resource($out)) {
                    fclose($out);
                }
                throw new RuntimeException('ไม่สามารถสร้างไฟล์เข้ารหัสปลายทางได้');
            }

            try {
                $salt = random_bytes(SODIUM_CRYPTO_PWHASH_SALTBYTES);
                $key = sodium_crypto_pwhash(
                    SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_KEYBYTES,
                    $password,
                    $salt,
                    SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE,
                    SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE
                );
                [$state, $header] = sodium_crypto_secretstream_xchacha20poly1305_init_push($key);
                if (function_exists('sodium_memzero')) {
                    sodium_memzero($key);
                }

                if (fwrite($out, 'WCCRM2BKP1' . $salt . $header) === false) {
                    throw new RuntimeException('ไม่สามารถเขียนส่วนหัวของไฟล์เข้ารหัสได้');
                }

                do {
                    $chunk = fread($in, 1048576);
                    if ($chunk === false) {
                        throw new RuntimeException('เกิดข้อผิดพลาดขณะอ่านข้อมูลเพื่อเข้ารหัส');
                    }
                    $last = feof($in);
                    $tag = $last ? SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL : 0;
                    $cipher = sodium_crypto_secretstream_xchacha20poly1305_push($state, $chunk, '', $tag);
                    $frame = pack('N', strlen($cipher)) . $cipher;
                    if (fwrite($out, $frame) === false) {
                        throw new RuntimeException('ไม่สามารถเขียนบล็อกข้อมูลเข้ารหัสได้');
                    }
                } while (!$last);

                fflush($out);
            } finally {
                fclose($out);
                fclose($in);
            }

            @chmod($destPath, 0600);
            clearstatcache(true, $destPath);
            return (int)filesize($destPath);
        } catch (Throwable $e) {
            @unlink($destPath);
            throw $e;
        } finally {
            @unlink($tmpSnap);
            @unlink($tmpTar);
        }
    }
}
