<?php
namespace CRM;

final class Schema {
    /** module definitions are shared by API validation and frontend form rendering. */
    public static function all(): array {
        return [
            'contacts'=>['label'=>'สมาชิก / ผู้บริจาค','icon'=>'users','prefix'=>'con','fields'=>[
                'name'=>['label'=>'ชื่อ-นามสกุล','type'=>'text','required'=>true,'placeholder'=>'เช่น นายอับดุลเลาะห์ มีสุข หรือ บจก. ไวท์แชนแนล'],
                'phone'=>['label'=>'เบอร์โทรศัพท์','type'=>'phone','placeholder'=>'เช่น 081-234-5678 หรือ 02-123-4567'],
                'email'=>['label'=>'อีเมล','type'=>'email','placeholder'=>'เช่น donor@example.com (ถ้ามี)'],
                'type'=>['label'=>'ประเภทสมาชิก','type'=>'select','options'=>['donor'=>'ผู้บริจาค','member'=>'สมาชิก','organization'=>'องค์กร'],'placeholder'=>'— เลือกประเภทสมาชิก —'],
                'province'=>['label'=>'จังหวัด','type'=>'text','placeholder'=>'เช่น กรุงเทพมหานคร, ปัตตานี, ยะลา, เชียงใหม่'],
                'address'=>['label'=>'ที่อยู่สำหรับจัดส่งฮาดียะห์ / เอกสาร','type'=>'textarea','placeholder'=>'บ้านเลขที่ หมู่บ้าน ซอย ถนน ตำบล/แขวง อำเภอ/เขต และรหัสไปรษณีย์…'],
                'tags'=>['label'=>'แท็ก (คั่นด้วยจุลภาค)','type'=>'text','placeholder'=>'เช่น VIP, บริจาครายเดือน, รอมฎอน69'],
                'notes'=>['label'=>'บันทึกเพิ่มเติม','type'=>'textarea','placeholder'=>'บันทึกข้อมูลสำคัญ เช่น เวลาที่สะดวกให้ติดต่อ หรือความต้องการพิเศษ…'],
                'legacy_id'=>['label'=>'รหัสระบบเก่า (ถ้ามี)','type'=>'text','placeholder'=>'เช่น OLD-CON-00125 (เว้นว่างได้)'],
            ],'columns'=>['name','phone','type','province','created_at']],
            'categories'=>['label'=>'หมวดหมู่โครงการ','icon'=>'tags','prefix'=>'cat','fields'=>[
                'name'=>['label'=>'ชื่อหมวดหมู่','type'=>'text','required'=>true,'placeholder'=>'เช่น กองทุนสื่อศาสนา, ช่วยเหลือผู้ประสบภัย, สร้างมัสยิด'],
                'description'=>['label'=>'รายละเอียดหมวดหมู่','type'=>'textarea','placeholder'=>'อธิบายขอบเขตหรือวัตถุประสงค์ของหมวดหมู่โครงการนี้…'],
                'active'=>['label'=>'สถานะการใช้งาน','type'=>'select','options'=>['1'=>'เปิดใช้งาน','0'=>'ปิดใช้งาน'],'placeholder'=>'— เลือกสถานะ —'],
            ],'columns'=>['name','active','created_at']],
            'campaigns'=>['label'=>'โครงการ','icon'=>'layers','prefix'=>'cam','fields'=>[
                'name'=>['label'=>'ชื่อโครงการ','type'=>'text','required'=>true,'placeholder'=>'เช่น โครงการช่วยเหลือผู้ประสบภัยน้ำท่วม ปี 2569'],
                'category_id'=>['label'=>'หมวดหมู่โครงการ','type'=>'relation','module'=>'categories','placeholder'=>'คลิกเพื่อเลือก หรือพิมพ์ชื่อหมวดหมู่โครงการ…'],
                'goal_satang'=>['label'=>'เป้าหมายระดมทุน (บาท)','type'=>'money','placeholder'=>'เช่น 500000.00 (ระบุ 0 หากไม่จำกัดเป้าหมาย)'],
                'start_date'=>['label'=>'วันที่เริ่มโครงการ','type'=>'date'],
                'end_date'=>['label'=>'วันที่สิ้นสุดโครงการ','type'=>'date'],
                'status'=>['label'=>'สถานะโครงการ','type'=>'select','options'=>['draft'=>'ร่าง','active'=>'ดำเนินการ','closed'=>'ปิดโครงการ'],'placeholder'=>'— เลือกสถานะโครงการ —'],
                'description'=>['label'=>'รายละเอียดโครงการ','type'=>'textarea','placeholder'=>'ระบุวัตถุประสงค์ รายละเอียดการดำเนินงาน และเงื่อนไขการรับฮาดียะห์…'],
                'cover_file_id'=>['label'=>'ภาพปกโครงการ','type'=>'text','readonly'=>true,'placeholder'=>'อัปโหลดได้หลังจากสร้างโครงการแล้ว'],
                'legacy_id'=>['label'=>'รหัสระบบเก่า','type'=>'text','placeholder'=>'เช่น CAM-OLD-01 (เว้นว่างได้)'],
            ],'columns'=>['name','status','goal_satang','start_date','created_at']],
            'receivers'=>['label'=>'ผู้รับแจ้งยอด / ช่องทาง','icon'=>'headset','prefix'=>'rcv','fields'=>[
                'name'=>['label'=>'ชื่อผู้รับแจ้ง / ช่องทาง','type'=>'text','required'=>true,'placeholder'=>'เช่น เจ้าหน้าที่โต๊ะ 1 (คุณฟาติมะห์) หรือ LINE Official'],
                'phone'=>['label'=>'เบอร์โทรศัพท์ติดต่อ','type'=>'phone','placeholder'=>'เช่น 089-000-1111 หรือเบอร์ภายใน'],
                'kind'=>['label'=>'ประเภทผู้รับแจ้ง','type'=>'select','options'=>['person'=>'บุคคล','callcenter'=>'Call Center','other'=>'อื่น ๆ'],'placeholder'=>'— เลือกประเภท —'],
                'active'=>['label'=>'สถานะ','type'=>'select','options'=>['1'=>'เปิดใช้งาน','0'=>'ปิดใช้งาน'],'placeholder'=>'— เลือกสถานะ —'],
                'notes'=>['label'=>'หมายเหตุ','type'=>'textarea','placeholder'=>'เช่น รอบกะการทำงาน หรือรายละเอียดช่องทางรับแจ้งยอด…'],
            ],'columns'=>['name','kind','phone','active']],
            'donations'=>['label'=>'รายการบริจาค','icon'=>'heart-handshake','prefix'=>'don','fields'=>[
                'contact_id'=>['label'=>'ผู้บริจาค / สมาชิก','type'=>'relation','module'=>'contacts','required'=>true,'placeholder'=>'คลิกเพื่อเลือก หรือพิมพ์ชื่อ / เบอร์โทรผู้บริจาค…'],
                'campaign_id'=>['label'=>'โครงการที่ร่วมบริจาค','type'=>'relation','module'=>'campaigns','required'=>true,'placeholder'=>'คลิกเพื่อเลือก หรือพิมพ์ชื่อโครงการ…'],
                'receiver_id'=>['label'=>'ผู้รับแจ้งยอด / ช่องทาง','type'=>'relation','module'=>'receivers','placeholder'=>'คลิกเพื่อเลือกผู้รับแจ้งยอด (ถ้ามี)…'],
                'amount_satang'=>['label'=>'จำนวนเงินบริจาค (บาท)','type'=>'money','required'=>true,'placeholder'=>'ระบุยอดเงิน เช่น 500.00 หรือ 1500.00'],
                'donated_at'=>['label'=>'วันที่บริจาค','type'=>'date','required'=>true],
                'status'=>['label'=>'สถานะการตรวจสอบ','type'=>'select','options'=>['pending'=>'รอตรวจสอบ','confirmed'=>'ยืนยันแล้ว','cancelled'=>'ยกเลิก'],'placeholder'=>'— เลือกสถานะ (ค่าเริ่มต้น: รอตรวจสอบ) —'],
                'barcode'=>['label'=>'Barcode / เลขอ้างอิงสลิป','type'=>'text','auto_code'=>true,'placeholder'=>'เว้นว่างเพื่อสร้างรหัสอัตโนมัติ (เช่น RCP-20261111-001) หรือพิมพ์เอง…'],
                'channel'=>['label'=>'ช่องทางการชำระเงิน','type'=>'select','options'=>['bank'=>'โอนเงินธนาคาร / QR','cash'=>'เงินสด','other'=>'อื่น ๆ'],'placeholder'=>'— เลือกช่องทางชำระเงิน —'],
                'distribution_period'=>['label'=>'ตัวเลือกการกระจายบุญ','type'=>'select','options'=>[
                    'once'=>'ครั้งเดียว / ปกติ',
                    'all_year'=>'บริจาคตลอดทั้งปี',
                    '30days'=>'แบ่ง 30 วัน',
                    '30days_1000m'=>'30 วัน 1000 เดือน',
                    'even_days'=>'แบ่ง วันคู่',
                    'odd_days'=>'แบ่ง วันคี่',
                    'best_10days'=>'10 วันอันประเสริฐ',
                    'last_10days'=>'10 วันสุดท้าย',
                    'day'=>'กลางวัน',
                    'night'=>'กลางคืน'
                ],'placeholder'=>'— เลือกรูปแบบการบริจาค —'],
                'note'=>['label'=>'หมายเหตุการบริจาค','type'=>'textarea','placeholder'=>'เช่น โอนเข้าบัญชีธนาคารกสิกรไทย เวลา 14:30 น. / ขอรับฮาดียะห์…'],
                'legacy_id'=>['label'=>'รหัสระบบเก่า','type'=>'text','placeholder'=>'รหัสอ้างอิงจากระบบเดิม (เว้นว่างได้)'],
            ],'columns'=>['barcode','contact_id','campaign_id','amount_satang','status','donated_at']],
            'hadeeya'=>['label'=>'รายการฮาดียะห์','icon'=>'gift','prefix'=>'had','fields'=>[
                'name'=>['label'=>'ชื่อรายการฮาดียะห์ (ของที่ระลึก)','type'=>'text','required'=>true,'placeholder'=>'เช่น หนังสืออัลกุรอานแปลไทย, ปฏิทินตั้งโต๊ะ White Channel'],
                'sku'=>['label'=>'รหัสสินค้า (SKU)','type'=>'text','auto_code'=>true,'placeholder'=>'เว้นว่างเพื่อรันรหัสอัตโนมัติ (เช่น HDY-001) หรือพิมพ์เอง…'],
                'description'=>['label'=>'รายละเอียดฮาดียะห์','type'=>'textarea','placeholder'=>'ระบุขนาด สี รุ่น หรือเงื่อนไขการมอบให้ผู้บริจาค…'],
                'unit'=>['label'=>'หน่วยนับ','type'=>'text','placeholder'=>'เช่น เล่ม, ชิ้น, ชุด, กล่อง'],
                'active'=>['label'=>'สถานะ','type'=>'select','options'=>['1'=>'ใช้งาน','0'=>'ปิด'],'placeholder'=>'— เลือกสถานะ —'],
            ],'columns'=>['sku','name','unit','active']],
            'stock_lots'=>['label'=>'ล็อตและคลังสินค้า','icon'=>'boxes','prefix'=>'lot','fields'=>[
                'hadeeya_id'=>['label'=>'รายการฮาดียะห์','type'=>'relation','module'=>'hadeeya','required'=>true,'placeholder'=>'คลิกเพื่อเลือก หรือพิมพ์ชื่อ/รหัส SKU ฮาดียะห์…'],
                'lot_code'=>['label'=>'รหัสล็อตสินค้า (Lot Code)','type'=>'text','auto_code'=>true,'placeholder'=>'เว้นว่างเพื่อรันรหัสอัตโนมัติ (เช่น LOT-202611-001) หรือพิมพ์เอง…'],
                'quantity'=>['label'=>'จำนวนสินค้าในล็อต (ชิ้น)','type'=>'integer','readonly_on_edit'=>true,'placeholder'=>'ระบุจำนวนชิ้นที่รับเข้าล็อตนี้ เช่น 100'],
                'location'=>['label'=>'ตำแหน่งจัดเก็บในคลัง','type'=>'text','placeholder'=>'เช่น ชั้นวาง A2, ห้องเก็บของชั้น 2, คลังหลัก'],
                'note'=>['label'=>'หมายเหตุล็อตสินค้า','type'=>'textarea','placeholder'=>'เช่น รับเข้าจากโรงพิมพ์ล็อตเดือนพฤศจิกายน ต้นทุนต่อชิ้น…'],
            ],'columns'=>['lot_code','hadeeya_id','quantity','location']],
            'inventory_moves'=>['label'=>'ประวัติเคลื่อนไหวสต็อก','icon'=>'arrow-left-right','prefix'=>'mov','readonly'=>true,'fields'=>[
                'lot_id'=>['label'=>'ล็อต','type'=>'relation','module'=>'stock_lots'],
                'movement'=>['label'=>'การเคลื่อนไหว','type'=>'text'],
                'quantity'=>['label'=>'จำนวน','type'=>'integer'],
                'before'=>['label'=>'ยอดก่อน','type'=>'integer'],
                'after'=>['label'=>'ยอดหลัง','type'=>'integer'],
                'reason'=>['label'=>'เหตุผล','type'=>'textarea'],
                'actor'=>['label'=>'ผู้ทำรายการ','type'=>'text'],
            ],'columns'=>['lot_id','movement','quantity','before','after','created_at']],
            'delivery_companies'=>['label'=>'บริษัทขนส่ง','icon'=>'truck','prefix'=>'dco','fields'=>[
                'name'=>['label'=>'ชื่อบริษัทขนส่ง','type'=>'text','required'=>true,'placeholder'=>'เช่น ไปรษณีย์ไทย (EMS), Flash Express, Kerry, J&T'],
                'tracking_url'=>['label'=>'ลิงก์ตรวจสอบพัสดุ (ใช้ {tracking} แทนเลขพัสดุ)','type'=>'text','placeholder'=>'เช่น https://track.thailandpost.co.th/?trackNumber={tracking}'],
                'active'=>['label'=>'สถานะ','type'=>'select','options'=>['1'=>'ใช้งาน','0'=>'ปิด'],'placeholder'=>'— เลือกสถานะ —'],
            ],'columns'=>['name','active']],
            'shipments'=>['label'=>'การจัดส่ง / รับคืน','icon'=>'package-check','prefix'=>'shp','fields'=>[
                'donation_id'=>['label'=>'อ้างอิงรายการบริจาค','type'=>'relation','module'=>'donations','required'=>true,'placeholder'=>'คลิกเพื่อเลือก หรือพิมพ์ชื่อผู้บริจาค / รหัสบาร์โค้ด…'],
                'hadeeya_id'=>['label'=>'รายการฮาดียะห์ที่ส่ง','type'=>'relation','module'=>'hadeeya','placeholder'=>'คลิกเพื่อเลือกฮาดียะห์ (หรือเลือกจากล็อตด้านล่างแล้วระบบเติมให้อัตโนมัติ)…'],
                'lot_id'=>['label'=>'ตัดสต็อกจากล็อตคลังสินค้า (อัตโนมัติ)','type'=>'relation','module'=>'stock_lots','placeholder'=>'คลิกเพื่อเลือกล็อตที่จะตัดสต็อกอัตโนมัติ (แสดงจำนวนคงเหลือ)…'],
                'quantity'=>['label'=>'จำนวนที่จัดส่ง (ชิ้น)','type'=>'integer','placeholder'=>'ระบุจำนวนชิ้น เช่น 1'],
                'delivery_company_id'=>['label'=>'บริษัทขนส่ง','type'=>'relation','module'=>'delivery_companies','placeholder'=>'คลิกเพื่อเลือกบริษัทขนส่ง…'],
                'tracking_no'=>['label'=>'หมายเลขพัสดุ (Tracking No.)','type'=>'text','placeholder'=>'เช่น EF123456789TH หรือ TH0123456789A'],
                'status'=>['label'=>'สถานะการจัดส่ง','type'=>'select','options'=>['preparing'=>'เตรียมจัดส่ง','shipped'=>'จัดส่งแล้ว','delivered'=>'รับสำเร็จ','returned'=>'ตีกลับ (คืนสต็อก)','cancelled'=>'ยกเลิก (คืนสต็อก)'],'placeholder'=>'— เลือกสถานะการจัดส่ง —'],
                'sent_at'=>['label'=>'วันที่ส่งพัสดุ','type'=>'date'],
                'received_at'=>['label'=>'วันที่ผู้บริจาคได้รับ','type'=>'date'],
                'note'=>['label'=>'รายละเอียด / ที่อยู่จัดส่งเพิ่มเติม','type'=>'textarea','placeholder'=>'ระบุหมายเหตุการจัดส่ง เช่น ฝากไว้ที่ป้อมยาม หรือโทรแจ้งก่อนส่ง…'],
                'proof_file_id'=>['label'=>'ไฟล์หลักฐานรับ/ส่งของ','type'=>'text','readonly'=>true,'placeholder'=>'แนบไฟล์รูปสลิปขนส่งได้หลังจากบันทึกรายการแล้ว'],
            ],'columns'=>['donation_id','hadeeya_id','lot_id','quantity','tracking_no','status','sent_at']],
            'tasks'=>['label'=>'Call Center / งานติดตาม','icon'=>'clipboard-list','prefix'=>'tsk','fields'=>[
                'title'=>['label'=>'หัวข้องานติดตาม','type'=>'text','required'=>true,'placeholder'=>'เช่น โทรขอบคุณและสอบถามที่อยู่จัดส่งฮาดียะห์'],
                'contact_id'=>['label'=>'สมาชิก / ผู้บริจาคที่ต้องติดต่อ','type'=>'relation','module'=>'contacts','placeholder'=>'คลิกเพื่อเลือก หรือพิมพ์ชื่อ/เบอร์โทรสมาชิก…'],
                'assigned_to'=>['label'=>'เจ้าหน้าที่ผู้รับผิดชอบ','type'=>'relation','module'=>'users','placeholder'=>'คลิกเพื่อเลือกพนักงานผู้รับผิดชอบ…'],
                'due_date'=>['label'=>'วันที่กำหนดติดตาม','type'=>'date'],
                'priority'=>['label'=>'ระดับความสำคัญ','type'=>'select','options'=>['normal'=>'ทั่วไป','high'=>'สูง','urgent'=>'เร่งด่วน'],'placeholder'=>'— เลือกระดับความสำคัญ —'],
                'status'=>['label'=>'สถานะงาน','type'=>'select','options'=>['open'=>'รอดำเนินการ','progress'=>'กำลังทำ','done'=>'เสร็จสิ้น'],'placeholder'=>'— เลือกสถานะงาน —'],
                'note'=>['label'=>'บันทึกผลการติดต่อ / รายละเอียด','type'=>'textarea','placeholder'=>'บันทึกรายละเอียดการพูดคุย เช่น ติดต่อแล้วรับสาย ยืนยันที่อยู่เรียบร้อย…'],
            ],'columns'=>['title','contact_id','assigned_to','due_date','status']],
            'feedback'=>['label'=>'ความคิดเห็น / ข้อเสนอแนะ','icon'=>'message-square','prefix'=>'fbk','fields'=>[
                'contact_id'=>['label'=>'ผู้ติดต่อ / ผู้บริจาค','type'=>'relation','module'=>'contacts','placeholder'=>'คลิกเพื่อเลือกผู้ติดต่อ (หรือเว้นว่างหากไม่ประสงค์ออกนาม)…'],
                'topic'=>['label'=>'หัวข้อเรื่อง','type'=>'text','required'=>true,'placeholder'=>'เช่น ชื่นชมรายการใหม่ / สอบถามการจัดส่งฮาดียะห์ล่าช้า'],
                'category'=>['label'=>'ประเภทเรื่อง','type'=>'select','options'=>['suggestion'=>'ข้อเสนอแนะ','complaint'=>'ร้องเรียน','praise'=>'ชื่นชม','other'=>'อื่น ๆ'],'placeholder'=>'— เลือกประเภทเรื่อง —'],
                'channel'=>['label'=>'ช่องทางที่รับเรื่อง','type'=>'select','options'=>['phone'=>'โทรศัพท์','web'=>'เว็บไซต์','line'=>'LINE','other'=>'อื่น ๆ'],'placeholder'=>'— เลือกช่องทางที่ติดต่อเข้ามา —'],
                'status'=>['label'=>'สถานะการจัดการ','type'=>'select','options'=>['new'=>'ใหม่','review'=>'กำลังตรวจสอบ','resolved'=>'แก้ไขแล้ว'],'placeholder'=>'— เลือกสถานะ —'],
                'message'=>['label'=>'รายละเอียดข้อความ','type'=>'textarea','placeholder'=>'พิมพ์รายละเอียดความคิดเห็น ข้อเสนอแนะ หรือผลการดำเนินการแก้ไข…'],
            ],'columns'=>['topic','category','channel','status','created_at']],
            'announcements'=>['label'=>'ประกาศภายใน','icon'=>'megaphone','prefix'=>'ann','fields'=>[
                'title'=>['label'=>'หัวข้อประกาศ','type'=>'text','required'=>true,'placeholder'=>'เช่น แจ้งแนวทางการรับแจ้งยอดช่วงเดือนรอมฎอน'],
                'body'=>['label'=>'เนื้อหาประกาศ','type'=>'textarea','required'=>true,'placeholder'=>'พิมพ์รายละเอียดประกาศสำหรับแจ้งทีมงานในระบบ…'],
                'status'=>['label'=>'สถานะการเผยแพร่','type'=>'select','options'=>['draft'=>'ฉบับร่าง','published'=>'เผยแพร่บนหน้า Dashboard'],'placeholder'=>'— เลือกสถานะการเผยแพร่ —'],
            ],'columns'=>['title','status','created_at']],
        ];
    }
    public static function module(string $name): ?array {return self::all()[$name]??null;}
    public static function data(string $collection,array $body,Store $store,bool $create=true): array {
        $schema=self::module($collection); if(!$schema)throw new \InvalidArgumentException('Unknown module');
        $out=[];
        foreach($schema['fields'] as $key=>$field) {
            if(!empty($field['readonly']))continue;
            $value=$body[$key]??'';
            if(!is_scalar($value) && $value!==null)throw new \InvalidArgumentException('Invalid field: '.$key);
            if(is_string($value))$value=trim($value);
            $type=$field['type'];
            if(!empty($field['required']) && ($value===''||$value===null)) throw new \InvalidArgumentException('กรุณาระบุ '.$field['label']);
            if ($type==='money') {
                if($value===''||$value===null) {$value=0;} elseif(is_int($value)) {$value=$value;} elseif(!is_numeric($value)) throw new \InvalidArgumentException('Invalid money amount');
                else {$value=(int)round((float)$value*100);}
                if ($value<0 || $value>1000000000000)throw new \InvalidArgumentException('Money amount outside range');
                if($collection==='donations'&&$key==='amount_satang'&&$value<=0)throw new \InvalidArgumentException('จำนวนเงินต้องมากกว่า 0');
            } elseif ($type==='integer') {
                if($value==='' || $value===null)$value=0;
                if(filter_var($value,FILTER_VALIDATE_INT)===false)throw new \InvalidArgumentException('Invalid integer');
                $value=(int)$value;if($value<0||$value>1000000000)throw new \InvalidArgumentException('Number outside range');
            } else {
                $value=(string)$value;
                if(mb_strlen($value)>($type==='textarea'?6000:350))throw new \InvalidArgumentException('Text is too long');
                if($type==='email'&&$value!==''&&!filter_var($value,FILTER_VALIDATE_EMAIL))throw new \InvalidArgumentException('Invalid email');
                if($type==='phone'&&$value!==''){
                    if(!preg_match('/^[0-9+() \-.]{5,30}$/D',$value))throw new \InvalidArgumentException('Invalid phone');
                    $value=self::formatPhone($value);
                }
                if($type==='date'&&$value!==''&&(!preg_match('/^\d{4}-\d\d-\d\d$/D',$value)||!checkdate((int)substr($value,5,2),(int)substr($value,8,2),(int)substr($value,0,4))))throw new \InvalidArgumentException('Invalid date');
                if($type==='select'&&$value!==''&&!array_key_exists($value,$field['options']))throw new \InvalidArgumentException('Invalid option: '.$key);
                if($type==='relation'&&$value!=='') {
                    $linked=$store->read($field['module'],$value);
                    if(!$linked || !empty($linked['deleted_at']))throw new \InvalidArgumentException('Record reference not found: '.$key);
                }
            }
            $out[$key]=$value;
        }
        if($collection==='contacts'){
            if(empty($out['type']))$out['type']='donor';
            if(($out['province']??'')==='' && ($out['address']??'')!==''){
                $out['province']=self::detectProvince((string)$out['address']);
            }
        }
        if($collection==='categories' && ($out['active']??'')==='')$out['active']='1';
        if($collection==='campaigns'){
            if($create && ($out['start_date']??'')==='')$out['start_date']=gmdate('Y-m-d');
            if(($out['status']??'')==='')$out['status']='active';
            if($out['start_date']!==''&&$out['end_date']!==''&&$out['end_date']<$out['start_date'])throw new \InvalidArgumentException('วันสิ้นสุดก่อนวันเริ่ม');
        }
        if($collection==='receivers'){
            if(($out['kind']??'')==='')$out['kind']='callcenter';
            if(($out['active']??'')==='')$out['active']='1';
        }
        if($collection==='donations'){
            if(empty($out['status']))$out['status']='pending';
            if(empty($out['channel']))$out['channel']='bank';
            if(empty($out['distribution_period']))$out['distribution_period']='once';
            if($create && ($out['barcode']??'')==='')$out['barcode']=self::nextCode($store,'donations','barcode','RCP-'.gmdate('Ymd').'-');
        }
        if($collection==='hadeeya'){
            if(($out['sku']??'')==='')$out['sku']=self::nextCode($store,'hadeeya','sku','HDY-');
            if(($out['unit']??'')==='')$out['unit']='ชิ้น';
            if(($out['active']??'')==='')$out['active']='1';
        }
        if($collection==='stock_lots'){
            if(($out['lot_code']??'')==='')$out['lot_code']=self::nextCode($store,'stock_lots','lot_code','LOT-'.gmdate('Ym').'-');
            if(!$create)unset($out['quantity']);
        }
        if($collection==='delivery_companies' && ($out['active']??'')==='')$out['active']='1';
        if($collection==='shipments'){
            if($out['quantity']===0)$out['quantity']=1;
            if(($out['status']??'')==='')$out['status']='preparing';
            if(($out['tracking_no']??'')!=='' && $out['status']==='preparing'){
                $out['status']='shipped';
            }
            if($out['status']==='shipped' && ($out['sent_at']??'')==='')$out['sent_at']=gmdate('Y-m-d');
            if($out['status']==='delivered' && ($out['received_at']??'')==='')$out['received_at']=gmdate('Y-m-d');
            if(($out['note']??'')==='' && ($out['donation_id']??'')!==''){
                $don=$store->read('donations',(string)$out['donation_id']);
                if($don && !empty($don['contact_id'])){
                    $con=$store->read('contacts',(string)$don['contact_id']);
                    if($con){
                        $parts=array_filter([
                            !empty($con['name'])?'ผู้รับ: '.$con['name']:'',
                            !empty($con['phone'])?'โทร: '.$con['phone']:'',
                            !empty($con['address'])?'ที่อยู่: '.$con['address'].(!empty($con['province'])?' จ.'.$con['province']:''):''
                        ]);
                        if($parts)$out['note']=implode(' | ',$parts);
                    }
                }
            }
        }
        if($collection==='tasks'){
            if(($out['priority']??'')==='')$out['priority']='normal';
            if(($out['status']??'')==='')$out['status']='open';
            if($create && ($out['due_date']??'')==='')$out['due_date']=gmdate('Y-m-d');
        }
        if($collection==='feedback'){
            if(($out['category']??'')==='')$out['category']='suggestion';
            if(($out['channel']??'')==='')$out['channel']='phone';
            if(($out['status']??'')==='')$out['status']='new';
        }
        if($collection==='announcements' && ($out['status']??'')==='')$out['status']='published';
        return $out;
    }
    public static function formatPhone(string $raw): string {
        $digits=preg_replace('/\D+/','',$raw)??'';
        if(strlen($digits)===10 && str_starts_with($digits,'0')){
            return substr($digits,0,3).'-'.substr($digits,3,3).'-'.substr($digits,6);
        }
        if(strlen($digits)===9 && str_starts_with($digits,'0')){
            return substr($digits,0,2).'-'.substr($digits,2,3).'-'.substr($digits,5);
        }
        return $raw;
    }
    public static function detectProvince(string $text): string {
        if(preg_match('/(กรุงเทพมหานคร|กรุงเทพฯ|กรุงเทพ|กทม\.?)/u',$text))return 'กรุงเทพมหานคร';
        $provinces=['กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี'];
        foreach($provinces as $p){
            if(mb_strpos($text,$p)!==false)return $p;
        }
        if(mb_strpos($text,'อยุธยา')!==false)return 'พระนครศรีอยุธยา';
        if(mb_strpos($text,'โคราช')!==false)return 'นครราชสีมา';
        return '';
    }
    private static function nextCode(Store $store,string $collection,string $field,string $prefix): string {
        $existing=[];
        foreach($store->summaries($collection) as $item){
            $val=strtoupper(trim((string)($item[$field]??'')));
            if($val!=='')$existing[$val]=true;
        }
        $seq=count($existing)+1;
        for($i=0;$i<1000;$i++){
            $candidate=$prefix.str_pad((string)($seq+$i),3,'0',STR_PAD_LEFT);
            if(!isset($existing[strtoupper($candidate)]))return $candidate;
        }
        return $prefix.strtoupper(substr(bin2hex(random_bytes(3)),0,5));
    }
    public static function summary(string $collection,array $record): array {
        $schema=self::module($collection);$summary=['id'=>$record['id'],'created_at'=>$record['created_at'],'updated_at'=>$record['updated_at']??'','deleted_at'=>$record['deleted_at']??null,'version'=>$record['version']??1];
        foreach($schema['fields'] as $key=>$field) {
            $value=$record[$key]??'';
            if($field['type']==='textarea')$value=mb_substr((string)$value,0,100);
            $summary[$key]=$value;
        }
        return $summary;
    }
}
