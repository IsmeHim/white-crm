<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit('CLI only');
require dirname(__DIR__).'/app/bootstrap.php';
use CRM\Store;use CRM\Schema;
$dir=sys_get_temp_dir().'/whitechannel_crm_test_'.bin2hex(random_bytes(6));
$store=new Store($dir);$now=crm_now();
$record=['id'=>crm_id('con'),'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'name'=>'ทดสอบผู้บริจาค','phone'=>'0812345678','type'=>'donor','email'=>'','province'=>'Bangkok','address'=>'','tags'=>'','notes'=>'','legacy_id'=>''];
$store->transact([['collection'=>'contacts','id'=>$record['id'],'record'=>$record,'summary'=>Schema::summary('contacts',$record)]]);
assert($store->count('contacts')===1);
assert($store->read('contacts',$record['id'])['name']==='ทดสอบผู้บริจาค');
assert($store->listing('contacts','0812345')['total']===1);
$record['name']='ทดสอบแก้ไข';$record['version']=2;
$store->transact([['collection'=>'contacts','id'=>$record['id'],'record'=>$record,'summary'=>Schema::summary('contacts',$record),'expected_version'=>1]]);
assert($store->read('contacts',$record['id'])['version']===2);
try {$store->transact([['collection'=>'contacts','id'=>$record['id'],'record'=>$record,'summary'=>Schema::summary('contacts',$record),'expected_version'=>1]]);throw new RuntimeException('Conflict detection failed');}
catch(RuntimeException $e){if(!str_contains($e->getMessage(),'Conflict'))throw $e;}
assert($store->listing('contacts','ทดสอบแก้ไข')['total']===1);
$invalid=false;try{Schema::data('contacts',['name'=>'','type'=>'donor'],$store);}catch(InvalidArgumentException){$invalid=true;}
assert($invalid);
$cam=['id'=>crm_id('cam'),'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'name'=>'โครงการทดสอบ','status'=>'active','goal_satang'=>100000];
$don1=['id'=>crm_id('don'),'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'contact_id'=>$record['id'],'campaign_id'=>$cam['id'],'amount_satang'=>250000,'donated_at'=>'2026-10-15','status'=>'confirmed'];
$don2=['id'=>crm_id('don'),'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'contact_id'=>$record['id'],'campaign_id'=>$cam['id'],'amount_satang'=>100000,'donated_at'=>'2026-11-10','status'=>'confirmed'];
$store->transact([
    ['collection'=>'campaigns','id'=>$cam['id'],'record'=>$cam,'summary'=>Schema::summary('campaigns',$cam)],
    ['collection'=>'donations','id'=>$don1['id'],'record'=>$don1,'summary'=>Schema::summary('donations',$don1)],
    ['collection'=>'donations','id'=>$don2['id'],'record'=>$don2,'summary'=>Schema::summary('donations',$don2)],
]);
$novList=$store->listing('donations','',['date_from'=>'2026-11-01','date_to'=>'2026-11-30']);
assert($novList['total']===1);
assert($novList['sum_confirmed_satang']===100000);
$autoCon=Schema::data('contacts',['name'=>'ฮัจยีสมชาย','phone'=>'0891112222','address'=>'99 หมู่ 4 อ.เมือง จ.ปัตตานี 94000'],$store);
assert($autoCon['phone']==='089-111-2222');
assert($autoCon['province']==='ปัตตานี');
assert($autoCon['type']==='donor');
$autoHad=Schema::data('hadeeya',['name'=>'หนังสืออัลกุรอาน'],$store);
assert(str_starts_with($autoHad['sku'],'HDY-'));
assert($autoHad['unit']==='ชิ้น');
assert($autoHad['active']==='1');
function rmTree(string $path):void{if(!is_dir($path))return;foreach(new FilesystemIterator($path,FilesystemIterator::SKIP_DOTS) as $f){if($f->isDir())rmTree($f->getPathname());else @unlink($f->getPathname());}@rmdir($path);}
unset($store);
rmTree($dir);
echo "PASS: SQLite records, index lookup, date-range filter, write transaction, optimistic conflict, validation, cache invalidation\n";
