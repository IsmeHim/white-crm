<?php

declare(strict_types=1);

namespace CRM;

use InvalidArgumentException;

/**
 * Authentication & Authorization service.
 * Handles user roles, session security, password hashing (Argon2id),
 * and brute-force rate-limiting locks.
 */
final class Auth {
    private Store $store;

    /**
     * Role-based access control (RBAC) mapping.
     * Roles: admin, manager, finance, callcenter, warehouse, auditor, viewer
     */
    private array $rights = [
        'admin'      => ['*'],
        'manager'    => [
            'dashboard', 'contacts', 'categories', 'campaigns', 'receivers',
            'donations', 'hadeeya', 'stock_lots', 'inventory_moves',
            'delivery_companies', 'shipments', 'tasks', 'feedback',
            'announcements', 'reports',
        ],
        'finance'    => [
            'dashboard', 'contacts', 'campaigns', 'receivers',
            'donations', 'reports',
        ],
        'callcenter' => [
            'dashboard', 'contacts', 'campaigns', 'donations',
            'receivers', 'tasks', 'feedback',
        ],
        'warehouse'  => [
            'dashboard', 'hadeeya', 'stock_lots', 'inventory_moves',
            'delivery_companies', 'shipments', 'donations',
        ],
        'auditor'    => [
            'dashboard', 'contacts', 'categories', 'campaigns', 'receivers',
            'donations', 'hadeeya', 'stock_lots', 'inventory_moves',
            'delivery_companies', 'shipments', 'tasks', 'feedback',
            'announcements', 'reports', 'audit',
        ],
        'viewer'     => ['dashboard', 'announcements'],
    ];

    public function __construct(Store $store) {
        $this->store = $store;
    }

    /**
     * Returns human-readable Thai role labels.
     */
    public function roles(): array {
        return [
            'admin'      => 'ผู้ดูแลระบบ',
            'manager'    => 'ผู้จัดการ',
            'finance'    => 'การเงิน',
            'callcenter' => 'Call Center',
            'warehouse'  => 'คลังสินค้า',
            'auditor'    => 'ผู้ตรวจสอบ',
            'viewer'     => 'ผู้ดูข้อมูล',
        ];
    }

    /**
     * Resolves currently authenticated user from session.
     */
    public function current(): ?array {
        if (empty($_SESSION['uid']) || !isset($_SESSION['last_seen'])) {
            return null;
        }

        // Idle session timeout: 1 hour (3600 seconds)
        if (time() - $_SESSION['last_seen'] > 3600) {
            $_SESSION = [];
            return null;
        }

        $user = $this->store->read('users', (string)$_SESSION['uid']);
        if (
            !$user ||
            empty($user['active']) ||
            !empty($user['deleted_at']) ||
            ($_SESSION['auth_version'] ?? '') !== ($user['auth_version'] ?? '')
        ) {
            return null;
        }

        $_SESSION['last_seen'] = time();
        return $user;
    }

    /**
     * Checks if current user has permission for a specific module and action.
     */
    public function can(string $module, string $action = 'read'): bool {
        $user = $this->current();
        if (!$user) {
            return false;
        }

        $role = $user['role'] ?? 'viewer';
        if ($role === 'admin') {
            return true;
        }

        if (!in_array($module, $this->rights[$role] ?? [], true)) {
            return false;
        }

        // Auditor and Viewer roles are read-only
        if (($role === 'auditor' || $role === 'viewer') && $action !== 'read') {
            return false;
        }

        if ($module === 'reports' && $action !== 'read') {
            return false;
        }

        if ($module === 'inventory_moves' && $action !== 'read' && $role !== 'warehouse' && $role !== 'manager') {
            return false;
        }

        if ($action === 'delete' && $role !== 'manager') {
            return false;
        }

        return true;
    }

    /**
     * Enforces required permission or returns 401/403 JSON error.
     */
    public function require(string $module, string $action = 'read'): array {
        $user = $this->current();
        if (!$user) {
            crm_json(['error' => 'Please sign in'], 401);
        }

        if (!$this->can($module, $action)) {
            crm_json(['error' => 'Permission denied'], 403);
        }

        return $user;
    }

    /**
     * Authenticates username & password with IP rate-limiting protection.
     */
    public function login(string $login, string $password): bool {
        $login = mb_strtolower(trim($login));
        $bucket = CRM_STORAGE . '/locks/login_' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'cli')) . '.json';

        $f = fopen($bucket, 'c+');
        if (!$f || !flock($f, LOCK_EX)) {
            return false;
        }

        try {
            $raw = stream_get_contents($f);
            $state = json_decode($raw ?: '', true) ?: ['hits' => 0, 'until' => 0];

            if (($state['until'] ?? 0) > time()) {
                return false;
            }

            if (($state['until'] ?? 0) < time() - 900) {
                $state = ['hits' => 0, 'until' => 0];
            }

            $found = null;
            foreach ($this->store->summaries('users') as $u) {
                if (mb_strtolower((string)($u['username'] ?? '')) === $login) {
                    $found = $this->store->read('users', $u['id']);
                    break;
                }
            }

            $hash = $found['password_hash'] ?? '$2y$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
            $ok = password_verify($password, $hash) && $found && !empty($found['active']);

            if (!$ok) {
                $state['hits']++;
                if ($state['hits'] >= 7) {
                    $state['until'] = time() + 900; // Lock for 15 minutes after 7 failures
                }
            } else {
                $state = ['hits' => 0, 'until' => 0];
                session_regenerate_id(true);
                $_SESSION['uid'] = $found['id'];
                $_SESSION['auth_version'] = $found['auth_version'] ?? '';
                $_SESSION['last_seen'] = time();
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
            }

            ftruncate($f, 0);
            rewind($f);
            fwrite($f, json_encode($state));
            fflush($f);

            return (bool)$ok;
        } finally {
            flock($f, LOCK_UN);
            fclose($f);
        }
    }

    /**
     * Logs out user and destroys session.
     */
    public function logout(): void {
        $_SESSION = [];
        session_regenerate_id(true);
    }

    /**
     * Hashes password using Argon2id with minimum length constraint.
     */
    public static function hash(string $password): string {
        if (strlen($password) < 12 || strlen($password) > 200) {
            throw new InvalidArgumentException('รหัสผ่านต้องยาว 12-200 ตัวอักษร');
        }

        return password_hash($password, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT);
    }

    /**
     * Filters user entity to safe fields for public listing/summary.
     */
    public static function userSummary(array $u): array {
        $keys = ['id', 'username', 'name', 'role', 'active', 'created_at', 'updated_at', 'version', 'deleted_at'];
        return array_intersect_key($u, array_flip($keys));
    }

    public function publicUser(array $u): array {
        return self::userSummary($u);
    }
}
