<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(403);exit('CLI only');}
require dirname(__DIR__).'/app/bootstrap.php';
use CRM\Auth;use CRM\Store;
if(is_file(ROOT.'/config/installed.php')){fwrite(STDERR,"Already installed\n");exit(1);}
function ask(string $prompt): string {fwrite(STDOUT,$prompt);return trim((string)fgets(STDIN));}
$name=ask('ชื่อผู้ดูแล (Display name): ');
$username=strtolower(ask('ชื่อผู้ใช้ (a-z 0-9 . _ -): '));
if($name===''||mb_strlen($name)>150||!preg_match('/^[a-z0-9._-]{3,40}$/D',$username)){fwrite(STDERR,"Invalid name / username\n");exit(1);}
$password=getenv('CRM_INITIAL_PASSWORD');
if($password===false ||$password===''){
    $password=ask('รหัสผ่านใหม่ (อย่างน้อย 12 ตัว, screen echo on): ');
}
try{$hash=Auth::hash($password);}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n");exit(1);}
$store=new Store();foreach($store->summaries('users') as $_){fwrite(STDERR,"Existing users found. Refusing to overwrite.\n");exit(1);}
$id=crm_id('usr');$now=crm_now();$user=['id'=>$id,'username'=>$username,'name'=>$name,'role'=>'admin','active'=>true,'password_hash'=>$hash,'auth_version'=>bin2hex(random_bytes(16)),'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null];
$store->transact([['collection'=>'users','id'=>$id,'record'=>$user,'summary'=>Auth::userSummary($user)]]);
$config='<?php return '.var_export(['installed_at'=>$now,'storage_path'=>'storage'],true).';';
$file=fopen(ROOT.'/config/installed.php','x');if(!$file){fwrite(STDERR,"Cannot create config/installed.php\n");exit(1);}fwrite($file,$config);fclose($file);@chmod(ROOT.'/config/installed.php',0600);
echo "\nInstalled! Set Web Root to: ".ROOT."/public\n";
