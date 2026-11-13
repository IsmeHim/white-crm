<?php

declare(strict_types=1);
require dirname(__DIR__) . '/app/bootstrap.php';

use CRM\Store;
use CRM\Auth;
use CRM\Api;

crm_security_headers();
$store = new Store();
$auth = new Auth($store);
$setupAllowed = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true) || getenv('ALLOW_WEB_SETUP') === '1';
$api = (string)($_GET['api'] ?? '');
if (!$installed) {
    if ($api === 'install' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if (!$setupAllowed) crm_json(['error' => 'Web setup disabled. Use php scripts/install.php on server.'], 403);
        crm_check_csrf();
        $d = crm_input();
        $username = mb_strtolower(trim((string)($d['username'] ?? '')));
        $name = trim((string)($d['name'] ?? ''));
        if (!preg_match('/^[a-z0-9._-]{3,40}$/D', $username) || $name === '' || mb_strlen($name) > 150) crm_json(['error' => 'กรุณาตรวจสอบชื่อผู้ใช้และชื่อผู้ดูแล'], 422);
        try {
            $hash = Auth::hash((string)($d['password'] ?? ''));
        } catch (Throwable $e) {
            crm_json(['error' => $e->getMessage()], 422);
        }
        $lock = fopen(ROOT . '/config/installation.lock', 'c+');
        if (!$lock || !flock($lock, LOCK_EX)) crm_json(['error' => 'Cannot lock installation'], 500);
        try {
            if (is_file(ROOT . '/config/installed.php')) crm_json(['error' => 'Already installed'], 409);
            $id = crm_id('usr');
            $now = crm_now();
            $user = ['id' => $id, 'username' => $username, 'name' => $name, 'role' => 'admin', 'active' => true, 'password_hash' => $hash, 'auth_version' => bin2hex(random_bytes(16)), 'version' => 1, 'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null];
            $store->transact([['collection' => 'users', 'id' => $id, 'record' => $user, 'summary' => Auth::userSummary($user)]]);
            $marker = '<?php return ' . var_export(['installed_at' => $now, 'storage_path' => 'storage'], true) . ';';
            $file = fopen(ROOT . '/config/installed.php', 'x');
            if (!$file) crm_json(['error' => 'Cannot create install marker'], 500);
            fwrite($file, $marker);
            fflush($file);
            fclose($file);
            @chmod(ROOT . '/config/installed.php', 0600);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
        crm_json(['ok' => true]);
    }
    if ($api !== '') crm_json(['error' => 'Install first'], 503);
} else {
    if ($api !== '') (new Api($store, $auth))->run($api);
}
$user = $installed ? $auth->current() : null;
$screen = !$installed ? 'setup' : (!$user ? 'login' : 'app');
$csrf = crm_csrf();
?>
<!doctype html>
<html lang="th">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="theme-color" content="#a2bb3b">
    <meta name="csrf-token" content="<?= crm_e($csrf) ?>">
    <meta name="description" content="White Channel CRM V2 | Portable No-SQL CRM">
    <link rel="manifest" href="assets/manifest.webmanifest">
    <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="assets/app.css?v=<?= filemtime(__DIR__ . '/assets/app.css') ?>">
    <title>White Channel CRM V2</title>
</head>

<body data-screen="<?= crm_e($screen) ?>">
    <?php if ($screen === 'setup'): ?>
        <main class="auth-wrap">
            <section class="auth-card">
                <div class="brand-logo big">W<span>.</span></div>
                <div class="eyebrow">WHITE CHANNEL / CRM V2</div>
                <h1>ตั้งค่าระบบครั้งแรก</h1>
                <p class="muted">สร้างบัญชีผู้ดูแลระบบ ไม่มีบัญชีหรือรหัสผ่านสำเร็จรูป</p>
                <?php if (!$setupAllowed): ?><div class="alert danger">การติดตั้งผ่านเว็บปิดอยู่เพื่อความปลอดภัย กรุณาใช้คำสั่ง <code>php scripts/install.php</code> บน Server</div>
                <?php else: ?><form id="setup-form" class="stack"><label>ชื่อผู้ดูแล<input name="name" autocomplete="name" required placeholder="ชื่อที่ใช้แสดง" maxlength="150"></label><label>ชื่อผู้ใช้<input name="username" required pattern="[a-zA-Z0-9._-]{3,40}" placeholder="admin.myteam" autocomplete="username"></label><label>รหัสผ่านอย่างน้อย 12 ตัวอักษร<input name="password" required type="password" minlength="12" autocomplete="new-password" placeholder="รหัสผ่านที่คาดเดายาก"></label><button class="btn primary" type="submit">สร้างระบบและผู้ดูแล <span>→</span></button></form><?php endif; ?><p id="auth-message" class="form-message" aria-live="polite"></p>
            </section>
        </main>
    <?php elseif ($screen === 'login'): ?>
        <main class="auth-wrap">
            <section class="auth-card">
                <div class="brand-logo big">W<span>.</span></div>
                <div class="eyebrow">WHITE CHANNEL / CRM V2</div>
                <h1>ยินดีต้อนรับกลับ</h1>
                <p class="muted">เข้าสู่ระบบเพื่อจัดการข้อมูลและโครงการ</p>
                <form id="login-form" class="stack"><label class="form-field"><span class="field-title">ชื่อผู้ใช้ (Username) <span class="req-star">*</span></span><input name="username" autocomplete="username" required placeholder="เช่น admin"></label><label class="form-field"><span class="field-title">รหัสผ่าน (Password) <span class="req-star">*</span></span><input name="password" type="password" autocomplete="current-password" required placeholder="กรอกรหัสผ่านเข้าสู่ระบบ…"></label><button class="btn primary" type="submit">เข้าสู่ระบบ <span>→</span></button></form>
                <p id="auth-message" class="form-message" aria-live="polite"></p>
                <p class="muted mini">White Channel CRM V2 • Secure File-Based Platform</p>
            </section>
        </main>
    <?php else: ?>
        <div class="app-shell">
            <aside class="sidebar" id="sidebar">
                <div class="side-top">
                    <div class="brand-logo">W<span>.</span></div>
                    <div><strong>White Channel</strong><small>CRM / VERSION 2.0</small></div><button class="icon-btn sidebar-close" id="sidebar-close" aria-label="ปิดเมนู">×</button>
                </div>
                <div class="side-section">WORKSPACE</div>
                <nav id="nav-main" aria-label="เมนูหลัก"></nav>
                <div class="side-bottom">
                    <div class="side-profile">
                        <div class="avatar"><?= crm_e(mb_substr($user['name'] ?? 'A', 0, 1)) ?></div>
                        <div><strong><?= crm_e($user['name']) ?></strong><small><?= crm_e($auth->roles()[$user['role']] ?? $user['role']) ?></small></div>
                    </div><button class="btn subtle full" id="logout-btn">ออกจากระบบ</button>
                </div>
            </aside>
            <div class="main-layout">
                <header class="topbar"><button class="icon-btn mobile-menu" id="menu-open" aria-label="เปิดเมนู">☰</button>
                    <div class="crumb">WHITE CHANNEL <span>/</span> <strong id="crumb-current">ภาพรวมระบบ</strong></div>
                    <div class="top-actions">
                        <div class="top-search" id="top-search"><span class="top-search-icon" aria-hidden="true">⌕</span><input id="global-search" class="top-search-input" type="search" autocomplete="off" placeholder="ค้นหา หรือพิมพ์สั่ง AI…" aria-label="ค้นหาทั้งระบบ"><button type="button" class="top-search-ai-btn" id="ai-search-btn" title="กดเพื่อให้ AI วิเคราะห์และพาไปหน้าที่ต้องการ">✦ AI</button>
                            <div class="top-search-results hidden" id="global-search-results" role="listbox"></div>
                        </div><span class="top-badge"><i></i> ระบบพร้อมใช้งาน</span><button class="icon-btn" id="theme-toggle" aria-label="เปลี่ยนธีม" title="สลับธีม">◐</button>
                        <div class="profile-menu-wrap" id="profile-menu-wrap">
                            <button type="button" class="avatar-btn" id="profile-menu-btn" aria-haspopup="true" aria-expanded="false" title="เมนูโปรไฟล์ <?= crm_e($user['name']) ?>">
                                <div class="avatar miniavatar"><?= crm_e(mb_substr($user['name'] ?? 'A', 0, 1)) ?></div>
                                <span class="avatar-arrow" aria-hidden="true">▾</span>
                            </button>
                            <div class="profile-dropdown hidden" id="profile-dropdown" role="menu">
                                <div class="profile-dropdown-head">
                                    <div class="avatar"><?= crm_e(mb_substr($user['name'] ?? 'A', 0, 1)) ?></div>
                                    <div class="profile-dropdown-user">
                                        <strong class="profile-dropdown-name"><?= crm_e($user['name']) ?></strong>
                                        <span class="profile-dropdown-role"><?= crm_e($auth->roles()[$user['role']] ?? $user['role']) ?> · <small class="muted">@<?= crm_e($user['username']) ?></small></span>
                                    </div>
                                </div>
                                <div class="profile-dropdown-divider"></div>
                                <div class="profile-dropdown-menu">
                                    <button type="button" class="profile-dropdown-item" data-pnav="settings">
                                        <span class="pitem-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
                                        <div class="pitem-text">
                                            <strong>ตั้งค่าส่วนตัว</strong>
                                            <small>เปลี่ยนรหัสผ่าน, ธีมสี, ตั้งค่า AI</small>
                                        </div>
                                    </button>
                                    <?php if (($user['role'] ?? '') === 'admin'): ?>
                                    <button type="button" class="profile-dropdown-item" data-pnav="users">
                                        <span class="pitem-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                                        <div class="pitem-text">
                                            <strong>ผู้ใช้งานและสิทธิ์</strong>
                                            <small>จัดการสิทธิ์และบัญชีผู้ใช้</small>
                                        </div>
                                    </button>
                                    <?php endif; ?>
                                    <?php if (in_array($user['role'] ?? '', ['admin', 'auditor'], true)): ?>
                                    <button type="button" class="profile-dropdown-item" data-pnav="audit">
                                        <span class="pitem-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg></span>
                                        <div class="pitem-text">
                                            <strong>ประวัติการทำงาน</strong>
                                            <small>ตรวจสอบล็อกและโหมดพัฒนา</small>
                                        </div>
                                    </button>
                                    <?php endif; ?>
                                    <button type="button" class="profile-dropdown-item" id="top-theme-toggle">
                                        <span class="pitem-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg></span>
                                        <div class="pitem-text">
                                            <strong>สลับธีมสีหน้าจอ</strong>
                                            <small id="profile-theme-label">Premium Navy</small>
                                        </div>
                                    </button>
                                </div>
                                <div class="profile-dropdown-divider"></div>
                                <button type="button" class="profile-dropdown-logout" id="top-logout-btn">
                                    <span class="pitem-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
                                    <span>ออกจากระบบ</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                <main id="page-content" class="page" tabindex="-1">
                    <div class="loading-state">กำลังโหลดข้อมูล…</div>
                </main>
            </div>
        </div>
        <nav class="bottom-nav" id="mobile-nav" aria-label="ทางลัดมือถือ"></nav>
        <div class="overlay" id="overlay"></div>
        <div class="modal-backdrop hidden" id="modal-backdrop">
            <section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-head">
                    <div>
                        <div class="eyebrow">WHITE CHANNEL CRM</div>
                        <h2 id="modal-title">รายการ</h2>
                    </div><button class="icon-btn" id="modal-close" aria-label="ปิด">×</button>
                </div>
                <div id="modal-body" class="modal-body"></div>
            </section>
        </div>
        <div id="toast-root" aria-live="polite" class="toast-root"></div>
    <?php endif; ?>
    <script defer src="assets/app.js?v=<?= filemtime(__DIR__ . '/assets/app.js') ?>"></script>
</body>

</html>