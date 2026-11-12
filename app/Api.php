<?php
namespace CRM;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

final class Api {
    private Store $store;
    private Auth $auth;
    public function __construct(Store $store, Auth $auth){$this->store=$store;$this->auth=$auth;}
    public function run(string $action): never {
        try {
            $method=$_SERVER['REQUEST_METHOD']??'GET';
            if($action==='login' && $method==='POST'){
                crm_check_csrf();$d=crm_input();$ok=$this->auth->login((string)($d['username']??''),(string)($d['password']??''));
                if(!$ok)crm_json(['error'=>'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือถูกล็อกชั่วคราว'],401);
                crm_json(['ok'=>true,'csrf'=>crm_csrf()]);
            }
            if($action==='logout'&&$method==='POST'){crm_check_csrf();$this->auth->logout();crm_json(['ok'=>true]);}
            if($action==='session'&&$method==='GET'){
                $u=$this->auth->current();crm_json(['user'=>$u?$this->auth->publicUser($u):null,'roles'=>$this->auth->roles(),'csrf'=>crm_csrf()]);
            }
            if($method!=='GET')crm_check_csrf();
            $user=$this->auth->current();if(!$user)crm_json(['error'=>'Session expired'],401);
            switch($action) {
                case 'schema':
                    crm_json(['modules'=>Schema::all(),'roles'=>$this->auth->roles()]);
                case 'summary':
                    $this->auth->require('dashboard');crm_json($this->dashboard());
                case 'module':
                    $this->module($method);break;
                case 'record':
                    $this->record($method);break;
                case 'quick-status':
                    $this->quickStatus($method);break;
                case 'options':
                    $module=(string)($_GET['module']??'');
                    if($module==='users') {
                        if(!$this->auth->can('users')&&!$this->auth->can('tasks'))crm_json(['error'=>'Permission denied'],403);
                    } else $this->auth->require($module);
                    if($module==='users'){$items=[];foreach($this->store->summaries('users') as $s){if(!empty($s['active']))$items[]=['id'=>$s['id'],'name'=>$s['name']];}crm_json(['items'=>array_slice($items,0,300)]);}
                    if(!Schema::module($module))crm_json(['error'=>'Invalid module'],404);
                    $r=$this->store->listing($module,(string)($_GET['q']??''),[],1,100);
                    $hadeeyaNames=[];
                    if($module==='stock_lots'){
                        foreach($this->store->summaries('hadeeya') as $h)$hadeeyaNames[$h['id']]=$h['name']??$h['id'];
                        usort($r['items'],function($a,$b){
                            $qa=((int)($a['quantity']??0))>0?1:0;
                            $qb=((int)($b['quantity']??0))>0?1:0;
                            if($qa!==$qb)return $qb<=>$qa;
                            return strcmp((string)($a['created_at']??''),(string)($b['created_at']??''));
                        });
                    }
                    $contactsMap=[];
                    if($module==='donations'){
                        foreach($this->store->summaries('contacts') as $c)$contactsMap[$c['id']]=$c;
                    }
                    $items=array_map(function($x) use ($module,$hadeeyaNames,$contactsMap){
                        if($module==='stock_lots'){
                            $hName=$hadeeyaNames[$x['hadeeya_id']??'']??'';
                            $qty=(int)($x['quantity']??0);
                            $label=($x['lot_code']??$x['id']).($hName!==''?" · $hName":'')." (คงเหลือ {$qty})";
                            return ['id'=>$x['id'],'name'=>$label,'hadeeya_id'=>$x['hadeeya_id']??'','quantity'=>$qty,'lot_code'=>$x['lot_code']??''];
                        }
                        if($module==='donations'){
                            $con=$contactsMap[$x['contact_id']??'']??[];
                            $cName=$con['name']??'';
                            $amt=number_format(((int)($x['amount_satang']??0))/100,2);
                            $bc=!empty($x['barcode'])?$x['barcode']:substr((string)$x['id'],0,10);
                            $addrParts=array_filter([
                                !empty($con['name'])?'ผู้รับ: '.$con['name']:'',
                                !empty($con['phone'])?'โทร: '.$con['phone']:'',
                                !empty($con['address'])?'ที่อยู่: '.$con['address'].(!empty($con['province'])?' จ.'.$con['province']:''):''
                            ]);
                            return ['id'=>$x['id'],'name'=>"{$bc} · {$cName} (฿{$amt})",'contact_id'=>$x['contact_id']??'','shipping_note'=>implode(' | ',$addrParts)];
                        }
                        if($module==='delivery_companies'){
                            return ['id'=>$x['id'],'name'=>$x['name']??$x['id'],'tracking_url'=>$x['tracking_url']??''];
                        }
                        return ['id'=>$x['id'],'name'=>$x['name']??$x['title']??$x['lot_code']??$x['barcode']??$x['tracking_no']??$x['id']];
                    },$r['items']);
                    crm_json(['items'=>$items,'total'=>$r['total']]);
                case 'contact-profile':
                    $this->contactProfile();break;
                case 'phone-lookup':
                    $this->phoneLookup();break;
                case 'live-slip':
                    $this->liveSlip($method);break;
                case 'db-info':
                    $this->dbInfo();break;
                case 'backup-download':
                    $this->backupDownload();break;
                case 'db-optimize':
                    $this->dbOptimize($method);break;
                case 'search':
                    $this->globalSearch();break;
                case 'ai-config':
                    $this->aiConfig($method);break;
                case 'ai-search':
                    $this->aiSearch($method);break;
                case 'users': $this->users($method);break;
                case 'inventory': $this->inventory($method);break;
                case 'audit':
                    $this->auth->require('audit');$r=$this->store->listing('audit',(string)($_GET['q']??''),[],max(1,(int)($_GET['page']??1)),25);crm_json($r);
                case 'export': $this->export();break;
                case 'change-password':$this->changePassword($method);break;
                case 'upload':$this->upload($method);break;
                case 'file':$this->downloadFile($method);break;
                default:crm_json(['error'=>'Endpoint not found'],404);
            }
        } catch (InvalidArgumentException $e) {crm_json(['error'=>$e->getMessage()],422);}
          catch (RuntimeException $e) {
            $conflict=str_starts_with($e->getMessage(),'Conflict');
            error_log('CRM runtime: '.$e->getMessage());
            crm_json(['error'=>$conflict?$e->getMessage():'ไม่สามารถดำเนินการได้ กรุณาตรวจสอบข้อมูลและ Log'], $conflict?409:500);
          }
          catch(Throwable $e) {error_log('CRM exception: '.$e->getMessage());crm_json(['error'=>'Unexpected server error'],500);}
    }
    private function module(string $method): never {
        $module=(string)($_GET['module']??'');$schema=Schema::module($module);
        if(!$schema)crm_json(['error'=>'Unknown module'],404);
        $this->auth->require($module,$method==='GET'?'read':'write');
        if($method==='GET'){
            $filter=[];
            foreach(['status','campaign_id','category_id','contact_id','hadeeya_id','lot_id','assigned_to','date_from','date_to'] as $field){
                if(isset($_GET[$field])&&$_GET[$field]!=='')$filter[$field]=(string)$_GET[$field];
            }
            $r=$this->store->listing($module,(string)($_GET['q']??''),$filter,(int)($_GET['page']??1),(int)($_GET['limit']??20));
            crm_json($r);
        }
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        if(!empty($schema['readonly']))crm_json(['error'=>'Read only'],403);
        $data=Schema::data($module,crm_input(),$this->store);
        $id=crm_id($schema['prefix']);$now=crm_now();
        $actorId=$this->auth->current()['id'];
        if($module==='tasks' && empty($data['assigned_to']))$data['assigned_to']=$actorId;
        $record=['id'=>$id,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'created_by'=>$actorId]+$data;
        $changes=[];
        if($module==='donations' && ($record['status']??'')==='confirmed' && !empty($record['contact_id'])){
            $changes=array_merge($changes,$this->syncContactLoyaltyChange((string)$record['contact_id'],$id,(int)$record['amount_satang'],true,$now));
        }
        if($module==='feedback' && ($record['category']??'')==='complaint'){
            $changes=array_merge($changes,$this->buildAutoTaskChange(
                '⚠️ ติดตามเรื่องร้องเรียน: '.mb_substr((string)($record['topic']??''),0,80),
                (string)($record['contact_id']??''),
                $actorId,
                'high',
                'ระบบสร้างอัตโนมัติจากข้อเสนอแนะ/ร้องเรียน (#'.substr($id,0,10).'): '.(string)($record['message']??''),
                $now
            ));
        }
        if($module==='stock_lots' && (int)($record['quantity']??0)>0){
            $initQty=(int)$record['quantity'];
            $movId=crm_id('mov');
            $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$id,'movement'=>'receive','quantity'=>$initQty,'before'=>0,'after'=>$initQty,'reason'=>'รับเข้าสต็อกเริ่มต้นเมื่อเปิดล็อตใหม่ ('.($record['lot_code']??$id).')','actor'=>$actorId];
            $changes[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
            $changes[]=$this->auditChange('inventory_moves',$movId,'initial_receive');
        }
        if($module==='shipments'){
            $qty=max(1,(int)($record['quantity']??1));
            $status=(string)($record['status']??'preparing');
            if(empty($record['lot_id']) && !empty($record['hadeeya_id']) && !in_array($status,['returned','cancelled'],true)){
                $fifo=$this->findFifoLot((string)$record['hadeeya_id'],$qty);
                if($fifo)$record['lot_id']=$fifo['id'];
            }
            $lotId=(string)($record['lot_id']??'');
            if($lotId!=='' && !in_array($status,['returned','cancelled'],true)){
                $lot=$this->store->read('stock_lots',$lotId);
                if(!$lot||!empty($lot['deleted_at']))throw new InvalidArgumentException('ไม่พบล็อตคลังสินค้าที่เลือก');
                $oldQty=(int)($lot['quantity']??0);
                if($oldQty<$qty)throw new InvalidArgumentException('สต็อกในล็อต '.($lot['lot_code']??$lotId).' ไม่เพียงพอ (คงเหลือ '.$oldQty.' ชิ้น)');
                if(empty($record['hadeeya_id'])&&!empty($lot['hadeeya_id'])){
                    $record['hadeeya_id']=$lot['hadeeya_id'];
                }
                $newQty=$oldQty-$qty;
                $lotPrevVersion=(int)$lot['version'];
                $lot['quantity']=$newQty;$lot['updated_at']=$now;$lot['version']++;
                $record['stock_deducted']=true;
                $record['deducted_lot_id']=$lotId;
                $record['deducted_qty']=$qty;
                $movId=crm_id('mov');
                $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>'issue','quantity'=>$qty,'before'=>$oldQty,'after'=>$newQty,'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #'.substr($id,0,12),'actor'=>$actorId];
                $changes[]=['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lotPrevVersion];
                $changes[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
                $changes[]=$this->auditChange('inventory_moves',$movId,'auto_issue');
            }
            if($status==='returned'){
                $don=!empty($record['donation_id'])?$this->store->read('donations',(string)$record['donation_id']):null;
                $changes=array_merge($changes,$this->buildAutoTaskChange(
                    '📦 พัสดุตีกลับ: โทรตรวจสอบที่อยู่จัดส่งใหม่ ('.(($record['tracking_no']??'')?:substr($id,0,8)).')',
                    (string)($don['contact_id']??''),
                    $actorId,
                    'urgent',
                    'ระบบสร้างอัตโนมัติเนื่องจากรายการจัดส่ง #'.substr($id,0,10).' สถานะเป็น ตีกลับ',
                    $now
                ));
            }
        }
        array_unshift($changes,['collection'=>$module,'id'=>$id,'record'=>$record,'summary'=>Schema::summary($module,$record)]);
        $changes[]=$this->auditChange($module,$id,'created');
        $this->store->transact($changes);
        crm_json(['ok'=>true,'record'=>$record],201);
    }
    private function record(string $method): never {
        $module=(string)($_GET['module']??'');$id=(string)($_GET['id']??'');$schema=Schema::module($module);
        if(!$schema)crm_json(['error'=>'Unknown module'],404);
        $this->auth->require($module,$method==='GET'?'read':($method==='DELETE'?'delete':'write'));
        $current=$this->store->read($module,$id);
        if(!$current||!empty($current['deleted_at']))crm_json(['error'=>'Record not found'],404);
        if($method==='GET')crm_json(['record'=>$current]);
        if(!in_array($method,['PUT','DELETE'],true))crm_json(['error'=>'Method not allowed'],405);
        if(!empty($schema['readonly']))crm_json(['error'=>'Read only'],403);
        $body=crm_input();$version=(int)($body['version']??-1);
        if($version!==(int)$current['version'])crm_json(['error'=>'Record changed; reload'],409);
        $now=crm_now();
        $actorId=$this->auth->current()['id'];
        $extraChanges=[];
        if($method==='DELETE'){
            if($this->hasReferences($module,$id))throw new InvalidArgumentException('มีข้อมูลอื่นอ้างอิงรายการนี้ ไม่สามารถลบได้');
            if($module==='donations'&&($this->auth->current()['role']??'')!=='admin')crm_json(['error'=>'Only admin can void a donation'],403);
            if($module==='stock_lots' && (int)($current['quantity']??0)!==0)crm_json(['error'=>'Cannot delete a non-empty stock lot'],422);
            $record=$current;
            $record['deleted_at']=$now;
            if($module==='shipments' && !empty($current['stock_deducted']) && !empty($current['deducted_lot_id'])){
                $lotId=(string)$current['deducted_lot_id'];
                $restoreQty=max(1,(int)($current['deducted_qty']??$current['quantity']??1));
                $lot=$this->store->read('stock_lots',$lotId);
                if($lot && empty($lot['deleted_at'])){
                    $oldQty=(int)$lot['quantity'];$newQty=$oldQty+$restoreQty;$lotPrev=(int)$lot['version'];
                    $lot['quantity']=$newQty;$lot['updated_at']=$now;$lot['version']++;
                    $record['stock_deducted']=false;
                    $movId=crm_id('mov');
                    $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>'receive','quantity'=>$restoreQty,'before'=>$oldQty,'after'=>$newQty,'reason'=>'คืนสต็อกอัตโนมัติ (ลบรายการจัดส่ง #'.substr($id,0,12).')','actor'=>$actorId];
                    $extraChanges[]=['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lotPrev];
                    $extraChanges[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
                }
            }
        } else {
            $data=Schema::data($module,$body,$this->store,false);
            $record=array_replace($current,$data);
            if($module==='donations' && ($current['status']??'')==='confirmed' && (int)$record['amount_satang'] !== (int)$current['amount_satang']) throw new InvalidArgumentException('ยอดบริจาคที่ยืนยันแล้วแก้ไขจำนวนเงินไม่ได้ ให้ใช้รายการปรับปรุงที่ตรวจสอบย้อนหลังได้');
            if($module==='donations' && ($record['status']??'')==='confirmed' && !empty($record['contact_id'])){
                $extraChanges=array_merge($extraChanges,$this->syncContactLoyaltyChange((string)$record['contact_id'],$id,(int)$record['amount_satang'],true,$now));
            }
            if($module==='shipments'){
                $wasDeducted=!empty($current['stock_deducted']);
                $newStatus=(string)($record['status']??'preparing');
                $isCancelledOrReturned=in_array($newStatus,['returned','cancelled'],true);
                if(empty($record['lot_id']) && !empty($record['hadeeya_id']) && !$isCancelledOrReturned && !$wasDeducted){
                    $fifo=$this->findFifoLot((string)$record['hadeeya_id'],max(1,(int)($record['quantity']??1)));
                    if($fifo)$record['lot_id']=$fifo['id'];
                }
                if($wasDeducted && $isCancelledOrReturned){
                    $lotId=(string)($current['deducted_lot_id']??$current['lot_id']??'');
                    $restoreQty=max(1,(int)($current['deducted_qty']??$current['quantity']??1));
                    $lot=$lotId!==''?$this->store->read('stock_lots',$lotId):null;
                    if($lot && empty($lot['deleted_at'])){
                        $oldQty=(int)$lot['quantity'];$newQty=$oldQty+$restoreQty;$lotPrev=(int)$lot['version'];
                        $lot['quantity']=$newQty;$lot['updated_at']=$now;$lot['version']++;
                        $record['stock_deducted']=false;
                        $movId=crm_id('mov');
                        $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>'receive','quantity'=>$restoreQty,'before'=>$oldQty,'after'=>$newQty,'reason'=>'คืนสต็อกอัตโนมัติเนื่องจากจัดส่ง #'.substr($id,0,12).' เปลี่ยนสถานะเป็น '.$newStatus,'actor'=>$actorId];
                        $extraChanges[]=['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lotPrev];
                        $extraChanges[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
                    }
                } elseif(!$wasDeducted && !$isCancelledOrReturned && !empty($record['lot_id'])){
                    $lotId=(string)$record['lot_id'];
                    $qty=max(1,(int)($record['quantity']??1));
                    $lot=$this->store->read('stock_lots',$lotId);
                    if(!$lot||!empty($lot['deleted_at']))throw new InvalidArgumentException('ไม่พบล็อตคลังสินค้าที่เลือก');
                    $oldQty=(int)$lot['quantity'];
                    if($oldQty<$qty)throw new InvalidArgumentException('สต็อกในล็อต '.($lot['lot_code']??$lotId).' ไม่เพียงพอ (คงเหลือ '.$oldQty.' ชิ้น)');
                    if(empty($record['hadeeya_id'])&&!empty($lot['hadeeya_id']))$record['hadeeya_id']=$lot['hadeeya_id'];
                    $newQty=$oldQty-$qty;$lotPrev=(int)$lot['version'];
                    $lot['quantity']=$newQty;$lot['updated_at']=$now;$lot['version']++;
                    $record['stock_deducted']=true;$record['deducted_lot_id']=$lotId;$record['deducted_qty']=$qty;
                    $movId=crm_id('mov');
                    $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>'issue','quantity'=>$qty,'before'=>$oldQty,'after'=>$newQty,'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #'.substr($id,0,12),'actor'=>$actorId];
                    $extraChanges[]=['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lotPrev];
                    $extraChanges[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
                }
                if($newStatus==='returned' && ($current['status']??'')!=='returned'){
                    $don=!empty($record['donation_id'])?$this->store->read('donations',(string)$record['donation_id']):null;
                    $extraChanges=array_merge($extraChanges,$this->buildAutoTaskChange(
                        '📦 พัสดุตีกลับ: โทรตรวจสอบที่อยู่จัดส่งใหม่ ('.(($record['tracking_no']??'')?:substr($id,0,8)).')',
                        (string)($don['contact_id']??''),
                        $actorId,
                        'urgent',
                        'ระบบสร้างอัตโนมัติเนื่องจากรายการจัดส่ง #'.substr($id,0,10).' เปลี่ยนสถานะเป็น ตีกลับ (คืนสต็อกเข้าคลังแล้ว)',
                        $now
                    ));
                }
            }
        }
        $record['updated_at']=$now;$record['version']++;
        $allChanges=array_merge(
            [['collection'=>$module,'id'=>$id,'record'=>$record,'summary'=>Schema::summary($module,$record),'expected_version'=>$version]],
            $extraChanges,
            [$this->auditChange($module,$id,$method==='DELETE'?'deleted':'updated')]
        );
        $this->store->transact($allChanges);
        crm_json(['ok'=>true,'record'=>$record]);
    }
    private function quickStatus(string $method): never {
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $body=crm_input();
        $module=(string)($body['module']??'');
        $id=(string)($body['id']??'');
        $field=(string)($body['field']??'status');
        $value=(string)($body['value']??'');
        $schema=Schema::module($module);
        if(!$schema||!empty($schema['readonly']))crm_json(['error'=>'Unknown or read-only module'],404);
        $this->auth->require($module,'write');
        $fieldDef=$schema['fields'][$field]??null;
        if(!$fieldDef||($fieldDef['type']??'')!=='select'||!isset($fieldDef['options'][$value])){
            throw new InvalidArgumentException('ค่าสถานะไม่ถูกต้อง');
        }
        $current=$this->store->read($module,$id);
        if(!$current||!empty($current['deleted_at']))crm_json(['error'=>'ไม่พบรายการข้อมูล'],404);
        if((string)($current[$field]??'')===$value){
            crm_json(['ok'=>true,'record'=>$current]);
        }
        $now=crm_now();
        $actorId=$this->auth->current()['id'];
        $version=(int)$current['version'];
        $record=$current;
        $record[$field]=$value;
        $extraChanges=[];
        if($module==='donations' && $field==='status' && $value==='confirmed' && !empty($record['contact_id'])){
            $extraChanges=array_merge($extraChanges,$this->syncContactLoyaltyChange((string)$record['contact_id'],$id,(int)($record['amount_satang']??0),true,$now));
        }
        if($module==='shipments' && $field==='status'){
            if($value==='shipped' && empty($record['sent_at']))$record['sent_at']=gmdate('Y-m-d');
            if($value==='delivered' && empty($record['received_at']))$record['received_at']=gmdate('Y-m-d');
            $wasDeducted=!empty($current['stock_deducted']);
            $isCancelledOrReturned=in_array($value,['returned','cancelled'],true);
            if($wasDeducted && $isCancelledOrReturned){
                $lotId=(string)($current['deducted_lot_id']??$current['lot_id']??'');
                $restoreQty=max(1,(int)($current['deducted_qty']??$current['quantity']??1));
                $lot=$lotId!==''?$this->store->read('stock_lots',$lotId):null;
                if($lot && empty($lot['deleted_at'])){
                    $oldQty=(int)$lot['quantity'];$newQty=$oldQty+$restoreQty;$lotPrev=(int)$lot['version'];
                    $lot['quantity']=$newQty;$lot['updated_at']=$now;$lot['version']++;
                    $record['stock_deducted']=false;
                    $movId=crm_id('mov');
                    $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>'receive','quantity'=>$restoreQty,'before'=>$oldQty,'after'=>$newQty,'reason'=>'คืนสต็อกอัตโนมัติเนื่องจากจัดส่ง #'.substr($id,0,12).' เปลี่ยนสถานะเป็น '.$value,'actor'=>$actorId];
                    $extraChanges[]=['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lotPrev];
                    $extraChanges[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
                }
            } elseif(!$wasDeducted && !$isCancelledOrReturned && !empty($record['lot_id'])){
                $lotId=(string)$record['lot_id'];
                $qty=max(1,(int)($record['quantity']??1));
                $lot=$this->store->read('stock_lots',$lotId);
                if(!$lot||!empty($lot['deleted_at']))throw new InvalidArgumentException('ไม่พบล็อตคลังสินค้าที่เลือก');
                $oldQty=(int)$lot['quantity'];
                if($oldQty<$qty)throw new InvalidArgumentException('สต็อกในล็อต '.($lot['lot_code']??$lotId).' ไม่เพียงพอ (คงเหลือ '.$oldQty.' ชิ้น)');
                $newQty=$oldQty-$qty;$lotPrev=(int)$lot['version'];
                $lot['quantity']=$newQty;$lot['updated_at']=$now;$lot['version']++;
                $record['stock_deducted']=true;$record['deducted_lot_id']=$lotId;$record['deducted_qty']=$qty;
                $movId=crm_id('mov');
                $movement=['id'=>$movId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>'issue','quantity'=>$qty,'before'=>$oldQty,'after'=>$newQty,'reason'=>'ตัดสต็อกอัตโนมัติจากรายการจัดส่ง #'.substr($id,0,12),'actor'=>$actorId];
                $extraChanges[]=['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lotPrev];
                $extraChanges[]=['collection'=>'inventory_moves','id'=>$movId,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)];
            }
            if($value==='returned' && ($current['status']??'')!=='returned'){
                $don=!empty($record['donation_id'])?$this->store->read('donations',(string)$record['donation_id']):null;
                $extraChanges=array_merge($extraChanges,$this->buildAutoTaskChange(
                    '📦 พัสดุตีกลับ: โทรตรวจสอบที่อยู่จัดส่งใหม่ ('.(($record['tracking_no']??'')?:substr($id,0,8)).')',
                    (string)($don['contact_id']??''),
                    $actorId,
                    'urgent',
                    'ระบบสร้างอัตโนมัติเนื่องจากรายการจัดส่ง #'.substr($id,0,10).' เปลี่ยนสถานะเป็น ตีกลับ (คืนสต็อกเข้าคลังแล้ว)',
                    $now
                ));
            }
        }
        $record['updated_at']=$now;$record['version']++;
        $allChanges=array_merge(
            [['collection'=>$module,'id'=>$id,'record'=>$record,'summary'=>Schema::summary($module,$record),'expected_version'=>$version]],
            $extraChanges,
            [$this->auditChange($module,$id,'status_'.$value)]
        );
        $this->store->transact($allChanges);
        crm_json(['ok'=>true,'record'=>$record]);
    }
    private function findFifoLot(string $hadeeyaId,int $minQty=1): ?array {
        $candidates=[];
        foreach($this->store->summaries('stock_lots') as $lot){
            if(($lot['hadeeya_id']??'')===$hadeeyaId && (int)($lot['quantity']??0)>=$minQty){
                $candidates[]=$lot;
            }
        }
        if(!$candidates)return null;
        usort($candidates,fn($a,$b)=>strcmp((string)($a['created_at']??''),(string)($b['created_at']??'')));
        return $candidates[0];
    }
    private function syncContactLoyaltyChange(string $contactId,string $currentDonationId,int $currentSatang,bool $isCurrentConfirmed,string $now): array {
        $contact=$this->store->read('contacts',$contactId);
        if(!$contact||!empty($contact['deleted_at']))return [];
        $totalSatang=$isCurrentConfirmed?$currentSatang:0;
        $confirmedCount=$isCurrentConfirmed?1:0;
        foreach($this->store->summaries('donations') as $d){
            if(($d['id']??'')===$currentDonationId)continue;
            if(($d['contact_id']??'')===$contactId && ($d['status']??'')==='confirmed'){
                $totalSatang+=(int)($d['amount_satang']??0);
                $confirmedCount++;
            }
        }
        $rawTags=array_filter(array_map('trim',explode(',',(string)($contact['tags']??''))));
        $changed=false;
        if($totalSatang>=1000000 && !in_array('VIP',$rawTags,true)){
            $rawTags[]='VIP';
            $changed=true;
        }
        if($confirmedCount>=3 && !in_array('ผู้บริจาคประจำ',$rawTags,true)){
            $rawTags[]='ผู้บริจาคประจำ';
            $changed=true;
        }
        if(!$changed)return [];
        $prevVersion=(int)$contact['version'];
        $contact['tags']=implode(', ',$rawTags);
        $contact['updated_at']=$now;
        $contact['version']++;
        return [
            ['collection'=>'contacts','id'=>$contactId,'record'=>$contact,'summary'=>Schema::summary('contacts',$contact),'expected_version'=>$prevVersion],
            $this->auditChange('contacts',$contactId,'auto_loyalty_tag')
        ];
    }
    private function buildAutoTaskChange(string $title,string $contactId,string $assignedTo,string $priority,string $note,string $now): array {
        $tskId=crm_id('tsk');
        $task=[
            'id'=>$tskId,
            'version'=>1,
            'created_at'=>$now,
            'updated_at'=>$now,
            'deleted_at'=>null,
            'created_by'=>$assignedTo,
            'title'=>$title,
            'contact_id'=>$contactId,
            'assigned_to'=>$assignedTo,
            'due_date'=>gmdate('Y-m-d'),
            'priority'=>$priority,
            'status'=>'open',
            'note'=>$note,
        ];
        return [
            ['collection'=>'tasks','id'=>$tskId,'record'=>$task,'summary'=>Schema::summary('tasks',$task)],
            $this->auditChange('tasks',$tskId,'auto_created')
        ];
    }
    private function inventory(string $method): never {
        $this->auth->require('inventory_moves','write');
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $body=crm_input();$lotId=(string)($body['lot_id']??'');$type=(string)($body['type']??'');$qty=filter_var($body['quantity']??null,FILTER_VALIDATE_INT);
        if(!in_array($type,['receive','issue','adjust'],true)||$qty===false||$qty===null||$qty<0||$qty>10000000)throw new InvalidArgumentException('ประเภทหรือจำนวนไม่ถูกต้อง');
        if($type!=='adjust'&&$qty===0)throw new InvalidArgumentException('จำนวนต้องมากกว่า 0');
        $reason=trim((string)($body['reason']??''));if(mb_strlen($reason)>1000 ||$reason==='')throw new InvalidArgumentException('ต้องระบุเหตุผล');
        $lot=$this->store->read('stock_lots',$lotId);if(!$lot||$lot['deleted_at'])crm_json(['error'=>'ไม่พบล็อต'],404);
        $old=(int)$lot['quantity'];$new=match($type){'receive'=>$old+$qty,'issue'=>$old-$qty,'adjust'=>$qty};
        if($new<0||$new>1000000000)throw new InvalidArgumentException('ยอดคงเหลือไม่เพียงพอหรือจำนวนมากเกินไป');
        $lot['quantity']=$new;$lot['updated_at']=crm_now();$lot['version']++;
        $id=crm_id('mov');$now=crm_now();$actor=$this->auth->current()['id'];
        $movement=['id'=>$id,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'lot_id'=>$lotId,'movement'=>$type,'quantity'=>$qty,'before'=>$old,'after'=>$new,'reason'=>$reason,'actor'=>$actor];
        $this->store->transact([
            ['collection'=>'stock_lots','id'=>$lotId,'record'=>$lot,'summary'=>Schema::summary('stock_lots',$lot),'expected_version'=>$lot['version']-1],
            ['collection'=>'inventory_moves','id'=>$id,'record'=>$movement,'summary'=>Schema::summary('inventory_moves',$movement)],
            $this->auditChange('inventory_moves',$id,$type)
        ]);
        crm_json(['ok'=>true,'record'=>$movement]);
    }
    private function users(string $method): never {
        $this->auth->require('users',$method==='GET'?'read':'write');
        if($method==='GET'){
            $items=[];foreach($this->store->summaries('users') as $u)$items[]=$u;
            usort($items,fn($a,$b)=>strcmp($b['created_at'],$a['created_at']));crm_json(['items'=>$items,'total'=>count($items)]);
        }
        if(!in_array($method,['POST','PUT'],true))crm_json(['error'=>'Method not allowed'],405);
        $d=crm_input();$username=mb_strtolower(trim((string)($d['username']??'')));
        if(!preg_match('/^[a-z0-9._-]{3,40}$/D',$username))throw new InvalidArgumentException('Username: 3-40 ตัว ใช้ a-z 0-9 . _ -');
        $role=(string)($d['role']??'viewer');if(!isset($this->auth->roles()[$role]))throw new InvalidArgumentException('Invalid role');
        $name=trim((string)($d['name']??''));if($name===''||mb_strlen($name)>150)throw new InvalidArgumentException('Invalid display name');
        $active=!empty($d['active']);$id=(string)($d['id']??'');$old=$method==='PUT'?$this->store->read('users',$id):null;
        if($method==='PUT'&&!$old)crm_json(['error'=>'User not found'],404);
        foreach($this->store->summaries('users') as $u){if(($u['username']??'')===$username&&$u['id']!==$id)throw new InvalidArgumentException('Username already used');}
        $currentUser=$this->auth->current();
        if($old&&$old['id']===$currentUser['id']&&(!$active||$role!=='admin'))throw new InvalidArgumentException('Cannot remove your own admin access');
        if($old&&($old['role']??'')==='admin'&&(!$active||$role!=='admin')){
            $others=0;foreach($this->store->summaries('users') as $u)if($u['id']!==$id&&($u['role']??'')==='admin'&&!empty($u['active']))$others++;
            if($others===0)throw new InvalidArgumentException('At least one active admin is required');
        }
        $password=(string)($d['password']??'');if($method==='POST'&&$password==='')throw new InvalidArgumentException('Password required');
        $now=crm_now();$u=$old??['id'=>crm_id('usr'),'version'=>0,'created_at'=>$now,'deleted_at'=>null,'auth_version'=>bin2hex(random_bytes(16))];
        $expected=(int)$u['version'];if($method==='PUT'&&(int)($d['version']??-1)!==$expected)crm_json(['error'=>'Record changed; reload'],409);
        $u['username']=$username;$u['name']=$name;$u['role']=$role;$u['active']=$active;$u['updated_at']=$now;$u['version']++;
        if($password!==''){$u['password_hash']=Auth::hash($password);$u['auth_version']=bin2hex(random_bytes(16));}
        if($old&&($old['role']!==$role||$old['active']!==$active))$u['auth_version']=bin2hex(random_bytes(16));
        $this->store->transact([
            ['collection'=>'users','id'=>$u['id'],'record'=>$u,'summary'=>Auth::userSummary($u)]+($method==='PUT'?['expected_version'=>$expected]:[]),
            $this->auditChange('users',$u['id'],$method==='POST'?'created':'updated')
        ]);
        crm_json(['ok'=>true,'user'=>Auth::userSummary($u)]);
    }
    private function changePassword(string $method): never {
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $d=crm_input();$me=$this->auth->current();
        if(!password_verify((string)($d['current_password']??''),$me['password_hash']))crm_json(['error'=>'รหัสผ่านเดิมไม่ถูกต้อง'],422);
        $me['password_hash']=Auth::hash((string)($d['new_password']??''));$me['auth_version']=bin2hex(random_bytes(16));$previous=$me['version'];$me['version']++;$me['updated_at']=crm_now();
        $this->store->transact([
            ['collection'=>'users','id'=>$me['id'],'record'=>$me,'summary'=>Auth::userSummary($me),'expected_version'=>$previous],
            $this->auditChange('users',$me['id'],'password_changed')
        ]);
        $_SESSION['auth_version']=$me['auth_version'];crm_json(['ok'=>true]);
    }
    private function hasReferences(string $module,string $id): bool {
        $relations=[
            'contacts'=>[['donations','contact_id'],['tasks','contact_id'],['feedback','contact_id']],
            'categories'=>[['campaigns','category_id']],
            'campaigns'=>[['donations','campaign_id']],
            'receivers'=>[['donations','receiver_id']],
            'donations'=>[['shipments','donation_id']],
            'hadeeya'=>[['stock_lots','hadeeya_id'],['shipments','hadeeya_id']],
            'stock_lots'=>[['inventory_moves','lot_id'],['shipments','lot_id']],
            'delivery_companies'=>[['shipments','delivery_company_id']],
        ];
        foreach($relations[$module]??[] as [$collection,$field]) {
            foreach($this->store->summaries($collection) as $summary)if(($summary[$field]??'')===$id)return true;
        }
        return false;
    }
    private function upload(string $method): never {
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $module=(string)($_GET['module']??'');$id=(string)($_GET['id']??'');
        if(!in_array($module,['campaigns','shipments'],true))crm_json(['error'=>'Attachments are not available for this module'],404);
        $this->auth->require($module,'write');
        $record=$this->store->read($module,$id);if(!$record||!empty($record['deleted_at']))crm_json(['error'=>'Record not found'],404);
        $file=$_FILES['file']??null;
        if(!is_array($file)||($file['error']??-1)!==UPLOAD_ERR_OK||!is_uploaded_file($file['tmp_name']??''))throw new InvalidArgumentException('ไฟล์อัปโหลดไม่ถูกต้อง');
        $size=(int)$file['size'];if($size<1||$size>10*1024*1024)throw new InvalidArgumentException('รองรับไฟล์ไม่เกิน 10 MB');
        $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $allowed=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp','application/pdf'=>'pdf'];
        if(!isset($allowed[$mime]))throw new InvalidArgumentException('รองรับเฉพาะ PNG, JPEG, WEBP และ PDF');
        if(str_starts_with($mime,'image/')&&!@getimagesize($file['tmp_name']))throw new InvalidArgumentException('รูปภาพไม่ถูกต้อง');
        if($mime==='application/pdf'){$fh=fopen($file['tmp_name'],'rb');$magic=fread($fh,5);fclose($fh);if($magic!=='%PDF-')throw new InvalidArgumentException('PDF ไม่ถูกต้อง');}
        $sha=hash_file('sha256',$file['tmp_name']);$ext=$allowed[$mime];
        $destDir=CRM_STORAGE.'/uploads/'.substr($sha,0,2);if(!is_dir($destDir))mkdir($destDir,0700,true);
        $dest=$destDir.'/'.$sha.'.'.$ext;
        if(!is_file($dest) && !move_uploaded_file($file['tmp_name'],$dest))throw new RuntimeException('Cannot save uploaded file');
        @chmod($dest,0600);
        $fileId=crm_id('fil');$now=crm_now();
        $meta=['id'=>$fileId,'version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'module'=>$module,'record_id'=>$id,'mime'=>$mime,'size'=>$size,'sha256'=>$sha,'ext'=>$ext,'original_name'=>mb_substr(basename((string)$file['name']),0,180),'actor'=>$this->auth->current()['id']];
        $field=$module==='shipments'?'proof_file_id':'cover_file_id';$previous=$record['version'];$record[$field]=$fileId;$record['updated_at']=$now;$record['version']++;
        $this->store->transact([
            ['collection'=>$module,'id'=>$id,'record'=>$record,'summary'=>Schema::summary($module,$record),'expected_version'=>$previous],
            ['collection'=>'files','id'=>$fileId,'record'=>$meta,'summary'=>$meta],
            $this->auditChange($module,$id,'file_uploaded')
        ]);
        crm_json(['ok'=>true,'file_id'=>$fileId]);
    }
    private function downloadFile(string $method): never {
        if($method!=='GET')crm_json(['error'=>'Method not allowed'],405);
        $id=(string)($_GET['id']??'');$file=$this->store->read('files',$id);
        if(!$file)crm_json(['error'=>'File not found'],404);
        $this->auth->require($file['module'],'read');
        $record=$this->store->read($file['module'],$file['record_id']);
        if(!$record||!empty($record['deleted_at']))crm_json(['error'=>'File not available'],404);
        $sha=$file['sha256'];$ext=$file['ext'];
        if(!preg_match('/^[a-f0-9]{64}$/D',$sha)||!in_array($ext,['png','jpg','webp','pdf'],true))crm_json(['error'=>'Invalid file storage'],500);
        $path=CRM_STORAGE.'/uploads/'.substr($sha,0,2).'/'.$sha.'.'.$ext;
        if(!is_file($path))crm_json(['error'=>'Stored file missing'],404);
        header('Content-Type: '.$file['mime']);
        header('Content-Disposition: attachment; filename="attachment.'.$ext.'"');
        header('Content-Length: '.filesize($path));
        header('Cache-Control: private, no-store');readfile($path);exit;
    }
    private function auditChange(string $module,string $id,string $action): array {
        $actor=$this->auth->current();$now=crm_now();$uid=crm_id('aud');
        $record=['id'=>$uid,'created_at'=>$now,'updated_at'=>$now,'version'=>1,'deleted_at'=>null,'actor_id'=>$actor['id']??'system','actor_name'=>$actor['name']??'System','module'=>$module,'record_id'=>$id,'action'=>$action,'ip_hash'=>hash('sha256',($_SERVER['REMOTE_ADDR']??'cli'))];
        return ['collection'=>'audit','id'=>$uid,'record'=>$record,'summary'=>$record];
    }
    private function dashboard(): array {
        $dateFrom=isset($_GET['date_from'])&&preg_match('/^\d{4}-\d\d-\d\d$/',(string)$_GET['date_from'])?(string)$_GET['date_from']:'';
        $dateTo=isset($_GET['date_to'])&&preg_match('/^\d{4}-\d\d-\d\d$/',(string)$_GET['date_to'])?(string)$_GET['date_to']:'';
        $cacheKey='dashboard-overview-v4-'.$dateFrom.'-'.$dateTo;
        $stats=$this->store->cached($cacheKey,60,function() use ($dateFrom,$dateTo){
            $counts=[];foreach(['contacts','campaigns','donations','hadeeya','stock_lots','shipments','tasks','feedback'] as $k)$counts[$k]=$this->store->count($k);
            $amount=0;$pendingAmount=0;$periodCount=0;$byCampaign=[];$byCampaignCounts=[];$byMonth=[];$byMonthCounts=[];$status=[];
            foreach($this->store->summaries('donations') as $d){
                $dDate=substr((string)(($d['donated_at']??'')!==''?$d['donated_at']:($d['created_at']??'')),0,10);
                if($dateFrom!=='' && ($dDate===''||$dDate<$dateFrom))continue;
                if($dateTo!=='' && ($dDate===''||$dDate>$dateTo))continue;
                $periodCount++;
                $s=(string)($d['status']??'');$status[$s]=($status[$s]??0)+1;
                $v=(int)($d['amount_satang']??0);
                if($s==='pending')$pendingAmount+=$v;
                if($s!=='confirmed')continue;
                $amount+=$v;
                $c=(string)($d['campaign_id']??'unknown');
                $byCampaign[$c]=($byCampaign[$c]??0)+$v;
                $byCampaignCounts[$c]=($byCampaignCounts[$c]??0)+1;
                $month=substr($dDate,0,7);
                if(preg_match('/^\d{4}-\d\d$/',$month)){
                    $byMonth[$month]=($byMonth[$month]??0)+$v;
                    $byMonthCounts[$month]=($byMonthCounts[$month]??0)+1;
                }
            }
            ksort($byMonth);ksort($byMonthCounts);arsort($byCampaign);
            $low=[];foreach($this->store->summaries('stock_lots') as $lot)if((int)($lot['quantity']??0)<=5)$low[]=['lot_code'=>$lot['lot_code']??'','quantity'=>$lot['quantity']??0];
            return ['counts'=>$counts,'confirmed_satang'=>$amount,'pending_satang'=>$pendingAmount,'period_donations_count'=>$periodCount,'date_from'=>$dateFrom,'date_to'=>$dateTo,'donation_status'=>$status,'by_month'=>array_slice($byMonth,-12,null,true),'by_month_counts'=>array_slice($byMonthCounts,-12,null,true),'by_campaign'=>array_slice($byCampaign,0,10,true),'by_campaign_counts'=>$byCampaignCounts,'low_stock'=>array_slice($low,0,8)];
        });
        $ann=[];foreach($this->store->summaries('announcements') as $a)if(($a['status']??'')==='published')$ann[]=['title'=>$a['title'],'created_at'=>$a['created_at']];
        usort($ann,fn($a,$b)=>strcmp($b['created_at'],$a['created_at']));$stats['announcements']=array_slice($ann,0,4);
        crm_json($stats);
    }
    private function export(): never {
        $module=(string)($_GET['module']??'');$schema=Schema::module($module);
        if(!$schema)crm_json(['error'=>'Unknown module'],404);
        $this->auth->require($module);
        if(!$this->auth->can('reports')&&($this->auth->current()['role']??'')!=='admin')crm_json(['error'=>'Export requires reports permission'],403);
        $dateFrom=isset($_GET['date_from'])&&preg_match('/^\d{4}-\d\d-\d\d$/',(string)$_GET['date_from'])?(string)$_GET['date_from']:'';
        $dateTo=isset($_GET['date_to'])&&preg_match('/^\d{4}-\d\d-\d\d$/',(string)$_GET['date_to'])?(string)$_GET['date_to']:'';
        $statusFilter=trim((string)($_GET['status']??''));
        $qFilter=mb_strtolower(trim((string)($_GET['q']??'')),'UTF-8');
        $filename=$module.($dateFrom?"_{$dateFrom}":'').($dateTo?"_to_{$dateTo}":'').'_'.gmdate('Ymd_His').'.csv';
        header('Content-Type: text/csv; charset=utf-8');header('Content-Disposition: attachment; filename="'.$filename.'"');header('Cache-Control: no-store');
        $out=fopen('php://output','w');fwrite($out,"\xEF\xBB\xBF");
        $keys=array_merge(['id'],array_keys($schema['fields']),['created_at','updated_at','legacy_id']);$keys=array_values(array_unique($keys));
        fputcsv($out,$keys);
        foreach($this->store->summaries($module) as $r){
            if($statusFilter!=='' && (string)($r['status']??'')!==$statusFilter)continue;
            if($dateFrom!==''||$dateTo!==''){
                $rawDate=match($module){
                    'donations'=>($r['donated_at']??'')!==''?$r['donated_at']:($r['created_at']??''),
                    'shipments'=>($r['sent_at']??'')!==''?$r['sent_at']:($r['created_at']??''),
                    'tasks'=>($r['due_date']??'')!==''?$r['due_date']:($r['created_at']??''),
                    default=>($r['created_at']??''),
                };
                $recDate=substr((string)$rawDate,0,10);
                if($dateFrom!=='' && ($recDate===''||$recDate<$dateFrom))continue;
                if($dateTo!=='' && ($recDate===''||$recDate>$dateTo))continue;
            }
            if($qFilter!==''){
                $hay=mb_strtolower(implode(' ',array_map(fn($x)=>is_scalar($x)?(string)$x:'',$r)),'UTF-8');
                if(!str_contains($hay,$qFilter))continue;
            }
            $full=$this->store->read($module,$r['id'])?:$r;
            $row=[];foreach($keys as $key){
                $value=$full[$key]??'';
                if(($schema['fields'][$key]['type']??'')==='money' && is_numeric($value)){
                    $value=number_format(((int)$value)/100,2,'.','');
                }
                $value=(string)$value;
                if(preg_match('/^[\s]*[=+@\-]/u',$value))$value="'".$value;
                $row[]=$value;
            }
            fputcsv($out,$row);
        }
        fclose($out);exit;
    }
    private function contactProfile(): never {
        $this->auth->require('contacts','read');
        $id=(string)($_GET['id']??'');
        $contact=$this->store->read('contacts',$id);
        if(!$contact||!empty($contact['deleted_at']))crm_json(['error'=>'ไม่พบข้อมูลสมาชิก/ผู้บริจาค'],404);
        $campaigns=[];foreach($this->store->summaries('campaigns') as $c)$campaigns[$c['id']]=$c['name']??$c['id'];
        $receivers=[];foreach($this->store->summaries('receivers') as $r)$receivers[$r['id']]=$r['name']??$r['id'];
        $hadeeya=[];foreach($this->store->summaries('hadeeya') as $h)$hadeeya[$h['id']]=$h['name']??$h['id'];
        $lots=[];foreach($this->store->summaries('stock_lots') as $l)$lots[$l['id']]=$l['lot_code']??$l['id'];
        $couriers=[];foreach($this->store->summaries('delivery_companies') as $dc)$couriers[$dc['id']]=$dc['name']??$dc['id'];
        $users=[];foreach($this->store->summaries('users') as $u)$users[$u['id']]=$u['name']??$u['username']??$u['id'];

        $donations=[];$donationIds=[];
        $confirmedSatang=0;$pendingSatang=0;$confirmedCount=0;$lastDonatedAt='';
        foreach($this->store->summaries('donations') as $d){
            if(($d['contact_id']??'')!==$id)continue;
            $donationIds[$d['id']]=$d;
            $amt=(int)($d['amount_satang']??0);
            $st=(string)($d['status']??'pending');
            if($st==='confirmed'){
                $confirmedSatang+=$amt;$confirmedCount++;
                $dt=(string)($d['donated_at']??'');
                if($dt!==''&&($lastDonatedAt===''||$dt>$lastDonatedAt))$lastDonatedAt=$dt;
            } elseif($st==='pending'){
                $pendingSatang+=$amt;
            }
            $d['campaign_name']=$campaigns[$d['campaign_id']??'']??($d['campaign_id']??'—');
            $d['receiver_name']=$receivers[$d['receiver_id']??'']??($d['receiver_id']??'—');
            $donations[]=$d;
        }
        usort($donations,fn($a,$b)=>strcmp(($b['donated_at']??$b['created_at']??''),($a['donated_at']??$a['created_at']??'')));

        $shipments=[];$deliveredCount=0;
        if($donationIds){
            foreach($this->store->summaries('shipments') as $s){
                $did=(string)($s['donation_id']??'');
                if(!isset($donationIds[$did]))continue;
                if(($s['status']??'')==='delivered')$deliveredCount++;
                $s['hadeeya_name']=$hadeeya[$s['hadeeya_id']??'']??($s['hadeeya_id']??'—');
                $s['lot_code']=$lots[$s['lot_id']??'']??($s['lot_id']??'—');
                $s['courier_name']=$couriers[$s['delivery_company_id']??'']??($s['delivery_company_id']??'—');
                $s['donation_barcode']=$donationIds[$did]['barcode']?:substr($did,0,10);
                $shipments[]=$s;
            }
        }
        usort($shipments,fn($a,$b)=>strcmp(($b['sent_at']??$b['created_at']??''),($a['sent_at']??$a['created_at']??'')));

        $tasks=[];$openTasksCount=0;
        foreach($this->store->summaries('tasks') as $t){
            if(($t['contact_id']??'')!==$id)continue;
            if(($t['status']??'')!=='done')$openTasksCount++;
            $t['assigned_name']=$users[$t['assigned_to']??'']??($t['assigned_to']??'ยังไม่ระบุ');
            $tasks[]=$t;
        }
        usort($tasks,fn($a,$b)=>strcmp(($b['due_date']??$b['created_at']??''),($a['due_date']??$a['created_at']??'')));

        $feedback=[];
        foreach($this->store->summaries('feedback') as $f){
            if(($f['contact_id']??'')!==$id)continue;
            $feedback[]=$f;
        }

        crm_json([
            'record'=>$contact,
            'stats'=>[
                'confirmed_satang'=>$confirmedSatang,
                'pending_satang'=>$pendingSatang,
                'total_donations'=>count($donations),
                'confirmed_donations'=>$confirmedCount,
                'total_shipments'=>count($shipments),
                'delivered_shipments'=>$deliveredCount,
                'total_tasks'=>count($tasks),
                'open_tasks'=>$openTasksCount,
                'total_feedback'=>count($feedback),
                'last_donated_at'=>$lastDonatedAt,
            ],
            'donations'=>array_slice($donations,0,100),
            'shipments'=>array_slice($shipments,0,100),
            'tasks'=>array_slice($tasks,0,100),
            'feedback'=>array_slice($feedback,0,50),
        ]);
    }
    private function phoneLookup(): never {
        $this->auth->require('contacts','read');
        $rawPhone=trim((string)($_GET['phone']??''));
        $digits=preg_replace('/\D+/','',$rawPhone)??'';
        if(strlen($digits)<8){
            crm_json(['found'=>false,'phone_formatted'=>Schema::formatPhone($rawPhone)]);
        }
        $found=null;
        foreach($this->store->summaries('contacts') as $c){
            $cDigits=preg_replace('/\D+/','',(string)($c['phone']??''))??'';
            if($cDigits!==''&&($cDigits===$digits||str_ends_with($cDigits,$digits)||str_ends_with($digits,$cDigits))){
                $found=$this->store->read('contacts',$c['id']);
                break;
            }
        }
        if(!$found||!empty($found['deleted_at'])){
            crm_json(['found'=>false,'phone_formatted'=>Schema::formatPhone($rawPhone)]);
        }
        $donations=[];$totalSatang=0;
        $campaigns=[];foreach($this->store->summaries('campaigns') as $cam)$campaigns[$cam['id']]=$cam['name']??$cam['id'];
        foreach($this->store->summaries('donations') as $d){
            if(($d['contact_id']??'')===$found['id']){
                $d['campaign_name']=$campaigns[$d['campaign_id']??'']??'—';
                if(($d['status']??'')==='confirmed')$totalSatang+=(int)($d['amount_satang']??0);
                $donations[]=$d;
            }
        }
        usort($donations,fn($a,$b)=>strcmp((string)($b['donated_at']??$b['created_at']??''),(string)($a['donated_at']??$a['created_at']??'')));

        $shipments=[];$hadeeyas=[];
        foreach($this->store->summaries('hadeeya') as $h)$hadeeyas[$h['id']]=$h['name']??$h['id'];
        $donationIds=array_column($donations,'id');
        if($donationIds){
            $dMap=array_flip($donationIds);
            foreach($this->store->summaries('shipments') as $s){
                if(isset($dMap[$s['donation_id']??''])){
                    $s['hadeeya_name']=$hadeeyas[$s['hadeeya_id']??'']??'—';
                    $shipments[]=$s;
                }
            }
        }
        usort($shipments,fn($a,$b)=>strcmp((string)($b['created_at']??''),(string)($a['created_at']??'')));

        crm_json([
            'found'=>true,
            'contact'=>$found,
            'phone_formatted'=>Schema::formatPhone((string)($found['phone']??$rawPhone)),
            'lifetime_satang'=>$totalSatang,
            'donations_count'=>count($donations),
            'recent_donations'=>array_slice($donations,0,3),
            'recent_shipments'=>array_slice($shipments,0,3),
        ]);
    }
    private function liveSlip(string $method): never {
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $this->auth->require('donations','write');
        $body=crm_input();

        $rawPhone=trim((string)($body['phone']??''));
        $digits=preg_replace('/\D+/','',$rawPhone)??'';
        if(strlen($digits)<9){
            throw new \InvalidArgumentException('กรุณาระบุเบอร์โทรศัพท์อย่างน้อย 9-10 หลัก');
        }
        $formattedPhone=Schema::formatPhone($rawPhone);

        $rawAmount=$body['amount']??'';
        if($rawAmount===''||!is_numeric($rawAmount)||(float)$rawAmount<=0){
            throw new \InvalidArgumentException('กรุณาระบุจำนวนเงินบริจาคที่ถูกต้อง');
        }
        $amountSatang=(int)round((float)$rawAmount*100);

        $now=crm_now();
        $actorId=$this->auth->current()['id'];
        $slipDate=trim((string)($body['slip_date']??''));
        if($slipDate===''||!preg_match('/^\d{4}-\d\d-\d\d$/',$slipDate)){
            $slipDate=gmdate('Y-m-d');
        }
        $slipRecorder=trim((string)($body['slip_recorder']??''));
        $slipProducer=trim((string)($body['slip_producer']??''));
        $slipPage=trim((string)($body['slip_page']??''));
        $campaignId=trim((string)($body['campaign_id']??''));
        if($campaignId===''){
            foreach($this->store->summaries('campaigns') as $cam){
                if(($cam['status']??'')==='active'){$campaignId=$cam['id'];break;}
            }
            if($campaignId===''){
                foreach($this->store->summaries('campaigns') as $cam){$campaignId=$cam['id'];break;}
            }
        }
        $receiverId=trim((string)($body['receiver_id']??''));
        $channel=trim((string)($body['channel']??'bank'));
        $distPeriod=trim((string)($body['distribution_period']??'once'));
        $validPeriods=array_keys(Schema::module('donations')['fields']['distribution_period']['options']);
        if(!in_array($distPeriod,$validPeriods,true))$distPeriod='once';

        $userNote=trim((string)($body['note']??''));
        $noteParts=[];
        if($userNote!=='')$noteParts[]=$userNote;
        if($slipRecorder!=='')$noteParts[]="ผู้บันทึก: {$slipRecorder}";
        if($slipProducer!=='')$noteParts[]="โปรดิวเซอร์: {$slipProducer}";
        if($slipPage!=='')$noteParts[]="แผ่นที่: {$slipPage}";
        $fullDonationNote=implode(' | ',$noteParts);

        // 1. Contact resolution
        $contactId='';
        $existingContact=null;
        foreach($this->store->summaries('contacts') as $c){
            $cDigits=preg_replace('/\D+/','',(string)($c['phone']??''))??'';
            if($cDigits!==''&&($cDigits===$digits||str_ends_with($cDigits,$digits)||str_ends_with($digits,$cDigits))){
                $existingContact=$this->store->read('contacts',$c['id']);
                break;
            }
        }

        $inputName=trim((string)($body['name']??''));
        $inputAddress=trim((string)($body['address']??''));
        $inputProvince=trim((string)($body['province']??''));
        if($inputProvince===''&&$inputAddress!==''){
            $inputProvince=Schema::detectProvince($inputAddress);
        }

        $allChanges=[];
        $contactChanges=[];
        $isNewContact=false;

        if($existingContact&&empty($existingContact['deleted_at'])){
            $contactId=$existingContact['id'];
            $contactUpdated=false;
            $prevVer=(int)$existingContact['version'];
            if($inputName!==''&&($existingContact['name']===''||str_starts_with($existingContact['name'],'ผู้บริจาค (เบอร์'))){
                $existingContact['name']=$inputName;
                $contactUpdated=true;
            }
            if($inputAddress!==''&&$inputAddress!==($existingContact['address']??'')){
                $existingContact['address']=$inputAddress;
                if($inputProvince!=='')$existingContact['province']=$inputProvince;
                $contactUpdated=true;
            }
            if($contactUpdated){
                $existingContact['updated_at']=$now;
                $existingContact['version']++;
                $contactChanges[]=[
                    'collection'=>'contacts',
                    'id'=>$contactId,
                    'record'=>$existingContact,
                    'summary'=>Schema::summary('contacts',$existingContact),
                    'expected_version'=>$prevVer,
                ];
                $contactChanges[]=$this->auditChange('contacts',$contactId,'updated_from_live_slip');
            }
            $finalContact=$existingContact;
        } else {
            $isNewContact=true;
            $contactId=crm_id('con');
            $displayName=$inputName!==''?$inputName:"ผู้บริจาค (เบอร์ {$formattedPhone})";
            $finalContact=[
                'id'=>$contactId,
                'version'=>1,
                'created_at'=>$now,
                'updated_at'=>$now,
                'deleted_at'=>null,
                'created_by'=>$actorId,
                'name'=>$displayName,
                'phone'=>$formattedPhone,
                'email'=>'',
                'type'=>'donor',
                'province'=>$inputProvince,
                'address'=>$inputAddress,
                'tags'=>'รายการสด',
                'notes'=>$slipRecorder?"เพิ่มจากใบงานรายการสด (ผู้บันทึก: {$slipRecorder})":'เพิ่มจากใบงานรายการสด',
                'legacy_id'=>'',
            ];
            $contactChanges[]=[
                'collection'=>'contacts',
                'id'=>$contactId,
                'record'=>$finalContact,
                'summary'=>Schema::summary('contacts',$finalContact),
            ];
            $contactChanges[]=$this->auditChange('contacts',$contactId,'created_from_live_slip');
        }

        // 2. Donation record
        $donationId=crm_id('don');
        $barcode=Schema::data('donations',['barcode'=>''],$this->store,true)['barcode']??('RCP-'.gmdate('Ymd').'-'.substr(bin2hex(random_bytes(2)),0,4));
        $donationRecord=[
            'id'=>$donationId,
            'version'=>1,
            'created_at'=>$now,
            'updated_at'=>$now,
            'deleted_at'=>null,
            'created_by'=>$actorId,
            'contact_id'=>$contactId,
            'campaign_id'=>$campaignId,
            'receiver_id'=>$receiverId,
            'amount_satang'=>$amountSatang,
            'donated_at'=>$slipDate,
            'status'=>'pending',
            'barcode'=>$barcode,
            'channel'=>$channel,
            'distribution_period'=>$distPeriod,
            'note'=>$fullDonationNote,
            'legacy_id'=>'',
        ];
        $allChanges[]=[
            'collection'=>'donations',
            'id'=>$donationId,
            'record'=>$donationRecord,
            'summary'=>Schema::summary('donations',$donationRecord),
        ];
        $allChanges[]=$this->auditChange('donations',$donationId,'created_from_live_slip');

        // 3. Hadiyah & Task Handling
        $hadiyahMode=trim((string)($body['hadiyah_mode']??'none'));
        $createdShipment=null;
        $createdTask=null;
        $hasAddress=!empty(trim((string)($finalContact['address']??'')));

        if($hadiyahMode==='pending'){
            // "รอแจ้ง" -> create task for Call Center
            $autoTaskId=crm_id('tsk');
            $createdTask=[
                'id'=>$autoTaskId,
                'version'=>1,
                'created_at'=>$now,
                'updated_at'=>$now,
                'deleted_at'=>null,
                'created_by'=>$actorId,
                'title'=>"📞 โทรสอบถามฮาดียะห์: {$finalContact['name']} (ยอด ฿".number_format($amountSatang/100,2).")",
                'contact_id'=>$contactId,
                'assigned_to'=>$actorId,
                'due_date'=>$slipDate,
                'priority'=>'normal',
                'status'=>'open',
                'note'=>"ผู้บริจาคแจ้งผ่านรายการสดระบุ 'รอแจ้งของฮาดียะฮ์' (ยอดบริจาค ฿".number_format($amountSatang/100,2)." / ผู้บันทึก: {$slipRecorder}) กรุณาโทรติดต่อสอบถามฮาดียะห์ที่ต้องการรับและที่อยู่จัดส่ง",
            ];
            $allChanges[]=[
                'collection'=>'tasks',
                'id'=>$autoTaskId,
                'record'=>$createdTask,
                'summary'=>Schema::summary('tasks',$createdTask),
            ];
            $allChanges[]=$this->auditChange('tasks',$autoTaskId,'auto_created_from_live_slip');
        } elseif($hadiyahMode==='receive'){
            $hadiyahId=trim((string)($body['hadiyah_id']??''));
            $qty=max(1,(int)($body['hadiyah_qty']??1));
            $lotId=trim((string)($body['lot_id']??''));
            $hadItem=$hadiyahId!==''?$this->store->read('hadeeya',$hadiyahId):null;
            $hadName=$hadItem['name']??'ของฮาดียะห์';

            if($lotId===''&&$hadiyahId!==''){
                $fifo=$this->findFifoLot($hadiyahId,$qty);
                if($fifo)$lotId=$fifo['id'];
            }

            $shipmentId=crm_id('shp');
            $shipmentNoteParts=array_filter([
                "ผู้รับ: {$finalContact['name']}",
                "โทร: {$finalContact['phone']}",
                $hasAddress?"ที่อยู่: {$finalContact['address']}".(!empty($finalContact['province'])?" จ.{$finalContact['province']}":""):"⚠️ ยังไม่มีที่อยู่จัดส่ง (รอ Call Center โทรสอบถาม)",
                $slipRecorder?"ผู้บันทึก: {$slipRecorder}":"",
            ]);

            $shipmentRecord=[
                'id'=>$shipmentId,
                'version'=>1,
                'created_at'=>$now,
                'updated_at'=>$now,
                'deleted_at'=>null,
                'created_by'=>$actorId,
                'donation_id'=>$donationId,
                'hadeeya_id'=>$hadiyahId,
                'lot_id'=>$lotId,
                'quantity'=>$qty,
                'delivery_company_id'=>'',
                'tracking_no'=>'',
                'status'=>'preparing',
                'sent_at'=>null,
                'received_at'=>null,
                'note'=>implode(' | ',$shipmentNoteParts),
                'proof_file_id'=>'',
            ];

            // Stock deduction if lot selected
            if($lotId!==''){
                $lot=$this->store->read('stock_lots',$lotId);
                if($lot&&empty($lot['deleted_at'])){
                    $oldQty=(int)($lot['quantity']??0);
                    if($oldQty>=$qty){
                        $newQty=$oldQty-$qty;
                        $lotPrevVersion=(int)$lot['version'];
                        $lot['quantity']=$newQty;
                        $lot['updated_at']=$now;
                        $lot['version']++;
                        $shipmentRecord['stock_deducted']=true;
                        $shipmentRecord['deducted_lot_id']=$lotId;
                        $shipmentRecord['deducted_qty']=$qty;

                        $movId=crm_id('mov');
                        $movement=[
                            'id'=>$movId,
                            'version'=>1,
                            'created_at'=>$now,
                            'updated_at'=>$now,
                            'deleted_at'=>null,
                            'lot_id'=>$lotId,
                            'movement'=>'issue',
                            'quantity'=>$qty,
                            'before'=>$oldQty,
                            'after'=>$newQty,
                            'reason'=>"ตัดสต็อกอัตโนมัติจากใบงานรายการสด (จัดส่ง #".substr($shipmentId,0,10).")",
                            'actor'=>$actorId,
                        ];
                        $allChanges[]=[
                            'collection'=>'stock_lots',
                            'id'=>$lotId,
                            'record'=>$lot,
                            'summary'=>Schema::summary('stock_lots',$lot),
                            'expected_version'=>$lotPrevVersion,
                        ];
                        $allChanges[]=[
                            'collection'=>'inventory_moves',
                            'id'=>$movId,
                            'record'=>$movement,
                            'summary'=>Schema::summary('inventory_moves',$movement),
                        ];
                        $allChanges[]=$this->auditChange('inventory_moves',$movId,'auto_issue');
                    }
                }
            }

            $allChanges[]=[
                'collection'=>'shipments',
                'id'=>$shipmentId,
                'record'=>$shipmentRecord,
                'summary'=>Schema::summary('shipments',$shipmentRecord),
            ];
            $allChanges[]=$this->auditChange('shipments',$shipmentId,'created_from_live_slip');
            $createdShipment=$shipmentRecord;

            // If contact has NO address, generate Call Center task to get the address!
            if(!$hasAddress){
                $autoTaskId=crm_id('tsk');
                $createdTask=[
                    'id'=>$autoTaskId,
                    'version'=>1,
                    'created_at'=>$now,
                    'updated_at'=>$now,
                    'deleted_at'=>null,
                    'created_by'=>$actorId,
                    'title'=>"📞 โทรขอที่อยู่จัดส่งฮาดียะห์: {$hadName} ({$finalContact['name']})",
                    'contact_id'=>$contactId,
                    'assigned_to'=>$actorId,
                    'due_date'=>$slipDate,
                    'priority'=>'high',
                    'status'=>'open',
                    'note'=>"ผู้บริจาคแจ้งยอด ฿".number_format($amountSatang/100,2)." ผ่านรายการสด ขอรับ {$hadName} (จำนวน {$qty} ชิ้น) แต่ยังไม่มีที่อยู่จัดส่งในระบบ กรุณาโทรติดต่อเบอร์ {$finalContact['phone']} เพื่อขอที่อยู่จัดส่งพัสดุ",
                ];
                $allChanges[]=[
                    'collection'=>'tasks',
                    'id'=>$autoTaskId,
                    'record'=>$createdTask,
                    'summary'=>Schema::summary('tasks',$createdTask),
                ];
                $allChanges[]=$this->auditChange('tasks',$autoTaskId,'auto_created_from_live_slip');
            }
        }

        // Commit all changes in ONE atomic transaction
        $finalChanges=array_merge($contactChanges,$allChanges);
        $this->store->transact($finalChanges);

        crm_json([
            'ok'=>true,
            'is_new_contact'=>$isNewContact,
            'contact'=>$finalContact,
            'donation'=>$donationRecord,
            'shipment'=>$createdShipment,
            'task'=>$createdTask,
            'message'=>"บันทึกใบรับบริจาคเรียบร้อย (เบอร์ {$formattedPhone} ยอด ฿".number_format($amountSatang/100,2).")",
        ],201);
    }
    private function dbInfo(): never {
        $me=$this->auth->current();
        if(($me['role']??'')!=='admin')crm_json(['error'=>'Admin only'],403);
        $dbBytes=$this->store->diskUsage();
        $uploadsBytes=0;$uploadsCount=0;
        $uploadsDir=CRM_STORAGE.'/uploads';
        if(is_dir($uploadsDir)){
            foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($uploadsDir,\FilesystemIterator::SKIP_DOTS)) as $f){
                if($f->isFile()){$uploadsBytes+=$f->getSize();$uploadsCount++;}
            }
        }
        $totalRecords=0;
        foreach(array_keys(Schema::all()) as $m)$totalRecords+=$this->store->count($m);
        $sqliteVer=$this->store->pdo()->query('SELECT sqlite_version()')->fetchColumn();
        $lastBackup=$this->store->read('settings','backup_meta');
        crm_json([
            'sqlite_version'=>(string)$sqliteVer,
            'db_bytes'=>$dbBytes,
            'uploads_bytes'=>$uploadsBytes,
            'uploads_count'=>$uploadsCount,
            'total_records'=>$totalRecords,
            'last_backup_at'=>$lastBackup['last_backup_at']??null,
            'last_backup_by'=>$lastBackup['last_backup_by']??null,
        ]);
    }
    private function backupDownload(): never {
        $me=$this->auth->current();
        if(($me['role']??'')!=='admin')crm_json(['error'=>'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สำรองฐานข้อมูลได้'],403);
        $token=(string)($_GET['_csrf']??'');
        if(!hash_equals(crm_csrf(),$token))crm_json(['error'=>'Invalid CSRF token for backup download'],419);
        $format=(string)($_GET['format']??'sqlite');
        $now=crm_now();
        $meta=['id'=>'backup_meta','version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'last_backup_at'=>$now,'last_backup_by'=>$me['name']??$me['username']??'Admin'];
        $this->store->transact([
            ['collection'=>'settings','id'=>'backup_meta','record'=>$meta,'summary'=>$meta],
            $this->auditChange('settings','backup_meta','web_backup_'.$format)
        ]);
        $tmpSnap=sys_get_temp_dir().'/wc-crm-snap-'.bin2hex(random_bytes(8)).'.sqlite';
        try {
            $pdo=$this->store->pdo();
            $pdo->exec('PRAGMA wal_checkpoint(FULL)');
            try {
                $escaped=str_replace("'","''",$tmpSnap);
                $pdo->exec("VACUUM INTO '{$escaped}'");
            } catch (Throwable) {
                copy(CRM_STORAGE.'/crm.sqlite',$tmpSnap);
            }
            if(!is_file($tmpSnap))throw new RuntimeException('ไม่สามารถสร้างไฟล์สแนปช็อตฐานข้อมูลได้');
            $stamp=date('Ymd-His');
            if($format==='archive'){
                $tarPath=sys_get_temp_dir().'/wc-crm-full-'.bin2hex(random_bytes(8)).'.tar';
                try {
                    $phar=new \PharData($tarPath);
                    $phar->addFile($tmpSnap,'storage/crm.sqlite');
                    $upDir=CRM_STORAGE.'/uploads';
                    if(is_dir($upDir)){
                        foreach(new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($upDir,\FilesystemIterator::SKIP_DOTS)) as $f){
                            if($f->isFile()){
                                $rel='storage/uploads/'.str_replace('\\','/',substr($f->getPathname(),strlen($upDir)+1));
                                $phar->addFile($f->getPathname(),$rel);
                            }
                        }
                    }
                    unset($phar);
                    header('Content-Type: application/x-tar');
                    header('Content-Disposition: attachment; filename="whitechannel-crm-full-backup-'.$stamp.'.tar"');
                    header('Content-Length: '.filesize($tarPath));
                    header('Cache-Control: private, no-store');
                    readfile($tarPath);
                } finally {
                    @unlink($tarPath);
                }
            } else {
                header('Content-Type: application/vnd.sqlite3');
                header('Content-Disposition: attachment; filename="whitechannel-crm-db-'.$stamp.'.sqlite"');
                header('Content-Length: '.filesize($tmpSnap));
                header('Cache-Control: private, no-store');
                readfile($tmpSnap);
            }
        } finally {
            @unlink($tmpSnap);
        }
        exit;
    }
    private function dbOptimize(string $method): never {
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $me=$this->auth->current();
        if(($me['role']??'')!=='admin')crm_json(['error'=>'Admin only'],403);
        $pdo=$this->store->pdo();
        $stmt=$pdo->query('SELECT collection, id, record_json FROM records');
        $changes=[];$count=0;
        while($row=$stmt->fetch()){
            $mod=(string)$row['collection'];
            $rec=json_decode((string)$row['record_json'],true);
            if(!is_array($rec)||empty($rec['id']))continue;
            $schema=Schema::module($mod);
            $sum=$mod==='users'?Auth::userSummary($rec):($schema?Schema::summary($mod,$rec):$rec);
            $changes[]=['collection'=>$mod,'id'=>$rec['id'],'record'=>$rec,'summary'=>$sum];
            $count++;
        }
        if($changes)$this->store->transact($changes);
        $pdo->exec('PRAGMA wal_checkpoint(TRUNCATE)');
        $pdo->exec('VACUUM');
        crm_json(['ok'=>true,'rebuilt_records'=>$count,'db_bytes'=>$this->store->diskUsage()]);
    }
    private function globalSearch(): never {
        $q=trim((string)($_GET['q']??''));
        if(mb_strlen($q)<1)crm_json(['items'=>[]]);
        $results=[];
        foreach(Schema::all() as $module=>$schema){
            if(!$this->auth->can($module,'read'))continue;
            $r=$this->store->listing($module,$q,[],1,5);
            foreach($r['items'] as $x){
                $title=$x['name']??$x['title']??$x['topic']??$x['lot_code']??$x['barcode']??$x['tracking_no']??$x['id'];
                $sub=$x['phone']??$x['sku']??$x['province']??$x['donated_at']??$x['due_date']??$x['status']??'';
                if(isset($x['amount_satang']))$sub=number_format(((int)$x['amount_satang'])/100,2).' บาท'.($sub?" · $sub":'');
                $results[]=[
                    'module'=>$module,
                    'module_label'=>$schema['label'],
                    'id'=>$x['id'],
                    'title'=>(string)$title,
                    'subtitle'=>(string)$sub,
                ];
                if(count($results)>=15)break 2;
            }
        }
        crm_json(['items'=>$results]);
    }
    private function aiModels(): array {
        return [
            'gemini-3.5-flash-lite'=>['label'=>'gemini-3.5-flash-lite · ตัวหลัก (ฟรี 500 ครั้ง/วัน · เร็ว ฉลาดพอดี)','rpm'=>15,'tpm'=>250000,'rpd'=>500],
            'gemini-3.1-flash-lite'=>['label'=>'gemini-3.1-flash-lite · สำรอง 1 (ฟรีอีก 500 ครั้ง/วัน · รวมเป็น 1,000)','rpm'=>15,'tpm'=>250000,'rpd'=>500],
            'gemini-3.6-flash'=>['label'=>'gemini-3.6-flash · สำรอง 2 (ตัวท็อป กรณี Lite ใช้งานไม่ได้)','rpm'=>5,'tpm'=>250000,'rpd'=>20],
            'gemini-2.5-flash'=>['label'=>'gemini-2.5-flash · สำรอง 3 (วดเร็ว แม่นยำ)','rpm'=>10,'tpm'=>250000,'rpd'=>250],
            'gemini-2.5-flash-lite'=>['label'=>'gemini-2.5-flash-lite · สำรอง 4 (ประหยัดโควต้า ตอบไวมาก)','rpm'=>15,'tpm'=>250000,'rpd'=>500],
            'gemini-2.0-flash'=>['label'=>'gemini-2.0-flash · สำรอง 5 (เสถียรสูง)','rpm'=>15,'tpm'=>1000000,'rpd'=>1500],
        ];
    }
    private function readAiSettings(): array {
        $s=$this->store->read('settings','ai_config');
        if(!is_array($s))return ['enabled'=>false,'model'=>'gemini-3.5-flash-lite','auto_fallback'=>true,'api_key'=>''];
        $key='';
        if(!empty($s['api_key_enc'])){
            $secret=hash('sha256',(string)($s['iv']??'wc').ROOT,true);
            $dec=openssl_decrypt((string)$s['api_key_enc'],'aes-256-cbc',$secret,0,substr(hash('sha256',(string)($s['iv']??'iv')),0,16));
            if(is_string($dec))$key=$dec;
        }
        $models=$this->aiModels();
        $model=(string)($s['model']??'gemini-3.5-flash-lite');
        if(!isset($models[$model]))$model='gemini-3.5-flash-lite';
        return ['enabled'=>!empty($s['enabled'])&&$key!=='','model'=>$model,'auto_fallback'=>array_key_exists('auto_fallback',$s)?!empty($s['auto_fallback']):true,'api_key'=>$key];
    }
    private function getAiUsageStats(string $activeModel): array {
        $models=$this->aiModels();
        $today=date('Y-m-d');
        $currentMin=date('Y-m-d H:i');
        $raw=$this->store->read('settings','ai_usage');
        $byDay=is_array($raw['days'][$today]??null)?$raw['days'][$today]:[];
        $byMin=is_array($raw['mins'][$currentMin]??null)?$raw['mins'][$currentMin]:[];
        $stats=[];
        foreach($models as $m=>$meta){
            $dUsed=(int)($byDay[$m]['requests']??0);
            $dTokens=(int)($byDay[$m]['tokens']??0);
            $mUsed=(int)($byMin[$m]['requests']??0);
            $mTokens=(int)($byMin[$m]['tokens']??0);
            $stats[$m]=[
                'model'=>$m,
                'label'=>$meta['label'],
                'is_active'=>$m===$activeModel,
                'rpm_used'=>$mUsed,
                'rpm_limit'=>$meta['rpm'],
                'rpm_remaining'=>max(0,$meta['rpm']-$mUsed),
                'tpm_used'=>$mTokens,
                'tpm_limit'=>$meta['tpm'],
                'rpd_used'=>$dUsed,
                'rpd_limit'=>$meta['rpd'],
                'rpd_remaining'=>max(0,$meta['rpd']-$dUsed),
                'd_tokens'=>$dTokens,
                'last_used_at'=>$byDay[$m]['last_at']??null,
            ];
        }
        return ['date'=>$today,'reset_note'=>'โควต้ารายวัน (RPD) รีเซ็ตทุกวัน และโควต้ารายนาที (RPM/TPM) รีเซ็ตทุก 60 วินาที','active'=>$stats[$activeModel]??reset($stats),'all'=>$stats];
    }
    private function recordAiUsage(string $model,int $tokens): void {
        $today=date('Y-m-d');
        $currentMin=date('Y-m-d H:i');
        $now=crm_now();
        $raw=$this->store->read('settings','ai_usage');
        if(!is_array($raw))$raw=['id'=>'ai_usage','version'=>0,'created_at'=>$now,'deleted_at'=>null,'days'=>[],'mins'=>[]];
        $days=is_array($raw['days']??null)?$raw['days']:[];
        $mins=is_array($raw['mins']??null)?$raw['mins']:[];
        foreach(array_keys($days) as $d){if($d!==$today)unset($days[$d]);}
        foreach(array_keys($mins) as $m){if($m!==$currentMin)unset($mins[$m]);}
        $days[$today][$model]['requests']=((int)($days[$today][$model]['requests']??0))+1;
        $days[$today][$model]['tokens']=((int)($days[$today][$model]['tokens']??0))+$tokens;
        $days[$today][$model]['last_at']=$now;
        $mins[$currentMin][$model]['requests']=((int)($mins[$currentMin][$model]['requests']??0))+1;
        $mins[$currentMin][$model]['tokens']=((int)($mins[$currentMin][$model]['tokens']??0))+$tokens;
        $raw['days']=$days;$raw['mins']=$mins;$raw['updated_at']=$now;$raw['version']=((int)($raw['version']??0))+1;
        $this->store->transact([['collection'=>'settings','id'=>'ai_usage','record'=>$raw,'summary'=>['id'=>'ai_usage','updated_at'=>$now]]]);
    }
    private function aiConfig(string $method): never {
        $me=$this->auth->current();
        $models=$this->aiModels();
        if($method==='GET'){
            $cfg=$this->readAiSettings();
            $masked=$cfg['api_key']!==''?(substr($cfg['api_key'],0,6).'••••••••'.substr($cfg['api_key'],-4)):'';
            crm_json([
                'enabled'=>$cfg['enabled'],
                'has_key'=>$cfg['api_key']!=='',
                'masked_key'=>$masked,
                'model'=>$cfg['model'],
                'auto_fallback'=>$cfg['auto_fallback'],
                'models'=>$models,
                'usage'=>$this->getAiUsageStats($cfg['model']),
                'can_edit'=>($me['role']??'')==='admin',
            ]);
        }
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        if(($me['role']??'')!=='admin')crm_json(['error'=>'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่ตั้งค่า AI API Key ได้'],403);
        $d=crm_input();
        if(!empty($d['reset_usage'])){
            $now=crm_now();
            $raw=['id'=>'ai_usage','version'=>1,'created_at'=>$now,'updated_at'=>$now,'deleted_at'=>null,'days'=>[],'mins'=>[]];
            $this->store->transact([['collection'=>'settings','id'=>'ai_usage','record'=>$raw,'summary'=>['id'=>'ai_usage','updated_at'=>$now]]]);
            $cfg=$this->readAiSettings();
            crm_json(['ok'=>true,'usage'=>$this->getAiUsageStats($cfg['model'])]);
        }
        $current=$this->readAiSettings();
        $newKey=trim((string)($d['api_key']??''));
        $clear=!empty($d['clear_key']);
        $keyToSave=$clear?'':($newKey!==''?$newKey:$current['api_key']);
        if($keyToSave!==''&&(strlen($keyToSave)<15||strlen($keyToSave)>250))throw new InvalidArgumentException('รูปแบบ Gemini API Key ไม่ถูกต้อง');
        $model=trim((string)($d['model']??'gemini-3.5-flash-lite'));
        if(!isset($models[$model]))$model='gemini-3.5-flash-lite';
        $enabled=array_key_exists('enabled',$d)?!empty($d['enabled']):($keyToSave!=='');
        $autoFallback=array_key_exists('auto_fallback',$d)?!empty($d['auto_fallback']):true;
        $iv=bin2hex(random_bytes(12));
        $secret=hash('sha256',$iv.ROOT,true);
        $enc=$keyToSave!==''?(string)openssl_encrypt($keyToSave,'aes-256-cbc',$secret,0,substr(hash('sha256',$iv),0,16)):'';
        $now=crm_now();
        $old=$this->store->read('settings','ai_config');
        $record=['id'=>'ai_config','version'=>($old['version']??0)+1,'created_at'=>$old['created_at']??$now,'updated_at'=>$now,'deleted_at'=>null,'enabled'=>$enabled&&$keyToSave!=='','model'=>$model,'auto_fallback'=>$autoFallback,'iv'=>$iv,'api_key_enc'=>$enc];
        $this->store->transact([
            ['collection'=>'settings','id'=>'ai_config','record'=>$record,'summary'=>['id'=>'ai_config','updated_at'=>$now,'enabled'=>$record['enabled'],'model'=>$model]],
            $this->auditChange('settings','ai_config','ai_config_updated')
        ]);
        $masked=$keyToSave!==''?(substr($keyToSave,0,6).'••••••••'.substr($keyToSave,-4)):'';
        crm_json([
            'ok'=>true,
            'enabled'=>$record['enabled'],
            'has_key'=>$keyToSave!=='',
            'masked_key'=>$masked,
            'model'=>$model,
            'auto_fallback'=>$autoFallback,
            'models'=>$models,
            'usage'=>$this->getAiUsageStats($model),
        ]);
    }
    private function aiSearch(string $method): never {
        if($method!=='POST')crm_json(['error'=>'Method not allowed'],405);
        $d=crm_input();
        $q=mb_substr(trim((string)($d['q']??'')),0,200);
        if($q==='')crm_json(['error'=>'กรุณาพิมพ์คำค้นหา'],422);
        $cfg=$this->readAiSettings();
        if(!$cfg['enabled']||$cfg['api_key']==='')crm_json(['error'=>'ยังไม่ได้ตั้งค่า Gemini API Key (ตั้งค่าได้ที่เมนู ตั้งค่าส่วนตัว)'],422);
        $pages=[
            'dashboard'=>'ภาพรวมระบบ / หน้าแรก / แดชบอร์ด / สรุปยอด (Dashboard)',
            'reports'=>'รายงานและสถิติ / ส่งออก CSV / Excel (Reports & Export)',
            'contacts'=>'สมาชิก / ผู้บริจาค / รายชื่อลูกค้า / เบอร์โทร / ที่อยู่ (Contacts / Donors / Members)',
            'campaigns'=>'โครงการ / แคมเปญรับบริจาค (Campaigns / Projects)',
            'categories'=>'หมวดหมู่โครงการ / ประเภทโครงการ (Campaign Categories)',
            'donations'=>'รายการบริจาค / แจ้งโอน / ยอดเงินบริจาค / ใบเสร็จ (Donations)',
            'receivers'=>'ผู้รับแจ้งยอด / ช่องทางรับบริจาค (Receivers / Channels)',
            'hadeeya'=>'รายการฮาดียะห์ / ของที่ระลึก / สินค้า / ของขวัญ (Hadeeya / Gifts)',
            'stock_lots'=>'ล็อตและคลังสินค้า / สต็อกคงเหลือ / คลัง (Stock Lots / Warehouse)',
            'inventory_moves'=>'ประวัติเคลื่อนไหวสต็อก / รับเข้า-จ่ายออกสต็อก (Inventory Movements)',
            'shipments'=>'การจัดส่ง / รับคืน / เลขพัสดุ / ส่งของ (Shipments / Tracking)',
            'delivery_companies'=>'บริษัทขนส่ง / ขนส่งเอกชน / ไปรษณีย์ (Delivery Companies)',
            'tasks'=>'Call Center / งานติดตาม / โทรติดตามลูกค้า (Tasks / Call Center)',
            'feedback'=>'ความคิดเห็น / ข้อเสนอแนะ / ร้องเรียน (Feedback)',
            'announcements'=>'ประกาศภายใน / ข่าวสารองค์กร (Announcements)',
            'users'=>'ผู้ใช้งานและสิทธิ์ / แอดมิน / พนักงาน (Users & Roles)',
            'audit'=>'ประวัติการทำงาน / ตรวจสอบย้อนหลัง / ล็อก (Audit Log)',
            'settings'=>'ตั้งค่าส่วนตัว / เปลี่ยนธีม / เปลี่ยนรหัสผ่าน / ตั้งค่า AI (Settings)',
        ];
        $allowedPages=[];
        foreach($pages as $mod=>$desc){
            if($mod==='settings'||$this->auth->can($mod,'read'))$allowedPages[$mod]=$desc;
        }
        $sampleRecords=[];
        foreach(Schema::all() as $module=>$schema){
            if(!$this->auth->can($module,'read'))continue;
            $count=0;
            foreach($this->store->summaries($module) as $item){
                $title=$item['name']??$item['title']??$item['topic']??$item['lot_code']??$item['barcode']??$item['tracking_no']??$item['id'];
                $extra=$item['phone']??$item['sku']??$item['province']??$item['status']??'';
                $sampleRecords[]=['module'=>$module,'module_label'=>$schema['label'],'id'=>$item['id'],'title'=>(string)$title,'subtitle'=>(string)$extra];
                if(++$count>=8 || count($sampleRecords)>=60)break;
            }
            if(count($sampleRecords)>=60)break;
        }
        $prompt="คุณคือ AI ผู้ช่วยนำทางและค้นหาอัจฉริยะของระบบ White Channel CRM V2\n"
            ."ผู้ใช้พิมพ์คำสั่งหรือคำค้นหาแล้วกด Enter เพื่อให้ระบบพาไปยังหน้าที่ต้องการทันที (อาจพิมพ์ผิด สะกดผิด พิมพ์แป้นไทย/อังกฤษสลับกัน หรือพิมพ์เป็นประโยคคำสั่ง): ".json_encode($q,JSON_UNESCAPED_UNICODE)."\n\n"
            ."รายการหน้าโมดูลที่ผู้ใช้มีสิทธิ์เข้าถึง (module_id => คำอธิบาย):\n".json_encode($allowedPages,JSON_UNESCAPED_UNICODE)."\n\n"
            ."ข้อมูลรายการในระบบบางส่วน (สำหรับจับคู่กรณีผู้ใช้ค้นหาชื่อคน โครงการ หรือรหัสเฉพาะเจาะจง):\n".json_encode($sampleRecords,JSON_UNESCAPED_UNICODE)."\n\n"
            ."งานของคุณ:\n"
            ."1. วิเคราะห์เจตนาที่แท้จริงของผู้ใช้ว่าต้องการเปิดหน้าไหน (`primary_intent`: 'module') หรือต้องการเปิดดูข้อมูลเฉพาะรายบุคคล/รายการ (`primary_intent`: 'record')\n"
            ."2. รองรับคำพิมพ์ผิดและภาษาพูดทุกแบบ เช่น:\n"
            ."   - 'บริจาก', 'แจ้งโอน', 'คีย์ยอด' -> module='donations'\n"
            ."   - 'บริจาครอตรวจ', 'สลิปรอเช็ค' -> module='donations', status_filter='pending'\n"
            ."   - 'ยอดบริจาควันนี้' -> module='donations', date_preset='today'\n"
            ."   - 'รายงานเดือนนี้', 'สรุปยอดเดือนนี้' -> module='reports', date_preset='month'\n"
            ."   - 'สมาชิค', 'ผู้บริจาก', 'หาเบอร์ลูกค้า' -> module='contacts'\n"
            ."   - 'เพิ่มผู้บริจาค', 'สมัครสมาชิกใหม่' -> module='contacts', action='create'\n"
            ."   - 'ส่งของ', 'พัสดุ', 'เช็คเลขพัสดุ' -> module='shipments'\n"
            ."   - 'พัสดุตีกลับ' -> module='shipments', status_filter='returned'\n"
            ."   - 'ฮาดียะ', 'ของที่ระลึก', 'ของขวัญ' -> module='hadeeya'\n"
            ."   - 'เช็คสต็อก', 'ล็อตสินค้า', 'คลัง' -> module='stock_lots'\n"
            ."   - 'งานติดตาม', 'คอลเซ็นเตอร์', 'งานค้าง' -> module='tasks', status_filter='open'\n"
            ."   - 'ตั้งค่า', 'เปลี่ยนรหัส', 'เปลี่ยนธีม', 'สำรองข้อมูล', 'backup' -> module='settings'\n"
            ."3. ตอบกลับเป็น JSON Object เท่านั้น ตามโครงสร้างนี้:\n"
            ."{\n"
            ."  \"primary_intent\": \"module หรือ record\",\n"
            ."  \"corrected_query\": \"คำหรือความหมายที่แก้คำผิดแล้ว\",\n"
            ."  \"explanation\": \"คำอธิบายสั้นๆ ว่ากำลังพาไปหน้าไหนเพราะอะไร\",\n"
            ."  \"recommended_modules\": [\n"
            ."    {\n"
            ."      \"module\": \"ชื่อ module_id ที่ตรงที่สุด\",\n"
            ."      \"action\": \"navigate หรือ create หรือ filter\",\n"
            ."      \"filter_keyword\": \"คำค้นเฉพาะสำหรับกรองในตาราง (ถ้าเป็นการสั่งเปิดหน้าทั่วไปให้ใส่ค่าว่าง '')\",\n"
            ."      \"status_filter\": \"ค่าสถานะถ้าผู้ใช้ระบุ เช่น pending, confirmed, open, progress, done, preparing, shipped, delivered, returned, new, resolved (ถ้าไม่ระบุให้ใส่ '')\",\n"
            ."      \"date_preset\": \"ช่วงเวลาถ้าผู้ใช้ระบุ: today, 7d, month, last_month, year (ถ้าไม่ระบุให้ใส่ '')\",\n"
            ."      \"reason\": \"เหตุผลสั้นๆ\"\n"
            ."    }\n"
            ."  ],\n"
            ."  \"matched_records\": [\n"
            ."    {\"module\": \"module_id\", \"id\": \"record_id จากข้อมูลที่ให้ไปเท่านั้น\", \"reason\": \"เหตุผลที่ตรง\"}\n"
            ."  ]\n"
            ."}";
        $payload=[
            'contents'=>[['parts'=>[['text'=>$prompt]]]],
            'generationConfig'=>[
                'temperature'=>0.1,
                'maxOutputTokens'=>600,
                'responseMimeType'=>'application/json',
            ],
        ];
        $allModels=array_keys($this->aiModels());
        $tryOrder=[$cfg['model']];
        if(!empty($cfg['auto_fallback'])){
            foreach($allModels as $m){if(!in_array($m,$tryOrder,true))$tryOrder[]=$m;}
        }
        $resp=false;$httpCode=0;$errDetail='';$usedModel=$cfg['model'];
        $bodyJson=json_encode($payload,JSON_UNESCAPED_UNICODE);
        foreach($tryOrder as $candidateModel){
            $usedModel=$candidateModel;
            $url='https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode($candidateModel).':generateContent?key='.rawurlencode($cfg['api_key']);
            [$resp,$httpCode,$errDetail]=$this->httpPostJson($url,$bodyJson);
            if($resp!==false && $httpCode>=200 && $httpCode<300)break;
        }
        if($resp===false||$httpCode>=400){
            $errData=json_decode((string)$resp,true);
            $apiMsg=$errData['error']['message']??($errDetail?:'เชื่อมต่อ Gemini API ไม่สำเร็จ');
            crm_json(['error'=>'Gemini API Error ('.$usedModel.'): '.$apiMsg],502);
        }
        $decoded=json_decode((string)$resp,true);
        $totalTokens=(int)($decoded['usageMetadata']['totalTokenCount']??0);
        $this->recordAiUsage($usedModel,$totalTokens);
        $rawText=(string)($decoded['candidates'][0]['content']['parts'][0]['text']??'{}');
        $rawText=preg_replace('/^```(?:json)?\s*|\s*```$/m','',trim($rawText));
        $ai=json_decode($rawText,true);
        if(!is_array($ai))crm_json(['error'=>'ไม่สามารถอ่านผลลัพธ์จาก AI ได้'],502);
        $mods=[];
        foreach(($ai['recommended_modules']??[]) as $m){
            $mod=(string)($m['module']??'');
            if(!isset($allowedPages[$mod]))continue;
            $schema=Schema::module($mod);
            $label=$schema['label']??(['dashboard'=>'ภาพรวมระบบ','reports'=>'รายงานและสถิติ','users'=>'ผู้ใช้งานและสิทธิ์','audit'=>'ประวัติการทำงาน','settings'=>'ตั้งค่าส่วนตัว'][$mod]??$mod);
            $mods[]=[
                'module'=>$mod,
                'label'=>$label,
                'action'=>in_array($m['action']??'',['navigate','create','filter'],true)?$m['action']:'navigate',
                'filter_keyword'=>trim((string)($m['filter_keyword']??'')),
                'status_filter'=>trim((string)($m['status_filter']??'')),
                'date_preset'=>in_array($m['date_preset']??'',['today','7d','month','last_month','year','all'],true)?$m['date_preset']:'',
                'reason'=>(string)($m['reason']??''),
            ];
        }
        $recs=[];
        $sampleMap=[];
        foreach($sampleRecords as $sr)$sampleMap[$sr['module'].':'.$sr['id']]=$sr;
        foreach(($ai['matched_records']??[]) as $mr){
            $key=($mr['module']??'').':'.($mr['id']??'');
            if(isset($sampleMap[$key])){
                $item=$sampleMap[$key];
                $item['reason']=(string)($mr['reason']??'');
                $recs[]=$item;
            }
        }
        crm_json([
            'ok'=>true,
            'used_model'=>$usedModel,
            'tokens_used'=>$totalTokens,
            'usage'=>$this->getAiUsageStats($usedModel),
            'primary_intent'=>in_array($ai['primary_intent']??'',['module','record'],true)?$ai['primary_intent']:'module',
            'corrected_query'=>(string)($ai['corrected_query']??$q),
            'explanation'=>(string)($ai['explanation']??''),
            'recommended_modules'=>array_slice($mods,0,4),
            'matched_records'=>array_slice($recs,0,6),
        ]);
    }
    private function httpPostJson(string $url,string $bodyJson): array {
        if(function_exists('curl_init')){
            $ch=\curl_init($url);
            \curl_setopt_array($ch,[
                CURLOPT_POST=>true,
                CURLOPT_RETURNTRANSFER=>true,
                CURLOPT_HTTPHEADER=>['Content-Type: application/json'],
                CURLOPT_POSTFIELDS=>$bodyJson,
                CURLOPT_TIMEOUT=>12,
                CURLOPT_CONNECTTIMEOUT=>5,
                CURLOPT_SSL_VERIFYPEER=>false,
            ]);
            $resp=\curl_exec($ch);
            $code=(int)\curl_getinfo($ch,CURLINFO_HTTP_CODE);
            $err=\curl_error($ch);
            \curl_close($ch);
            return [$resp,$code,$err];
        }
        $ctx=stream_context_create([
            'http'=>[
                'method'=>'POST',
                'header'=>"Content-Type: application/json\r\nAccept: application/json\r\n",
                'content'=>$bodyJson,
                'timeout'=>12,
                'ignore_errors'=>true,
            ],
            'ssl'=>[
                'verify_peer'=>false,
                'verify_peer_name'=>false,
            ],
        ]);
        $resp=@file_get_contents($url,false,$ctx);
        $code=0;
        if(isset($http_response_header)&&is_array($http_response_header)){
            foreach($http_response_header as $hdr){
                if(preg_match('#^HTTP/\S+\s+(\d{3})#',$hdr,$m))$code=(int)$m[1];
            }
        }
        $err=$resp===false?(error_get_last()['message']??'Stream request failed'):'';
        return [$resp,$code,$err];
    }
}
