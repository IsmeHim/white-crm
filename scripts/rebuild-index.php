<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit('CLI only');
require dirname(__DIR__).'/app/bootstrap.php';
use CRM\Store;use CRM\Schema;use CRM\Auth;
$store=new Store();$count=0;
$stmt=$store->pdo()->query('SELECT collection, id, record_json FROM records');
$changes=[];
while($row=$stmt->fetch()){
    $module=(string)$row['collection'];
    $record=json_decode((string)$row['record_json'],true);
    if(!is_array($record)||empty($record['id']))continue;
    $schema=Schema::module($module);
    $summary=$module==='users'?Auth::userSummary($record):($schema?Schema::summary($module,$record):$record);
    $changes[]=['collection'=>$module,'id'=>$record['id'],'record'=>$record,'summary'=>$summary];
    $count++;
}
if($changes)$store->transact($changes);
$store->pdo()->exec('VACUUM');
echo "Rebuilt $count SQLite index records and vacuumed database.\n";
