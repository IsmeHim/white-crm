'use strict';
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const money = n => new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:2}).format(Number(n || 0)/100);
  const num = n => new Intl.NumberFormat('th-TH').format(Number(n||0));
  const dateDisplay = d => {if(!d)return '—'; const v=String(d);return /^\d{4}-\d\d-\d\d/.test(v)?v.slice(0,10):v;};
  const thMonthNames=['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  function formatMonthYearLabel(key){
    const parts=String(key||'').split('-');
    const m=parseInt(parts[1]||'0',10);
    const y=parseInt(parts[0]||'0',10);
    const mName=thMonthNames[m]||parts[1]||'';
    const bYear=y>0?String(y+543).slice(2):'';
    return `${mName} '${bYear}`;
  }
  let currentChartMode = 'amount';
  function buildTrendChart(byMonthObj, byMonthCountsObj={}, emptyMsg='ยังไม่มีรายการบริจาคที่ยืนยัน', mode=currentChartMode){
    let months=Object.entries(byMonthObj||{});
    if(!months.length)return{html:`<div class="empty">${esc(emptyMsg)}</div>`,totalSatang:0,totalCount:0,count:0};
    const totalSatang=months.reduce((acc,[,v])=>acc+(Number(v)||0),0);
    const totalCount=Object.values(byMonthCountsObj||{}).reduce((acc,v)=>acc+(Number(v)||0),0);
    const topAmount=Math.max(1,...months.map(x=>Number(x[1])||0));
    const topCount=Math.max(1,...months.map(x=>Number(byMonthCountsObj[x[0]]||0)));
    const maxBarPx=130;
    const html=months.map(([key,val])=>{
      const amt=Number(val)||0;
      const cnt=Number(byMonthCountsObj[key]||0);
      const label=formatMonthYearLabel(key);
      const rawH=mode==='count' ? Math.round((cnt/topCount)*maxBarPx) : Math.round((amt/topAmount)*maxBarPx);
      const bHeight=Math.min(140,Math.max(12,rawH));
      const primaryText=mode==='count' ? `${num(cnt)} รายการ` : `฿${num(Math.round(amt/100))}`;
      const subText=mode==='count' ? `฿${num(Math.round(amt/100))}` : (cnt>0?`${num(cnt)} รายการ` : '');
      const pctAmt=totalSatang>0?Math.round((amt/totalSatang)*100):0;
      const pctCnt=totalCount>0?Math.round((cnt/totalCount)*100):0;
      return `<div class="bar-col" data-month="${esc(key)}" title="เดือน ${esc(label)} | ยอดเงิน: ${money(amt)} (${pctAmt}%) | จำนวน: ${num(cnt)} รายการ (${pctCnt}%)"><span class="bar-value">${esc(primaryText)}</span><span class="bar-sub">${esc(subText)}</span><div class="bar bar-h-${bHeight}"></div><span class="bar-label">${esc(label)}</span></div>`;
    }).join('');
    return{html,totalSatang,totalCount,count:months.length};
  }
  const icons = {dashboard:'◫',contacts:'♙',categories:'◇',campaigns:'▦',receivers:'☎',donations:'♥',hadeeya:'◈',stock_lots:'▤',inventory_moves:'⇄',delivery_companies:'▱',shipments:'▰',tasks:'☷',feedback:'☏',announcements:'◉',reports:'▥',users:'♟',audit:'◷',settings:'⚙'};
  const groups = [ ['ภาพรวม',['dashboard','reports']], ['จัดการ CRM',['contacts','campaigns','categories','donations','receivers']], ['คลังและจัดส่ง',['hadeeya','stock_lots','inventory_moves','shipments','delivery_companies']], ['ติดตามและสื่อสาร',['tasks','feedback','announcements']], ['ตั้งค่าระบบ',['users','audit','settings']] ];
  const state={modules:{},roles:{},user:null,module:'dashboard',page:1,q:'',status:'',dateFrom:'',dateTo:'',datePreset:'all',options:{},optionItems:{},table:null};
  const thaiProvinces=['กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พะเยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี'];
  function detectThaiProvince(text){
    if(!text)return '';
    if(/(กรุงเทพมหานคร|กรุงเทพฯ|กรุงเทพ|กทม\.?)/.test(text))return 'กรุงเทพมหานคร';
    for(const p of thaiProvinces){if(text.includes(p))return p;}
    if(text.includes('อยุธยา'))return 'พระนครศรีอยุธยา';
    if(text.includes('โคราช'))return 'นครราชสีมา';
    return '';
  }
  function formatThaiPhone(raw){
    const d=String(raw||'').replace(/\D+/g,'');
    if(d.length===10&&d.startsWith('0'))return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
    if(d.length===9&&d.startsWith('0'))return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5)}`;
    return raw;
  }
  const fmtIsoDate=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;};
  function computeDatePreset(preset){
    const now=new Date();const today=fmtIsoDate(now);
    if(preset==='today')return {from:today,to:today};
    if(preset==='7d'){const d=new Date(now);d.setDate(d.getDate()-6);return {from:fmtIsoDate(d),to:today};}
    if(preset==='month'){const d=new Date(now.getFullYear(),now.getMonth(),1);return {from:fmtIsoDate(d),to:today};}
    if(preset==='last_month'){const s=new Date(now.getFullYear(),now.getMonth()-1,1),e=new Date(now.getFullYear(),now.getMonth(),0);return {from:fmtIsoDate(s),to:fmtIsoDate(e)};}
    if(preset==='year'){const d=new Date(now.getFullYear(),0,1);return {from:fmtIsoDate(d),to:today};}
    return {from:'',to:''};
  }
  function renderDateFilterBar(){
    const presets=[['all','ทั้งหมด'],['today','วันนี้'],['7d','7 วันล่าสุด'],['month','เดือนนี้'],['last_month','เดือนที่แล้ว'],['year','ปีนี้']];
    return `<div class="date-filter-bar">
      <div class="date-presets">
        <span class="date-presets-label">📅 ช่วงวันที่:</span>
        ${presets.map(([k,lbl])=>`<button type="button" class="date-preset-btn ${state.datePreset===k?'active':''}" data-dpreset="${k}">${esc(lbl)}</button>`).join('')}
      </div>
      <div class="date-inputs">
        <label>ตั้งแต่ <input type="date" id="filter-date-from" value="${esc(state.dateFrom)}"></label>
        <label>ถึง <input type="date" id="filter-date-to" value="${esc(state.dateTo)}"></label>
        ${(state.dateFrom||state.dateTo)?`<button type="button" class="btn small ghost" id="clear-date-filter">✕ ล้างวันที่</button>`:''}
      </div>
    </div>`;
  }
  function wireDateFilterBar(){
    document.querySelectorAll('[data-dpreset]').forEach(b=>b.addEventListener('click',()=>{
      const p=b.dataset.dpreset;state.datePreset=p;
      const {from,to}=computeDatePreset(p);
      state.dateFrom=from;state.dateTo=to;state.page=1;render();
    }));
    $('#filter-date-from')?.addEventListener('change',e=>{state.dateFrom=e.target.value;state.datePreset='custom';state.page=1;render();});
    $('#filter-date-to')?.addEventListener('change',e=>{state.dateTo=e.target.value;state.datePreset='custom';state.page=1;render();});
    $('#clear-date-filter')?.addEventListener('click',()=>{state.dateFrom='';state.dateTo='';state.datePreset='all';state.page=1;render();});
  }
  const csrf=()=> $('meta[name="csrf-token"]')?.content || '';
  const api=async(action,params={},method='GET',body=null)=>{
    const url=new URL(location.pathname,location.href);url.searchParams.set('api',action);for(const[k,v]of Object.entries(params)){if(v!==undefined&&v!==null&&v!=='')url.searchParams.set(k,v);}
    const response=await fetch(url,{method,credentials:'same-origin',headers:{...(method!=='GET'?{'Content-Type':'application/json','X-CSRF-Token':csrf()}:{}),'Accept':'application/json'},body:body===null?null:JSON.stringify(body),cache:'no-store'});
    const data=await response.json().catch(()=>({error:`HTTP ${response.status}`}));
    if(!response.ok)throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  };
  const toast=(msg,error=false)=>{const root=$('#toast-root');if(!root){const el=$('#auth-message');if(el)el.textContent=msg;return;}const box=document.createElement('div');box.className='toast'+(error?' error':'');box.textContent=msg;root.append(box);setTimeout(()=>box.remove(),4300);};
  const formData=el=>Object.fromEntries(new FormData(el).entries());
  async function authForms(){
    const login=$('#login-form');if(login)login.addEventListener('submit',async e=>{e.preventDefault();const btn=$('button[type="submit"]',login);btn.disabled=true;try{await api('login',{},'POST',formData(login));location.reload();}catch(err){toast(err.message);}finally{btn.disabled=false;}});
    const setup=$('#setup-form');if(setup)setup.addEventListener('submit',async e=>{e.preventDefault();const btn=$('button[type="submit"]',setup);btn.disabled=true;try{await api('install',{},'POST',formData(setup));location.reload();}catch(err){toast(err.message);}finally{btn.disabled=false;}});
  }
  const roleAllows=(module,write=false)=>{
    const role=state.user?.role;if(role==='admin')return true;
    const allow={manager:['dashboard','reports','contacts','campaigns','categories','donations','receivers','hadeeya','stock_lots','inventory_moves','shipments','delivery_companies','tasks','feedback','announcements'],finance:['dashboard','reports','contacts','campaigns','donations','receivers'],callcenter:['dashboard','contacts','campaigns','donations','receivers','tasks','feedback'],warehouse:['dashboard','hadeeya','stock_lots','inventory_moves','shipments','delivery_companies','donations'],auditor:['dashboard','reports','contacts','campaigns','categories','donations','receivers','hadeeya','stock_lots','inventory_moves','shipments','delivery_companies','tasks','feedback','announcements','audit'],viewer:['dashboard','announcements']};
    if(module==='settings')return true;
    if(!allow[role]?.includes(module))return false;
    if(write&&['viewer','auditor'].includes(role))return false;
    return true;
  };
  const labelFor=m=>state.modules[m]?.label||({dashboard:'ภาพรวมระบบ',reports:'รายงานและสถิติ',users:'ผู้ใช้งานและสิทธิ์',audit:'ประวัติการทำงาน',settings:'ตั้งค่าส่วนตัว'}[m]||m);
  function makeNav(){
    $('#nav-main').innerHTML=groups.map(([name,items])=>`<div class="side-section" style="padding-top:16px">${esc(name)}</div>${items.filter(m=>roleAllows(m)).map(m=>`<a class="nav-link ${m===state.module?'active':''}" href="?module=${m}" data-nav="${m}"><span class="nav-icon">${icons[m]}</span>${esc(labelFor(m))}</a>`).join('')}`).join('');
    const mobile=['dashboard','contacts','donations','tasks','settings'].filter(m=>roleAllows(m));
    $('#mobile-nav').innerHTML=mobile.map(m=>`<button data-nav="${m}" class="${m===state.module?'active':''}"><span>${icons[m]}</span>${esc(m==='dashboard'?'หน้าแรก':m==='contacts'?'สมาชิก':m==='donations'?'บริจาค':m==='tasks'?'ติดตาม':'ตั้งค่า')}</button>`).join('');
    $('#crumb-current').textContent=labelFor(state.module);
    document.querySelectorAll('[data-nav]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault();navigate(n.dataset.nav);}));
  }
  const closeSidebar=()=>{$('#sidebar')?.classList.remove('show');$('#overlay')?.classList.remove('show');};
  const modal=(title,html,wide=false)=>{$('#modal-title').textContent=title;$('#modal-body').innerHTML=html;$('#modal-backdrop .modal')?.classList.toggle('wide',!!wide);$('#modal-backdrop').classList.remove('hidden');};
  const closeModal=()=>$('#modal-backdrop')?.classList.add('hidden');
  const header=(tag,title,description,actions='')=>`<div class="page-title"><div><div class="eyebrow">${esc(tag)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div><div class="title-actions">${actions}</div></div>`;
  const btn=(title,action,cls='')=>`<button class="btn ${cls}" data-action="${action}">${title}</button>`;
  function navigate(module,replace=false){
    if(!roleAllows(module)){toast('ไม่มีสิทธิ์เข้าถึงโมดูลนี้',true);return;}
    state.module=module;state.page=1;state.q='';state.status='';state.dateFrom='';state.dateTo='';state.datePreset='all';state.options={};closeSidebar();
    if(!replace)history.pushState({module},'',`?module=${encodeURIComponent(module)}`);makeNav();render();
  }
  async function render(){
    const main=$('#page-content');main.innerHTML='<div class="loading-state">กำลังโหลดข้อมูล…</div>';
    try{if(state.module==='dashboard')await dashboard();else if(state.module==='reports')await reports();else if(state.module==='users')await usersPage();else if(state.module==='audit')await auditPage();else if(state.module==='settings')await settingsPage();else if(state.modules[state.module])await recordsPage();else navigate('dashboard',true);}
    catch(err){main.innerHTML=`<div class="panel empty"><div class="empty-icon">⚠</div><h3>ไม่สามารถโหลดข้อมูล</h3><p>${esc(err.message)}</p><button class="btn" id="retry-page">ลองอีกครั้ง</button></div>`;$('#retry-page')?.addEventListener('click',render);}
  }
  async function dashboard(){
    const a=await api('summary');const c=a.counts;
    const stats=[['ผู้บริจาค / สมาชิก',num(c.contacts),'contacts','ข้อมูลสมาชิกทั้งหมด'],['ยอดบริจาคยืนยัน',money(a.confirmed_satang),'donations','ไม่นับรายการรอและยกเลิก'],['โครงการทั้งหมด',num(c.campaigns),'campaigns','จำนวนโครงการที่บันทึก'],['การจัดส่งทั้งหมด',num(c.shipments),'shipments','รายการจัดส่ง / คืน']];
    const trend=buildTrendChart(a.by_month, a.by_month_counts||{}, 'ยังไม่มีรายการบริจาคที่ยืนยัน', currentChartMode);
    let campaigns=Object.entries(a.by_campaign||{});const campaignNames=await optionNames('campaigns').catch(()=>({}));const max=Math.max(1,...campaigns.map(x=>x[1]));
    const campCounts=a.by_campaign_counts||{};
    $('#page-content').innerHTML=header('OVERVIEW / DASHBOARD','ภาพรวมระบบ','สรุปข้อมูลการดำเนินงานจากข้อมูลจริงในระบบ',btn('＋ เพิ่มรายการบริจาค','new-donation','primary'))+
      `<div class="stat-grid">${stats.map(([name,val,mod,sub])=>`<div class="stat-card"><div class="stat-top">${esc(name)}<span class="stat-icon">${icons[mod]}</span></div><div class="stat-num">${esc(val)}</div><div class="stat-sub">${esc(sub)}</div></div>`).join('')}</div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h3>แนวโน้มยอดบริจาค</h3><small>ยอดเงินรวม <strong>${money(trend.totalSatang)}</strong> · จำนวน <strong>${num(trend.totalCount)}</strong> รายการ</small></div><div class="chart-toggle-pill"><button type="button" class="chart-mode-btn ${currentChartMode==='amount'?'active':''}" data-chart-mode="amount" title="ดูกราฟเปรียบเทียบตามยอดเงิน (บาท)">฿ ยอดเงิน</button><button type="button" class="chart-mode-btn ${currentChartMode==='count'?'active':''}" data-chart-mode="count" title="ดูกราฟเปรียบเทียบตามจำนวนรายการบริจาค"># จำนวนรายการ</button></div></div><div class="bars" id="trend-bars">${trend.html}</div><div class="chart-spacer"></div></section><section class="panel"><div class="panel-head"><div><h3>ยอดบริจาคตามโครงการ</h3><small>เรียงตามยอดรวม</small></div></div><div class="stat-list">${campaigns.length?campaigns.map(([id,amount])=>{const cCnt=campCounts[id]||0; const cPct=a.confirmed_satang>0?Math.round((amount/a.confirmed_satang)*100):0; return `<div><div class="stat-list-row"><span>${esc(campaignNames[id]||id)}</span><strong>${money(amount)} <small class="campaign-count-badge">(${num(cCnt)} รายการ · ${cPct}%)</small></strong></div><div class="progress-line"><div class="w-pct-${Math.min(100,Math.max(0,Math.round(amount/max*100)))}"></div></div></div>`;}).join(''):'<div class="empty">ยังไม่มีข้อมูล</div>'}</div></section></div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>ภาพรวมการดำเนินงาน</h3></div><div class="stat-list">${[['รายการบริจาคทั้งหมด',num(c.donations)],['งานติดตาม',num(c.tasks)],['รายการฮาดียะห์',num(c.hadeeya)],['ล็อตสินค้า',num(c.stock_lots)],['ความคิดเห็น / ข้อเสนอแนะ',num(c.feedback)]].map(([k,v])=>`<div class="stat-list-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></section><section class="panel"><div class="panel-head"><h3>ประกาศล่าสุด</h3></div>${(a.announcements||[]).length?(a.announcements||[]).map(p=>`<div class="item-row"><span class="mini-dot"></span><div><div class="item-title">${esc(p.title)}</div><div class="item-small">${esc(dateDisplay(p.created_at))}</div></div></div>`).join(''):'<div class="empty">ยังไม่มีประกาศ</div>'}</section></div>`;
    document.querySelectorAll('[data-chart-mode]').forEach(btn => {
      btn.onclick = () => {
        currentChartMode = btn.dataset.chartMode;
        document.querySelectorAll('[data-chart-mode]').forEach(b => b.classList.toggle('active', b.dataset.chartMode === currentChartMode));
        const updated = buildTrendChart(a.by_month, a.by_month_counts||{}, 'ยังไม่มีรายการบริจาคที่ยืนยัน', currentChartMode);
        const barsEl = $('#trend-bars');
        if(barsEl) barsEl.innerHTML = updated.html;
      };
    });
    $('[data-action="new-donation"]')?.addEventListener('click',()=>{navigate('donations');setTimeout(()=>openForm('donations'),120);});
  }
  async function optionNames(module){
    if(state.options[module])return state.options[module];
    const result=await api('options',{module});const names={};const items={};
    for(const item of result.items||[]){names[item.id]=item.name;items[item.id]=item;}
    state.options[module]=names;state.optionItems[module]=items;return names;
  }
  function pillClass(value){
    const success=['active','confirmed','delivered','done','resolved','published','1'];
    const danger=['cancelled','closed','returned','urgent','0'];
    return success.includes(String(value))?'green':danger.includes(String(value))?'red':'yellow';
  }
  function humanValue(column,value,field,row=null,module=null,canWrite=false){
    if(value===null||value===undefined||value==='')return '<span class="cell-muted">—</span>';
    if(['proof_file_id','cover_file_id'].includes(column))return `<a class="btn small" href="?api=file&id=${encodeURIComponent(value)}" target="_blank" rel="noopener">⇩ ดาวน์โหลดไฟล์</a>`;
    if(column==='created_at'||column==='updated_at')return esc(dateDisplay(value));
    if(module==='tasks' && column==='due_date'){
      const dStr=dateDisplay(value);
      if(row && row.status!=='done' && /^\d{4}-\d\d-\d\d$/.test(dStr)){
        const today=fmtIsoDate(new Date());
        if(dStr<today){
          const diff=Math.max(1,Math.round((new Date(today)-new Date(dStr))/86400000));
          return `<span class="pill red" title="เลยกำหนดติดตามแล้ว">⚠️ เลยกำหนด (${num(diff)} วัน) · ${esc(dStr)}</span>`;
        }
        if(dStr===today)return `<span class="pill yellow" title="ต้องติดตามวันนี้">🔔 วันนี้ · ${esc(dStr)}</span>`;
      }
      return esc(dStr);
    }
    if(module==='stock_lots' && column==='quantity'){
      const q=Number(value||0);
      if(q<=0)return `<span class="pill red">⚠️ หมดสต็อก (0)</span>`;
      if(q<=5)return `<span class="pill yellow">⚡ ใกล้หมด (${num(q)} ชิ้น)</span>`;
      return `<span class="pill green">✓ ${num(q)} ชิ้น</span>`;
    }
    if(module==='shipments' && column==='tracking_no'){
      const courier=row?.delivery_company_id?state.optionItems?.delivery_companies?.[row.delivery_company_id]:null;
      const tpl=courier?.tracking_url||'';
      const url=tpl&&tpl.includes('{tracking}')?tpl.replace('{tracking}',encodeURIComponent(value)):`https://www.google.com/search?q=${encodeURIComponent(value)}`;
      return `<strong>${esc(value)}</strong> <a class="pill green" style="margin-left:5px;text-decoration:none" href="${esc(url)}" target="_blank" rel="noopener" title="คลิกเพื่อเช็กสถานะพัสดุ">↗ เช็กพัสดุ</a>`;
    }
    if(field?.type==='money')return `<strong>${money(value)}</strong>`;
    if(field?.type==='relation')return esc(state.options[field.module]?.[value]||String(value).slice(0,23));
    if(field?.type==='select'){
      let label=field.options?.[String(value)]||String(value);
      let cls=pillClass(value);
      if(canWrite && row && module && ['status','active','priority'].includes(column)){
        return `<select class="status-pill-select ${cls}" data-quick-module="${esc(module)}" data-quick-id="${esc(row.id)}" data-quick-field="${esc(column)}" title="คลิกเพื่อเปลี่ยนสถานะทันที">${Object.entries(field.options).map(([k,v])=>`<option value="${esc(k)}" ${String(value)===k?'selected':''}>${esc(v)}</option>`).join('')}</select>`;
      }
      return `<span class="pill ${cls}">${esc(label)}</span>`;
    }
    return esc(String(value).length>45?String(value).slice(0,45)+'…':value);
  }
  function quickActionBtn(m,row,canWrite){
    if(!canWrite)return '';
    if(m==='tasks' && row.status!=='done')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="done" title="ทำเครื่องหมายว่าเสร็จสิ้นทันที">✓ เสร็จสิ้น</button>`;
    if(m==='donations' && row.status==='pending')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="confirmed" title="ยืนยันยอดบริจาคทันที">✓ ยืนยันยอด</button>`;
    if(m==='shipments' && row.status==='preparing')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="shipped" title="เปลี่ยนเป็นจัดส่งแล้วทันที">🚚 ส่งแล้ว</button>`;
    if(m==='shipments' && row.status==='shipped')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="delivered" title="เปลี่ยนเป็นรับสำเร็จทันที">✓ รับสำเร็จ</button>`;
    if(m==='feedback' && row.status!=='resolved')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="resolved" title="เปลี่ยนเป็นแก้ไขแล้วทันที">✓ แก้ไขแล้ว</button>`;
    if(m==='announcements' && row.status==='draft')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="published" title="เผยแพร่ประกาศทันที">✦ เผยแพร่</button>`;
    return '';
  }
  async function updateQuickStatus(module,id,field,value,el=null){
    if(el)el.disabled=true;
    try{
      await api('quick-status',{},'POST',{module,id,field,value});
      if(module==='shipments')delete state.options.stock_lots;
      toast('อัปเดตสถานะเรียบร้อย');
      render();
    }catch(err){
      toast(err.message,true);
      render();
    }
  }
  async function recordsPage(){
    const m=state.module,schema=state.modules[m];
    const showDateFilter=['donations','shipments','inventory_moves','tasks','feedback'].includes(m);
    const r=await api('module',{
      module:m,q:state.q,page:state.page,limit:20,
      ...(state.status?{status:state.status}:{}),
      ...(showDateFilter&&state.dateFrom?{date_from:state.dateFrom}:{}),
      ...(showDateFilter&&state.dateTo?{date_to:state.dateTo}:{})
    });
    state.table=r;
    for(const f of Object.values(schema.fields))if(f.type==='relation'&&roleAllows(f.module))await optionNames(f.module).catch(()=>({}));
    const canWrite=roleAllows(m,true)&&!schema.readonly;
    const actions=canWrite?btn('＋ เพิ่มข้อมูล','new'):'';
    let filter='';if(schema.fields.status?.options)filter=`<select class="filter-select" id="status-filter" aria-label="กรองสถานะ"><option value="">ทุกสถานะ</option>${Object.entries(schema.fields.status.options).map(([k,v])=>`<option value="${esc(k)}" ${state.status===k?'selected':''}>${esc(v)}</option>`).join('')}</select>`;
    const columns=schema.columns||['id','created_at'];
    const donationSummaryStrip=(m==='donations')?`<div class="filter-summary-strip">
      <div><strong>📊 สรุปยอดบริจาคตามตัวกรองปัจจุบัน</strong> <span class="muted">(${state.dateFrom||state.dateTo?`วันที่ ${esc(state.dateFrom||'เริ่มต้น')} ถึง ${esc(state.dateTo||'ปัจจุบัน')}`:'ทุกช่วงเวลา'})</span></div>
      <div class="filter-summary-metrics">
        <span>จำนวนรายการ: <strong>${num(r.total)}</strong> รายการ</span>
        <span>ยอดที่ยืนยันแล้ว: <strong>${money(r.sum_confirmed_satang||0)}</strong></span>
        <span>ยอดรวมทั้งหมด (ไม่รวมยกเลิก): <strong>${money(r.sum_total_satang||0)}</strong></span>
      </div>
    </div>`:'';
    $('#page-content').innerHTML=header('MANAGEMENT / '+m.toUpperCase(),schema.label,'จัดการข้อมูลพร้อมระบบค้นหาและบันทึกประวัติการเปลี่ยนแปลง',actions)+
      (showDateFilter?renderDateFilterBar():'')+
      donationSummaryStrip+
      `<div class="toolbar"><div class="toolbar-left"><input id="search-records" class="search-input" type="search" value="${esc(state.q)}" placeholder="ค้นหาชื่อ รหัส หรือรายละเอียด…" aria-label="ค้นหา">${filter}</div>${roleAllows('reports')?btn('⇩ ส่งออก CSV','export'):''}</div><section class="panel table-panel"><div class="table-header"><div><h3>รายการทั้งหมด</h3><p>พบ ${num(r.total)} รายการ</p></div><span class="pill">หน้า ${num(r.page)} / ${num(r.pages)}</span></div><div class="table-wrap"><table><thead><tr>${columns.map(col=>`<th>${esc(schema.fields[col]?.label||({created_at:'วันที่สร้าง',updated_at:'อัปเดต'}[col]||col))}</th>`).join('')}<th>จัดการ</th></tr></thead><tbody>${r.items.length?r.items.map(row=>`<tr>${columns.map((col,i)=>`<td class="${i===0?'cell-primary':''}">${humanValue(col,row[col],schema.fields[col],row,m,canWrite)}</td>`).join('')}<td><div class="table-actions">${quickActionBtn(m,row,canWrite)}<button class="btn small" data-view="${esc(row.id)}">${m==='contacts'?'♙ ดูโปรไฟล์ 360°':'ดูข้อมูล'}</button>${canWrite?`<button class="btn small ghost" data-edit="${esc(row.id)}">แก้ไข</button>`:''}</div></td></tr>`).join(''):`<tr><td colspan="${columns.length+1}"><div class="empty"><div class="empty-icon">☷</div><h3>ไม่พบข้อมูล</h3><p>ลองค้นหาด้วยคำอื่น ปรับช่วงวันที่ หรือเพิ่มรายการใหม่</p></div></td></tr>`}</tbody></table></div><div class="table-footer"><span>${r.total?`แสดง ${(r.page-1)*20+1}–${Math.min(r.total,r.page*20)} จาก ${num(r.total)}`:'ไม่มีรายการ'}</span><div class="pagination"><button id="prev-page" class="btn small" ${r.page<=1?'disabled':''}>ก่อนหน้า</button><button id="next-page" class="btn small" ${r.page>=r.pages?'disabled':''}>ถัดไป</button></div></div></section>`;
    if(showDateFilter)wireDateFilterBar();
    $('[data-action="new"]')?.addEventListener('click',()=>openForm(m));
    $('[data-action="export"]')?.addEventListener('click',()=>{
      const u=new URL(location.pathname,location.href);
      u.searchParams.set('api','export');u.searchParams.set('module',m);
      if(state.q)u.searchParams.set('q',state.q);
      if(state.status)u.searchParams.set('status',state.status);
      if(showDateFilter&&state.dateFrom)u.searchParams.set('date_from',state.dateFrom);
      if(showDateFilter&&state.dateTo)u.searchParams.set('date_to',state.dateTo);
      location.href=u.toString();
    });
    $('#prev-page')?.addEventListener('click',()=>{state.page--;render();});$('#next-page')?.addEventListener('click',()=>{state.page++;render();});
    let debounce;$('#search-records')?.addEventListener('input',e=>{clearTimeout(debounce);const val=e.target.value;debounce=setTimeout(()=>{state.q=val;state.page=1;render();},370);});
    $('#status-filter')?.addEventListener('change',e=>{state.status=e.target.value;state.page=1;render();});
    document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>viewRecord(m,b.dataset.view)));
    document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openForm(m,b.dataset.edit)));
    document.querySelectorAll('[data-quick-id]').forEach(sel=>sel.addEventListener('change',e=>{
      updateQuickStatus(sel.dataset.quickModule,sel.dataset.quickId,sel.dataset.quickField,e.target.value,sel);
    }));
    document.querySelectorAll('[data-qact-id]').forEach(btn=>btn.addEventListener('click',()=>{
      updateQuickStatus(m,btn.dataset.qactId,'status',btn.dataset.qactVal,btn);
    }));
  }
  async function fieldHTML(k,field,value='',editing=false){
    const type=field.type;let input='';const id='f_'+k;const required=field.required?'required':'';
    const isReadonly=Boolean(field.readonly || (editing && field.readonly_on_edit));
    const ph=(editing && field.readonly_on_edit)?'แก้ไขยอดได้ที่ปุ่ม "ปรับสต็อก" ในตาราง':(field.placeholder||('กรอก'+field.label+'…'));
    let reqTag=field.required?`<span class="req-star" title="จำเป็นต้องกรอก">*</span>`:`<span class="opt-tag">(ไม่บังคับ)</span>`;
    if(field.auto_code)reqTag=`<span class="opt-tag" style="color:var(--accent-text);border-color:rgba(162,187,59,.4);background:rgba(162,187,59,.12)">(เว้นว่างเพื่อรันอัตโนมัติ)</span>`;
    else if(editing && field.readonly_on_edit)reqTag=`<span class="opt-tag">(ปรับยอดที่ปุ่ม ปรับสต็อก)</span>`;
    else if(field.readonly)reqTag=`<span class="opt-tag">(อัตโนมัติ)</span>`;

    if(type==='relation'){
      if(value&&!state.options[field.module]?.[value]&&roleAllows(field.module)){await optionNames(field.module).catch(()=>({}));}
      const known=state.options[field.module]?.[value] || (value?String(value):'');
      const canQuickAdd=(field.module==='contacts'&&roleAllows('contacts',true));
      const quickAddBtn=canQuickAdd?`<button type="button" class="btn small relation-quick-add-btn" data-target="${id}" data-rel="${esc(field.module)}" style="font-size:11px;padding:2px 8px;min-height:22px;margin-left:auto;font-weight:750;color:var(--accent-text);border-color:rgba(162,187,59,.4);background:rgba(162,187,59,.1)">＋ สร้างผู้บริจาคใหม่</button>`:'';
      input=`<div class="relation-picker">
        <span class="relation-icon" aria-hidden="true">⌕</span>
        <input type="hidden" id="${id}" name="${esc(k)}" value="${esc(value)}">
        <input class="relation-search" data-rel="${esc(field.module)}" data-target="${id}" autocomplete="off" placeholder="${esc(field.placeholder||'คลิกเพื่อเลือก หรือพิมพ์ชื่อ/รหัสเพื่อค้นหา…')}" value="${esc(known)}">
        <button type="button" class="relation-clear ${value?'':'hidden'}" title="ล้างค่าที่เลือก" aria-label="ล้างค่า">×</button>
        <div class="relation-results hidden"></div>
      </div>`;
      return `<label class="form-field" for="${id}"><div class="field-title" style="display:flex;align-items:center;justify-content:space-between;width:100%"><span style="display:inline-flex;align-items:center;gap:4px">${esc(field.label)} ${reqTag}</span>${quickAddBtn}</div>${input}</label>`;
    } else if(type==='select'){
      const selPh=field.placeholder||'— เลือกรายการ —';
      input=`<select id="${id}" name="${esc(k)}" ${required}><option value="">${esc(selPh)}</option>${Object.entries(field.options).map(([key,text])=>`<option value="${esc(key)}" ${String(value)===key?'selected':''}>${esc(text)}</option>`).join('')}</select>`;
    } else if(type==='textarea'){
      input=`<textarea id="${id}" name="${esc(k)}" placeholder="${esc(ph)}" ${required}>${esc(value)}</textarea>`;
    } else if(type==='money'){
      input=`<div class="money-input-wrap"><span class="money-prefix">฿</span><input id="${id}" name="${esc(k)}" type="number" step="0.01" min="0" placeholder="${esc(field.placeholder||'0.00')}" value="${value===''?'':esc((Number(value)/100).toFixed(2))}" ${required}></div>`;
    } else {
      input=`<input id="${id}" name="${esc(k)}" type="${type==='date'?'date':type==='email'?'email':type==='integer'?'number':'text'}" placeholder="${esc(ph)}" value="${esc(value)}" ${type==='integer'?'min="0"':''} ${required} ${isReadonly?'disabled':''}>`;
    }
    return `<label class="form-field ${type==='textarea'?'field-full':''}" for="${id}"><span class="field-title">${esc(field.label)} ${reqTag}</span>${input}</label>`;
  }
  function showInlineContactCreator(picker, target, input, initialText=''){
    const fieldWrap = picker.closest('.form-field') || picker.parentElement;
    let existingBox = fieldWrap.querySelector('.inline-contact-box');
    if(existingBox){
      existingBox.remove();
      return;
    }
    const isDigits = /^[\d\s+-]{6,}$/.test(initialText.trim());
    const defaultPhone = isDigits ? initialText.trim() : '';
    const defaultName = isDigits ? '' : initialText.trim();

    const boxHtml = `
      <div class="inline-contact-box" style="margin-top:10px;padding:12px 14px;background:var(--bg);border:1.5px solid var(--accent);border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.08);grid-column:1/-1">
        <div style="font-weight:800;font-size:12px;color:var(--accent-text);display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span>＋ ข้อมูลผู้บริจาคใหม่ (จะถูกบันทึกพร้อมกันเมื่อกด "บันทึกข้อมูล" ด้านล่าง)</span>
          <button type="button" class="btn small ghost" id="inline-con-close" style="padding:0 6px;min-height:20px;font-size:16px" title="ยกเลิกการสร้างผู้บริจาคใหม่">×</button>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:9px">
          <label class="form-field" style="margin:0"><span class="field-title">ชื่อ-นามสกุล / นามแฝง <span class="req-star">*</span></span><input id="quick-con-name" value="${esc(defaultName)}" placeholder="เช่น คุณสมชาย ใจดี" required autocomplete="off"></label>
          <label class="form-field" style="margin:0"><span class="field-title">เบอร์โทรศัพท์ <span class="req-star">*</span></span><input id="quick-con-phone" type="tel" value="${esc(defaultPhone)}" placeholder="เช่น 081-234-5678" required autocomplete="off"></label>
          <label class="form-field field-full" style="margin:0"><span class="field-title">ที่อยู่จัดส่งพัสดุ <span class="opt-tag">(เว้นว่างได้ เพื่อให้ Call Center โทรสอบถาม)</span></span><input id="quick-con-address" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ" autocomplete="off"></label>
          <label class="form-field field-full" style="margin:0"><span class="field-title">จังหวัด</span><input id="quick-con-province" placeholder="เช่น กรุงเทพฯ" autocomplete="off"></label>
        </div>
      </div>
    `;

    fieldWrap.insertAdjacentHTML('beforeend', boxHtml);
    const box = fieldWrap.querySelector('.inline-contact-box');

    const nameInput = box.querySelector('#quick-con-name');
    const phoneInput = box.querySelector('#quick-con-phone');
    const addrInput = box.querySelector('#quick-con-address');
    const provInput = box.querySelector('#quick-con-province');

    addrInput?.addEventListener('input', () => {
      const p = detectThaiProvince(addrInput.value);
      if(p && provInput && !provInput.value.trim()) provInput.value = p;
    });

    const closeBox = () => { box.remove(); input.focus(); };
    box.querySelector('#inline-con-close')?.addEventListener('click', closeBox);

    setTimeout(() => {
      if(!defaultName) nameInput.focus();
      else if(!defaultPhone) phoneInput.focus();
      else addrInput.focus();
    }, 50);
  }
  function wireRelationSearch(form){
    form.querySelectorAll('.relation-quick-add-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const target = form.querySelector('#' + btn.dataset.target);
        const searchInput = form.querySelector('.relation-search[data-target="' + btn.dataset.target + '"]');
        const picker = searchInput?.parentElement;
        if(picker && target && searchInput){
          showInlineContactCreator(picker, target, searchInput, searchInput.value.trim());
        }
      });
    });

    form.querySelectorAll('.relation-search').forEach(input=>{
      let t;const target=$('#'+input.dataset.target,form);
      const picker=input.parentElement;
      const results=picker.querySelector('.relation-results');
      const clearBtn=picker.querySelector('.relation-clear');
      const syncClear=()=>clearBtn?.classList.toggle('hidden',!target.value && !input.value);
      clearBtn?.addEventListener('click',e=>{
        e.preventDefault();e.stopPropagation();
        target.value='';input.value='';syncClear();input.focus();
      });
      results.addEventListener('mousedown',e=>e.preventDefault());
      const loadOptions=async(q)=>{
        try{
          const r=await api('options',{module:input.dataset.rel,q});
          const isContacts=(input.dataset.rel==='contacts');
          let createBtnHtml='';
          if(isContacts && roleAllows('contacts',true)){
            createBtnHtml=`<div style="padding:6px;border-top:1px dashed var(--line);background:rgba(162,187,59,.07)"><button type="button" class="btn small primary relation-inline-create-btn" style="width:100%;font-size:11.5px;font-weight:800;gap:5px;justify-content:center">＋ สร้างผู้บริจาคใหม่ทันที${q?` "${esc(q)}"`:''}</button></div>`;
          }
          results.innerHTML=(r.items.length?r.items.map(o=>`<button type="button" class="relation-option" data-id="${esc(o.id)}" data-name="${esc(o.name)}" data-hadeeya="${esc(o.hadeeya_id||'')}" data-shipnote="${esc(o.shipping_note||'')}"><span>${esc(o.name)}</span><small>${esc(o.id.slice(0,11))}</small></button>`).join(''):'<div class="relation-empty">ไม่พบข้อมูลที่ตรงกัน</div>')+createBtnHtml;
          results.classList.remove('hidden');

          results.querySelector('.relation-inline-create-btn')?.addEventListener('click',e=>{
            e.preventDefault();e.stopPropagation();
            results.classList.add('hidden');
            showInlineContactCreator(picker,target,input,q);
          });

          results.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',async()=>{
            target.value=btn.dataset.id;input.value=btn.dataset.name;results.classList.add('hidden');syncClear();
            if(input.dataset.rel==='donations' && btn.dataset.shipnote){
              const noteEl=$('#f_note',form);
              if(noteEl && !noteEl.value.trim()){
                noteEl.value=btn.dataset.shipnote;
              }
            }
            if(input.dataset.rel==='hadeeya'){
              const lotInput=$('#f_lot_id',form);
              if(lotInput && !lotInput.value){
                await optionNames('stock_lots').catch(()=>({}));
                const fifoLot=Object.values(state.optionItems.stock_lots||{}).find(l=>l.hadeeya_id===btn.dataset.id && Number(l.quantity||0)>0);
                if(fifoLot){
                  lotInput.value=fifoLot.id;
                  const lotSearch=lotInput.parentElement?.querySelector('.relation-search');
                  if(lotSearch)lotSearch.value=fifoLot.name;
                  lotInput.parentElement?.querySelector('.relation-clear')?.classList.remove('hidden');
                }
              }
            }
            if(input.dataset.rel==='stock_lots' && btn.dataset.hadeeya){
              const hInput=$('#f_hadeeya_id',form);
              if(hInput && !hInput.value){
                hInput.value=btn.dataset.hadeeya;
                const hSearch=hInput.parentElement?.querySelector('.relation-search');
                if(hSearch && state.options.hadeeya?.[btn.dataset.hadeeya]){
                  hSearch.value=state.options.hadeeya[btn.dataset.hadeeya];
                  hInput.parentElement?.querySelector('.relation-clear')?.classList.remove('hidden');
                }
              }
            }
          }));
        }catch(e){results.innerHTML='<div class="relation-empty">ค้นหาไม่ได้</div>';results.classList.remove('hidden');}
      };
      input.addEventListener('focus',()=>{loadOptions(input.value.trim().length>=2?input.value.trim():'');});
      input.addEventListener('input',()=>{
        target.value='';syncClear();clearTimeout(t);const q=input.value.trim();
        t=setTimeout(()=>loadOptions(q),220);
      });
      input.addEventListener('blur',()=>setTimeout(()=>results.classList.add('hidden'),220));
    });
  }
  async function openForm(module,id=null,prefill={}){
    const schema=state.modules[module];if(!roleAllows(module,true)||schema.readonly)return;
    try{
      const record=id?(await api('record',{module,id})).record:{...prefill};
      const today=fmtIsoDate(new Date());
      if(!id){
        if(module==='contacts')record.type??='donor';
        if(module==='categories')record.active??='1';
        if(module==='campaigns'){record.start_date??=today;record.status??='active';}
        if(module==='receivers'){record.kind??='callcenter';record.active??='1';}
        if(module==='donations'){record.donated_at??=today;record.status??='pending';record.channel??='bank';record.distribution_period??='once';}
        if(module==='hadeeya'){record.unit??='ชิ้น';record.active??='1';}
        if(module==='stock_lots')record.quantity??=1;
        if(module==='delivery_companies')record.active??='1';
        if(module==='shipments'){
          record.quantity??=1;record.status??='preparing';
          if(record.donation_id && !record.note){
            await optionNames('donations').catch(()=>({}));
            const donOpt=state.optionItems.donations?.[record.donation_id];
            if(donOpt?.shipping_note)record.note=donOpt.shipping_note;
          }
        }
        if(module==='tasks'){record.assigned_to??=state.user?.id||'';record.due_date??=today;record.priority??='normal';record.status??='open';}
        if(module==='feedback'){record.category??='suggestion';record.channel??='phone';record.status??='new';}
        if(module==='announcements')record.status??='published';
      }
      const fields=await Promise.all(Object.entries(schema.fields).map(([k,v])=>fieldHTML(k,v,record[k]??'',!!id)));
      const shipmentStockNote=module==='shipments'?`<div class="secondary-note" style="margin-top:16px"><strong>📦 ระบบอัตโนมัติสำหรับการจัดส่ง:</strong> เลือกฮาดียะห์แล้วระบบจะเลือกล็อตสต็อกที่มีของ (FIFO) ให้อัตโนมัติ · เลือกรายการบริจาคแล้วดึงที่อยู่ผู้รับให้อัตโนมัติ · พิมพ์เลขพัสดุแล้วปรับสถานะเป็น <em>จัดส่งแล้ว</em> พร้อมลงวันที่ส่งให้อัตโนมัติครับ</div>`:'';
      modal((id?'แก้ไข':'เพิ่ม')+' '+schema.label,`<form id="record-form"><div class="form-grid">${fields.join('')}</div>${shipmentStockNote}<div class="form-actions">${id&&roleAllows(module,true)&&state.user.role==='admin'?`<button type="button" class="btn danger" id="delete-record">ลบข้อมูล</button>`:''}<button type="button" class="btn" id="cancel-modal">ยกเลิก</button><button type="submit" class="btn primary">บันทึกข้อมูล</button></div></form>`);
      $('#cancel-modal').onclick=closeModal;
      const formEl=$('#record-form');
      wireRelationSearch(formEl);
      if(module==='contacts'){
        const addrEl=$('#f_address',formEl);
        const provEl=$('#f_province',formEl);
        const phoneEl=$('#f_phone',formEl);
        addrEl?.addEventListener('input',()=>{
          const detected=detectThaiProvince(addrEl.value);
          if(detected && provEl && !provEl.value.trim())provEl.value=detected;
        });
        let phoneWarn=$('#dup-phone-warn',formEl);
        if(phoneEl && !phoneWarn){
          phoneWarn=document.createElement('div');
          phoneWarn.id='dup-phone-warn';
          phoneWarn.className='secondary-note hidden';
          phoneWarn.style.marginTop='6px';
          phoneEl.parentElement.appendChild(phoneWarn);
        }
        let pTimer;
        phoneEl?.addEventListener('blur',()=>{phoneEl.value=formatThaiPhone(phoneEl.value);});
        phoneEl?.addEventListener('input',()=>{
          clearTimeout(pTimer);
          const digits=phoneEl.value.replace(/\D+/g,'');
          if(digits.length===10 && digits.startsWith('0'))phoneEl.value=formatThaiPhone(digits);
          if(digits.length<9){phoneWarn?.classList.add('hidden');return;}
          pTimer=setTimeout(async()=>{
            try{
              const r=await api('module',{module:'contacts',q:phoneEl.value,limit:5});
              const dup=(r.items||[]).find(c=>c.id!==id && String(c.phone||'').replace(/\D+/g,'')===digits);
              if(dup && phoneWarn){
                phoneWarn.innerHTML=`⚠️ เบอร์โทรนี้ตรงกับสมาชิกที่มีอยู่แล้ว: <strong>${esc(dup.name)}</strong> <button type="button" class="btn small" style="margin-left:8px" id="open-dup-contact">♙ เปิดดูโปรไฟล์</button>`;
                phoneWarn.classList.remove('hidden');
                $('#open-dup-contact',phoneWarn)?.addEventListener('click',()=>viewContactProfile(dup.id));
              } else phoneWarn?.classList.add('hidden');
            }catch(e){}
          },300);
        });
      }
      if(module==='shipments'){
        const trackEl=$('#f_tracking_no',formEl);
        const statusEl=$('#f_status',formEl);
        const sentEl=$('#f_sent_at',formEl);
        trackEl?.addEventListener('input',()=>{
          if(trackEl.value.trim()!==''){
            if(statusEl && statusEl.value==='preparing')statusEl.value='shipped';
            if(sentEl && !sentEl.value)sentEl.value=today;
          }
        });
      }
      formEl.onsubmit=async e=>{
        e.preventDefault();
        const data=formData(e.target);
        if(id)data.version=record.version;
        const submitBtn=formEl.querySelector('button[type="submit"]');
        try{
          const inlineConBox=formEl.querySelector('.inline-contact-box');
          if(inlineConBox && !data.contact_id){
            const cName=inlineConBox.querySelector('#quick-con-name')?.value.trim()||'';
            const cPhone=inlineConBox.querySelector('#quick-con-phone')?.value.trim()||'';
            const cAddr=inlineConBox.querySelector('#quick-con-address')?.value.trim()||'';
            const cProv=inlineConBox.querySelector('#quick-con-province')?.value.trim()||'';
            if(!cName){toast('กรุณาระบุชื่อผู้บริจาค',true);inlineConBox.querySelector('#quick-con-name')?.focus();return;}
            if(!cPhone||cPhone.replace(/\D+/g,'').length<9){toast('กรุณาระบุเบอร์โทรศัพท์อย่างน้อย 9-10 หลัก',true);inlineConBox.querySelector('#quick-con-phone')?.focus();return;}
            if(submitBtn)submitBtn.disabled=true;
            const conRes=await api('module',{module:'contacts'},'POST',{
              name:cName,
              phone:cPhone,
              address:cAddr,
              province:cProv||detectThaiProvince(cAddr)||'',
              type:'donor'
            });
            const newCon=conRes.record;
            state.options.contacts=state.options.contacts||{};
            state.options.contacts[newCon.id]=newCon.name;
            data.contact_id=newCon.id;
            const conTarget=formEl.querySelector('#f_contact_id');
            if(conTarget)conTarget.value=newCon.id;
            const conSearch=conTarget?.closest('.relation-picker')?.querySelector('.relation-search');
            if(conSearch)conSearch.value=newCon.name+(newCon.phone?' ('+newCon.phone+')':'');
            inlineConBox.remove();
          }
          if(submitBtn)submitBtn.disabled=true;
          await api(id?'record':'module',id?{module,id}:{module},id?'PUT':'POST',data);
          delete state.options[module];delete state.optionItems[module];
          if(module==='shipments'){delete state.options.stock_lots;delete state.optionItems.stock_lots;}
          closeModal();toast('บันทึกข้อมูลเรียบร้อย');render();
        }catch(error){
          if(submitBtn)submitBtn.disabled=false;
          toast(error.message,true);
        }
      };
      $('#delete-record')?.addEventListener('click',async()=>{if(!confirm('ยืนยันการลบรายการนี้? ระบบจะเก็บประวัติเพื่อการตรวจสอบ'))return;
        try{await api('record',{module,id},'DELETE',{version:record.version});closeModal();toast('ลบข้อมูลแล้ว');render();}catch(e){toast(e.message,true);}});
    }catch(e){toast(e.message,true);}
  }
  async function viewContactProfile(id){
    try{
      const p=await api('contact-profile',{id});
      const c=p.record,s=p.stats;
      const typeLabels={donor:'ผู้บริจาค',member:'สมาชิก',organization:'องค์กร'};
      const initials=(c.name||'ผ').trim().slice(0,1).toUpperCase();
      const canDonate=roleAllows('donations',true);
      const canTask=roleAllows('tasks',true);
      const canShip=roleAllows('shipments',true);
      const canEdit=roleAllows('contacts',true);
      const html=`
        <div class="donor-hero">
          <div class="donor-hero-left">
            <div class="donor-hero-avatar">${esc(initials)}</div>
            <div>
              <div class="donor-hero-title">
                <h3>${esc(c.name)}</h3>
                <span class="pill green">${esc(typeLabels[c.type]||c.type||'ผู้บริจาค')}</span>
                ${c.tags?c.tags.split(',').filter(Boolean).map(t=>`<span class="pill">${esc(t.trim())}</span>`).join(''):''}
              </div>
              <div class="donor-hero-meta">
                <span>☎ ${esc(c.phone||'ไม่ระบุเบอร์โทร')}</span>
                ${c.email?`<span>✉ ${esc(c.email)}</span>`:''}
                ${c.province?`<span>📍 ${esc(c.province)}</span>`:''}
                <span>รหัส: <code>${esc(c.id.slice(0,12))}</code></span>
              </div>
            </div>
          </div>
          <div class="donor-hero-actions">
            ${canDonate?`<button type="button" class="btn small primary" id="prof-add-donation">＋ เพิ่มรายการบริจาค</button>`:''}
            ${canTask?`<button type="button" class="btn small" id="prof-add-task">＋ งานติดตาม</button>`:''}
            ${canEdit?`<button type="button" class="btn small" id="prof-edit-contact">✎ แก้ไขข้อมูล</button>`:''}
          </div>
        </div>
        <div class="donor-kpi-grid">
          <div class="donor-kpi-card highlight">
            <div class="donor-kpi-label">ยอดบริจาคสะสม (Lifetime Value)</div>
            <div class="donor-kpi-val">${money(s.confirmed_satang)}</div>
            <div class="donor-kpi-sub">ยืนยันแล้ว ${num(s.confirmed_donations)} รายการ${s.pending_satang?` · รอตรวจ ${money(s.pending_satang)}`:''}</div>
          </div>
          <div class="donor-kpi-card">
            <div class="donor-kpi-label">วันที่บริจาคล่าสุด</div>
            <div class="donor-kpi-val">${esc(s.last_donated_at?dateDisplay(s.last_donated_at):'ยังไม่เคย')}</div>
            <div class="donor-kpi-sub">รวมทั้งหมด ${num(s.total_donations)} รายการ</div>
          </div>
          <div class="donor-kpi-card">
            <div class="donor-kpi-label">ฮาดียะห์ / การจัดส่ง</div>
            <div class="donor-kpi-val">${num(s.total_shipments)} <small style="font-size:13px;font-weight:600">ครั้ง</small></div>
            <div class="donor-kpi-sub">รับสำเร็จแล้ว ${num(s.delivered_shipments)} รายการ</div>
          </div>
          <div class="donor-kpi-card">
            <div class="donor-kpi-label">งานติดตาม Call Center</div>
            <div class="donor-kpi-val">${num(s.open_tasks)} <small style="font-size:13px;font-weight:600">งานค้าง</small></div>
            <div class="donor-kpi-sub">ทั้งหมด ${num(s.total_tasks)} งาน · ข้อเสนอแนะ ${num(s.total_feedback)}</div>
          </div>
        </div>
        <div class="donor-tabs">
          <button type="button" class="donor-tab active" data-ptab="donations">♥ ประวัติการบริจาค <span class="donor-tab-count">${num(p.donations.length)}</span></button>
          <button type="button" class="donor-tab" data-ptab="shipments">▰ ฮาดียะห์ & การจัดส่ง <span class="donor-tab-count">${num(p.shipments.length)}</span></button>
          <button type="button" class="donor-tab" data-ptab="tasks">☷ งานติดตาม & ข้อเสนอแนะ <span class="donor-tab-count">${num(p.tasks.length+p.feedback.length)}</span></button>
          <button type="button" class="donor-tab" data-ptab="info">♙ ข้อมูลที่อยู่ & หมายเหตุ</button>
        </div>
        <div id="prof-pane-donations" class="donor-tab-pane">
          ${p.donations.length?`<div class="timeline-list">${p.donations.map(d=>`<div class="timeline-card">
            <div class="timeline-card-main">
              <div class="timeline-card-title">
                <span>${esc(d.campaign_name)}</span>
                ${humanValue('status',d.status,state.modules.donations?.fields?.status)}
              </div>
              <div class="timeline-card-sub">
                <span>📅 วันที่บริจาค: ${esc(dateDisplay(d.donated_at||d.created_at))}</span>
                <span>ช่องทาง: ${esc({bank:'โอนเงิน',cash:'เงินสด',other:'อื่น ๆ'}[d.channel]||d.channel||'—')}</span>
                ${d.barcode?`<span>Barcode: ${esc(d.barcode)}</span>`:''}
                <span>ผู้รับแจ้ง: ${esc(d.receiver_name||'—')}</span>
              </div>
            </div>
            <div class="timeline-card-right">
              <strong style="font-size:16px">${money(d.amount_satang)}</strong>
              ${canShip?`<button type="button" class="btn small" data-ship-don="${esc(d.id)}" title="สร้างรายการจัดส่งฮาดียะห์สำหรับยอดบริจาคนี้">▰ จัดส่งฮาดียะห์</button>`:''}
              <button type="button" class="btn small ghost" data-view-don="${esc(d.id)}">เปิดดู</button>
            </div>
          </div>`).join('')}</div>`:`<div class="empty" style="padding:30px">ยังไม่มีประวัติการบริจาคสำหรับสมาชิกท่านนี้</div>`}
        </div>
        <div id="prof-pane-shipments" class="donor-tab-pane hidden">
          ${p.shipments.length?`<div class="timeline-list">${p.shipments.map(sh=>`<div class="timeline-card">
            <div class="timeline-card-main">
              <div class="timeline-card-title">
                <span>🎁 ${esc(sh.hadeeya_name)} (จำนวน ${num(sh.quantity||1)} ชิ้น)</span>
                ${humanValue('status',sh.status,state.modules.shipments?.fields?.status)}
              </div>
              <div class="timeline-card-sub">
                <span>ขนส่ง: ${esc(sh.courier_name||'—')}</span>
                <span>เลขพัสดุ: <strong>${esc(sh.tracking_no||'ยังไม่ระบุ')}</strong></span>
                <span>ล็อต: ${esc(sh.lot_code||'—')}</span>
                <span>วันที่ส่ง: ${esc(dateDisplay(sh.sent_at||sh.created_at))}</span>
              </div>
            </div>
            <div class="timeline-card-right">
              <button type="button" class="btn small ghost" data-view-ship="${esc(sh.id)}">เปิดดู</button>
            </div>
          </div>`).join('')}</div>`:`<div class="empty" style="padding:30px">ยังไม่มีประวัติการจัดส่งฮาดียะห์</div>`}
        </div>
        <div id="prof-pane-tasks" class="donor-tab-pane hidden">
          ${(p.tasks.length||p.feedback.length)?`<div class="timeline-list">
            ${p.tasks.map(tk=>`<div class="timeline-card">
              <div class="timeline-card-main">
                <div class="timeline-card-title"><span>☷ [งานติดตาม] ${esc(tk.title)}</span> ${humanValue('status',tk.status,state.modules.tasks?.fields?.status)}</div>
                <div class="timeline-card-sub"><span>กำหนดติดตาม: ${esc(dateDisplay(tk.due_date))}</span><span>ผู้รับผิดชอบ: ${esc(tk.assigned_name)}</span></div>
              </div>
              <div class="timeline-card-right"><button type="button" class="btn small ghost" data-view-task="${esc(tk.id)}">เปิดดู</button></div>
            </div>`).join('')}
            ${p.feedback.map(fb=>`<div class="timeline-card">
              <div class="timeline-card-main">
                <div class="timeline-card-title"><span>☏ [ข้อเสนอแนะ] ${esc(fb.topic)}</span> ${humanValue('status',fb.status,state.modules.feedback?.fields?.status)}</div>
                <div class="timeline-card-sub"><span>วันที่: ${esc(dateDisplay(fb.created_at))}</span></div>
              </div>
            </div>`).join('')}
          </div>`:`<div class="empty" style="padding:30px">ยังไม่มีงานติดตามหรือข้อเสนอแนะ</div>`}
        </div>
        <div id="prof-pane-info" class="donor-tab-pane hidden">
          <div class="detail-block"><div class="detail-label">ที่อยู่จัดส่ง</div><div class="detail-value">${esc(c.address||'—')}</div></div>
          <div class="detail-block"><div class="detail-label">จังหวัด</div><div class="detail-value">${esc(c.province||'—')}</div></div>
          <div class="detail-block"><div class="detail-label">บันทึกเพิ่มเติม</div><div class="detail-value">${esc(c.notes||'—')}</div></div>
          <div class="detail-block"><div class="detail-label">รหัสระบบเก่า (Legacy ID)</div><div class="detail-value">${esc(c.legacy_id||'—')}</div></div>
          <div class="detail-block"><div class="detail-label">วันที่สร้าง / อัปเดตล่าสุด</div><div class="detail-value">${esc(dateDisplay(c.created_at))} / ${esc(dateDisplay(c.updated_at))} (v${esc(c.version)})</div></div>
        </div>
      `;
      modal('โปรไฟล์ผู้บริจาค 360° • '+c.name, html, true);
      document.querySelectorAll('[data-ptab]').forEach(tab=>tab.addEventListener('click',()=>{
        document.querySelectorAll('[data-ptab]').forEach(t=>t.classList.toggle('active',t===tab));
        ['donations','shipments','tasks','info'].forEach(k=>$('#prof-pane-'+k)?.classList.toggle('hidden',k!==tab.dataset.ptab));
      }));
      $('#prof-add-donation')?.addEventListener('click',()=>openForm('donations',null,{contact_id:id}));
      $('#prof-add-task')?.addEventListener('click',()=>openForm('tasks',null,{contact_id:id}));
      $('#prof-edit-contact')?.addEventListener('click',()=>openForm('contacts',id));
      document.querySelectorAll('[data-ship-don]').forEach(b=>b.addEventListener('click',()=>openForm('shipments',null,{donation_id:b.dataset.shipDon})));
      document.querySelectorAll('[data-view-don]').forEach(b=>b.addEventListener('click',()=>viewRecord('donations',b.dataset.viewDon)));
      document.querySelectorAll('[data-view-ship]').forEach(b=>b.addEventListener('click',()=>viewRecord('shipments',b.dataset.viewShip)));
      document.querySelectorAll('[data-view-task]').forEach(b=>b.addEventListener('click',()=>viewRecord('tasks',b.dataset.viewTask)));
    }catch(e){toast(e.message,true);}
  }
  async function viewRecord(module,id){
    if(module==='contacts')return viewContactProfile(id);
    try{const r=(await api('record',{module,id})).record;const schema=state.modules[module];
      for(const f of Object.values(schema.fields))if(f.type==='relation'&&roleAllows(f.module))await optionNames(f.module).catch(()=>({}));
      let fields=Object.entries(schema.fields).map(([k,f])=>`<div class="detail-block"><div class="detail-label">${esc(f.label)}</div><div class="detail-value">${humanValue(k,r[k],f)}</div></div>`).join('');
      if(module==='shipments' && r.lot_id){
        const stBadge=r.stock_deducted?`<span class="pill green">✓ ตัดสต็อกจากล็อตอัตโนมัติแล้ว (${num(r.deducted_qty||r.quantity||1)} ชิ้น)</span>`:`<span class="pill yellow">↺ คืนสต็อกแล้ว / ยังไม่ตัดสต็อก</span>`;
        fields+=`<div class="detail-block"><div class="detail-label">สถานะการตัดสต็อกคลังสินค้า</div><div class="detail-value">${stBadge}</div></div>`;
      }
      modal('รายละเอียด • '+schema.label,fields+`<div class="detail-block"><div class="detail-label">รหัสระบบ / เวอร์ชัน</div><div class="detail-value">${esc(r.id)} / v${esc(r.version)}</div></div><div class="form-actions">${module==='contacts'?btn('♙ โปรไฟล์ 360°','profile',''):''}${module==='donations'&&roleAllows('shipments',true)?btn('▰ สร้างรายการจัดส่งฮาดียะห์','create-shipment','primary'):''}${module==='stock_lots'&&roleAllows('inventory_moves',true)?btn('⇄ ปรับสต็อก','movement','primary'):''}${['shipments','campaigns'].includes(module)&&roleAllows(module,true)?btn('⇧ แนบหลักฐาน / ภาพ','upload',''):''}${roleAllows(module,true)&&!schema.readonly?btn('แก้ไขรายการ','edit',''):''}</div>`);
      $('[data-action="edit"]')?.addEventListener('click',()=>openForm(module,id));
      $('[data-action="movement"]')?.addEventListener('click',()=>openMovement(id));
      $('[data-action="upload"]')?.addEventListener('click',()=>openUpload(module,id));
      $('[data-action="create-shipment"]')?.addEventListener('click',()=>openForm('shipments',null,{donation_id:id}));
    }catch(e){toast(e.message,true);}
  }
  function openUpload(module,id){
    modal('แนบไฟล์ / หลักฐาน',`<form id="upload-form" class="stack" style="display:grid;gap:16px"><label>เลือกไฟล์ PNG / JPG / WEBP / PDF ขนาดสูงสุด 10 MB<input type="file" name="file" accept="image/png,image/jpeg,image/webp,application/pdf" required></label><div class="secondary-note">ไฟล์ถูกเก็บนอกโฟลเดอร์ Public และเปิดผ่าน API ที่ตรวจสิทธิ์เท่านั้น</div><div class="form-actions"><button type="button" class="btn" id="cancel-modal">ยกเลิก</button><button type="submit" class="btn primary">อัปโหลด</button></div></form>`);
    $('#cancel-modal').onclick=closeModal;
    $('#upload-form').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.target);const url=new URL(location.pathname,location.href);url.searchParams.set('api','upload');url.searchParams.set('module',module);url.searchParams.set('id',id);
      try{const r=await fetch(url,{method:'POST',headers:{'X-CSRF-Token':csrf()},body:form,credentials:'same-origin'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Upload failed');closeModal();toast('อัปโหลดไฟล์สำเร็จ');render();}
      catch(err){toast(err.message,true);}
    };
  }
  async function openMovement(lotId=''){
    const r=await api('options',{module:'stock_lots'});modal('บันทึกเคลื่อนไหวสต็อก',`<form id="movement-form" class="stack"><div class="form-grid"><label class="form-field"><span class="field-title">ล็อตสินค้า <span class="req-star">*</span></span><select name="lot_id" required><option value="">— เลือกล็อตสินค้าฮาดียะห์ —</option>${r.items.map(x=>`<option value="${esc(x.id)}" ${lotId===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label class="form-field"><span class="field-title">ประเภทการเคลื่อนไหว <span class="req-star">*</span></span><select name="type"><option value="receive">รับเข้า (+)</option><option value="issue">จ่ายออก (-)</option><option value="adjust">ปรับยอดคงเหลือ (=)</option></select></label><label class="form-field"><span class="field-title">จำนวน (ชิ้น) <span class="req-star">*</span></span><input type="number" name="quantity" required min="0" step="1" value="1" placeholder="ระบุจำนวนชิ้น เช่น 10"></label><label class="form-field field-full"><span class="field-title">เหตุผล / เลขเอกสารอ้างอิง <span class="req-star">*</span></span><input name="reason" maxlength="1000" required placeholder="เช่น รับของเข้าจากโรงพิมพ์ล็อตใหม่ หรือ เบิกจัดส่งผู้บริจาค"></label></div><p class="secondary-note">การบันทึกจะเปลี่ยนยอดล็อตและสร้างประวัติแบบตรวจสอบย้อนหลังได้พร้อมกัน</p><div class="form-actions"><button class="btn" type="button" id="cancel-modal">ยกเลิก</button><button class="btn primary" type="submit">บันทึก</button></div></form>`);
    $('#cancel-modal').onclick=closeModal;$('#movement-form').onsubmit=async e=>{e.preventDefault();try{await api('inventory',{},'POST',formData(e.target));delete state.options.stock_lots;closeModal();toast('อัปเดตสต็อกสำเร็จ');render();}catch(err){toast(err.message,true);}};
  }
  async function reports(){
    const a=await api('summary',{...(state.dateFrom?{date_from:state.dateFrom}:{}),...(state.dateTo?{date_to:state.dateTo}:{})});
    const c=a.counts;
    const periodNote=(state.dateFrom||state.dateTo)?`ช่วงวันที่ ${state.dateFrom||'เริ่มต้น'} ถึง ${state.dateTo||'ปัจจุบัน'}`:'ข้อมูลสะสมทุกช่วงเวลา';
    const stats=[
      ['ยอดบริจาคยืนยันแล้ว',money(a.confirmed_satang),'donations',periodNote],
      ['ยอดบริจาครอตรวจสอบ',money(a.pending_satang||0),'donations','รายการสถานะรอตรวจสอบ'],
      ['จำนวนรายการบริจาค',num(a.period_donations_count??c.donations),'donations',periodNote],
      ['ผู้บริจาค / สมาชิกทั้งหมด',num(c.contacts),'contacts','ฐานข้อมูลสมาชิกในระบบ']
    ];
    const trend=buildTrendChart(a.by_month, a.by_month_counts||{}, 'ไม่มีรายการบริจาคที่ยืนยันในช่วงเวลานี้', currentChartMode);
    let campaigns=Object.entries(a.by_campaign||{});const campaignNames=await optionNames('campaigns').catch(()=>({}));const max=Math.max(1,...campaigns.map(x=>x[1]));
    const campCounts=a.by_campaign_counts||{};
    const box=$('#page-content');
    box.innerHTML=header('ANALYTICS / REPORTS','รายงานและสถิติ','วิเคราะห์ยอดบริจาคตามช่วงวันที่ โครงการ และส่งออกข้อมูล CSV',btn('＋ เพิ่มรายการบริจาค','new-donation','primary'))+
      renderDateFilterBar()+
      `<div class="stat-grid">${stats.map(([name,val,mod,sub])=>`<div class="stat-card"><div class="stat-top">${esc(name)}<span class="stat-icon">${icons[mod]}</span></div><div class="stat-num">${esc(val)}</div><div class="stat-sub">${esc(sub)}</div></div>`).join('')}</div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-head"><div><h3>แนวโน้มยอดบริจาค</h3><small>${esc(periodNote)} · ยอดเงินรวม <strong>${money(trend.totalSatang)}</strong> · จำนวน <strong>${num(trend.totalCount)}</strong> รายการ</small></div><div class="chart-toggle-pill"><button type="button" class="chart-mode-btn ${currentChartMode==='amount'?'active':''}" data-rep-chart-mode="amount" title="ดูกราฟเปรียบเทียบตามยอดเงิน (บาท)">฿ ยอดเงิน</button><button type="button" class="chart-mode-btn ${currentChartMode==='count'?'active':''}" data-rep-chart-mode="count" title="ดูกราฟเปรียบเทียบตามจำนวนรายการบริจาค"># จำนวนรายการ</button></div></div><div class="bars" id="rep-trend-bars">${trend.html}</div><div class="chart-spacer"></div></section><section class="panel"><div class="panel-head"><div><h3>ยอดบริจาคแยกตามโครงการ</h3><small>${esc(periodNote)}</small></div></div><div class="stat-list">${campaigns.length?campaigns.map(([id,amount])=>{const cCnt=campCounts[id]||0; const cPct=a.confirmed_satang>0?Math.round((amount/a.confirmed_satang)*100):0; return `<div><div class="stat-list-row"><span>${esc(campaignNames[id]||id)}</span><strong>${money(amount)} <small class="campaign-count-badge">(${num(cCnt)} รายการ · ${cPct}%)</small></strong></div><div class="progress-line"><div class="w-pct-${Math.min(100,Math.max(0,Math.round(amount/max*100)))}"></div></div></div>`;}).join(''):'<div class="empty">ไม่มีข้อมูลในช่วงเวลานี้</div>'}</div></section></div>
      <section class="panel"><h3>⇩ ส่งออกข้อมูลรายงาน (CSV สำหรับ Excel)</h3><p class="muted">คลิกเพื่อดาวน์โหลดไฟล์ CSV (${esc(periodNote)})</p><div class="quick-actions">${['donations','contacts','campaigns','hadeeya','stock_lots','shipments'].filter(roleAllows).map(m=>btn('⇩ ส่งออก '+labelFor(m),'export-'+m)).join('')}</div></section>`;
    box.querySelectorAll('[data-rep-chart-mode]').forEach(btn => {
      btn.onclick = () => {
        currentChartMode = btn.dataset.repChartMode;
        box.querySelectorAll('[data-rep-chart-mode]').forEach(b => b.classList.toggle('active', b.dataset.repChartMode === currentChartMode));
        const updated = buildTrendChart(a.by_month, a.by_month_counts||{}, 'ไม่มีรายการบริจาคที่ยืนยันในช่วงเวลานี้', currentChartMode);
        const barsEl = $('#rep-trend-bars');
        if(barsEl) barsEl.innerHTML = updated.html;
      };
    });
    wireDateFilterBar();
    box.querySelectorAll('[data-action^="export-"]').forEach(b=>b.onclick=()=>{
      const mod=b.dataset.action.replace('export-','');
      const u=new URL(location.pathname,location.href);
      u.searchParams.set('api','export');u.searchParams.set('module',mod);
      if(state.dateFrom)u.searchParams.set('date_from',state.dateFrom);
      if(state.dateTo)u.searchParams.set('date_to',state.dateTo);
      location.href=u.toString();
    });
    box.querySelector('[data-action="new-donation"]')?.addEventListener('click',()=>{navigate('donations');setTimeout(()=>openForm('donations'),100);});
  }
  async function usersPage(){const r=await api('users');
    $('#page-content').innerHTML=header('ADMINISTRATION / ACCESS','ผู้ใช้งานและสิทธิ์','จัดการบัญชีผู้ใช้และบทบาทสำหรับแต่ละฝ่าย',btn('＋ เพิ่มผู้ใช้','add-user','primary'))+`<div class="panel"><div class="panel-head"><h3>บัญชีผู้ใช้งาน (${num(r.total)})</h3></div>${r.items.map(u=>`<div class="role-table"><div><strong>${esc(u.name)}</strong><div class="item-small">${esc(u.username)} · ${esc(state.roles[u.role]||u.role)}</div></div><span class="pill ${u.active?'green':'red'}">${u.active?'ใช้งาน':'ปิดใช้งาน'}</span><button class="btn small" data-user="${esc(u.id)}">แก้ไข</button></div>`).join('')}</div>`;
    $('[data-action="add-user"]').onclick=()=>userForm();document.querySelectorAll('[data-user]').forEach(el=>el.onclick=()=>userForm(r.items.find(x=>x.id===el.dataset.user)));
  }
  function userForm(user=null){const roles=Object.entries(state.roles);modal(user?'แก้ไขผู้ใช้':'เพิ่มผู้ใช้',`<form id="user-form"><div class="form-grid"><label class="form-field"><span class="field-title">ชื่อที่ใช้แสดง <span class="req-star">*</span></span><input name="name" value="${esc(user?.name||'')}" placeholder="เช่น อาหมัด (ฝ่ายการเงิน)" required></label><label class="form-field"><span class="field-title">ชื่อผู้ใช้ (Username) <span class="req-star">*</span></span><input name="username" value="${esc(user?.username||'')}" placeholder="เช่น ahmad.fin (a-z, 0-9, ., _, -)" required pattern="[a-zA-Z0-9._-]{3,40}"></label><label class="form-field"><span class="field-title">บทบาท / สิทธิ์การใช้งาน <span class="req-star">*</span></span><select name="role">${roles.map(([k,v])=>`<option value="${esc(k)}" ${user?.role===k?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label class="form-field"><span class="field-title">สถานะบัญชี <span class="req-star">*</span></span><select name="active"><option value="1" ${user?.active!==false?'selected':''}>เปิดใช้งาน</option><option value="0" ${user?.active===false?'selected':''}>ปิดใช้งาน</option></select></label><label class="form-field field-full"><span class="field-title">${user?'กำหนดรหัสผ่านใหม่':'รหัสผ่านเริ่มต้น'} ${user?'<span class="opt-tag">(เว้นว่างถ้าไม่เปลี่ยน)</span>':'<span class="req-star">*</span>'}</span><input name="password" type="password" minlength="12" placeholder="${user?'เว้นว่างไว้หากต้องการใช้รหัสผ่านเดิม':'ตั้งรหัสผ่านอย่างน้อย 12 ตัวอักษร'}" ${user?'':'required'} autocomplete="new-password"></label></div><div class="form-actions"><button class="btn" type="button" id="cancel-modal">ยกเลิก</button><button class="btn primary" type="submit">บันทึกผู้ใช้</button></div></form>`);
    $('#cancel-modal').onclick=closeModal;$('#user-form').onsubmit=async e=>{e.preventDefault();const d=formData(e.target);d.active=d.active==='1';if(user){d.id=user.id;d.version=user.version;}
      try{await api('users',{},user?'PUT':'POST',d);closeModal();toast('บันทึกบัญชีเรียบร้อย');render();}catch(err){toast(err.message,true);}};
  }
  async function auditPage(){
    const r=await api('audit',{page:state.page});
    const isEnabled = r.enabled !== false;
    const statusBadge = isEnabled
      ? `<span class="top-badge" style="background:rgba(162,187,59,.15);color:var(--accent-text);padding:6px 12px;border-radius:20px;font-size:11.5px;font-weight:750;display:inline-flex;align-items:center;gap:6px"><i style="width:7px;height:7px;background:#89ba32;border-radius:50%;display:inline-block"></i> กำลังบันทึกประวัติ</span>`
      : `<span class="top-badge" style="background:rgba(239,107,99,.18);color:#ef6b63;border:1px solid rgba(239,107,99,.35);padding:6px 12px;border-radius:20px;font-size:11.5px;font-weight:750;display:inline-flex;align-items:center;gap:6px"><i style="width:7px;height:7px;background:#ef6b63;border-radius:50%;display:inline-block"></i> ปิดบันทึกชั่วคราว</span>`;
    
    const iconPause = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`;
    const iconPlay = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
    const iconTrash = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
    const iconPauseCircle = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef6b63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>`;

    const toggleBtn = isEnabled
      ? `<button type="button" class="btn small" id="toggle-audit-btn" style="border-color:rgba(239,107,99,.5);color:#ef6b63;font-weight:750" title="ปิดการบันทึกประวัติการทำงานเพื่อประหยัดพื้นที่ระหว่างพัฒนา">${iconPause} ปิดเก็บประวัติ (โหมดพัฒนา)</button>`
      : `<button type="button" class="btn small primary" id="toggle-audit-btn" style="font-weight:750" title="เปิดใช้งานการบันทึกประวัติการทำงาน">${iconPlay} เปิดเก็บประวัติ</button>`;

    const clearBtn = `<button type="button" class="btn small danger" id="clear-audit-btn" style="font-weight:750" title="ล้างประวัติการทำงานทั้งหมดและคืนพื้นที่ฐานข้อมูล (VACUUM)">${iconTrash} ล้างประวัติทั้งหมด</button>`;

    const actions = `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${statusBadge} ${toggleBtn} ${clearBtn}</div>`;

    let bannerNotice = '';
    if (!isEnabled) {
      bannerNotice = `<div style="margin-bottom:18px;padding:14px 18px;border-radius:12px;background:rgba(239,107,99,.12);border:1px solid rgba(239,107,99,.35);display:flex;align-items:center;gap:12px">
        <span style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">${iconPauseCircle}</span>
        <div>
          <div style="font-weight:800;color:var(--text)">ระบบอยู่ในโหมดพัฒนา: ปิดการบันทึกประวัติการทำงานชั่วคราว</div>
          <div class="muted mini" style="margin-top:2px">คุณยังสามารถเพิ่ม แก้ไข และบันทึกข้อมูลในฟอร์มต่างๆ ได้ตามปกติ — ระบบแค่ไม่บันทึก Log ประวัติการทำงานย้อนหลังเพื่อประหยัดพื้นที่ SQLite</div>
        </div>
      </div>`;
    }

    const rows = (r.items && r.items.length)
      ? r.items.map(a=>`<tr><td>${esc(a.created_at)}</td><td>${esc(a.actor_name)}</td><td>${esc(a.module)}</td><td><span class="pill">${esc(a.action)}</span></td><td class="cell-muted">${esc(a.record_id)}</td></tr>`).join('')
      : `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--muted)">ยังไม่มีรายการประวัติการทำงาน (หรือประวัติถูกล้างแล้ว)</td></tr>`;

    $('#page-content').innerHTML = header('AUDIT / HISTORY','ประวัติการทำงาน','บันทึกการเปลี่ยนแปลงข้อมูลย้อนหลัง', actions) +
      bannerNotice +
      `<section class="panel table-panel">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>เวลา UTC</th><th>ผู้ทำรายการ</th><th>โมดูล</th><th>กิจกรรม</th><th>อ้างอิง</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="table-footer">
          <span>${num(r.total)} รายการ</span>
          <div class="pagination">
            <button class="btn small" id="prev-page" ${r.page===1?'disabled':''}>ก่อน</button>
            <button class="btn small" id="next-page" ${r.page===r.pages||!r.pages?'disabled':''}>ถัดไป</button>
          </div>
        </div>
      </section>`;

    $('#prev-page').onclick=()=>{state.page--;render();};
    $('#next-page').onclick=()=>{state.page++;render();};

    const handleToggle = async () => {
      try {
        const res = await api('audit', {}, 'POST', { action: 'toggle', enabled: !isEnabled });
        toast(res.message || 'อัปเดตสถานะสำเร็จ');
        render();
      } catch(err) {
        toast(err.message, true);
      }
    };
    $('#toggle-audit-btn')?.addEventListener('click', handleToggle);

    $('#clear-audit-btn')?.addEventListener('click', async () => {
      if (!confirm('ยืนยันล้างประวัติการทำงานทั้งหมดในระบบเพื่อประหยัดพื้นที่ใช่หรือไม่?\n\n(ระบบจะลบข้อมูลล็อกทั้งหมดและรัน VACUUM คืนพื้นที่ฐานข้อมูล SQLite ทันที)')) return;
      try {
        const res = await api('audit', {}, 'POST', { action: 'clear' });
        toast(res.message || 'ล้างประวัติและคืนพื้นที่เรียบร้อย');
        state.page = 1;
        render();
      } catch(err) {
        toast(err.message, true);
      }
    });
  }
  const aiModelList = [
    ['gemini-3.5-flash-lite', 'gemini-3.5-flash-lite · ตัวหลัก (ฟรีวันละ 500 ครั้ง · เร็ว ฉลาดพอดี)'],
    ['gemini-3.1-flash-lite', 'gemini-3.1-flash-lite · สำรอง 1 (ฟรีอีก 500 ครั้ง/วัน · รวมเป็น 1,000)'],
    ['gemini-3.6-flash',      'gemini-3.6-flash · สำรอง 2 (ตัวท็อป กรณี Lite ใช้งานไม่ได้)'],
    ['gemini-2.5-flash',      'gemini-2.5-flash · สำรอง 3 (รวดเร็ว แม่นยำ)'],
    ['gemini-2.5-flash-lite', 'gemini-2.5-flash-lite · สำรอง 4 (ประหยัดโควต้า ตอบไวมาก)'],
    ['gemini-2.0-flash',      'gemini-2.0-flash · สำรอง 5 (เสถียรสูง)']
  ];
  function renderQuotaCard(usage, activeModel){
    const cur = usage?.all?.[activeModel] || usage?.active || {model:activeModel,rpm_used:0,rpm_limit:15,rpm_remaining:15,tpm_used:0,tpm_limit:250000,rpd_used:0,rpd_limit:500,rpd_remaining:500,d_tokens:0};
    const rpdPct = Math.min(100, Math.round((cur.rpd_used / Math.max(1, cur.rpd_limit)) * 100));
    const rpmPct = Math.min(100, Math.round((cur.rpm_used / Math.max(1, cur.rpm_limit)) * 100));
    const tpmPct = Math.min(100, Math.round((cur.tpm_used / Math.max(1, cur.tpm_limit)) * 100));
    const allRows = Object.values(usage?.all || {}).map(m => {
      const pct = Math.min(100, Math.round((m.rpd_used / Math.max(1, m.rpd_limit)) * 100));
      return `<div class="quota-row ${m.model===activeModel?'active':''}" data-qmodel="${esc(m.model)}">
        <div class="quota-model"><strong>${esc(m.model)}</strong>${m.model===activeModel?' <span class="pill green" style="font-size:9px;padding:2px 6px">กำลังใช้งาน</span>':''}</div>
        <div class="quota-metric"><span>RPM</span><strong>${num(m.rpm_used)} / ${num(m.rpm_limit)}</strong></div>
        <div class="quota-metric"><span>TPM</span><strong>${num(m.tpm_used)} / ${num(Math.round(m.tpm_limit/1000))}K</strong></div>
        <div class="quota-metric"><span>RPD (รายวัน)</span><strong>${num(m.rpd_used)} / ${num(m.rpd_limit)}</strong> <small class="muted">(เหลือ ${num(m.rpd_remaining)})</small></div>
        <div class="quota-bar"><div style="width:${pct}%"></div></div>
      </div>`;
    }).join('');
    return `<div class="quota-panel" id="ai-quota-box">
      <div class="quota-head">
        <div>
          <strong>📊 สถานะโควต้าฟรี (Rate Limit & Quota Tracker) · โมเดล <code>${esc(cur.model)}</code></strong>
          <div class="item-small">นับจำนวนการเรียกใช้งานจริงจากระบบนี้เทียบเพดานโควต้าฟรีของ Google AI Studio (อัปเดตอัตโนมัติทุกครั้งที่ค้นหา)</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center">
          <a class="btn small" href="https://aistudio.google.com/rate-limit" target="_blank" rel="noopener">↗ เปิดดูใน Google AI Studio</a>
          <button type="button" class="btn small ghost" id="reset-ai-usage" title="รีเซ็ตตัวนับในระบบ">↺ รีเซ็ตตัวนับ</button>
        </div>
      </div>
      <div class="quota-grid">
        <div class="quota-card">
          <div class="quota-card-top"><span>โควต้าต่อวัน (RPD)</span><span class="pill ${rpdPct>=90?'red':rpdPct>=70?'yellow':'green'}">คงเหลือ ${num(cur.rpd_remaining)} ครั้ง</span></div>
          <div class="quota-num">${num(cur.rpd_used)} <small>/ ${num(cur.rpd_limit)} ครั้ง</small></div>
          <div class="progress-line"><div class="w-pct-${Math.min(100,Math.max(0,Math.round(rpdPct)))}"></div></div>
        </div>
        <div class="quota-card">
          <div class="quota-card-top"><span>โควต้าต่อนาที (RPM)</span><span class="pill">คงเหลือ ${num(cur.rpm_remaining)}/นาที</span></div>
          <div class="quota-num">${num(cur.rpm_used)} <small>/ ${num(cur.rpm_limit)} ครั้ง</small></div>
          <div class="progress-line"><div class="w-pct-${Math.min(100,Math.max(0,Math.round(rpmPct)))}"></div></div>
        </div>
        <div class="quota-card">
          <div class="quota-card-top"><span>โทเคนต่อนาที (TPM)</span><span class="pill">วันนี้ใช้ ${num(cur.d_tokens)} tokens</span></div>
          <div class="quota-num">${num(cur.tpm_used)} <small>/ ${num(Math.round(cur.tpm_limit/1000))}K</small></div>
          <div class="progress-line"><div class="w-pct-${Math.min(100,Math.max(0,Math.round(tpmPct)))}"></div></div>
        </div>
      </div>
      <details class="quota-details">
        <summary>ดูโควต้าของโมเดลสำรองทั้งหมดในระบบ (6 โมเดล)</summary>
        <div class="quota-table">${allRows}</div>
      </details>
    </div>`;
  }
  async function settingsPage(){
    let t=localStorage.getItem('crm-theme')||'premium';
    const isAdmin=state.user?.role==='admin';
    let aiCfg={enabled:false,has_key:false,masked_key:'',model:'gemini-3.5-flash-lite',auto_fallback:true,usage:{},can_edit:isAdmin};
    let dbInfo=null;
    try{aiCfg=await api('ai-config');}catch(e){}
    if(isAdmin){try{dbInfo=await api('db-info');}catch(e){}}
    const fmtKB=b=>b>=1048576?(b/1048576).toFixed(2)+' MB':Math.max(1,Math.round((b||0)/1024))+' KB';
    $('#page-content').innerHTML=header('PREFERENCES / SETTINGS','ตั้งค่าระบบส่วนตัว','เปลี่ยนธีม รหัสผ่าน สำรองฐานข้อมูล และตั้งค่า Gemini AI ช่วยค้นหา')+
      `<div class="dashboard-grid">
        <section class="panel"><h3>ธีมสีแอปพลิเคชัน</h3><p class="muted">ระบบรองรับธีมดั้งเดิม Modern Navy และ Dark Mode</p><div class="form-grid"><button type="button" class="btn ${t==='premium'?'primary':''}" data-theme="premium">◉ Premium Navy + Olive</button><button type="button" class="btn ${t==='classic'?'primary':''}" data-theme="classic">◉ Classic Green + White</button><button type="button" class="btn ${t==='dark'?'primary':''}" data-theme="dark">◉ Dark Professional</button></div></section>
        <section class="panel"><h3>เปลี่ยนรหัสผ่าน</h3><div id="password-form" class="stack" style="display:grid;gap:14px"><label class="form-field"><span class="field-title">รหัสผ่านปัจจุบัน <span class="req-star">*</span></span><input name="current_password" type="password" placeholder="กรอกรหัสผ่านที่ใช้งานอยู่ในปัจจุบัน…" autocomplete="current-password"></label><label class="form-field"><span class="field-title">รหัสผ่านใหม่ (12 ตัวขึ้นไป) <span class="req-star">*</span></span><input name="new_password" type="password" minlength="12" placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร…" autocomplete="new-password"></label><div class="form-actions" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><small class="muted">🔒 รหัสผ่านต้องมีความยาว 12 ตัวขึ้นไป</small><button type="button" id="save-password-btn" class="btn primary" style="font-weight:800;padding:0 18px">✓ บันทึกรหัสผ่านใหม่</button></div></div></section>
      </div>
      <section class="panel" style="margin-bottom:18px">
        <div class="panel-head"><div><h3>✦ ตั้งค่า Gemini AI ช่วยค้นหาอัจฉริยะ</h3><small>ช่วยให้พิมพ์ค้นหาหรือสั่งเปิดหน้าต่างๆ ได้แม่นยำแม้พิมพ์สะกดผิด หรือพิมพ์คำใกล้เคียง</small></div><span id="ai-status-pill" class="pill ${aiCfg.enabled&&aiCfg.has_key?'green':'yellow'}">${aiCfg.enabled&&aiCfg.has_key?'✦ เปิดใช้งาน AI แล้ว':'ยังไม่ได้ตั้งค่า API Key'}</span></div>
        ${aiCfg.can_edit?`<div id="ai-config-form" class="stack" style="display:grid;gap:18px">
          <div class="form-grid">
            <div>
              <div class="field-label-row" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px">
                <label for="ai-key-input" style="margin:0">Gemini API Key</label>
                <div style="display:flex;align-items:center;gap:6px">
                  <div id="ai-key-badge" class="key-badge ${aiCfg.has_key?'saved':'empty'}">
                    <span class="key-badge-dot"></span>
                    <span class="key-badge-title">${aiCfg.has_key?'คีย์ปัจจุบัน:':'สถานะ:'}</span>
                    <code id="ai-masked-label">${aiCfg.has_key?esc(aiCfg.masked_key):'ยังไม่ได้ตั้งค่า'}</code>
                  </div>
                  ${aiCfg.has_key?`<button type="button" class="btn small danger clear-ai-key-btn" title="ลบ API Key ปัจจุบันออกจากระบบ" style="padding:2px 8px;min-height:24px;font-size:11px;font-weight:750">🗑️ ลบ Key ปัจจุบัน</button>`:''}
                </div>
              </div>
              <input id="ai-key-input" name="api_key" type="text" placeholder="${aiCfg.has_key?'เว้นว่างไว้หากไม่ต้องการเปลี่ยนคีย์เดิม':'วาง API Key ที่นี่ (เช่น AIzaSy...)'}" autocomplete="off" spellcheck="false">
            </div>
            <div>
              <label for="ai-model-select" style="margin-bottom:6px">รุ่นโมเดลหลัก (Gemini Model)</label>
              <select id="ai-model-select" name="model">
                ${aiModelList.map(([val,label])=>`<option value="${esc(val)}" ${aiCfg.model===val?'selected':''}>${esc(label)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="ai-options-box">
            <label class="check-row"><input id="ai-enabled-check" type="checkbox" name="enabled" value="1" ${aiCfg.enabled||!aiCfg.has_key?'checked':''}> <span>เปิดใช้งานระบบ AI ช่วยค้นหาและแก้คำผิดอัตโนมัติบนแถบค้นหาด้านบน</span></label>
            <label class="check-row"><input id="ai-fallback-check" type="checkbox" name="auto_fallback" value="1" ${aiCfg.auto_fallback!==false?'checked':''}> <span>สลับไปใช้โมเดลสำรองอัตโนมัติ (Auto-Fallback) เมื่อโควต้าโมเดลหลักเต็ม</span></label>
          </div>
          <div id="ai-quota-wrap">${renderQuotaCard(aiCfg.usage, aiCfg.model)}</div>
          <div class="secondary-note" style="margin-bottom:12px"><strong>หมายเหตุเรื่องการดึงโควต้าจาก Google AI Studio:</strong> Google ไม่ได้เปิด Public API ให้ดึงหน้าตาราง Rate Limit โดยตรงด้วย API Key ธรรมดา แต่จะส่ง <code>usageMetadata (จำนวน Tokens)</code> กลับมาทุกครั้งที่เรียกใช้งาน ระบบนี้จึงทำหน้าที่<strong>นับและคำนวณโควต้าที่ใช้ไป/คงเหลือ (RPD, RPM, TPM) ของแต่ละโมเดลให้อัตโนมัติ</strong>ตามเกณฑ์ของ Google AI Studio ครับ</div>
          <div class="form-actions" style="margin-top:10px">${aiCfg.has_key?`<button type="button" class="btn danger" id="clear-ai-key">ลบ API Key</button>`:''}<button type="button" id="save-ai-btn" class="btn primary">✦ บันทึกตั้งค่า Gemini AI</button></div>
        </div>`:`<p class="muted">เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถแก้ไข Gemini API Key ได้</p><div id="ai-quota-wrap">${renderQuotaCard(aiCfg.usage, aiCfg.model)}</div>`}
      </section>
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>🗄️ สำรองและจัดการฐานข้อมูล (Database Backup & Maintenance)</h3>
            <small>White Channel CRM V2.0 · PHP 8.4+ · SQLite3 Database (WAL Mode) · <code>storage/crm.sqlite</code></small>
          </div>
          <span class="pill green">SQLite ${esc(dbInfo?.sqlite_version||'3.x')}</span>
        </div>
        ${isAdmin && dbInfo ? `
          <div class="db-backup-grid">
            <div class="db-stat-box"><span>ขนาดฐานข้อมูล SQLite</span><strong id="db-size-label">${esc(fmtKB(dbInfo.db_bytes))}</strong></div>
            <div class="db-stat-box"><span>ข้อมูลในระบบทั้งหมด</span><strong>${num(dbInfo.total_records)} รายการ</strong></div>
            <div class="db-stat-box"><span>ไฟล์แนบในระบบ (Uploads)</span><strong>${num(dbInfo.uploads_count)} ไฟล์ (${esc(fmtKB(dbInfo.uploads_bytes))})</strong></div>
            <div class="db-stat-box"><span>สำรองข้อมูลผ่านเว็บล่าสุด</span><strong>${esc(dbInfo.last_backup_at?dateDisplay(dbInfo.last_backup_at):'ยังไม่เคย')}</strong></div>
          </div>
          <div class="db-actions-row">
            <button type="button" class="btn primary" id="btn-backup-sqlite">⇩ ดาวน์โหลดฐานข้อมูล (.sqlite)</button>
            <button type="button" class="btn" id="btn-backup-full">⇩ ดาวน์โหลดชุดข้อมูลเต็ม + ไฟล์แนบ (.tar)</button>
            <button type="button" class="btn ghost" id="btn-optimize-db">⚡ จัดระเบียบและบีบอัดฐานข้อมูล (VACUUM)</button>
          </div>
        ` : `<p class="secondary-note">ฐานข้อมูลเก็บอยู่ที่ <code>storage/crm.sqlite</code> เฉพาะผู้ดูแลระบบ (Admin) สามารถดาวน์โหลดไฟล์สำรองฐานข้อมูลผ่านหน้าเว็บได้โดยตรง</p>`}
      </section>`;
    $('#btn-backup-sqlite')?.addEventListener('click',()=>{
      toast('กำลังสร้างสแนปช็อตฐานข้อมูล SQLite สำหรับดาวน์โหลด…');
      location.href=`?api=backup-download&format=sqlite&_csrf=${encodeURIComponent(csrf())}`;
    });
    $('#btn-backup-full')?.addEventListener('click',()=>{
      toast('กำลังรวบรวมฐานข้อมูลและไฟล์แนบทั้งหมด…');
      location.href=`?api=backup-download&format=archive&_csrf=${encodeURIComponent(csrf())}`;
    });
    $('#btn-optimize-db')?.addEventListener('click',async e=>{
      const btn=e.currentTarget;btn.disabled=true;
      try{
        const res=await api('db-optimize',{},'POST',{});
        const lbl=$('#db-size-label');if(lbl)lbl.textContent=fmtKB(res.db_bytes);
        toast(`จัดระเบียบข้อมูล ${num(res.rebuilt_records)} รายการ และบีบอัดฐานข้อมูลเรียบร้อย`);
      }catch(err){toast(err.message,true);}
      finally{btn.disabled=false;}
    });
    document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{
      setTheme(b.dataset.theme);
      document.querySelectorAll('[data-theme]').forEach(btn=>btn.classList.toggle('primary',btn.dataset.theme===b.dataset.theme));
    });
    $('#save-password-btn')?.addEventListener('click',async()=>{
      const box=$('#password-form');
      const current_password=box.querySelector('[name="current_password"]').value;
      const new_password=box.querySelector('[name="new_password"]').value;
      try{await api('change-password',{},'POST',{current_password,new_password});box.querySelector('[name="current_password"]').value='';box.querySelector('[name="new_password"]').value='';toast('เปลี่ยนรหัสผ่านแล้ว');}catch(err){toast(err.message,true);}
    });
    const wireQuotaReset=()=>{
      $('#reset-ai-usage')?.addEventListener('click',async()=>{
        if(!confirm('รีเซ็ตตัวนับสถิติโควต้าในระบบเป็น 0 หรือไม่?'))return;
        try{const res=await api('ai-config',{},'POST',{reset_usage:true});$('#ai-quota-wrap').innerHTML=renderQuotaCard(res.usage,$('#ai-model-select')?.value||aiCfg.model);wireQuotaReset();toast('รีเซ็ตตัวนับโควต้าแล้ว');}catch(err){toast(err.message,true);}
      });
    };
    wireQuotaReset();
    $('#ai-model-select')?.addEventListener('change',e=>{
      aiCfg.model=e.target.value;
      const wrap=$('#ai-quota-wrap');
      if(wrap){wrap.innerHTML=renderQuotaCard(aiCfg.usage,aiCfg.model);wireQuotaReset();}
    });
    $('#save-ai-btn')?.addEventListener('click',async e=>{
      const btn=e.currentTarget;btn.disabled=true;
      const d={
        api_key:$('#ai-key-input')?.value||'',
        model:$('#ai-model-select')?.value||'gemini-3.5-flash-lite',
        enabled:!!$('#ai-enabled-check')?.checked,
        auto_fallback:!!$('#ai-fallback-check')?.checked
      };
      try{
        const res=await api('ai-config',{},'POST',d);
        aiCfg.usage=res.usage;aiCfg.model=res.model;
        toast('บันทึกการตั้งค่า Gemini AI เรียบร้อย');
        const pill=$('#ai-status-pill');
        if(pill){pill.className='pill '+(res.enabled&&res.has_key?'green':'yellow');pill.textContent=res.enabled&&res.has_key?'✦ เปิดใช้งาน AI แล้ว':'ยังไม่ได้ตั้งค่า API Key';}
        const keyBadge=$('#ai-key-badge');
        if(keyBadge){
          keyBadge.className='key-badge '+(res.has_key?'saved':'empty');
          const title=keyBadge.querySelector('.key-badge-title');
          if(title)title.textContent=res.has_key?'คีย์ปัจจุบัน:':'สถานะ:';
        }
        const maskedLbl=$('#ai-masked-label');
        if(maskedLbl)maskedLbl.textContent=res.has_key?res.masked_key:'ยังไม่ได้ตั้งค่า';
        const keyInput=$('#ai-key-input');
        if(keyInput){keyInput.value='';keyInput.placeholder=res.has_key?'เว้นว่างไว้หากไม่ต้องการเปลี่ยนคีย์เดิม':'วาง API Key ที่นี่ (เช่น AIzaSy...)';}
        const wrap=$('#ai-quota-wrap');
        if(wrap){wrap.innerHTML=renderQuotaCard(res.usage,res.model);wireQuotaReset();}
      }catch(err){toast(err.message,true);}
      finally{btn.disabled=false;}
    });
    const handleClearKey = async () => {
      if(!confirm('ยืนยันการลบ API Key ปัจจุบันออกจากระบบหรือไม่?')) return;
      try{await api('ai-config',{},'POST',{clear_key:true,enabled:false});toast('ลบ API Key เรียบร้อยแล้ว');render();}catch(err){toast(err.message,true);}
    };
    $('#clear-ai-key')?.addEventListener('click', handleClearKey);
    document.querySelectorAll('.clear-ai-key-btn').forEach(btn => btn.addEventListener('click', handleClearKey));
  }
  async function openAiConfigModal(){
    let aiCfg={enabled:false,has_key:false,masked_key:'',model:'gemini-3.5-flash-lite',auto_fallback:true,usage:{},can_edit:state.user?.role==='admin'};
    try{aiCfg=await api('ai-config');}catch(e){}
    if(!aiCfg.can_edit){navigate('settings');return;}
    const curUsage = aiCfg.usage?.all?.[aiCfg.model] || aiCfg.usage?.active;
    modal('✦ ตั้งค่า Gemini AI ช่วยค้นหาอัจฉริยะ',`<div id="modal-ai-form" class="stack" style="display:grid;gap:18px">
      <div class="ai-box"><div class="ai-box-head"><span>✦ AI Smart Search & Navigation</span><span>${aiCfg.enabled&&aiCfg.has_key?'เปิดใช้งานแล้ว':'ยังไม่ตั้งค่า'}</span></div><div class="ai-box-text">เมื่อเปิดใช้งาน ระบบจะใช้ Gemini ช่วยเดาคำค้นหาที่พิมพ์ผิด (เช่น พิมพ์ "บริจาก", "สมาชิค", "ส่งของ") แล้วพาไปยังหน้าที่ถูกต้องหรือเปิดข้อมูลให้ทันที${curUsage?`<br><strong style="color:var(--accent-text)">📊 โควต้าวันนี้ (${esc(aiCfg.model)}): ใช้ไป ${num(curUsage.rpd_used)} / ${num(curUsage.rpd_limit)} ครั้ง (คงเหลือ ${num(curUsage.rpd_remaining)} ครั้ง)</strong>`:''}</div></div>
      <div>
        <div class="field-label-row" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
          <label for="m-ai-key" style="margin:0">Gemini API Key</label>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="key-badge ${aiCfg.has_key?'saved':'empty'}">
              <span class="key-badge-dot"></span>
              <span>${aiCfg.has_key?'คีย์ปัจจุบัน:':'สถานะ:'}</span>
              <code>${aiCfg.has_key?esc(aiCfg.masked_key):'ยังไม่ได้ตั้งค่า'}</code>
            </div>
            ${aiCfg.has_key?`<button type="button" class="btn small danger" id="m-clear-ai-key" style="padding:1px 8px;min-height:24px;font-size:11px;font-weight:750">🗑️ ลบ Key ปัจจุบัน</button>`:''}
          </div>
        </div>
        <input id="m-ai-key" name="api_key" type="text" placeholder="${aiCfg.has_key?'เว้นว่างไว้หากไม่ต้องการเปลี่ยนคีย์':'วาง API Key ที่นี่ (เช่น AIzaSy...)'}" autocomplete="off" spellcheck="false">
      </div>
      <div>
        <label for="m-ai-model" style="margin-bottom:6px">รุ่นโมเดลหลัก (Gemini Model)</label>
        <select id="m-ai-model" name="model">
          ${aiModelList.map(([val,label])=>`<option value="${esc(val)}" ${aiCfg.model===val?'selected':''}>${esc(label)}</option>`).join('')}
        </select>
      </div>
      <div class="ai-options-box" style="margin:4px 0 0">
        <label class="check-row"><input id="m-ai-enabled" type="checkbox" name="enabled" value="1" ${aiCfg.enabled||!aiCfg.has_key?'checked':''}> <span>เปิดใช้งาน AI ช่วยค้นหาบนแถบค้นหาด้านบน</span></label>
        <label class="check-row"><input id="m-ai-fallback" type="checkbox" name="auto_fallback" value="1" ${aiCfg.auto_fallback!==false?'checked':''}> <span>สลับโมเดลสำรองอัตโนมัติ (Auto-Fallback)</span></label>
      </div>
      <div class="form-actions" style="margin-top:10px"><button type="button" class="btn" id="cancel-modal">ยกเลิก</button><button type="button" id="m-save-ai" class="btn primary">✦ บันทึก API Key</button></div>
    </div>`);
    $('#cancel-modal').onclick=closeModal;
    $('#m-clear-ai-key')?.addEventListener('click', async () => {
      if(!confirm('ยืนยันการลบ API Key ปัจจุบันออกจากระบบหรือไม่?')) return;
      try {
        await api('ai-config', {}, 'POST', {clear_key: true, enabled: false});
        closeModal();
        toast('ลบ API Key เรียบร้อยแล้ว');
        if(state.module === 'settings') render();
      } catch(err) {
        toast(err.message, true);
      }
    });
    $('#m-save-ai').onclick=async()=>{
      const d={
        api_key:$('#m-ai-key')?.value||'',
        model:$('#m-ai-model')?.value||'gemini-3.5-flash-lite',
        enabled:!!$('#m-ai-enabled')?.checked,
        auto_fallback:!!$('#m-ai-fallback')?.checked
      };
      try{await api('ai-config',{},'POST',d);closeModal();toast('บันทึก Gemini API Key เรียบร้อย! ลองพิมพ์ค้นหาได้เลย');if(state.module==='settings')render();}catch(err){toast(err.message,true);}
    };
  }
  function setTheme(theme){const t=['premium','classic','dark'].includes(theme)?theme:'premium';localStorage.setItem('crm-theme',t);document.documentElement.dataset.theme=t;const labelEl=$('#profile-theme-label');if(labelEl){const names={premium:'Premium Navy',classic:'Classic Green',dark:'Dark Professional'};labelEl.textContent=(names[t]||t)+' (เปิดอยู่)';}}
  function wireGlobalSearch(){
    const input=$('#global-search'),box=$('#global-search-results'),aiBtn=$('#ai-search-btn');if(!input||!box)return;
    let timer,aiTimer;
    const hide=()=>box.classList.add('hidden');
    const localFuzzyModules=q=>{
      const norm=q.toLowerCase().trim();if(!norm)return[];
      const aliases={
        dashboard:['แดชบอร์ด','หน้าแรก','ภาพรวม','สรุป','home','dash','main'],
        reports:['รายงาน','สถิติ','ส่งออก','กราฟ','excel','csv','export','report'],
        contacts:['สมาชิก','ผู้บริจาค','ลูกค้า','คนบริจาค','รายชื่อ','เบอร์โทร','สมาชิค','ผู้บริจาก','contact','donor','member'],
        campaigns:['โครงการ','แคมเปญ','โปรเจค','โปรเจกต์','campaign','project'],
        categories:['หมวดหมู่','ประเภทโครงการ','หมวด','category'],
        donations:['บริจาค','รายการบริจาค','ยอดบริจาค','โอนเงิน','แจ้งโอน','ใบเสร็จ','บริจาก','ทำบุญ','donation','donate'],
        receivers:['ผู้รับแจ้งยอด','ช่องทาง','รับแจ้ง','receiver','channel'],
        hadeeya:['ฮาดียะห์','ฮาดียะ','ของที่ระลึก','ของขวัญ','ของแถม','สินค้า','hadeeya','gift'],
        stock_lots:['ล็อต','คลังสินค้า','สต็อก','สต๊อก','เช็คสต็อก','คลัง','stock','lot','warehouse'],
        inventory_moves:['เคลื่อนไหวสต็อก','ประวัติสต็อก','รับเข้า','จ่ายออก','ปรับสต็อก','inventory','move'],
        shipments:['จัดส่ง','ส่งของ','พัสดุ','เลขพัสดุ','รับคืน','ตีกลับ','ส่งพัสดุ','shipment','tracking','delivery'],
        delivery_companies:['บริษัทขนส่ง','ขนส่ง','ไปรษณีย์','แฟลช','เคอรี่','ขนส่งเอกชน','courier'],
        tasks:['งานติดตาม','ติดตาม','คอลเซ็นเตอร์','โทรติดตาม','งาน','callcenter','call center','task','follow'],
        feedback:['ความคิดเห็น','ข้อเสนอแนะ','ร้องเรียน','ติชม','คอมเมนต์','feedback','comment'],
        announcements:['ประกาศ','ข่าวสาร','แจ้งเตือน','announcement','news'],
        users:['ผู้ใช้งาน','ผู้ใช้','สิทธิ์','แอดมิน','พนักงาน','จัดการผู้ใช้','user','admin','role'],
        audit:['ประวัติการทำงาน','ประวัติ','ล็อก','ตรวจสอบ','audit','log','history'],
        settings:['ตั้งค่า','เปลี่ยนรหัส','รหัสผ่าน','เปลี่ยนสี','ธีม','ตั้งค่าส่วนตัว','ai','gemini','api key','setting','theme','password']
      };
      const editDist=(a,b)=>{
        const m=a.length,n=b.length;if(!m)return n;if(!n)return m;
        const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
        for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;
        for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
        return dp[m][n];
      };
      const scored=[];
      for(const [mod,words] of Object.entries(aliases)){
        if(mod!=='settings'&&!roleAllows(mod))continue;
        const label=labelFor(mod).toLowerCase();
        let best=99;
        if(label.includes(norm)||mod.includes(norm))best=0;
        for(const w of words){
          if(w.includes(norm)||norm.includes(w)){best=Math.min(best,0.5);continue;}
          const d=editDist(norm,w);
          const maxLen=Math.max(norm.length,w.length);
          if(maxLen>=3 && d<=Math.ceil(maxLen*0.38))best=Math.min(best,d);
        }
        if(best<=3)scored.push({module:mod,label:labelFor(mod),score:best});
      }
      scored.sort((a,b)=>a.score-b.score);
      return scored.slice(0,3);
    };
    const wireResultClicks=container=>{
      container.querySelectorAll('[data-qnav]').forEach(b=>b.addEventListener('click',()=>{
        const mod=b.dataset.qnav,act=b.dataset.qact||'navigate',kw=b.dataset.qkw||'';
        hide();input.value='';
        if(state.module!==mod)navigate(mod);
        if(act==='create')setTimeout(()=>openForm(mod),120);
        else if(kw&&state.modules[mod]){state.q=kw;state.page=1;render();}
      }));
      container.querySelectorAll('[data-sid]').forEach(b=>b.addEventListener('click',()=>{
        const mod=b.dataset.smod,id=b.dataset.sid;hide();
        if(state.module!==mod)navigate(mod);
        setTimeout(()=>viewRecord(mod,id),80);
      }));
      container.querySelector('#trigger-ai-search')?.addEventListener('click',e=>{
        e.stopPropagation();const q=input.value.trim();if(q)runAiSearch(q);else openAiConfigModal();
      });
      container.querySelector('#open-ai-config')?.addEventListener('click',e=>{
        e.stopPropagation();hide();openAiConfigModal();
      });
    };
    const renderQuickNav=()=>{
      const quick=['contacts','donations','campaigns','shipments','tasks','hadeeya'].filter(m=>roleAllows(m));
      box.innerHTML=`<div class="top-search-head"><span>ทางลัดไปยังโมดูล</span><button type="button" class="btn small ghost" id="open-ai-config" style="padding:2px 7px;min-height:22px;font-size:10px;color:var(--accent-text)">⚙ ตั้งค่า AI</button></div>`+quick.map(m=>`<button type="button" class="top-search-item" data-qnav="${esc(m)}"><span class="top-search-item-icon">${icons[m]||'•'}</span><div class="top-search-item-body"><div class="top-search-item-title">${esc(labelFor(m))}</div><div class="top-search-item-sub">เปิดหน้าจัดการ${esc(labelFor(m))}</div></div><span class="top-search-item-badge">โมดูล</span></button>`).join('');
      box.classList.remove('hidden');
      wireResultClicks(box);
    };
    const applyModuleRedirect=(top,explanation='')=>{
      hide();input.value='';input.blur();
      const targetMod=top.module;
      state.module=targetMod;
      state.page=1;
      state.q=(top.action==='filter'&&top.filter_keyword)?top.filter_keyword:'';
      state.status=top.status_filter||'';
      if(top.date_preset){
        const r=computeDatePreset(top.date_preset);
        state.datePreset=top.date_preset;state.dateFrom=r.from;state.dateTo=r.to;
      } else {
        state.datePreset='all';state.dateFrom='';state.dateTo='';
      }
      const u=new URL(location.href);u.searchParams.set('module',targetMod);history.pushState({},'',u);
      makeNav();closeSidebar();render();
      if(top.action==='create')setTimeout(()=>openForm(targetMod),140);
      toast(`✦ AI พาไปหน้า "${top.label}"${explanation?' · '+explanation:''}`);
    };
    const runAiSearch=async(q,autoNavigate=true)=>{
      let aiZone=$('#ai-search-zone',box);
      if(!aiZone){
        box.insertAdjacentHTML('afterbegin',`<div id="ai-search-zone"></div>`);
        aiZone=$('#ai-search-zone',box);
      }
      aiZone.innerHTML=`<div class="ai-box"><div class="ai-box-head"><span>✦ AI กำลังวิเคราะห์คำสั่งของคุณ…</span></div><div class="ai-box-text muted">กำลังวิเคราะห์ "${esc(q)}" เพื่อพาไปยังหน้าที่ต้องการทันที…</div></div>`;
      box.classList.remove('hidden');
      try{
        const ai=await api('ai-search',{},'POST',{q});
        if(autoNavigate){
          if(ai.primary_intent==='record' && ai.matched_records?.length){
            const rec=ai.matched_records[0];
            hide();input.value='';input.blur();
            if(state.module!==rec.module)navigate(rec.module);
            setTimeout(()=>viewRecord(rec.module,rec.id),100);
            toast(`✦ AI เปิดข้อมูล "${rec.title}" (${rec.module_label})`);
            return;
          }
          if(ai.recommended_modules?.length){
            applyModuleRedirect(ai.recommended_modules[0],ai.explanation||ai.corrected_query||q);
            return;
          }
          if(ai.matched_records?.length){
            const rec=ai.matched_records[0];
            hide();input.value='';input.blur();
            if(state.module!==rec.module)navigate(rec.module);
            setTimeout(()=>viewRecord(rec.module,rec.id),100);
            toast(`✦ AI เปิดข้อมูล "${rec.title}" (${rec.module_label})`);
            return;
          }
        }
        const uStat = ai.usage?.all?.[ai.used_model] || ai.usage?.active;
        const quotaBadge = uStat ? ` · โควต้าวันนี้เหลือ ${num(uStat.rpd_remaining)}/${num(uStat.rpd_limit)}` : '';
        let html=`<div class="ai-box"><div class="ai-box-head"><span>✦ AI (${esc(ai.used_model||'AI')}${esc(quotaBadge)})</span><span>เข้าใจว่า: "${esc(ai.corrected_query||q)}"</span></div><div class="ai-box-text">${esc(ai.explanation||'ผลการวิเคราะห์จาก AI')}</div></div>`;
        if(ai.recommended_modules?.length){
          html+=`<div class="top-search-head"><span>✦ หน้าที่ AI แนะนำให้ไป</span><span>คลิกเพื่อเปิดทันที</span></div>`+ai.recommended_modules.map(m=>`<button type="button" class="top-search-item" data-qnav="${esc(m.module)}" data-qact="${esc(m.action)}" data-qkw="${esc(m.filter_keyword||'')}"><span class="top-search-item-icon ai">${icons[m.module]||'✦'}</span><div class="top-search-item-body"><div class="top-search-item-title">${esc(m.action==='create'?'＋ เพิ่มข้อมูลใน: '+m.label:m.label)}</div><div class="top-search-item-sub">${esc(m.reason||'หน้าที่ตรงกับความต้องการของคุณ')}</div></div><span class="top-search-item-badge ai">✦ AI แนะนำ</span></button>`).join('');
        }
        if(ai.matched_records?.length){
          html+=`<div class="top-search-head"><span>✦ ข้อมูลที่ AI พบว่าใกล้เคียง</span></div>`+ai.matched_records.map(it=>`<button type="button" class="top-search-item" data-smod="${esc(it.module)}" data-sid="${esc(it.id)}"><span class="top-search-item-icon ai">${icons[it.module]||'•'}</span><div class="top-search-item-body"><div class="top-search-item-title">${esc(it.title)}</div><div class="top-search-item-sub">${esc(it.reason||it.subtitle||it.id)}</div></div><span class="top-search-item-badge ai">${esc(it.module_label)}</span></button>`).join('');
        }
        aiZone.innerHTML=html;
        wireResultClicks(aiZone);
      }catch(err){
        const fallbackMods=localFuzzyModules(q);
        if(autoNavigate && fallbackMods.length){
          applyModuleRedirect({module:fallbackMods[0].module,label:fallbackMods[0].label,action:'navigate'},'นำทางอัตโนมัติ');
          return;
        }
        aiZone.innerHTML=`<div class="ai-box"><div class="ai-box-head"><span>✦ ใช้ AI ช่วยค้นหา</span><button type="button" class="btn small" id="open-ai-config" style="min-height:24px;padding:2px 8px">ตั้งค่า API Key</button></div><div class="ai-box-text muted">${esc(err.message)}</div></div>`;
        wireResultClicks(aiZone);
      }
    };
    const runSearch=async q=>{
      try{
        const r=await api('search',{q});
        if(input.value.trim()!==q)return;
        const fuzzyMods=localFuzzyModules(q);
        let html=`<div id="ai-search-zone"><button type="button" class="ai-trigger-btn" id="trigger-ai-search">✦ ให้ AI วิเคราะห์ "${esc(q)}" แล้วพาไปหน้าที่ต้องการทันที</button></div>`;
        if(fuzzyMods.length){
          html+=`<div class="top-search-head"><span>หน้าที่ตรงหรือใกล้เคียง</span><span>คลิกเพื่อเปิดทันที</span></div>`+fuzzyMods.map(m=>`<button type="button" class="top-search-item" data-qnav="${esc(m.module)}"><span class="top-search-item-icon">${icons[m.module]||'•'}</span><div class="top-search-item-body"><div class="top-search-item-title">ไปที่หน้า ${esc(m.label)}</div><div class="top-search-item-sub">เปิดโมดูล${esc(m.label)}</div></div><span class="top-search-item-badge">เปิดหน้า</span></button>`).join('');
        }
        if(r.items?.length){
          html+=`<div class="top-search-head"><span>ข้อมูลในระบบ (${num(r.items.length)})</span><span>คลิกเพื่อดูรายละเอียด</span></div>`+r.items.map(it=>`<button type="button" class="top-search-item" data-smod="${esc(it.module)}" data-sid="${esc(it.id)}"><span class="top-search-item-icon">${icons[it.module]||'•'}</span><div class="top-search-item-body"><div class="top-search-item-title">${esc(it.title)}</div><div class="top-search-item-sub">${esc(it.subtitle||it.id)}</div></div><span class="top-search-item-badge">${esc(it.module_label)}</span></button>`).join('');
        }
        box.innerHTML=html;
        box.classList.remove('hidden');
        wireResultClicks(box);
      }catch(e){hide();}
    };
    aiBtn?.addEventListener('click',e=>{
      e.stopPropagation();
      const q=input.value.trim();
      if(q)runAiSearch(q,true);
      else openAiConfigModal();
    });
    input.addEventListener('focus',()=>{const q=input.value.trim();if(!q)renderQuickNav();else runSearch(q);});
    input.addEventListener('input',()=>{
      clearTimeout(timer);clearTimeout(aiTimer);const q=input.value.trim();
      if(!q){renderQuickNav();return;}
      timer=setTimeout(()=>runSearch(q),180);
    });
    input.addEventListener('keydown',async e=>{
      if(e.key==='Escape'){hide();input.blur();}
      else if(e.key==='Enter'){
        const q=input.value.trim();if(!q)return;
        e.preventDefault();
        clearTimeout(timer);clearTimeout(aiTimer);
        await runAiSearch(q,true);
      }
    });
    document.addEventListener('click',e=>{if(!e.target.closest('#top-search'))hide();});
    window.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus();input.select();}
    });
  }
  function wireProfileMenu(){
    const btn=$('#profile-menu-btn'),drop=$('#profile-dropdown');
    if(!btn||!drop)return;

    const close=()=>{
      drop.classList.add('hidden');
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded','false');
    };
    const toggle=()=>{
      const isHidden=drop.classList.contains('hidden');
      if(isHidden){
        drop.classList.remove('hidden');
        btn.classList.add('active');
        btn.setAttribute('aria-expanded','true');
      } else {
        close();
      }
    };

    btn.addEventListener('click',e=>{
      e.stopPropagation();
      toggle();
    });

    document.addEventListener('click',e=>{
      if(!e.target.closest('#profile-menu-wrap'))close();
    });

    window.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&!drop.classList.contains('hidden')){
        close();
        btn.focus();
      }
    });

    drop.querySelectorAll('[data-pnav]').forEach(item=>{
      item.addEventListener('click',()=>{
        close();
        const mod=item.dataset.pnav;
        if(mod)navigate(mod);
      });
    });

    $('#top-theme-toggle')?.addEventListener('click',()=>{
      const themes=['premium','classic','dark'];
      const i=themes.indexOf(localStorage.getItem('crm-theme')||'premium');
      setTheme(themes[(i+1)%3]);
    });

    const doLogout=async()=>{
      try{
        await api('logout',{},'POST',{});
        location.href=location.pathname;
      }catch(e){
        toast(e.message,true);
      }
    };
    $('#top-logout-btn')?.addEventListener('click',doLogout);
  }
  async function init(){setTheme(localStorage.getItem('crm-theme')||'premium');if(document.body.dataset.screen!=='app'){authForms();return;}
    try{const r=await api('session');state.user=r.user;state.roles=r.roles;const s=await api('schema');state.modules=s.modules;}catch(e){toast(e.message,true);return;}
    let requested=new URLSearchParams(location.search).get('module')||'dashboard';state.module=roleAllows(requested)?requested:'dashboard';
    makeNav();wireGlobalSearch();wireProfileMenu();$('#logout-btn').onclick=async()=>{try{await api('logout',{},'POST',{});location.href=location.pathname;}catch(e){toast(e.message,true);}};
    $('#menu-open').onclick=()=>{$('#sidebar').classList.add('show');$('#overlay').classList.add('show');};$('#sidebar-close').onclick=closeSidebar;$('#overlay').onclick=closeSidebar;
    $('#modal-close').onclick=closeModal;$('#modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal();});
    $('#theme-toggle').onclick=()=>{const themes=['premium','classic','dark'];const i=themes.indexOf(localStorage.getItem('crm-theme')||'premium');setTheme(themes[(i+1)%3]);};
    window.addEventListener('popstate',()=>{state.module=new URLSearchParams(location.search).get('module')||'dashboard';state.page=1;makeNav();render();});
    window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
    await render();
    if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(r=>r.unregister())).catch(()=>{});}
  }
  init().catch(e=>console.error(e));
})();
