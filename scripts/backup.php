<?php

declare(strict_types=1);
/** Encrypted streaming backup (tar -> libsodium secretstream). CLI wrapper around CRM\Backup.
 * Password supplied with CRM_BACKUP_PASSWORD environment variable.
 * Backup does not include app code/config, only private storage.
 */
if (PHP_SAPI !== 'cli') exit('CLI only');
require dirname(__DIR__) . '/app/bootstrap.php';

if (!\CRM\Backup::isEncryptionSupported()) {
    fwrite(STDERR, "Extension sodium and PharData are required for encrypted backups.\n");
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

try {
    $bytes = \CRM\Backup::createEncrypted($password, $name);
    echo "Encrypted backup created: {$name} ({$bytes} bytes)\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Backup failed: {$e->getMessage()}\n");
    exit(1);
}
