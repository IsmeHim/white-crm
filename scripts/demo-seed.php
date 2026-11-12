<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit('CLI only');
require dirname(__DIR__) . '/app/bootstrap.php';

use CRM\Store;
use CRM\Schema;

if (!in_array('--yes', $argv, true)) {
    echo "DEMO ONLY. Run php scripts/demo-seed.php --yes to add sample data.\n";
    exit(1);
}
$store = new Store();
$now = crm_now();
function seed(Store $s, string $module, array $fields): array
{
    $schema = CRM\Schema::module($module);
    $id = crm_id($schema['prefix']);
    $now = crm_now();
    $r = ['id' => $id, 'version' => 1, 'created_at' => $now, 'updated_at' => $now, 'deleted_at' => null, 'created_by' => 'demo'] + $fields;
    $s->transact([['collection' => $module, 'id' => $id, 'record' => $r, 'summary' => CRM\Schema::summary($module, $r)]]);
    return $r;
}
$c = seed($store, 'contacts', ['name' => 'ผู้บริจาคตัวอย่าง', 'phone' => '0812345678', 'email' => 'example@example.test', 'type' => 'donor', 'province' => 'กรุงเทพมหานคร', 'address' => 'ข้อมูลตัวอย่างเท่านั้น', 'tags' => 'ตัวอย่าง', 'notes' => 'ข้อมูลจำลอง', 'legacy_id' => '']);
$cat = seed($store, 'categories', ['name' => 'โครงการเพื่อสังคม', 'active' => '1', 'description' => 'ตัวอย่าง']);
$campaign = seed($store, 'campaigns', ['name' => 'โครงการช่วยเหลือ (ตัวอย่าง)', 'category_id' => $cat['id'], 'goal_satang' => 2500000, 'start_date' => date('Y-m-d'), 'end_date' => '', 'status' => 'active', 'description' => 'ข้อมูลจำลอง', 'legacy_id' => '']);
seed($store, 'donations', ['contact_id' => $c['id'], 'campaign_id' => $campaign['id'], 'receiver_id' => '', 'amount_satang' => 150000, 'donated_at' => date('Y-m-d'), 'status' => 'confirmed', 'barcode' => 'DEMO-00001', 'channel' => 'bank', 'distribution_period' => 'once', 'note' => 'ข้อมูลจำลอง', 'legacy_id' => '']);
$had = seed($store, 'hadeeya', ['name' => 'ชุดของขวัญตัวอย่าง', 'sku' => 'DEMO-H-01', 'unit' => 'ชุด', 'description' => 'ข้อมูลจำลอง', 'active' => '1']);
seed($store, 'stock_lots', ['hadeeya_id' => $had['id'], 'lot_code' => 'DEMO-LOT-01', 'quantity' => 0, 'location' => 'คลังตัวอย่าง', 'note' => 'ยอดเริ่มต้น 0']);
seed($store, 'announcements', ['title' => 'ยินดีต้อนรับสู่ White Channel CRM V2', 'body' => 'นี่เป็นข้อมูลตัวอย่าง สามารถลบได้', 'status' => 'published']);
echo "Demo data created.\n";
