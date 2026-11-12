<?php

declare(strict_types=1);

/**
 * White Channel CRM V2 - Application Bootstrap
 * Handles environment setup, autoloader, session initialization,
 * helper functions, and security response headers.
 */

define('ROOT', dirname(__DIR__));

$config = require ROOT . '/config/app.php';
@date_default_timezone_set($config['timezone'] ?? 'Asia/Bangkok');

// Enforce PHP 8.4+ and mandatory extensions
if (PHP_VERSION_ID < 80400) {
    http_response_code(500);
    exit('PHP 8.4 or newer is required.');
}

foreach (['json', 'openssl', 'fileinfo', 'pdo_sqlite'] as $ext) {
    if (!extension_loaded($ext)) {
        http_response_code(500);
        exit('Missing PHP extension: ' . $ext);
    }
}

// UTF-8 string fallbacks if ext-mbstring is not available
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $s, ?string $encoding = null): int {
        return preg_match_all('/./us', $s);
    }
}

if (!function_exists('mb_substr')) {
    function mb_substr(string $s, int $start, ?int $length = null, ?string $encoding = null): string {
        $chars = preg_split('//u', $s, -1, PREG_SPLIT_NO_EMPTY);
        if (!is_array($chars)) {
            return '';
        }
        return implode('', array_slice($chars, $start, $length));
    }
}

if (!function_exists('mb_strtolower')) {
    function mb_strtolower(string $s, ?string $encoding = null): string {
        return strtolower($s);
    }
}

// CRM Namespace Autoloader
spl_autoload_register(function (string $class): void {
    if (!str_starts_with($class, 'CRM\\')) {
        return;
    }
    $file = ROOT . '/app/' . substr($class, 4) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

// Storage Directory Resolution
if (!is_dir(ROOT . '/storage')) {
    mkdir(ROOT . '/storage', 0700, true);
}

$installed = is_file(ROOT . '/config/installed.php') ? require ROOT . '/config/installed.php' : null;
$storageSetting = (is_array($installed) ? ($installed['storage_path'] ?? 'storage') : 'storage');
$override = getenv('CRM_STORAGE_PATH');
if (is_string($override) && $override !== '') {
    $storageSetting = $override;
}

$absolute = (str_starts_with((string)$storageSetting, '/') || preg_match('/^[A-Za-z]:[\\\\\/]/', (string)$storageSetting));
$storage = $absolute ? (string)$storageSetting : ROOT . '/' . ltrim((string)$storageSetting, '/\\');

if (str_contains($storage, '..')) {
    http_response_code(500);
    exit('Unsafe storage path');
}

if (!is_dir($storage)) {
    mkdir($storage, 0700, true);
}

define('CRM_STORAGE', $storage);

// Session Security Configuration
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' && getenv('TRUST_PROXY') === '1');

if (PHP_SAPI !== 'cli' && session_status() !== PHP_SESSION_ACTIVE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    session_name($config['session_name'] ?? 'WCCRM_SESS');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

/**
 * Emit JSON response and terminate execution.
 */
function crm_json(array $data, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

/**
 * Retrieve or generate session CSRF token.
 */
function crm_csrf(): string {
    if (!isset($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/**
 * Validate CSRF token against HTTP request header or POST parameter.
 */
function crm_check_csrf(): void {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf'] ?? '');
    if (!is_string($token) || !hash_equals(crm_csrf(), $token)) {
        crm_json(['error' => 'CSRF token invalid'], 419);
    }
}

/**
 * Read and validate JSON payload from php://input.
 */
function crm_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 1024 * 1024) {
        crm_json(['error' => 'Request payload exceeds 1MB limit'], 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        crm_json(['error' => 'Expected JSON object in request body'], 422);
    }
    return $data;
}

/**
 * Escape HTML special characters for safe output.
 */
function crm_e(mixed $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Generate current UTC ISO 8601 timestamp string.
 */
function crm_now(): string {
    return gmdate('Y-m-d\\TH:i:s\\Z');
}

/**
 * Generate a unique random ID with a module-specific prefix.
 */
function crm_id(string $prefix): string {
    return $prefix . '_' . bin2hex(random_bytes(12));
}

/**
 * Set hardened HTTP response security headers.
 */
function crm_security_headers(): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    header('Cache-Control: no-store');
}
