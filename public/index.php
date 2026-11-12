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
    <link rel="stylesheet" href="assets/app.css?v=3.1.6">
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
                        <button type="button" class="btn primary small quick-slip-top-btn" id="top-live-slip-btn" title="คีย์ใบรับบริจาคจากรายการสดด่วน (One-Stop Slip)">⚡ คีย์ใบงาน TV สด</button>
                        <div class="top-search" id="top-search"><span class="top-search-icon" aria-hidden="true">⌕</span><input id="global-search" class="top-search-input" type="search" autocomplete="off" placeholder="ค้นหา หรือพิมพ์สั่ง AI…" aria-label="ค้นหาทั้งระบบ"><button type="button" class="top-search-ai-btn" id="ai-search-btn" title="กดเพื่อให้ AI วิเคราะห์และพาไปหน้าที่ต้องการ">✦ AI</button>
                            <div class="top-search-results hidden" id="global-search-results" role="listbox"></div>
                        </div><span class="top-badge"><i></i> ระบบพร้อมใช้งาน</span><button class="icon-btn" id="theme-toggle" aria-label="เปลี่ยนธีม" title="สลับธีม">◐</button>
                        <div class="avatar miniavatar"><?= crm_e(mb_substr($user['name'] ?? 'A', 0, 1)) ?></div>
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
    <script defer src="assets/app.js?v=3.1.6"></script>
</body>

</html>