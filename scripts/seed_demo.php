<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    exit("CLI only\n");
}

require dirname(__DIR__) . '/app/bootstrap.php';

use CRM\Store;
use CRM\Schema;

$store = new Store();
$now = crm_now();
$today = gmdate('Y-m-d');
$yesterday = gmdate('Y-m-d', strtotime('-1 day'));
$twoDaysAgo = gmdate('Y-m-d', strtotime('-2 days'));
$fiveDaysAgo = gmdate('Y-m-d', strtotime('-5 days'));
$tomorrow = gmdate('Y-m-d', strtotime('+1 day'));
$nextWeek = gmdate('Y-m-d', strtotime('+5 days'));

// Find first admin user to act as actor/assignee
$actorId = 'usr_system';
foreach ($store->summaries('users') as $u) {
    $actorId = $u['id'];
    break;
}

$changes = [];
$add = function (string $collection, string $id, array $data, string $createdAt = '') use (&$changes, $now, $actorId): array {
    $ts = $createdAt !== '' ? $createdAt : $now;
    $record = array_merge([
        'id' => $id,
        'version' => 1,
        'created_at' => $ts,
        'updated_at' => $ts,
        'deleted_at' => null,
        'created_by' => $actorId,
    ], $data);
    $changes[] = [
        'collection' => $collection,
        'id' => $id,
        'record' => $record,
        'summary' => Schema::summary($collection, $record),
    ];
    return $record;
};

// 1. Categories (หมวดหมู่โครงการ)
$categories = [
    ['id' => 'cat_demo_media',   'name' => 'กองทุนสื่อศาสนาและผลิตรายการ', 'description' => 'สนับสนุนค่าออกอากาศดาวเทียม อินเทอร์เน็ต และการผลิตรายการความรู้ศาสนา', 'active' => '1'],
    ['id' => 'cat_demo_relief',  'name' => 'ช่วยเหลือผู้ประสบภัยและมนุษยธรรม', 'description' => 'ถุงยังชีพ น้ำดื่ม และการฟื้นฟูผู้ประสบภัยน้ำท่วมและภัยพิบัติ', 'active' => '1'],
    ['id' => 'cat_demo_zakat',   'name' => 'กองทุนซะกาตและผู้ยากไร้', 'description' => 'ช่วยเหลือครอบครัวอนาถา เด็กกำพร้า และผู้ยากไร้ตามหลักศาสนา', 'active' => '1'],
    ['id' => 'cat_demo_edu',     'name' => 'การศึกษาและพัฒนาเยาวชน', 'description' => 'ทุนการศึกษา อุปกรณ์การเรียน และค่ายอบรมจริยธรรมเยาวชน', 'active' => '1'],
];
foreach ($categories as $c) {
    $add('categories', $c['id'], $c);
}

// 2. Campaigns (โครงการบริจาค)
$campaigns = [
    [
        'id' => 'cam_demo_media69',
        'name' => 'กองทุนสื่อความดี White Channel ประจำปี 2569',
        'category_id' => 'cat_demo_media',
        'goal_satang' => 150000000, // 1,500,000 THB
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
        'status' => 'active',
        'description' => 'ร่วมสนับสนุนการผลิตรายการโทรทัศน์และสื่อออนไลน์เพื่อเผยแผ่ความดีตลอดปี 2569',
        'cover_file_id' => '',
        'legacy_id' => 'CAM-69-01',
    ],
    [
        'id' => 'cam_demo_flood',
        'name' => 'โครงการถุงยังชีพช่วยเหลือผู้ประสบภัยน้ำท่วมภาคใต้',
        'category_id' => 'cat_demo_relief',
        'goal_satang' => 50000000, // 500,000 THB
        'start_date' => '2026-09-01',
        'end_date' => '2026-12-15',
        'status' => 'active',
        'description' => 'จัดส่งข้าวสาร อาหารแห้ง และน้ำดื่มสะอาดแก่ครัวเรือนที่ได้รับผลกระทบจากอุทกภัย',
        'cover_file_id' => '',
        'legacy_id' => 'CAM-69-02',
    ],
    [
        'id' => 'cam_demo_orphan',
        'name' => 'กองทุนเพื่อเด็กกำพร้าและครอบครัวผู้ยากไร้',
        'category_id' => 'cat_demo_zakat',
        'goal_satang' => 80000000, // 800,000 THB
        'start_date' => '2026-03-01',
        'end_date' => '2026-12-31',
        'status' => 'active',
        'description' => 'มอบทุนยังชีพรายเดือนและค่าเล่าเรียนแก่เด็กกำพร้าในเครือข่ายมูลนิธิ',
        'cover_file_id' => '',
        'legacy_id' => 'CAM-69-03',
    ],
    [
        'id' => 'cam_demo_quran',
        'name' => 'โครงการจัดพิมพ์อัลกุรอานแปลไทยเพื่อมัสยิดและโรงเรียน',
        'category_id' => 'cat_demo_edu',
        'goal_satang' => 60000000, // 600,000 THB
        'start_date' => '2026-05-01',
        'end_date' => '2026-11-30',
        'status' => 'active',
        'description' => 'จัดพิมพ์และส่งมอบอัลกุรอานพร้อมคำแปลภาษาไทยแก่ห้องสมุดโรงเรียนและมัสยิดทั่วประเทศ',
        'cover_file_id' => '',
        'legacy_id' => 'CAM-69-04',
    ],
    [
        'id' => 'cam_demo_ramadan',
        'name' => 'โครงการเลี้ยงละศีลอดและซะกาตเดือนรอมฎอน',
        'category_id' => 'cat_demo_zakat',
        'goal_satang' => 100000000, // 1,000,000 THB
        'start_date' => '2026-02-01',
        'end_date' => '2026-04-30',
        'status' => 'closed',
        'description' => 'โครงการสนับสนุนอาหารละศีลอดประจำปี (ปิดโครงการแล้ว)',
        'cover_file_id' => '',
        'legacy_id' => 'CAM-69-05',
    ],
];
foreach ($campaigns as $cam) {
    $add('campaigns', $cam['id'], $cam);
}

// 3. Receivers (ผู้รับแจ้งยอด / ช่องทาง)
$receivers = [
    ['id' => 'rcv_demo_line', 'name' => 'LINE Official (@WhiteChannel)', 'phone' => '02-111-2233', 'kind' => 'other',      'active' => '1', 'notes' => 'ช่องทางแชท LINE OA อัตโนมัติและแอดมินตอบกลับ'],
    ['id' => 'rcv_demo_cc1',  'name' => 'คุณฟาติมะห์ (Call Center โต๊ะ 1)', 'phone' => '081-555-0101', 'kind' => 'callcenter', 'active' => '1', 'notes' => 'รับสายกะเช้า 08:30 - 17:30 น.'],
    ['id' => 'rcv_demo_cc2',  'name' => 'คุณอาหมัด (Call Center โต๊ะ 2)',   'phone' => '081-555-0102', 'kind' => 'callcenter', 'active' => '1', 'notes' => 'รับสายกะบ่ายและดูแลผู้บริจาครายเดือน'],
    ['id' => 'rcv_demo_fb',   'name' => 'Facebook Page Inbox',           'phone' => '02-111-2234', 'kind' => 'other',      'active' => '1', 'notes' => 'รับแจ้งสลิปผ่านกล่องข้อความเพจ White Channel'],
    ['id' => 'rcv_demo_hq',   'name' => 'เคาน์เตอร์รับบริจาค สำนักงานใหญ่',  'phone' => '02-111-2200', 'kind' => 'person',     'active' => '1', 'notes' => 'ผู้บริจาคเดินทางมามอบด้วยตนเองที่สถานี'],
];
foreach ($receivers as $rcv) {
    $add('receivers', $rcv['id'], $rcv);
}

// 4. Contacts (สมาชิก / ผู้บริจาค 12 ราย)
$contacts = [
    [
        'id' => 'con_demo_01',
        'name' => 'ฮัจยีอับดุลเลาะห์ มีสุข',
        'phone' => '081-234-5678',
        'email' => 'abdullah.m@example.com',
        'type' => 'donor',
        'province' => 'กรุงเทพมหานคร',
        'address' => '88/12 ซอยรามคำแหง 53 แขวงพลับพลา เขตวังทองหลาง กรุงเทพมหานคร 10310',
        'tags' => 'VIP, ผู้บริจาคประจำ, อุปถัมภ์สื่อ',
        'notes' => 'ผู้บริจาคหลักประจำทุกเดือน สะดวกให้ติดต่อช่วงเช้า 09:00-11:00 น.',
        'legacy_id' => 'WC-00012',
    ],
    [
        'id' => 'con_demo_02',
        'name' => 'คุณมารียะห์ สุวรรณวงศ์',
        'phone' => '089-456-7890',
        'email' => 'mariyah.s@example.com',
        'type' => 'member',
        'province' => 'ปัตตานี',
        'address' => '145 ถนนเจริญประดิษฐ์ ตำบลรูสะมิแล อำเภอเมืองปัตตานี จังหวัดปัตตานี 94000',
        'tags' => 'ผู้บริจาคประจำ, สมาชิกรายเดือน',
        'notes' => 'ชอบรับฮาดียะห์เป็นหนังสืออ่านสำหรับครอบครัว',
        'legacy_id' => 'WC-00045',
    ],
    [
        'id' => 'con_demo_03',
        'name' => 'บริษัท ฮาลาลฟู้ดส์ จำกัด (คุณยูซุฟ)',
        'phone' => '02-987-6543',
        'email' => 'csr@halalfoods.co.th',
        'type' => 'organization',
        'province' => 'สมุทรปราการ',
        'address' => '999 หมู่ 5 ถนนเทพารักษ์ ตำบลสำโรงเหนือ อำเภอเมืองสมุทรปราการ จังหวัดสมุทรปราการ 10270',
        'tags' => 'VIP, องค์กรอุปถัมภ์',
        'notes' => 'ต้องการใบสำคัญรับเงินในนามบริษัททุกครั้งที่บริจาค',
        'legacy_id' => 'WC-00089',
    ],
    [
        'id' => 'con_demo_04',
        'name' => 'คุณอิบรอฮีม ทองดี',
        'phone' => '086-321-9988',
        'email' => 'ibrahim.t@example.com',
        'type' => 'donor',
        'province' => 'สงขลา',
        'address' => '42/7 ถนนเพชรเกษม ตำบลหาดใหญ่ อำเภอหาดใหญ่ จังหวัดสงขลา 90110',
        'tags' => 'ผู้บริจาคประจำ',
        'notes' => 'ติดตามรับชมรายการข่าวและรายการเยาวชนเป็นประจำ',
        'legacy_id' => 'WC-00102',
    ],
    [
        'id' => 'con_demo_05',
        'name' => 'คุณอาอิชะห์ วงศ์สวัสดิ์',
        'phone' => '092-111-3344',
        'email' => 'aishah.w@example.com',
        'type' => 'donor',
        'province' => 'เชียงใหม่',
        'address' => '210 ถนนเจริญประเทศ ตำบลช้างคลาน อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่ 50100',
        'tags' => 'VIP, ผู้บริจาคประจำ',
        'notes' => 'ร่วมบุญโครงการเด็กกำพร้าและพิมพ์หนังสืออัลกุรอานทุกไตรมาส',
        'legacy_id' => 'WC-00118',
    ],
    [
        'id' => 'con_demo_06',
        'name' => 'คุณซุลกิฟลี ดาราแม',
        'phone' => '084-777-6655',
        'email' => '',
        'type' => 'donor',
        'province' => 'ยะลา',
        'address' => '55 ถนนสิโรรส ตำบลสะเตง อำเภอเมืองยะลา จังหวัดยะลา 95000',
        'tags' => 'กู้ภัยน้ำท่วม',
        'notes' => 'แจ้งโอนผ่าน LINE Official',
        'legacy_id' => 'WC-00140',
    ],
    [
        'id' => 'con_demo_07',
        'name' => 'คุณคอดีญะห์ เจริญสุข',
        'phone' => '095-888-1212',
        'email' => 'khadijah.c@example.com',
        'type' => 'member',
        'province' => 'นนทบุรี',
        'address' => '77/9 หมู่บ้านพฤกษา ถนนรัตนาธิเบศร์ ตำบลบางกระสอ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
        'tags' => 'สมาชิกรายเดือน',
        'notes' => 'ฝากพัสดุไว้ที่นิติบุคคลหมู่บ้านได้หากไม่อยู่บ้าน',
        'legacy_id' => 'WC-00155',
    ],
    [
        'id' => 'con_demo_08',
        'name' => 'คุณฮารูน บินอับดุล',
        'phone' => '082-333-4455',
        'email' => '',
        'type' => 'donor',
        'province' => 'นราธิวาส',
        'address' => '19 ถนนสุริยะประดิษฐ์ ตำบลบางนาค อำเภอเมืองนราธิวาส จังหวัดนราธิวาส 96000',
        'tags' => 'ผู้บริจาคใหม่',
        'notes' => 'เพิ่งย้ายบ้านใหม่ รอคอนเฟิร์มรหัสไปรษณีย์อีกครั้ง',
        'legacy_id' => 'WC-00172',
    ],
    [
        'id' => 'con_demo_09',
        'name' => 'หจก. อัลามีน เทรดดิ้ง',
        'phone' => '02-555-8899',
        'email' => 'info@alameen.co.th',
        'type' => 'organization',
        'province' => 'กรุงเทพมหานคร',
        'address' => '320 ถนนพัฒนาการ แขวงสวนหลวง เขตสวนหลวง กรุงเทพมหานคร 10250',
        'tags' => 'VIP, องค์กรอุปถัมภ์',
        'notes' => 'ผู้สนับสนุนรายการช่วงเย็น',
        'legacy_id' => 'WC-00190',
    ],
    [
        'id' => 'con_demo_10',
        'name' => 'คุณซัลมา เกษมสันต์',
        'phone' => '091-222-9090',
        'email' => 'salma.k@example.com',
        'type' => 'donor',
        'province' => 'พระนครศรีอยุธยา',
        'address' => '64 หมู่ 3 ตำบลคลองตะเคียน อำเภอพระนครศรีอยุธยา จังหวัดพระนครศรีอยุธยา 13000',
        'tags' => 'ผู้บริจาคประจำ',
        'notes' => 'โอนร่วมบุญทุกวันศุกร์',
        'legacy_id' => 'WC-00205',
    ],
];
foreach ($contacts as $con) {
    $add('contacts', $con['id'], $con);
}

// 5. Hadeeya (รายการฮาดียะห์ / ของที่ระลึก)
$hadeeyas = [
    ['id' => 'had_demo_quran', 'sku' => 'HDY-001', 'name' => 'หนังสืออัลกุรอานแปลไทย (ปกแข็ง สีเขียวทอง)', 'unit' => 'เล่ม', 'active' => '1', 'description' => 'มอบให้ผู้ร่วมบริจาคกองทุนสื่อและโครงการการศึกษาตั้งแต่ 1,000 บาทขึ้นไป'],
    ['id' => 'had_demo_cal',   'sku' => 'HDY-002', 'name' => 'ปฏิทินตั้งโต๊ะอิสลาม White Channel 2569',    'unit' => 'ชุด',  'active' => '1', 'description' => 'ปฏิทินบอกเวลาละหมาดและวันสำคัญประจำปี 2569'],
    ['id' => 'had_demo_dua',   'sku' => 'HDY-003', 'name' => 'หนังสือรวมดุอาอ์ประจำวันฉบับพกพา',           'unit' => 'เล่ม', 'active' => '1', 'description' => 'หนังสือขนาดพกพา พิมพ์ 4 สีทั้งเล่ม'],
    ['id' => 'had_demo_bag',   'sku' => 'HDY-004', 'name' => 'กระเป๋าผ้าแคนวาส White Channel',           'unit' => 'ใบ',   'active' => '1', 'description' => 'กระเป๋าผ้ารักษ์โลกสกรีนโลโก้สถานี'],
    ['id' => 'had_demo_pen',   'sku' => 'HDY-005', 'name' => 'ชุดกล่องปากกาโลหะสลักชื่อ White Channel',     'unit' => 'กล่อง', 'active' => '1', 'description' => 'ของที่ระลึกพิเศษสำหรับผู้บริจาค VIP'],
];
foreach ($hadeeyas as $h) {
    $add('hadeeya', $h['id'], $h);
}

// 6. Stock Lots (ล็อตและคลังสินค้า)
$lots = [
    ['id' => 'lot_demo_01', 'hadeeya_id' => 'had_demo_quran', 'lot_code' => 'LOT-202609-001', 'quantity' => 84,  'location' => 'ชั้นวาง A1 · คลังหลักชั้น 2', 'note' => 'รับเข้าจากโรงพิมพ์ล็อตเดือนกันยายน 100 เล่ม'],
    ['id' => 'lot_demo_02', 'hadeeya_id' => 'had_demo_cal',   'lot_code' => 'LOT-202610-001', 'quantity' => 145, 'location' => 'ชั้นวาง B2 · คลังหลักชั้น 2', 'note' => 'ล็อตปฏิทินปีใหม่ 2569 รอบแรก'],
    ['id' => 'lot_demo_03', 'hadeeya_id' => 'had_demo_dua',   'lot_code' => 'LOT-202610-002', 'quantity' => 4,   'location' => 'ชั้นวาง A3 · คลังหลักชั้น 2', 'note' => 'สต็อกใกล้หมด รอสั่งพิมพ์เพิ่ม'],
    ['id' => 'lot_demo_04', 'hadeeya_id' => 'had_demo_bag',   'lot_code' => 'LOT-202611-001', 'quantity' => 38,  'location' => 'ตู้ C1 · ห้องจัดส่งชั้น 1',   'note' => 'กระเป๋าผ้าล็อตเดือนพฤศจิกายน'],
    ['id' => 'lot_demo_05', 'hadeeya_id' => 'had_demo_pen',   'lot_code' => 'LOT-202611-002', 'quantity' => 0,   'location' => 'ตู้ VIP · ห้องการเงิน',       'note' => 'แจกผู้บริจาค VIP ครบแล้ว รอของเข้าสัปดาห์หน้า'],
];
foreach ($lots as $l) {
    $add('stock_lots', $l['id'], $l, '2026-10-01T08:00:00Z');
}

// 7. Delivery Companies (บริษัทขนส่ง)
$couriers = [
    ['id' => 'dco_demo_thpost', 'name' => 'ไปรษณีย์ไทย (EMS)', 'tracking_url' => 'https://track.thailandpost.co.th/?trackNumber={tracking}', 'active' => '1'],
    ['id' => 'dco_demo_flash',  'name' => 'Flash Express',     'tracking_url' => 'https://www.flashexpress.co.th/tracking/?se={tracking}',   'active' => '1'],
    ['id' => 'dco_demo_kerry',  'name' => 'KEX (Kerry Express)','tracking_url' => 'https://th.kex-express.com/th/track/?track={tracking}',   'active' => '1'],
    ['id' => 'dco_demo_jnt',    'name' => 'J&T Express',       'tracking_url' => 'https://www.jtexpress.co.th/service/track?waybillNo={tracking}', 'active' => '1'],
];
foreach ($couriers as $dc) {
    $add('delivery_companies', $dc['id'], $dc);
}

// 8. Donations (รายการบริจาค 20 รายการ ย้อนหลัง 6 เดือน + เดือนปัจจุบัน + วันนี้)
$donations = [
    ['id'=>'don_demo_01','barcode'=>'RCP-20260615-001','contact_id'=>'con_demo_01','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_cc1','amount_satang'=>1000000,'donated_at'=>'2026-06-15','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ร่วมสนับสนุนกองทุนสื่อประจำเดือนมิถุนายน','legacy_id'=>''],
    ['id'=>'don_demo_02','barcode'=>'RCP-20260710-001','contact_id'=>'con_demo_03','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_hq', 'amount_satang'=>2500000,'donated_at'=>'2026-07-10','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'บจก.ฮาลาลฟู้ดส์ ร่วมอุปถัมภ์รายการ','legacy_id'=>''],
    ['id'=>'don_demo_03','barcode'=>'RCP-20260722-002','contact_id'=>'con_demo_02','campaign_id'=>'cam_demo_orphan', 'receiver_id'=>'rcv_demo_line','amount_satang'=>300000, 'donated_at'=>'2026-07-22','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'สมทบทุนเด็กกำพร้า','legacy_id'=>''],
    ['id'=>'don_demo_04','barcode'=>'RCP-20260805-001','contact_id'=>'con_demo_05','campaign_id'=>'cam_demo_quran',  'receiver_id'=>'rcv_demo_cc2','amount_satang'=>1200000,'donated_at'=>'2026-08-05','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ร่วมจัดพิมพ์อัลกุรอานแปลไทย 40 เล่ม','legacy_id'=>''],
    ['id'=>'don_demo_05','barcode'=>'RCP-20260819-002','contact_id'=>'con_demo_01','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_cc1','amount_satang'=>1000000,'donated_at'=>'2026-08-19','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'บริจาคประจำเดือนสิงหาคม','legacy_id'=>''],
    ['id'=>'don_demo_06','barcode'=>'RCP-20260912-001','contact_id'=>'con_demo_09','campaign_id'=>'cam_demo_flood',  'receiver_id'=>'rcv_demo_hq', 'amount_satang'=>3000000,'donated_at'=>'2026-09-12','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'หจก.อัลามีน สนับสนุนถุงยังชีพน้ำท่วม 100 ชุด','legacy_id'=>''],
    ['id'=>'don_demo_07','barcode'=>'RCP-20260925-002','contact_id'=>'con_demo_04','campaign_id'=>'cam_demo_flood',  'receiver_id'=>'rcv_demo_line','amount_satang'=>200000, 'donated_at'=>'2026-09-25','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ช่วยผู้ประสบภัยน้ำท่วม','legacy_id'=>''],
    ['id'=>'don_demo_08','barcode'=>'RCP-20261004-001','contact_id'=>'con_demo_01','campaign_id'=>'cam_demo_orphan', 'receiver_id'=>'rcv_demo_cc1','amount_satang'=>1500000,'donated_at'=>'2026-10-04','status'=>'confirmed','channel'=>'bank','distribution_period'=>'30days','note'=>'กระจายบุญ 30 วัน กองทุนเด็กกำพร้า ขอรับอัลกุรอานแปลไทย','legacy_id'=>''],
    ['id'=>'don_demo_09','barcode'=>'RCP-20261018-002','contact_id'=>'con_demo_02','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_line','amount_satang'=>250000, 'donated_at'=>'2026-10-18','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ขอรับปฏิทินตั้งโต๊ะ 2569','legacy_id'=>''],
    ['id'=>'don_demo_10','barcode'=>'RCP-20261029-003','contact_id'=>'con_demo_07','campaign_id'=>'cam_demo_quran',  'receiver_id'=>'rcv_demo_fb', 'amount_satang'=>150000, 'donated_at'=>'2026-10-29','status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ขอรับหนังสือดุอาอ์ประจำวัน','legacy_id'=>''],
    ['id'=>'don_demo_11','barcode'=>'RCP-20261102-001','contact_id'=>'con_demo_03','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_hq', 'amount_satang'=>5000000,'donated_at'=>$fiveDaysAgo,'status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'สนับสนุนกองทุนสื่อไตรมาสสุดท้าย','legacy_id'=>''],
    ['id'=>'don_demo_12','barcode'=>'RCP-20261105-002','contact_id'=>'con_demo_05','campaign_id'=>'cam_demo_flood',  'receiver_id'=>'rcv_demo_cc2','amount_satang'=>500000, 'donated_at'=>$twoDaysAgo, 'status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'สมทบถุงยังชีพน้ำท่วมภาคใต้ ขอรับกระเป๋าผ้า','legacy_id'=>''],
    ['id'=>'don_demo_13','barcode'=>'RCP-20261109-003','contact_id'=>'con_demo_08','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_line','amount_satang'=>120000, 'donated_at'=>$twoDaysAgo, 'status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ขอรับปฏิทินตั้งโต๊ะ 1 ชุด','legacy_id'=>''],
    ['id'=>'don_demo_14','barcode'=>'RCP-20261110-004','contact_id'=>'con_demo_10','campaign_id'=>'cam_demo_orphan', 'receiver_id'=>'rcv_demo_line','amount_satang'=>200000, 'donated_at'=>$yesterday,  'status'=>'confirmed','channel'=>'bank','distribution_period'=>'day', 'note'=>'บริจาคประจำวันศุกร์','legacy_id'=>''],
    ['id'=>'don_demo_15','barcode'=>'RCP-20261111-001','contact_id'=>'con_demo_01','campaign_id'=>'cam_demo_media69','receiver_id'=>'rcv_demo_cc1','amount_satang'=>1000000,'donated_at'=>$today,      'status'=>'confirmed','channel'=>'bank','distribution_period'=>'once','note'=>'ร่วมบุญกองทุนสื่อวันนี้','legacy_id'=>''],
    ['id'=>'don_demo_16','barcode'=>'RCP-20261111-002','contact_id'=>'con_demo_06','campaign_id'=>'cam_demo_flood',  'receiver_id'=>'rcv_demo_line','amount_satang'=>150000, 'donated_at'=>$today,      'status'=>'pending',  'channel'=>'bank','distribution_period'=>'once','note'=>'แจ้งโอนผ่าน LINE รอฝ่ายการเงินตรวจสลิป','legacy_id'=>''],
    ['id'=>'don_demo_17','barcode'=>'RCP-20261111-003','contact_id'=>'con_demo_04','campaign_id'=>'cam_demo_quran',  'receiver_id'=>'rcv_demo_fb', 'amount_satang'=>300000, 'donated_at'=>$today,      'status'=>'pending',  'channel'=>'bank','distribution_period'=>'once','note'=>'แจ้งสลิปทาง Inbox เพจ ขอรับอัลกุรอานแปลไทย 1 เล่ม','legacy_id'=>''],
];
foreach ($donations as $d) {
    $add('donations', $d['id'], $d, $d['donated_at'] . 'T09:30:00Z');
}

// 9. Shipments (การจัดส่ง / รับคืน)
$shipments = [
    [
        'id' => 'shp_demo_01',
        'donation_id' => 'don_demo_08',
        'hadeeya_id' => 'had_demo_quran',
        'lot_id' => 'lot_demo_01',
        'quantity' => 1,
        'delivery_company_id' => 'dco_demo_thpost',
        'tracking_no' => 'EF102938475TH',
        'status' => 'delivered',
        'sent_at' => '2026-10-05',
        'received_at' => '2026-10-07',
        'note' => 'ผู้รับ: ฮัจยีอับดุลเลาะห์ มีสุข | โทร: 081-234-5678 | ที่อยู่: 88/12 ซอยรามคำแหง 53 แขวงพลับพลา เขตวังทองหลาง กรุงเทพมหานคร 10310',
        'proof_file_id' => '',
        'stock_deducted' => true,
        'deducted_lot_id' => 'lot_demo_01',
        'deducted_qty' => 1,
    ],
    [
        'id' => 'shp_demo_02',
        'donation_id' => 'don_demo_09',
        'hadeeya_id' => 'had_demo_cal',
        'lot_id' => 'lot_demo_02',
        'quantity' => 1,
        'delivery_company_id' => 'dco_demo_flash',
        'tracking_no' => 'TH7701928374A',
        'status' => 'delivered',
        'sent_at' => '2026-10-19',
        'received_at' => '2026-10-22',
        'note' => 'ผู้รับ: คุณมารียะห์ สุวรรณวงศ์ | โทร: 089-456-7890 | ที่อยู่: 145 ถนนเจริญประดิษฐ์ ต.รูสะมิแล อ.เมือง จ.ปัตตานี 94000',
        'proof_file_id' => '',
        'stock_deducted' => true,
        'deducted_lot_id' => 'lot_demo_02',
        'deducted_qty' => 1,
    ],
    [
        'id' => 'shp_demo_03',
        'donation_id' => 'don_demo_10',
        'hadeeya_id' => 'had_demo_dua',
        'lot_id' => 'lot_demo_03',
        'quantity' => 1,
        'delivery_company_id' => 'dco_demo_kerry',
        'tracking_no' => 'KEX9001122334',
        'status' => 'shipped',
        'sent_at' => $yesterday,
        'received_at' => '',
        'note' => 'ผู้รับ: คุณคอดีญะห์ เจริญสุข | โทร: 095-888-1212 | ที่อยู่: 77/9 หมู่บ้านพฤกษา ถ.รัตนาธิเบศร์ อ.เมือง จ.นนทบุรี 11000',
        'proof_file_id' => '',
        'stock_deducted' => true,
        'deducted_lot_id' => 'lot_demo_03',
        'deducted_qty' => 1,
    ],
    [
        'id' => 'shp_demo_04',
        'donation_id' => 'don_demo_12',
        'hadeeya_id' => 'had_demo_bag',
        'lot_id' => 'lot_demo_04',
        'quantity' => 1,
        'delivery_company_id' => 'dco_demo_thpost',
        'tracking_no' => 'EF554433221TH',
        'status' => 'shipped',
        'sent_at' => $today,
        'received_at' => '',
        'note' => 'ผู้รับ: คุณอาอิชะห์ วงศ์สวัสดิ์ | โทร: 092-111-3344 | ที่อยู่: 210 ถ.เจริญประเทศ ต.ช้างคลาน อ.เมือง จ.เชียงใหม่ 50100',
        'proof_file_id' => '',
        'stock_deducted' => true,
        'deducted_lot_id' => 'lot_demo_04',
        'deducted_qty' => 1,
    ],
    [
        'id' => 'shp_demo_05',
        'donation_id' => 'don_demo_13',
        'hadeeya_id' => 'had_demo_cal',
        'lot_id' => 'lot_demo_02',
        'quantity' => 1,
        'delivery_company_id' => 'dco_demo_flash',
        'tracking_no' => 'TH8899001122B',
        'status' => 'returned',
        'sent_at' => $twoDaysAgo,
        'received_at' => '',
        'note' => 'พัสดุตีกลับเนื่องจากติดต่อผู้รับไม่ได้ | ผู้รับ: คุณฮารูน บินอับดุล | โทร: 082-333-4455',
        'proof_file_id' => '',
        'stock_deducted' => false,
        'deducted_lot_id' => 'lot_demo_02',
        'deducted_qty' => 1,
    ],
    [
        'id' => 'shp_demo_06',
        'donation_id' => 'don_demo_15',
        'hadeeya_id' => 'had_demo_quran',
        'lot_id' => 'lot_demo_01',
        'quantity' => 1,
        'delivery_company_id' => 'dco_demo_thpost',
        'tracking_no' => '',
        'status' => 'preparing',
        'sent_at' => '',
        'received_at' => '',
        'note' => 'ผู้รับ: ฮัจยีอับดุลเลาะห์ มีสุข | โทร: 081-234-5678 | ที่อยู่: 88/12 ซอยรามคำแหง 53 แขวงพลับพลา เขตวังทองหลาง กรุงเทพมหานคร 10310',
        'proof_file_id' => '',
        'stock_deducted' => true,
        'deducted_lot_id' => 'lot_demo_01',
        'deducted_qty' => 1,
    ],
];
foreach ($shipments as $s) {
    $add('shipments', $s['id'], $s);
}

// 10. Inventory Moves (ประวัติเคลื่อนไหวสต็อก)
$moves = [
    ['id'=>'mov_demo_01','lot_id'=>'lot_demo_01','movement'=>'receive','quantity'=>86,'before'=>0, 'after'=>86,'reason'=>'รับเข้าสต็อกเริ่มต้นเมื่อเปิดล็อตใหม่ (LOT-202609-001)','actor'=>$actorId,'at'=>'2026-09-15T09:00:00Z'],
    ['id'=>'mov_demo_02','lot_id'=>'lot_demo_02','movement'=>'receive','quantity'=>146,'before'=>0,'after'=>146,'reason'=>'รับเข้าสต็อกเริ่มต้นเมื่อเปิดล็อตใหม่ (LOT-202610-001)','actor'=>$actorId,'at'=>'2026-10-01T09:00:00Z'],
    ['id'=>'mov_demo_03','lot_id'=>'lot_demo_01','movement'=>'issue',  'quantity'=>1, 'before'=>86,'after'=>85,'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #shp_demo_01','actor'=>$actorId,'at'=>'2026-10-05T10:15:00Z'],
    ['id'=>'mov_demo_04','lot_id'=>'lot_demo_02','movement'=>'issue',  'quantity'=>1, 'before'=>146,'after'=>145,'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #shp_demo_02','actor'=>$actorId,'at'=>'2026-10-19T11:20:00Z'],
    ['id'=>'mov_demo_05','lot_id'=>'lot_demo_03','movement'=>'issue',  'quantity'=>1, 'before'=>5, 'after'=>4, 'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #shp_demo_03','actor'=>$actorId,'at'=>$yesterday.'T14:00:00Z'],
    ['id'=>'mov_demo_06','lot_id'=>'lot_demo_02','movement'=>'receive','quantity'=>1, 'before'=>144,'after'=>145,'reason'=>'คืนสต็อกอัตโนมัติเนื่องจากจัดส่ง #shp_demo_05 เปลี่ยนสถานะเป็น returned','actor'=>$actorId,'at'=>$yesterday.'T16:30:00Z'],
    ['id'=>'mov_demo_07','lot_id'=>'lot_demo_01','movement'=>'issue',  'quantity'=>1, 'before'=>85,'after'=>84,'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #shp_demo_06','actor'=>$actorId,'at'=>$today.'T09:45:00Z'],
];
foreach ($moves as $m) {
    $at = $m['at'];
    unset($m['at']);
    $add('inventory_moves', $m['id'], $m, $at);
}

// 11. Tasks (Call Center / งานติดตาม)
$tasks = [
    [
        'id' => 'tsk_demo_01',
        'title' => '📦 พัสดุตีกลับ: โทรตรวจสอบที่อยู่จัดส่งใหม่ (TH8899001122B)',
        'contact_id' => 'con_demo_08',
        'assigned_to' => $actorId,
        'due_date' => $twoDaysAgo,
        'priority' => 'urgent',
        'status' => 'open',
        'note' => 'ระบบสร้างอัตโนมัติเนื่องจากรายการจัดส่ง #shp_demo_05 สถานะเป็น ตีกลับ (ขนส่งโทรไม่ติด)',
    ],
    [
        'id' => 'tsk_demo_02',
        'title' => 'โทรยืนยันใบสำคัญรับเงินยอด 50,000 บาท กับฝ่ายบัญชี บจก.ฮาลาลฟู้ดส์',
        'contact_id' => 'con_demo_03',
        'assigned_to' => $actorId,
        'due_date' => $yesterday,
        'priority' => 'high',
        'status' => 'progress',
        'note' => 'ส่งไฟล์ PDF ให้ทางอีเมลแล้ว รอโทรเช็กว่าได้รับเอกสารตัวจริงหรือยัง',
    ],
    [
        'id' => 'tsk_demo_03',
        'title' => 'โทรขอบคุณและแจ้งเลขพัสดุฮาดียะห์ (คุณอาอิชะห์ จ.เชียงใหม่)',
        'contact_id' => 'con_demo_05',
        'assigned_to' => $actorId,
        'due_date' => $today,
        'priority' => 'normal',
        'status' => 'open',
        'note' => 'จัดส่งกระเป๋าผ้า EMS เลขพัสดุ EF554433221TH เรียบร้อยแล้ว',
    ],
    [
        'id' => 'tsk_demo_04',
        'title' => 'โทรสอบถามรายละเอียดสลิปโอนเงิน 1,500 บาท (โครงการน้ำท่วม)',
        'contact_id' => 'con_demo_06',
        'assigned_to' => $actorId,
        'due_date' => $today,
        'priority' => 'high',
        'status' => 'open',
        'note' => 'ตรวจสอบว่าต้องการรับของที่ระลึกฮาดียะห์ด้วยหรือไม่',
    ],
    [
        'id' => 'tsk_demo_05',
        'title' => 'เรียนเชิญฮัจยีอับดุลเลาะห์ ร่วมงานเปิดโครงการสื่อความดีปลายปี',
        'contact_id' => 'con_demo_01',
        'assigned_to' => $actorId,
        'due_date' => $nextWeek,
        'priority' => 'normal',
        'status' => 'open',
        'note' => 'ผู้บริจาค VIP ประจำสถานี โทรช่วงเช้า 09:30 น.',
    ],
    [
        'id' => 'tsk_demo_06',
        'title' => 'โทรขอบคุณคุณมารียะห์ และยืนยันการได้รับปฏิทินปี 2569',
        'contact_id' => 'con_demo_02',
        'assigned_to' => $actorId,
        'due_date' => $fiveDaysAgo,
        'priority' => 'normal',
        'status' => 'done',
        'note' => 'โทรคุยเรียบร้อย ผู้บริจาคได้รับปฏิทินแล้วและฝากดุอาอ์ให้ทีมงานทุกคน',
    ],
];
foreach ($tasks as $t) {
    $add('tasks', $t['id'], $t);
}

// 12. Feedback (ความคิดเห็น / ข้อเสนอแนะ)
$feedbacks = [
    [
        'id' => 'fbk_demo_01',
        'contact_id' => 'con_demo_01',
        'topic' => 'ชื่นชมรายการตอบปัญหาศาสนาช่วงค่ำ เนื้อหาเข้าใจง่ายมาก',
        'category' => 'praise',
        'channel' => 'phone',
        'status' => 'resolved',
        'message' => 'ผู้ชมฝากขอบคุณวิทยากรและทีมงานถ่ายทอดสด ภาพและเสียงคมชัดมาก',
    ],
    [
        'id' => 'fbk_demo_02',
        'contact_id' => 'con_demo_04',
        'topic' => 'เสนอแนะให้เพิ่มคิวอาร์โค้ดบริจาคบนหน้าจอให้ใหญ่ขึ้นสำหรับผู้สูงอายุ',
        'category' => 'suggestion',
        'channel' => 'line',
        'status' => 'review',
        'message' => 'ผู้สูงอายุที่บ้านอยากสแกนทำบุญผ่านมือถือได้ง่ายขึ้น ประสานฝ่ายกราฟิกปรับขนาด QR Code',
    ],
    [
        'id' => 'fbk_demo_03',
        'contact_id' => 'con_demo_08',
        'topic' => 'แจ้งยังไม่ได้รับพัสดุปฏิทินตั้งโต๊ะ (ขนส่งตีกลับ)',
        'category' => 'complaint',
        'channel' => 'phone',
        'status' => 'new',
        'message' => 'ผู้บริจาคแจ้งว่าวันนั้นติดธุระไม่ได้รับสายขนส่ง ขอให้จัดส่งใหม่อีกครั้ง',
    ],
];
foreach ($feedbacks as $f) {
    $add('feedback', $f['id'], $f);
}

// 13. Announcements (ประกาศภายใน)
$announcements = [
    [
        'id' => 'ann_demo_01',
        'title' => '📢 แนวทางการรับแจ้งยอดและจัดส่งฮาดียะห์ช่วงไตรมาส 4/2569',
        'body' => 'ขอให้เจ้าหน้าที่ Call Center ตรวจสอบชื่อ-เบอร์โทร-รหัสไปรษณีย์ของผู้บริจาคให้ครบถ้วนทุกครั้ง และเมื่อสร้างรายการจัดส่งให้เลือกล็อตคลังสินค้าเพื่อให้ระบบตัดสต็อกอัตโนมัติทันที',
        'status' => 'published',
    ],
    [
        'id' => 'ann_demo_02',
        'title' => '⚡ แจ้งเตือนคลังสินค้า: หนังสือรวมดุอาอ์ประจำวัน (HDY-003) เหลือ 4 เล่ม',
        'body' => 'ขณะนี้ล็อต LOT-202610-002 เหลือในคลัง 4 เล่มสุดท้าย ฝ่ายคลังกำลังรับเข้าล็อตใหม่จากโรงพิมพ์ในวันศุกร์นี้ จำนวน 300 เล่ม',
        'status' => 'published',
    ],
];
foreach ($announcements as $a) {
    $add('announcements', $a['id'], $a);
}

$store->transact($changes);

echo "SEEDED OK: " . count($changes) . " demo records inserted across all 13 modules.\n";
