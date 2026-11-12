# White Channel CRM V2.0 — SQLite3 + Gemini AI Edition

**Source Code ชุดเต็มของเวอร์ชัน 2.0** ใช้ **PHP 8.4+** และฐานข้อมูล **SQLite3 (`storage/crm.sqlite`)** พร้อมระบบ **Gemini AI Smart Search**, Responsive Web App, Admin, CSV Export, Backup/Restore และ Audit Log

## 🔑 ข้อมูลสำหรับเข้าสู่ระบบ (Login ด่วน)

* **URL เข้าใช้งาน (ผ่าน XAMPP Apache):** `http://localhost/whitechannel-crm-v2/public/`
* **ชื่อผู้ใช้ (Username):** `admin`
* **รหัสผ่าน (Password):** `Admin@123456`
* **วิธีรันแบบไม่เปิด XAMPP:** เปิด Terminal แล้วพิมพ์ `php -S localhost:8000 -t public` แล้วเข้า `http://localhost:8000`
* **ไฟล์ฐานข้อมูล SQLite:** เก็บอยู่ที่ `storage/crm.sqlite`

> **ขอบเขต**: เป็นระบบใหม่ที่ใช้งานจริงและมี CRUD ของโมดูลหลัก ไม่ใช่สำเนาโค้ดเดิม 1:1 และยังไม่รองรับการย้ายฐานข้อมูล CRM เดิม (Migration Bridge จะทำภายหลัง) รายละเอียดสิ่งที่ยังไม่ครอบคลุมอยู่ท้ายเอกสาร

---

## 📁 โครงสร้างโฟลเดอร์และไฟล์ในระบบ (Directory & File Tree)

```text
whitechannel-crm-v2/
├── app/                       # โค้ดแกนหลักของระบบหลังบ้าน (Backend Core PHP)
│   ├── Api.php                # RESTful JSON API, จัดการคำขอ, สถิติ, การจัดเก็บ, อัปโหลด และ AI
│   ├── Auth.php               # ระบบล็อกอิน, เข้ารหัสรหัสผ่าน (Argon2id), ตรวจสอบสิทธิ์ (RBAC)
│   ├── bootstrap.php          # ไฟล์เริ่มต้นระบบ, ตั้งค่า Session, Autoloader, CSRF, Security Headers
│   ├── Schema.php             # กำหนดโครงสร้างตาราง, ฟิลด์ข้อมูล, ความสัมพันธ์, และเงื่อนไขการตรวจสอบ
│   └── Store.php              # ฐานข้อมูล SQLite3 (WAL Mode), จัดการ Transaction, Query Cache
│
├── config/                    # ไฟล์การตั้งค่าระบบ (Configuration)
│   ├── app.php                # ตั้งค่าระบบหลัก เช่น ชื่อแอป, Timezone, การอัปโหลดไฟล์
│   └── installed.php          # บันทึกสถานะการติดตั้ง วันที่ติดตั้ง และที่อยู่ฐานข้อมูล
│
├── docs/                      # เอกสารทางเทคนิคและความปลอดภัย (Documentation)
│   ├── ARCHITECTURE.md        # สถาปัตยกรรมระบบ, โครงสร้างข้อมูล และ Endpoint API
│   └── SECURITY.md            # นโยบายความปลอดภัย, มาตรฐานการเข้ารหัส และแนวทางป้องกันระบบ
│
├── public/                    # โฟลเดอร์หน้าบ้าน (Public Web Root ที่เบราว์เซอร์เข้าถึงได้)
│   ├── index.php              # Entry Point เดียวของเว็บ, หน้าติดตั้ง, หน้า Login, โครงสร้าง SPA
│   ├── sw.js                  # Service Worker สำหรับรองรับการใช้งานแบบ Offline (PWA)
│   ├── .htaccess              # การตั้งค่า Apache ป้องกันการเข้าถึงไฟล์ตรง และความปลอดภัย
│   └── assets/                # ไฟล์สไตล์และสคริปต์หน้าบ้าน
│       ├── app.css            # สไตล์ชีตหลัก (รองรับธีม Navy, Green, Dark Professional)
│       ├── app.js             # สคริปต์ Frontend แบบ Vanilla JS (SPA, หน้าต่างป๊อปอัป, ค้นหาอัจฉริยะ)
│       ├── favicon.svg        # ไอคอนเว็บ White Channel แบบเวกเตอร์
│       └── manifest.webmanifest # การตั้งค่า Progressive Web App (PWA) ติดตั้งลงมือถือ/เดสก์ท็อปได้
│
├── scripts/                   # เครื่องมือจัดการระบบผ่าน Terminal (CLI Utility Scripts)
│   ├── backup.php             # สคริปต์สำรองข้อมูล SQLite + ไฟล์แนบ แบบเข้ารหัสลับ (Libsodium)
│   ├── restore.php            # สคริปต์กู้คืนข้อมูลสำรองจากไฟล์ .wcb
│   ├── health.php             # สคริปต์ตรวจสุขภาพระบบ, PHP Version, สถานะและจำนวนข้อมูลใน SQLite
│   ├── install.php            # สคริปต์ติดตั้งระบบและสร้างบัญชี Admin ผ่านหน้าต่าง Terminal
│   ├── rebuild-index.php      # สคริปต์จัดระเบียบข้อมูล, อัปเดตข้อความค้นหา และบีบอัดฐานข้อมูล (VACUUM)
│   └── demo-seed.php          # สคริปต์สร้างข้อมูลตัวอย่าง (สมาชิก, โครงการ, ยอดบริจาค, สินค้า)
│
├── storage/                   # โฟลเดอร์เก็บข้อมูลจริง (ห้ามเปิดให้เบราว์เซอร์เข้าถึงโดยตรง)
│   ├── crm.sqlite             # ไฟล์ฐานข้อมูล SQLite3 หลัก (เก็บข้อมูลทั้งหมดของระบบ)
│   ├── crm.sqlite-wal         # ไฟล์ Write-Ahead Log เพื่อความเร็วในการอ่าน/เขียนพร้อมกัน
│   ├── crm.sqlite-shm         # ไฟล์ Shared Memory สำหรับการจัดการ WAL
│   ├── uploads/               # จัดเก็บไฟล์แนบ (สลิปโอนเงิน, รูปภาพโครงการ, หลักฐานการส่งของ)
│   ├── exports/               # จัดเก็บไฟล์ CSV ที่ส่งออกจากระบบ
│   ├── locks/                 # จัดเก็บไฟล์ Lock ป้องกันการยิงสุ่มรหัสผ่าน (Brute Force)
│   ├── .htaccess              # บล็อกไม่ให้ภายนอกดาวน์โหลดไฟล์ใน storage โดยตรง
│   └── .gitkeep               # รักษาโครงสร้างโฟลเดอร์ใน Git
│
├── tests/                     # ระบบทดสอบอัตโนมัติ (Automated Testing)
│   └── smoke.php              # ทดสอบการทำงานของ SQLite, Transactions, Locking และ Cache
│
├── .htaccess                  # ตั้งค่าความปลอดภัยระดับรากโปรเจกต์
├── README.md                  # คู่มือการใช้งานและคำอธิบายโครงสร้างระบบ
└── README-TH.md               # คู่มือการติดตั้งและคำแนะนำระดับเซิร์ฟเวอร์ Production (ฉบับนี้)
```

---

## 1. ความต้องการขั้นต่ำ

- PHP **8.4 ขึ้นไป** พร้อม `json`, `openssl`, `fileinfo`, `pdo_sqlite` (แนะนำ `mbstring`)
- PHP `sodium` เพื่อใช้ Backup/Restore แบบเข้ารหัส
- Apache (XAMPP) หรือ Nginx (aaPanel) โดยตั้งให้ชี้ Document Root ไปที่ `public/`
- พื้นที่เขียนไฟล์ใน `storage/` และตอนติดตั้งต้องสร้าง `config/installed.php` ได้
- HTTPS สำหรับ Production, PHP Session และสิทธิ์ไฟล์ที่เหมาะสม
- ไม่ต้องใช้ Composer, npm, Node.js หรือโปรแกรม Database Server แยกภายนอก

---

## 2. ติดตั้งแบบเร็ว — XAMPP บน Windows

1. ตรวจ PHP ด้วย `php -v` หรือผ่าน XAMPP ว่าเป็น PHP **8.4+**
2. วางโฟลเดอร์โปรเจกต์ที่ `C:\xampp\htdocs\whitechannel-crm-v2\`
3. เริ่ม Apache จาก XAMPP Control Panel (ไม่ต้องเปิด MySQL)
4. เปิด `http://localhost/whitechannel-crm-v2/public/`
5. กรอกชื่อผู้ดูแล, Username และรหัสผ่าน **อย่างน้อย 12 ตัวอักษร** แล้วกดสร้างระบบ (หากติดตั้งแล้วล็อกอินด้วย `admin` / `Admin@123456`)

---

## 3. การสำรองข้อมูลและการกู้คืน (Encrypted Backup & Restore)

ระบบใช้ **libsodium Secretstream** พร้อม Key Derivation แบบ Password-Based แล้วสำรอง `storage/` รวมทั้งไฟล์ฐานข้อมูล SQLite และ File Upload แบบเข้ารหัส

Windows PowerShell:
```powershell
$env:CRM_BACKUP_PASSWORD="YOUR-LONG-SECRET-PASSPHRASE"
php scripts/backup.php D:\backups\crm-backup.wcb

# Restore (ต้องปิด Web/Process ที่เขียนข้อมูลก่อน)
php scripts/restore.php D:\backups\crm-backup.wcb --i-understand
Remove-Item Env:CRM_BACKUP_PASSWORD
```

---

## 4. บัญชีผู้ใช้และสิทธิ์

Role มี Admin, Manager, Finance, Call Center, Warehouse, Auditor และ Viewer ตรวจสิทธิ์ที่ฝั่ง Server ทั้ง API แบบ Read/Write ผู้ตรวจสอบอ่านได้อย่างเดียว Admin สามารถสร้าง/แก้ไขบัญชีและตั้งรหัสผ่านใหม่ได้

---

## 5. คำสั่งตรวจสอบ / ทดสอบระบบ

```bash
php scripts/health.php                # ตรวจระบบและจำนวนรายการใน SQLite
php tests/smoke.php                   # ทดสอบความถูกต้องของ Database Engine & Cache
php scripts/rebuild-index.php         # สร้าง Index และบีบอัดฐานข้อมูล SQLite (VACUUM)
php scripts/demo-seed.php --yes       # เพิ่มข้อมูลตัวอย่างลงระบบ (ห้ามรันบน Production)
```
