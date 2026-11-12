<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit('CLI only');
require dirname(__DIR__).'/app/bootstrap.php';
use CRM\Store;
$store=new Store();
$modules=['contacts','campaigns','donations','hadeeya','stock_lots','inventory_moves','shipments','tasks','feedback','users'];
echo "White Channel CRM V2 / Health\n";
echo "PHP: ".PHP_VERSION."\nDatabase: SQLite3 (".CRM_STORAGE."/crm.sqlite)\n";
echo "Installed: ".(is_file(ROOT.'/config/installed.php')?'YES':'NO')."\n";
echo "Database Bytes: ".$store->diskUsage()."\n";
foreach($modules as $m)echo str_pad($m,20).' '.$store->count($m)." records\n";
