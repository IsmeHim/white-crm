<?php
declare(strict_types=1);
/** CLI restore from authenticated encrypted backup. Stop writes and back up current storage first. */
if(PHP_SAPI!=='cli')exit('CLI only');
require dirname(__DIR__).'/app/bootstrap.php';
if(!extension_loaded('sodium')){fwrite(STDERR,"Extension sodium required.\n");exit(1);}
$src=$argv[1]??'';
if(!is_file($src)||!in_array('--i-understand',$argv,true)){fwrite(STDERR,"Usage: CRM_BACKUP_PASSWORD=... php scripts/restore.php /path/backup.wcb --i-understand\nSTOP WEB/PHP WORKERS FIRST.\n");exit(1);}
$password=getenv('CRM_BACKUP_PASSWORD');if(!is_string($password)||strlen($password)<12){fwrite(STDERR,"Set CRM_BACKUP_PASSWORD\n");exit(1);}
$in=fopen($src,'rb');$magic=fread($in,10);if($magic!=='WCCRM2BKP1'){fwrite(STDERR,"Invalid backup format\n");exit(1);}
$salt=fread($in,SODIUM_CRYPTO_PWHASH_SALTBYTES);$header=fread($in,SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_HEADERBYTES);
$key=sodium_crypto_pwhash(SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_KEYBYTES,$password,$salt,SODIUM_CRYPTO_PWHASH_OPSLIMIT_INTERACTIVE,SODIUM_CRYPTO_PWHASH_MEMLIMIT_INTERACTIVE);
$state=sodium_crypto_secretstream_xchacha20poly1305_init_pull($header,$key);
$tmpbase=sys_get_temp_dir().'/wc-crm-restore-'.bin2hex(random_bytes(8));$tar=$tmpbase.'.tar';$out=fopen($tar,'xb');$final=false;
try {
    while(!feof($in)){
        $sizeRaw=fread($in,4);if($sizeRaw==='')break;
        if(strlen($sizeRaw)!==4)throw new RuntimeException('Truncated frame header');
        $len=unpack('Nsize',$sizeRaw)['size'];
        if($len<17||$len>1048600)throw new RuntimeException('Invalid frame length');
        $cipher='';while(strlen($cipher)<$len){$part=fread($in,$len-strlen($cipher));if($part===false||$part==='')throw new RuntimeException('Truncated encrypted data');$cipher.=$part;}
        $message=sodium_crypto_secretstream_xchacha20poly1305_pull($state,$cipher);
        if($message===false)throw new RuntimeException('Wrong password / damaged backup');
        [$plain,$tag]=$message;fwrite($out,$plain);
        if($tag===SODIUM_CRYPTO_SECRETSTREAM_XCHACHA20POLY1305_TAG_FINAL){$final=true;if(fread($in,1)!=='')throw new RuntimeException('Trailing bytes');break;}
    }
    fclose($out);fclose($in);
    if(!$final)throw new RuntimeException('Missing final authentication tag');
    $stage=dirname(CRM_STORAGE).'/storage.restore.'.bin2hex(random_bytes(5));mkdir($stage,0700);
    $archive=new PharData($tar);
    // Authenticated archive produced by backup.php; still inspect paths defensively.
    foreach(new RecursiveIteratorIterator($archive) as $item){$filename=str_replace('phar://'.$tar.'/','',$item->getPathname());if(str_contains($filename,'..')||str_starts_with($filename,'/')||str_contains($filename,'\\'))throw new RuntimeException('Unsafe archive entry');}
    $archive->extractTo($stage,null,true);unset($archive);
    if(!is_file($stage.'/crm.sqlite') && (!is_dir($stage.'/records')||!is_dir($stage.'/index')))throw new RuntimeException('Backup lacks required storage database/dirs');
    $original=CRM_STORAGE;$saved=$original.'.before-restore-'.gmdate('YmdHis');
    if(!rename($original,$saved))throw new RuntimeException('Could not move current storage');
    if(!rename($stage,$original)) {rename($saved,$original);throw new RuntimeException('Could not activate restored storage');}
    echo "Restored to: $original\nPrevious data retained at: $saved\n";
} catch(Throwable $e) {fwrite(STDERR,"Restore failed: {$e->getMessage()}\n");exit(1);}
finally {@unlink($tar);}
