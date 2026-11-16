# White Channel CRM V2.0 — คู่มือการใช้งานและโครงสร้างระบบ (SQLite3 + Gemini AI Edition)

ระบบบริหารจัดการผู้บริจาค โครงการ คลังสินค้าฮาดียะห์ การจัดส่ง และงานติดตาม Call Center  
ขับเคลื่อนด้วย **PHP 8.4+** และฐานข้อมูล **SQLite3 (`storage/crm.sqlite`)** พร้อมระบบ **Gemini AI Smart Search**

---

## 🔑 ข้อมูลสำหรับเข้าสู่ระบบ (Login ด่วน)

* **URL เข้าใช้งาน (ผ่าน XAMPP Apache):** `http://localhost/whitechannel-crm-v2/public/`
* **ชื่อผู้ใช้ (Username):** `admin`
* **รหัสผ่าน (Password):** `Admin@123456`

> 💡 *สามารถเปลี่ยนรหัสผ่านใหม่ หรือเพิ่มบัญชีผู้ใช้ให้ทีมงานได้ที่เมนู **ผู้ใช้งานและสิทธิ์** หรือ **ตั้งค่าส่วนตัว***

---
## 🚀 วิธีเปิดรันระบบ (เลือกวิธีใดวิธีหนึ่ง)

### วิธีที่ 1: รันผ่าน XAMPP (แนะนำสำหรับใช้งานปกติ)
1. เปิดโปรแกรม **XAMPP Control Panel**
2. กด **Start** เฉพาะตัว **Apache** (ไม่ต้องเปิด MySQL เพราะระบบใช้ฐานข้อมูล SQLite3 ในตัวแล้ว)
3. เปิดเบราว์เซอร์ไปที่ `http://localhost/whitechannel-crm-v2/public/`

### วิธีที่ 2: รันผ่าน Terminal ใน VS Code (ไม่ต้องเปิด XAMPP)
1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ (`c:\xampp\htdocs\whitechannel-crm-v2`)
2. รันคำสั่ง:
   ```powershell
   php -S localhost:8000 -t public
   ```
3. เปิดเบราว์เซอร์ไปที่ `http://localhost:8000`

---

## 📁 โครงสร้างโฟลเดอร์และไฟล์ทั้งหมดในระบบ (Folder & File Structure)

ระบบได้รับการออกแบบให้มีโครงสร้างที่กระชับ ไม่พึ่งพาไลบรารีภายนอก (Zero Dependencies) และแบ่งแยกหน้าที่อย่างชัดเจน:

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
├── README.md                  # คู่มือการใช้งานและคำอธิบายโครงสร้างระบบ (ฉบับนี้)
└── README-TH.md               # คู่มือการติดตั้งและคำแนะนำระดับเซิร์ฟเวอร์ Production
```

---

## ✦ วิธีตั้งค่าและใช้งาน Gemini AI ช่วยค้นหาอัจฉริยะ

ระบบมีช่องค้นหาอัจฉริยะที่มุมขวาบน (`Ctrl + K`) ซึ่งช่วยเดาคำที่พิมพ์สะกดผิด หรือพิมพ์คำค้นหาคลุมเครือแล้วพาไปยังหน้าที่ถูกต้อง:

1. คลิกปุ่ม **`✦ AI`** บนช่องค้นหาด้านบนขวา (หรือไปที่เมนู **ตั้งค่าส่วนตัว** ด้านซ้าย)
2. นำ **Gemini API Key** (ขอฟรีได้ที่ [aistudio.google.com](https://aistudio.google.com)) มาวางในช่อง **Gemini API Key**
3. เลือกรุ่นโมเดลหลัก (ค่าเริ่มต้นคือ `gemini-3.5-flash-lite` ฟรี 500 ครั้ง/วัน) และติ๊กเปิด **สลับโมเดลสำรองอัตโนมัติ (Auto-Fallback)**
4. กดปุ่ม **✦ บันทึกตั้งค่า Gemini AI**
5. ระบบมีตาราง **Rate Limit & Quota Tracker** คอยนับจำนวนครั้งที่ใช้ไปและคงเหลือรายวัน (RPD) / รายนาที (RPM) ให้ดูสดๆ ในหน้าตั้งค่า

---

## 🗄️ ข้อมูลฐานข้อมูล (SQLite3)

* ไฟล์ฐานข้อมูลทั้งหมดถูกเก็บไว้ในไฟล์เดียวที่: **`storage/crm.sqlite`** (ทำงานในโหมด WAL - Write-Ahead Logging)
* คุณสามารถใช้โปรแกรมจัดการฐานข้อมูลทั่วไป เช่น **DB Browser for SQLite**, **DBeaver**, หรือส่วนเสริม **SQLite Viewer** ใน VS Code เปิดดูตาราง `records`, `cache`, และ `meta` ในไฟล์ `storage/crm.sqlite` ได้โดยตรง

---

## 🛠️ คำสั่งจัดการระบบผ่าน Terminal (CLI Scripts)

หากต้องการเช็คสถานะฐานข้อมูล สำรองข้อมูล หรือสร้างข้อมูลตัวอย่าง สามารถรันคำสั่งเหล่านี้ใน Terminal ได้เลย:

```powershell
# 1. เช็คสถานะระบบ เวอร์ชัน PHP และจำนวนข้อมูลใน SQLite
php scripts/health.php

# 2. ทดสอบระบบฐานข้อมูล SQLite (Smoke Test)
php tests/smoke.php

# 3. จัดเรียงดัชนีค้นหาใหม่และบีบอัดฐานข้อมูล SQLite (VACUUM)
php scripts/rebuild-index.php

# 4. เพิ่มข้อมูลตัวอย่าง (Demo Data)
php scripts/demo-seed.php --yes
```

### การสำรองและกู้คืนข้อมูล (Encrypted Backup / Restore)
```powershell
# สำรองข้อมูล (เข้ารหัสด้วยรหัสผ่านของคุณ)
$env:CRM_BACKUP_PASSWORD="รหัสผ่านสำรองข้อมูลอย่างน้อย12ตัว"
php scripts/backup.php D:\crm-backup.wcb

# กู้คืนข้อมูล
php scripts/restore.php D:\crm-backup.wcb --i-understand
```
