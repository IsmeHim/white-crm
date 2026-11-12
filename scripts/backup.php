<?php

declare(strict_types=1);
/** Encrypted streaming backup (tar -> libsodium secretstream). CLI only.
 * Password supplied with CRM_BACKUP_PASSWORD environment variable.
 * Backup does not include app code/config, only private storage.
 */
if (PHP_SAPI !== 'cli') exit('CLI only');
require dirname(__DIR__) . '/app/bootstrap.php';
if (!extension_loaded('sodium')) {
    fwrite(STDERR, "Extension sodium is required for encrypted backups.\n");
    exit(1);
}
if (!is_file(ROOT . '/config/installed.php')) {
    fwrite(STDERR, "Install CRM before backing up.\n");
    exit(1);
}
$password = getenv('CRM_BACKUP_PASSWORD');
if (!is_string($password) || strlen($password) < 12) {
    fwrite(STDERR, "Set CRM_BACKUP_PASSWORD to a secure passphrase (>=12 chars).\n");
    exit(1);
}
$name = $argv[1] ?? ROOT . '/crm-backup-' . gmdate('Ymd-His') . '.wcb';
if (file_exists($name)) {
    fwrite(STDERR, "Backup file already exists.\n");
    exit(1);
}
$tmpbase = sys_get_temp_dir() . '/wc-crm-backup-' . bin2hex(random_bytes(8));
$tar = $tmpbase . '.tar';
try {
    $guard = fopen(CRM_STORAGE . '/locks/global.lock', 'c+');
    if (!$guard || !flock($guard, LOCK_EX)) throw new RuntimeException('Cannot lock storage snapshot');
    try {
        $archive = new PharData($tar);
        $archive->buildFromDirectory(CRM_STORAGE);
        unset($archive);
    } finally {
        flock($guard, LOCK_UN);
        fclose($guard);
    }
    $in = fopen($tar, 'rb');
    $out = fopen($name, 'xb');
    if (!$in || !$out) throw new RuntimeException('Cannot open archive');
    $salt = random_bytes(SODIUM_CRYPTO_PWHASH_SALTBYTES);
    $key = sodium_crypto_pwhash(SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_KEYBYTES, $password, $salt, SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE, SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE);
    [$state, $header] = sodium_crypto_secretstream_xchacha20poly1305_init_push($key);
    fwrite($out, 'WCCRM2BKP1' . $salt . $header);
    do {
        $chunk = fread($in, 1048576);
        if ($chunk === false) throw new RuntimeException('Read error');
        $last = feof($in);
        $cipher = sodium_crypto_secretstream_xchacha20poly1305_push($state, $chunk, '', $last ? SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL : 0);
        fwrite($out, pack('N', strlen($cipher)) . $cipher);
    } while (!$last);
    fflush($out);
    fclose($out);
    fclose($in);
    chmod($name, 0600);
    echo "Encrypted backup created: $name\n";
} catch (Throwable $e) {
    @unlink($name);
    fwrite(STDERR, "Backup failed: {$e->getMessage()}\n");
    exit(1);
} finally {
    @unlink($tar);
}
