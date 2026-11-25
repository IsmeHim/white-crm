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
  const icons = {dashboard:'◫',wallboard:'▣',contacts:'♙',categories:'◇',campaigns:'▦',receivers:'☎',donations:'♥',hadeeya:'◈',stock_lots:'▤',inventory_moves:'⇄',delivery_companies:'▱',shipments:'▰',tasks:'☷',feedback:'☏',announcements:'◉',reports:'▥',users:'♟',audit:'◷',settings:'⚙'};
  const groups = [ ['ภาพรวม',['dashboard','wallboard','reports']], ['จัดการ CRM',['contacts','campaigns','categories','donations','receivers']], ['คลังและจัดส่ง',['hadeeya','stock_lots','inventory_moves','shipments','delivery_companies']], ['ติดตามและสื่อสาร',['tasks','feedback','announcements']], ['ตั้งค่าระบบ',['users','audit','settings']] ];
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
  function formatThaiPhoneAsYouType(raw){
    const d=String(raw||'').replace(/\D+/g,'').slice(0,10);
    if(!d)return '';
    if(/^0[23457]/.test(d)&&d.length<=9){
      if(d.length<=2)return d;
      if(d.length<=5)return `${d.slice(0,2)}-${d.slice(2)}`;
      return `${d.slice(0,2)}-${d.slice(2,5)}-${d.slice(5,9)}`;
    }
    if(d.length<=3)return d;
    if(d.length<=6)return `${d.slice(0,3)}-${d.slice(3)}`;
    return `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6,10)}`;
  }
  function applyPhoneMask(el){
    if(!el)return;
    const raw=el.value;
    const pos=el.selectionStart??raw.length;
    const digitsBefore=raw.slice(0,pos).replace(/\D+/g,'').length;
    const formatted=formatThaiPhoneAsYouType(raw);
    if(formatted!==raw){
      el.value=formatted;
      let newPos=0,seen=0;
      while(newPos<formatted.length&&seen<digitsBefore){
        if(/\d/.test(formatted[newPos]))seen++;
        newPos++;
      }
      if(typeof el.setSelectionRange==='function')el.setSelectionRange(newPos,newPos);
    }
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
    const allow={manager:['dashboard','wallboard','reports','contacts','campaigns','categories','donations','receivers','hadeeya','stock_lots','inventory_moves','shipments','delivery_companies','tasks','feedback','announcements'],finance:['dashboard','wallboard','reports','contacts','campaigns','donations','receivers'],callcenter:['dashboard','wallboard','contacts','campaigns','donations','receivers','tasks','feedback'],warehouse:['dashboard','wallboard','hadeeya','stock_lots','inventory_moves','shipments','delivery_companies','donations'],auditor:['dashboard','wallboard','reports','contacts','campaigns','categories','donations','receivers','hadeeya','stock_lots','inventory_moves','shipments','delivery_companies','tasks','feedback','announcements','audit'],viewer:['dashboard','wallboard','announcements']};
    if(module==='settings')return true;
    if(!allow[role]?.includes(module))return false;
    if(write&&['viewer','auditor'].includes(role))return false;
    return true;
  };
  const labelFor=m=>state.modules[m]?.label||({dashboard:'ภาพรวมระบบ',wallboard:'จอสดระดมทุน (LIVE)',reports:'รายงานและสถิติ',users:'ผู้ใช้งานและสิทธิ์',audit:'ประวัติการทำงาน',settings:'ตั้งค่าส่วนตัว'}[m]||m);
  function makeNav(){
    $('#nav-main').innerHTML=groups.map(([name,items])=>{
      const visible=items.filter(m=>roleAllows(m));
      if(!visible.length)return '';
      return `<div class="side-section" style="padding-top:16px">${esc(name)}</div>${visible.map(m=>`<a class="nav-link ${m===state.module?'active':''}" href="?module=${m}" data-nav="${m}"><span class="nav-icon">${icons[m]}</span>${esc(labelFor(m))}</a>`).join('')}`;
    }).join('');
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
  let wbCleanupFn = null;
  function stopWallboardTimers(){
    if(typeof wbCleanupFn === 'function'){
      try{wbCleanupFn();}catch(_){}
      wbCleanupFn = null;
    }
  }
  async function render(){
    stopWallboardTimers();
    const main=$('#page-content');main.innerHTML='<div class="loading-state">กำลังโหลดข้อมูล…</div>';
    try{if(state.module==='dashboard')await dashboard();else if(state.module==='wallboard')await wallboardPage();else if(state.module==='reports')await reports();else if(state.module==='users')await usersPage();else if(state.module==='audit')await auditPage();else if(state.module==='settings')await settingsPage();else if(state.modules[state.module])await recordsPage();else navigate('dashboard',true);}
    catch(err){main.innerHTML=`<div class="panel empty"><div class="empty-icon">⚠</div><h3>ไม่สามารถโหลดข้อมูล</h3><p>${esc(err.message)}</p><button class="btn" id="retry-page">ลองอีกครั้ง</button></div>`;$('#retry-page')?.addEventListener('click',render);}
  }
  async function dashboard(){
    const a=await api('summary');const c=a.counts;
    const stats=[['ผู้บริจาค / สมาชิก',num(c.contacts),'contacts','ข้อมูลสมาชิกทั้งหมด'],['ยอดบริจาคยืนยัน',money(a.confirmed_satang),'donations','ไม่นับรายการรอและยกเลิก'],['โครงการทั้งหมด',num(c.campaigns),'campaigns','จำนวนโครงการที่บันทึก'],['การจัดส่งทั้งหมด',num(c.shipments),'shipments','รายการจัดส่ง / คืน']];
    const trend=buildTrendChart(a.by_month, a.by_month_counts||{}, 'ยังไม่มีรายการบริจาคที่ยืนยัน', currentChartMode);
    let campaigns=Object.entries(a.by_campaign||{});const campaignNames=await optionNames('campaigns').catch(()=>({}));const max=Math.max(1,...campaigns.map(x=>x[1]));
    const campCounts=a.by_campaign_counts||{};
    $('#page-content').innerHTML=header('OVERVIEW / DASHBOARD','ภาพรวมระบบ','สรุปข้อมูลการดำเนินงานจากข้อมูลจริงในระบบ',roleAllows('donations',true)?btn('＋ เพิ่มรายการบริจาค','new-donation','primary'):'')+
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

  // --- Live Fundraising TV Wallboard (Broadcast Studio Mode) ---
  let wbSelectedCampaign = 'all';
  let wbScope = 'all';
  let wbAudioCtx = null;
  function playBroadcastChime(){
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return;
      if(!wbAudioCtx) wbAudioCtx = new Ctx();
      if(wbAudioCtx.state === 'suspended') wbAudioCtx.resume();
      const now = wbAudioCtx.currentTime;
      [[587.33, 0, 0.38], [880.0, 0.14, 0.65]].forEach(([freq, offset, dur]) => {
        const osc = wbAudioCtx.createOscillator();
        const gain = wbAudioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
        osc.connect(gain);
        gain.connect(wbAudioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + dur + 0.02);
      });
    }catch(_){}
  }

  async function wallboardPage(){
    let soundOn = localStorage.getItem('wb-sound') !== '0';
    let strictPrivacy = localStorage.getItem('wb-privacy') === '1';

    const defaultWidgets = { hero:true, goal:true, kpis:true, map:true, ranking:true, feed:true, celebrate:true, cleanChrome:false };
    let wbWidgets = { ...defaultWidgets };
    try{
      const saved = JSON.parse(localStorage.getItem('wb-widgets-v1') || 'null');
      if(saved && typeof saved === 'object') wbWidgets = { ...defaultWidgets, ...saved };
    }catch(_){}
    const ensureAtLeastOneWidget = () => {
      if(!wbWidgets.hero && !wbWidgets.goal && !wbWidgets.kpis && !wbWidgets.map && !wbWidgets.ranking && !wbWidgets.feed){
        wbWidgets.ranking = true;
      }
    };
    ensureAtLeastOneWidget();
    const saveWidgets = () => localStorage.setItem('wb-widgets-v1', JSON.stringify(wbWidgets));

    const scenePresets = {
      all:     { hero:true,  goal:true,  kpis:true,  map:true,  ranking:true,  feed:true  },
      hero:    { hero:true,  goal:true,  kpis:true,  map:false, ranking:false, feed:false },
      ranking: { hero:false, goal:false, kpis:false, map:false, ranking:true,  feed:false },
      geo:     { hero:false, goal:false, kpis:false, map:true,  ranking:true,  feed:false },
      feed:    { hero:false, goal:false, kpis:false, map:false, ranking:false, feed:true  }
    };
    const detectActivePreset = () => {
      for(const [k, p] of Object.entries(scenePresets)){
        if(p.hero===wbWidgets.hero && p.goal===wbWidgets.goal && p.kpis===wbWidgets.kpis && p.map===wbWidgets.map && p.ranking===wbWidgets.ranking && p.feed===wbWidgets.feed) return k;
      }
      return 'custom';
    };

    const sceneOrder = ['all', 'hero', 'ranking', 'geo', 'feed'];
    const defaultRotateCfg = {
      enabled: false,
      intervalSec: 15,
      autoOnFullscreen: true,
      scenes: { all: true, hero: true, ranking: true, geo: true, feed: true }
    };
    let wbRotateCfg = { ...defaultRotateCfg, scenes: { ...defaultRotateCfg.scenes } };
    try{
      const savedRot = JSON.parse(localStorage.getItem('wb-rotate-cfg-v1') || 'null');
      if(savedRot && typeof savedRot === 'object'){
        wbRotateCfg = {
          ...defaultRotateCfg,
          ...savedRot,
          intervalSec: Math.max(5, Number(savedRot.intervalSec) || 15),
          scenes: { ...defaultRotateCfg.scenes, ...(savedRot.scenes || {}) }
        };
      }
    }catch(_){}
    const saveRotateCfg = () => localStorage.setItem('wb-rotate-cfg-v1', JSON.stringify(wbRotateCfg));

    const [initialData, thGeo] = await Promise.all([
      api('wallboard', { campaign_id: wbSelectedCampaign, scope: wbScope }),
      loadThailandGeo().catch(() => null)
    ]);

    let currentData = initialData;
    let displayedSatang = Number(initialData.confirmed_satang || 0);
    let animFrame = null;
    let seenIds = new Set((initialData.recent_feed || []).map(x => x.id));
    let highlightedIds = new Set();
    let pulseProvince = (initialData.recent_feed || []).find(x => x.province)?.province || (initialData.top_provinces?.[0]?.province || '');
    let celebrateTimer = null;
    let wakeLockSentinel = null;
    let isMapDragging = false;
    let isSceneTransitioning = false;
    let rotateElapsedMs = 0;

    const geoProvLookup = {};
    if(thGeo?.provinces){ thGeo.provinces.forEach(gp => { geoProvLookup[gp.th] = gp; }); }

    const box = $('#page-content');
    box.innerHTML = `<div class="wb-shell ${wbWidgets.cleanChrome?'wb-clean-chrome':''}" id="wb-shell">
      <div class="progress-line wb-rotate-bar ${wbRotateCfg.enabled?'':'hidden'}" id="wb-rotate-bar"><div class="w-pct-0" id="wb-rotate-bar-fill"></div></div>
      <button type="button" class="wb-floating-restore ${wbWidgets.cleanChrome?'':'hidden'}" id="wb-restore-chrome-btn" title="แสดงแถบตั้งค่าและปุ่มควบคุม">⚙ ตั้งค่าจอ LIVE</button>

      <div class="wb-topbar">
        <div class="wb-brand">
          <span class="wb-live-pill"><i class="wb-live-dot"></i> LIVE</span>
          <div>
            <div class="wb-brand-title">WHITE CHANNEL · จอสดรายงานยอดระดมทุน</div>
            <div class="wb-brand-sub">อัปเดตข้อมูลอัตโนมัติทุก 5 วินาที</div>
          </div>
          <div class="wb-clock" id="wb-clock">--:--:-- น.</div>
        </div>

        <div class="wb-controls">
          <select class="wb-select" id="wb-campaign-select" aria-label="เลือกโครงการที่แสดงบนจอทีวี"></select>
          <div class="wb-toggle-group">
            <button type="button" class="wb-scope-btn ${wbScope==='all'?'active':''}" data-wb-scope="all">ยอดสะสมโครงการ</button>
            <button type="button" class="wb-scope-btn ${wbScope==='today'?'active':''}" data-wb-scope="today">ยอดเฉพาะวันนี้</button>
          </div>
          <button type="button" class="wb-ctrl-btn ${soundOn?'active':''}" id="wb-sound-btn" title="เปิด/ปิดเสียงกระดิ่งเมื่อมียอดบริจาคใหม่">${soundOn?'🔔 เสียงเปิด':'🔕 ปิดเสียง'}</button>
          <button type="button" class="wb-ctrl-btn ${strictPrivacy?'active':''}" id="wb-privacy-btn" title="สลับโหมดซ่อนชื่อผู้บริจาคทั้งหมดบนหน้าจอ">${strictPrivacy?'👁 ซ่อนชื่อทั้งหมด':'👁 แสดงชื่อย่อ'}</button>
          <button type="button" class="wb-ctrl-btn" id="wb-test-alert-btn" title="ทดสอบเสียงกระดิ่งและแบนเนอร์ฉลองยอดใหม่">✦ ทดสอบ</button>
          <button type="button" class="wb-ctrl-btn fullscreen-btn" id="wb-fullscreen-btn">⛶ เต็มจอทีวี</button>
        </div>
      </div>

      <div class="wb-scene-bar">
        <div class="wb-scene-presets">
          <span class="wb-scene-label">🎬 เลือกฉาก:</span>
          <button type="button" class="wb-scene-pill" data-wb-preset="all">ครบทุกส่วน</button>
          <button type="button" class="wb-scene-pill" data-wb-preset="hero">💰 ยอดรวม & เป้าหมาย</button>
          <button type="button" class="wb-scene-pill" data-wb-preset="ranking">🏆 อันดับจังหวัดสูงสุด</button>
          <button type="button" class="wb-scene-pill" data-wb-preset="geo">🗺️ แผนที่ + จังหวัด</button>
          <button type="button" class="wb-scene-pill" data-wb-preset="feed">♥ รายการร่วมบุญล่าสุด</button>
        </div>

        <div class="wb-controls">
          <div class="wb-autorotate-group ${wbRotateCfg.enabled?'is-running':''}" id="wb-autorotate-group">
            <button type="button" class="wb-autorotate-toggle" id="wb-autorotate-btn" title="เปิด/ปิดการสลับฉากอัตโนมัติ">${wbRotateCfg.enabled?`🔄 สลับฉาก (${wbRotateCfg.intervalSec}วิ)`:'⏸ สลับอัตโนมัติ'}</button>
            <select class="wb-rotate-select" id="wb-rotate-sec" aria-label="ตั้งเวลาสลับฉากอัตโนมัติ" title="ตั้งเวลาแสดงผลต่อฉาก">
              ${[8,10,15,20,30,45,60].map(s => `<option value="${s}" ${wbRotateCfg.intervalSec===s?'selected':''}>หน้าละ ${s} วิ</option>`).join('')}
            </select>
          </div>
          <button type="button" class="wb-ctrl-btn" id="wb-clean-chrome-btn" title="ซ่อนแถบเมนูด้านบนทั้งหมด เพื่อนำภาพขึ้นจอทีวีสดหรือ OBS">📺 ซ่อนแถบเมนู (ออกจอสด)</button>
          <div class="wb-picker-wrap" id="wb-picker-wrap">
            <button type="button" class="wb-ctrl-btn" id="wb-picker-btn">🎛 ตั้งค่าแสดงผล ▾</button>
            <div class="wb-widget-popover hidden" id="wb-widget-popover">
              <div class="wb-popover-title"><span>🔄 ตั้งค่าสลับฉากอัตโนมัติ</span><small class="muted">เมื่อเปิดหรือเต็มจอ</small></div>
              <label class="wb-widget-chk"><input type="checkbox" id="wb-rot-on-fs" ${wbRotateCfg.autoOnFullscreen?'checked':''}> <span>⛶ สลับฉากอัตโนมัติทันทีเมื่อกดเต็มจอทีวี</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-rot-scene="all" ${wbRotateCfg.scenes.all?'checked':''}> <span>วนฉาก: ครบทุกส่วน</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-rot-scene="hero" ${wbRotateCfg.scenes.hero?'checked':''}> <span>วนฉาก: 💰 ยอดรวม & เป้าหมาย</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-rot-scene="ranking" ${wbRotateCfg.scenes.ranking?'checked':''}> <span>วนฉาก: 🏆 อันดับจังหวัดสูงสุด</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-rot-scene="geo" ${wbRotateCfg.scenes.geo?'checked':''}> <span>วนฉาก: 🗺️ แผนที่ + จังหวัด</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-rot-scene="feed" ${wbRotateCfg.scenes.feed?'checked':''}> <span>วนฉาก: ♥ รายการร่วมบุญล่าสุด</span></label>
              <div class="wb-popover-divider"></div>
              <div class="wb-popover-title"><span>เลือกส่วนแสดงผลเอง</span><small class="muted">เลือกผสมได้</small></div>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="hero"> <span>💰 ยอดบริจาคหลัก</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="goal"> <span>🎯 หลอดความคืบหน้าเป้าหมาย</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="kpis"> <span>📊 การ์ดสถิติย่อย 4 ช่อง</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="map"> <span>🗺️ แผนที่ประเทศไทย 77 จังหวัด</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="ranking"> <span>🏆 อันดับจังหวัดสูงสุด</span></label>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="feed"> <span>♥ รายการร่วมบริจาคล่าสุด</span></label>
              <div class="wb-popover-divider"></div>
              <label class="wb-widget-chk"><input type="checkbox" data-wb-wchk="celebrate"> <span>🎉 แบนเนอร์ฉลองเมื่อยอดใหม่เข้า</span></label>
            </div>
          </div>
        </div>
      </div>

      <div id="wb-celebrate-slot" class="hidden"></div>

      <div class="wb-grid" id="wb-dynamic-grid"></div>
    </div>`;

    const shellEl = $('#wb-shell');
    const clockEl = $('#wb-clock');
    const campSelectEl = $('#wb-campaign-select');
    const dynGridEl = $('#wb-dynamic-grid');

    const updateClock = () => {
      if(!clockEl) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss} น.`;
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    const activeRollTimers = new WeakMap();
    const spawnDeltaPop = (boxEl, deltaSatang) => {
      if(!boxEl || !(deltaSatang > 0)) return;
      boxEl.querySelectorAll('.wb-delta-pop').forEach(n => n.remove());
      const badge = document.createElement('span');
      badge.className = 'wb-delta-pop';
      badge.textContent = `+${money(deltaSatang)}`;
      boxEl.appendChild(badge);
      setTimeout(() => badge.remove(), 1800);
    };

    const pulseBoxEl = (boxEl) => {
      if(!boxEl) return;
      boxEl.classList.remove('is-pulsing');
      void boxEl.offsetWidth;
      boxEl.classList.add('is-pulsing');
      setTimeout(() => boxEl.classList.remove('is-pulsing'), 1400);
    };

    const rollMoneyElement = (el, fromSatang, toSatang, opts = {}) => {
      if(!el) return;
      const prefix = opts.prefix || '';
      const duration = opts.duration || 1150;
      const boxEl = opts.boxEl || el.closest('.wb-hero-amount-wrap, .wb-ranking-solo-total, .wb-solo-prov-card, .wb-top-prov-row, .wb-kpi-box');
      const prevFrame = activeRollTimers.get(el);
      if(prevFrame) cancelAnimationFrame(prevFrame);

      const startVal = Math.max(0, Math.round(fromSatang));
      const endVal = Math.max(0, Math.round(toSatang));
      const diff = endVal - startVal;

      if(opts.pulse && boxEl){
        pulseBoxEl(boxEl);
        if(opts.deltaSatang > 0) spawnDeltaPop(boxEl, opts.deltaSatang);
      }

      if(diff === 0){
        el.classList.remove('wb-num-rolling');
        el.textContent = prefix + money(endVal);
        return;
      }

      el.classList.add('wb-num-rolling');
      const startTime = performance.now();

      const step = (ts) => {
        if(!el.isConnected) return;
        const t = Math.min(1, (ts - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const cur = Math.round(startVal + diff * eased);
        if(opts.trackHero) displayedSatang = cur;

        if(t < 1){
          el.textContent = prefix + money(cur);
          activeRollTimers.set(el, requestAnimationFrame(step));
        } else {
          if(opts.trackHero) displayedSatang = endVal;
          el.classList.remove('wb-num-rolling');
          el.textContent = prefix + money(endVal);
          activeRollTimers.delete(el);
        }
      };
      activeRollTimers.set(el, requestAnimationFrame(step));
    };

    const triggerMoneyInAnimation = (deltaSatang, provinceName = '') => {
      const delta = Math.max(100, Number(deltaSatang || 0));
      const totalConfirmed = Number(currentData.confirmed_satang || 0);
      const fromTotal = Math.max(0, totalConfirmed - delta);

      const heroEl = $('#wb-hero-amount');
      if(heroEl){
        rollMoneyElement(heroEl, fromTotal, totalConfirmed, { pulse: true, deltaSatang: delta, duration: 1200, trackHero: true });
      }
      const soloTotalEl = $('#wb-solo-total-amount');
      if(soloTotalEl){
        rollMoneyElement(soloTotalEl, fromTotal, totalConfirmed, { pulse: true, deltaSatang: delta, duration: 1200 });
      }
      const kpiTodayEl = $('#wb-kpi-today-amount');
      if(kpiTodayEl){
        const todayTot = Number(currentData.today_confirmed_satang || 0);
        rollMoneyElement(kpiTodayEl, Math.max(0, todayTot - delta), todayTot, { pulse: true, deltaSatang: delta, duration: 1150 });
      }
      if(provinceName){
        shellEl.querySelectorAll('[data-wb-prov-amt]').forEach(pEl => {
          if(pEl.dataset.wbProvAmt === provinceName){
            const pTarget = Number((currentData.province_amounts || {})[provinceName] || delta);
            const pFrom = Math.max(0, pTarget - delta);
            rollMoneyElement(pEl, pFrom, pTarget, { pulse: true, deltaSatang: delta, duration: 1200 });
          }
        });
        const hoverPillStrong = $('#wb-map-hover-pill strong');
        if(hoverPillStrong && (wbHoveredProv || pulseProvince) === provinceName){
          const pTarget = Number((currentData.province_amounts || {})[provinceName] || delta);
          rollMoneyElement(hoverPillStrong, Math.max(0, pTarget - delta), pTarget, { duration: 1150 });
        }
      }
    };

    const showCelebration = (item) => {
      if(!wbWidgets.celebrate) return;
      const slot = $('#wb-celebrate-slot');
      if(!slot || !item) return;
      const who = strictPrivacy ? 'ผู้มีจิตศรัทธา' : (item.donor_short || 'ผู้มีจิตศรัทธา');
      const provTxt = item.province ? ` (จ.${item.province})` : '';
      const amt = Number(item.amount_satang || 0);
      slot.className = 'wb-celebrate';
      slot.innerHTML = `<div class="wb-celebrate-main"><span>🎉 ยอดร่วมบุญใหม่!</span> <strong>${esc(who + provTxt)}</strong> <span>ร่วมบริจาคใน ${esc(item.campaign_name || '')}</span></div><span class="wb-celebrate-amt" id="wb-celebrate-amt">+${esc(money(amt))}</span>`;
      const celAmtEl = $('#wb-celebrate-amt');
      if(celAmtEl && amt > 0){
        rollMoneyElement(celAmtEl, 0, amt, { prefix: '+', duration: 950 });
      }
      if(celebrateTimer) clearTimeout(celebrateTimer);
      celebrateTimer = setTimeout(() => { slot.className = 'hidden'; }, 7500);
    };

    const [baseMapX, baseMapY, baseMapW, baseMapH] = thGeo?.viewBox || [0, 0, 608, 1080];
    let wbMapCam = { x: baseMapX, y: baseMapY, w: baseMapW, h: baseMapH };
    let wbHoveredProv = '';

    const buildMapSvgMarkup = (data, isTall = false) => {
      if(!thGeo?.provinces?.length) return '<div class="muted mini">กำลังเตรียมแผนที่…</div>';
      const provAmts = data.province_amounts || {};
      const maxAmt = Math.max(1, ...Object.values(provAmts).map(v => Number(v) || 0));
      const vb = wbMapCam;
      const paths = thGeo.provinces.map(gp => {
        const amt = Number(provAmts[gp.th] || 0);
        let cls = '';
        if(amt > 0){
          const r = Math.sqrt(amt / maxAmt);
          cls = r >= 0.8 ? 'w-h4' : r >= 0.55 ? 'w-h3' : r >= 0.3 ? 'w-h2' : 'w-h1';
        }
        const pCls = gp.th === pulseProvince ? 'is-pulse-prov' : '';
        return `<path class="wb-prov-path ${cls} ${pCls}" data-wb-prov="${esc(gp.th)}" d="${gp.d}"><title>จ.${esc(gp.th)} — ${amt > 0 ? money(amt) : '฿0.00'}</title></path>`;
      }).join('');

      const placedLbls = [];
      const targetGp = pulseProvince ? geoProvLookup[pulseProvince] : null;
      if(targetGp) placedLbls.push([targetGp.cx, targetGp.cy]);

      const topPins = (data.top_provinces || []).slice(0, isTall ? 6 : 3).map(tp => {
        if(tp.province === pulseProvince) return '';
        const gp = geoProvLookup[tp.province];
        if(!gp) return '';
        const tooClose = placedLbls.some(([px, py]) => Math.abs(px - gp.cx) < 105 && Math.abs(py - gp.cy) < 38);
        const showLbl = isTall && !tooClose;
        if(showLbl) placedLbls.push([gp.cx, gp.cy]);
        const lx = gp.cx >= 290 ? gp.cx + 12 : gp.cx - 12;
        const anchor = gp.cx >= 290 ? 'start' : 'end';
        return `<g>
          <circle class="wb-top-pin-dot" cx="${gp.cx}" cy="${gp.cy}" r="6.5"></circle>
          ${showLbl ? `<text class="wb-map-label" x="${lx}" y="${gp.cy + 6}" text-anchor="${anchor}">${esc(tp.province)}</text>` : ''}
        </g>`;
      }).join('');

      let pulseSvg = '';
      if(targetGp){
        const lx = targetGp.cx >= 290 ? targetGp.cx + 15 : targetGp.cx - 15;
        const anchor = targetGp.cx >= 290 ? 'start' : 'end';
        pulseSvg = `<g>
          <circle class="wb-pulse-ring" cx="${targetGp.cx}" cy="${targetGp.cy}" r="30"></circle>
          <circle class="wb-pulse-ring ring-2" cx="${targetGp.cx}" cy="${targetGp.cy}" r="30"></circle>
          <circle class="wb-pulse-dot" cx="${targetGp.cx}" cy="${targetGp.cy}" r="8.5"></circle>
          <text class="wb-map-label pulse-lbl" x="${lx}" y="${targetGp.cy + 6}" text-anchor="${anchor}">${esc(pulseProvince)}</text>
        </g>`;
      }

      const controlsHtml = `<div class="wb-map-controls">
          <button type="button" class="wb-map-zoom-btn" id="wb-map-zin" title="ซูมเข้า (+)">＋</button>
          <button type="button" class="wb-map-zoom-btn" id="wb-map-zout" title="ซูมออก (−)">−</button>
          <button type="button" class="wb-map-zoom-btn" id="wb-map-zreset" title="รีเซ็ตมุมมองแผนที่">⟲</button>
        </div>`;

      const inspectTarget = wbHoveredProv || pulseProvince || (data.top_provinces?.[0]?.province || '');
      const inspectAmt = inspectTarget ? Number(provAmts[inspectTarget] || 0) : 0;
      const hoverPillHtml = inspectTarget
        ? `<div class="wb-map-hover-pill" id="wb-map-hover-pill"><span>📍 จ.${esc(inspectTarget)}</span><strong>${esc(money(inspectAmt))}</strong></div>`
        : '';

      return `${controlsHtml}<svg class="wb-map-svg" id="wb-live-svg" viewBox="${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}" aria-hidden="true"><g>${paths}</g>${topPins}${pulseSvg}</svg>${hoverPillHtml}`;
    };

    const buildMapFooterHtml = (activeCnt) => `<div class="wb-map-footer">
      <span>ร่วมบริจาคแล้ว <strong>${num(activeCnt)} / 77</strong> จังหวัด</span>
      <span class="wb-legend-scale">น้อย <i class="wb-swatch s0"></i><i class="wb-swatch s1"></i><i class="wb-swatch s2"></i><i class="wb-swatch s3"></i><i class="wb-swatch s4"></i> มาก</span>
    </div>`;

    const buildCompactRankingHtml = (data, limit = 5) => {
      const tp = (data.top_provinces || []).slice(0, limit);
      if(!tp.length) return '<div class="muted mini">ยังไม่มีข้อมูลจังหวัดในช่วงนี้</div>';
      return tp.map((p, i) => {
        const mCls = i === 0 ? 'm-1' : i === 1 ? 'm-2' : i === 2 ? 'm-3' : '';
        return `<div class="wb-top-prov-row">
          <div class="wb-top-prov-left">
            <span class="wb-prov-medal ${mCls}">#${i + 1}</span>
            <span class="wb-prov-name">จ.${esc(p.province)}</span>
            <span class="wb-prov-donors">(${num(p.donor_count)} ท่าน)</span>
          </div>
          <strong data-wb-prov-amt="${esc(p.province)}">${esc(money(p.amount_satang))}</strong>
        </div>`;
      }).join('');
    };

    const buildExpandedRankingCard = (data, isSoloScreen) => {
      const sel = data.selected_campaign || { name: 'รวมทุกโครงการระดมทุน' };
      const tp = (data.top_provinces || []).slice(0, 10);
      const maxP = Math.max(1, ...tp.map(x => Number(x.amount_satang) || 0));
      const cardsHtml = tp.length ? `<div class="${isSoloScreen ? 'wb-solo-prov-grid' : 'wb-top-prov-list'}">${tp.map((p, i) => {
        const mCls = i === 0 ? 'm-1' : i === 1 ? 'm-2' : i === 2 ? 'm-3' : '';
        const pct = Math.min(100, Math.max(2, Math.round(((Number(p.amount_satang) || 0) / maxP) * 100)));
        return `<div class="wb-solo-prov-card ${i === 0 ? 'podium-1' : ''}">
          <div class="wb-solo-prov-top">
            <div class="wb-solo-prov-name">
              <span class="wb-prov-medal ${mCls}">#${i + 1}</span>
              <span>จ.${esc(p.province)}</span>
            </div>
            <span class="wb-solo-prov-amt" data-wb-prov-amt="${esc(p.province)}">${esc(money(p.amount_satang))}</span>
          </div>
          <div class="progress-line wb-prov-bar"><div class="w-pct-${pct}"></div></div>
          <div class="wb-solo-prov-meta">
            <span>ผู้บริจาค ${num(p.donor_count)} ท่าน · ${num(p.count)} รายการ</span>
            <span>สัดส่วน ${p.share_pct}%</span>
          </div>
        </div>`;
      }).join('')}</div>` : '<div class="empty">ยังไม่มีข้อมูลจังหวัดที่ร่วมบริจาคในช่วงเวลานี้</div>';

      return `<section class="wb-card">
        <div class="wb-ranking-solo-head">
          <div>
            <h2 class="wb-ranking-solo-title">🏆 อันดับจังหวัดที่ร่วมบริจาคสูงสุด</h2>
            <div class="wb-ranking-solo-sub">${esc(sel.name)} · ${wbScope === 'today' ? `ยอดประจำวันที่ ${esc(data.today_date)}` : 'ยอดสะสมที่ยืนยันแล้ว'}</div>
          </div>
          ${!wbWidgets.hero ? `<div class="wb-ranking-solo-total"><span>ยอดบริจาครวม</span><strong id="wb-solo-total-amount">${esc(money(data.confirmed_satang || 0))}</strong></div>` : ''}
        </div>
        ${cardsHtml}
      </section>`;
    };

    const syncControlsState = () => {
      const activePreset = detectActivePreset();
      shellEl.querySelectorAll('[data-wb-preset]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.wbPreset === activePreset);
      });
      shellEl.querySelectorAll('[data-wb-wchk]').forEach(chk => {
        const key = chk.dataset.wbWchk;
        chk.checked = !!wbWidgets[key];
      });
      shellEl.classList.toggle('wb-clean-chrome', !!wbWidgets.cleanChrome);
      $('#wb-restore-chrome-btn')?.classList.toggle('hidden', !wbWidgets.cleanChrome);
    };

    const renderWallboardData = (data, isInitial = false) => {
      currentData = data;
      syncControlsState();

      if(campSelectEl){
        const opts = [`<option value="all" ${wbSelectedCampaign==='all'?'selected':''}>★ รวมทุกโครงการระดมทุน</option>`]
          .concat((data.campaigns || []).map(c => `<option value="${esc(c.id)}" ${wbSelectedCampaign===c.id?'selected':''}>${esc(c.name)}${c.status!=='active'?' (ปิดแล้ว)':''}</option>`));
        campSelectEl.innerHTML = opts.join('');
      }

      if(!dynGridEl || isMapDragging) return;
      const prevFeedScroll = $('#wb-feed-scroll-box')?.scrollTop || 0;

      const sel = data.selected_campaign || { name: 'รวมทุกโครงการระดมทุน', goal_satang: 0 };
      const hasHeroCard = wbWidgets.hero || wbWidgets.goal || wbWidgets.kpis;
      const splitGeoCards = (!hasHeroCard && !wbWidgets.feed && wbWidgets.map && wbWidgets.ranking);

      const panels = [];

      // 1. Hero / Goal / KPIs Card
      if(hasHeroCard){
        let goalHtml = '';
        if(wbWidgets.goal){
          const goal = Number(data.goal_satang || 0);
          const confirmed = Number(data.confirmed_satang || 0);
          if(goal > 0){
            const rawPct = data.goal_pct ?? Math.round((confirmed / goal) * 1000) / 10;
            const clampPct = Math.min(100, Math.max(0, Math.round(confirmed / goal * 100)));
            const reached = confirmed >= goal;
            const initBarPct = isInitial ? 0 : clampPct;
            goalHtml = `<div class="wb-goal-section">
              <div class="wb-goal-top">
                <div class="wb-goal-pct">${num(rawPct)}% <small>ของเป้าหมายโครงการ</small></div>
                <div class="wb-goal-target">เป้าหมาย ${esc(money(goal))}</div>
              </div>
              <div class="progress-line wb-mega-bar"><div class="w-pct-${initBarPct}" data-wb-bar-pct="${clampPct}"></div></div>
              <div class="wb-goal-foot">
                <span>${reached ? 'บรรลุเป้าหมายโครงการแล้ว' : `อีก ${money(data.remaining_satang || 0)} ครบเป้าหมาย`}</span>
                ${reached ? '<span class="wb-goal-badge">🎉 ครบ 100%!</span>' : `<span>ยืนยันแล้ว ${num(data.confirmed_count || 0)} รายการ</span>`}
              </div>
            </div>`;
          } else {
            goalHtml = `<div class="wb-goal-section">
              <div class="wb-goal-top">
                <div class="wb-goal-pct">${num(data.confirmed_count || 0)} <small>รายการร่วมบริจาคที่ยืนยันแล้ว</small></div>
                <div class="wb-goal-target">เปิดรับบริจาคไม่จำกัดเป้าหมาย</div>
              </div>
              <div class="progress-line wb-mega-bar"><div class="w-pct-100"></div></div>
              <div class="wb-goal-foot"><span>ผู้ร่วมบุญ ${num(data.unique_donors || 0)} ท่าน</span><span>เฉลี่ย ${money(data.avg_satang || 0)} ต่อรายการ</span></div>
            </div>`;
          }
        }

        const kpiHtml = wbWidgets.kpis ? `<div class="wb-kpi-grid">
          <div class="wb-kpi-box">
            <div class="wb-kpi-label">ยอดยืนยันวันนี้ (${esc(data.today_date)})</div>
            <div class="wb-kpi-val gold" id="wb-kpi-today-amount">${esc(money(data.today_confirmed_satang || 0))}</div>
            <div class="wb-kpi-sub">${num(data.today_confirmed_count || 0)} รายการวันนี้</div>
          </div>
          <div class="wb-kpi-box">
            <div class="wb-kpi-label">ผู้มีจิตศรัทธาร่วมบริจาค</div>
            <div class="wb-kpi-val">${num(data.unique_donors || 0)} ท่าน</div>
            <div class="wb-kpi-sub">จาก ${num(data.confirmed_count || 0)} บิลยืนยัน</div>
          </div>
          <div class="wb-kpi-box">
            <div class="wb-kpi-label">ค่าเฉลี่ยต่อรายการ</div>
            <div class="wb-kpi-val">${esc(money(data.avg_satang || 0))}</div>
            <div class="wb-kpi-sub">จากยอดที่ยืนยันแล้ว</div>
          </div>
          <div class="wb-kpi-box">
            <div class="wb-kpi-label">คิวรอการเงินตรวจสอบ</div>
            <div class="wb-kpi-val">${num(data.pending_count || 0)} รายการ</div>
            <div class="wb-kpi-sub">รอตรวจ ${esc(money(data.pending_satang || 0))}</div>
          </div>
        </div>` : '';

        panels.push(`<section class="wb-card wb-hero-card">
          <div>
            <div class="wb-camp-tag">${wbScope === 'today' ? `LIVE TODAY · ประจำวันที่ ${esc(data.today_date)}` : 'CAMPAIGN LIVE FUNDRAISING'}</div>
            <h2 class="wb-camp-name">${esc(sel.name)}</h2>
          </div>
          ${wbWidgets.hero ? `<div class="wb-hero-amount-wrap">
            <div class="wb-hero-caption">${wbScope === 'today' ? 'ยอดบริจาคที่ยืนยันแล้วเฉพาะวันนี้' : 'ยอดบริจาคสะสมที่ยืนยันแล้ว'}</div>
            <div class="wb-hero-amount" id="wb-hero-amount">${esc(money(displayedSatang))}</div>
          </div>` : ''}
          ${goalHtml}
          ${kpiHtml}
        </section>`);
      }

      // 2. Map & Province Leaderboard Panels
      const activeProvCnt = Object.keys(data.province_amounts || {}).length;
      const pulseNote = pulseProvince ? `ล่าสุด: จ.${pulseProvince}` : `รวม ${num(activeProvCnt)} จังหวัด`;

      if(splitGeoCards){
        panels.push(`<section class="wb-card wb-map-card">
          <div class="wb-card-head"><h3>🗺️ แผนที่ผู้ร่วมบุญทั่วไทย (77 จังหวัด)</h3><small>${esc(pulseNote)}</small></div>
          <div class="wb-map-box wb-map-tall" id="wb-interactive-map-box">${buildMapSvgMarkup(data, true)}</div>
          ${buildMapFooterHtml(activeProvCnt)}
        </section>`);
        panels.push(buildExpandedRankingCard(data, false));
      } else if(wbWidgets.map && wbWidgets.ranking){
        panels.push(`<section class="wb-card wb-map-card">
          <div>
            <div class="wb-card-head"><h3>🗺️ พื้นที่ผู้ร่วมบุญทั่วไทย</h3><small>${esc(pulseNote)}</small></div>
            <div class="wb-map-box" id="wb-interactive-map-box">${buildMapSvgMarkup(data, false)}</div>
            ${buildMapFooterHtml(activeProvCnt)}
          </div>
          <div>
            <div class="wb-card-head"><h3>🏆 อันดับจังหวัดสูงสุด (Top 5)</h3></div>
            <div class="wb-top-prov-list">${buildCompactRankingHtml(data, 5)}</div>
          </div>
        </section>`);
      } else if(wbWidgets.map){
        panels.push(`<section class="wb-card wb-map-card">
          <div class="wb-card-head"><h3>🗺️ แผนที่ผู้ร่วมบุญทั่วไทย (77 จังหวัด)</h3><small>${esc(pulseNote)}</small></div>
          <div class="wb-map-box wb-map-tall" id="wb-interactive-map-box">${buildMapSvgMarkup(data, true)}</div>
          ${buildMapFooterHtml(activeProvCnt)}
        </section>`);
      } else if(wbWidgets.ranking){
        const isSoloRanking = !hasHeroCard && !wbWidgets.feed;
        panels.push(buildExpandedRankingCard(data, isSoloRanking));
      }

      // 3. Live Feed Panel
      if(wbWidgets.feed){
        const isSoloFeed = panels.length === 0;
        const items = data.recent_feed || [];
        const feedHtml = items.length ? items.map(item => {
          const isNew = highlightedIds.has(item.id);
          const who = strictPrivacy
            ? `ผู้มีจิตศรัทธา${item.phone_masked ? ' (' + item.phone_masked + ')' : ''}`
            : item.donor_short;
          return `<div class="wb-feed-item ${isNew ? 'is-new' : ''}">
            <div class="wb-feed-left">
              <div class="wb-feed-donor">
                <span>${esc(who)}</span>
                ${item.province ? `<span class="wb-feed-prov">จ.${esc(item.province)}</span>` : ''}
                ${item.distribution_label ? `<span class="wb-feed-dist">${esc(item.distribution_label)}</span>` : ''}
              </div>
              <div class="wb-feed-sub">${esc(item.campaign_name)}${!strictPrivacy && item.phone_masked ? ` · ${esc(item.phone_masked)}` : ''}</div>
            </div>
            <div class="wb-feed-right">
              <strong class="wb-feed-amt">+${esc(money(item.amount_satang))}</strong>
              <span class="wb-feed-time">${esc(item.time_label || item.donated_at || '')}</span>
            </div>
          </div>`;
        }).join('') : '<div class="empty">ยังไม่มีรายการบริจาคที่ยืนยันในช่วงเวลานี้</div>';

        panels.push(`<section class="wb-card">
          <div class="wb-card-head">
            <h3>♥ รายการร่วมบริจาคล่าสุด${isSoloFeed ? ` · ${esc(sel.name)}` : ''}</h3>
            <small>อัปเดต ${esc(data.server_time || '')} น.</small>
          </div>
          <div class="wb-feed-list ${isSoloFeed ? 'wb-feed-solo' : ''}" id="wb-feed-scroll-box">${feedHtml}</div>
        </section>`);
      }

      const colCount = Math.min(3, Math.max(1, panels.length));
      dynGridEl.className = `wb-grid cols-${colCount}${isInitial ? ' wb-enter' : ''}`;
      dynGridEl.innerHTML = panels.join('');
      if(isInitial){
        requestAnimationFrame(() => {
          dynGridEl.querySelectorAll('[data-wb-bar-pct]').forEach(barEl => {
            barEl.className = `w-pct-${barEl.dataset.wbBarPct}`;
          });
        });
        setTimeout(() => dynGridEl.classList.remove('wb-enter'), 1050);
      }

      const newFeedBox = $('#wb-feed-scroll-box');
      if(newFeedBox && prevFeedScroll > 0 && !isInitial){
        newFeedBox.scrollTop = prevFeedScroll;
      }

      // Wire interactive zoom/pan/hover on map panel
      const mapBox = $('#wb-interactive-map-box');
      const liveSvg = $('#wb-live-svg');
      if(mapBox && liveSvg){
        const applyWbCam = () => {
          wbMapCam.w = Math.max(baseMapW / 8, Math.min(baseMapW, wbMapCam.w));
          wbMapCam.h = wbMapCam.w * (baseMapH / baseMapW);
          wbMapCam.x = Math.max(baseMapX - wbMapCam.w * 0.25, Math.min(baseMapX + baseMapW - wbMapCam.w * 0.75, wbMapCam.x));
          wbMapCam.y = Math.max(baseMapY - wbMapCam.h * 0.25, Math.min(baseMapY + baseMapH - wbMapCam.h * 0.75, wbMapCam.y));
          liveSvg.setAttribute('viewBox', `${wbMapCam.x.toFixed(1)} ${wbMapCam.y.toFixed(1)} ${wbMapCam.w.toFixed(1)} ${wbMapCam.h.toFixed(1)}`);
        };
        const zoomWb = (factor, ax = wbMapCam.x + wbMapCam.w / 2, ay = wbMapCam.y + wbMapCam.h / 2) => {
          const nw = Math.max(baseMapW / 8, Math.min(baseMapW, wbMapCam.w * factor));
          const nh = nw * (baseMapH / baseMapW);
          const rx = (ax - wbMapCam.x) / wbMapCam.w;
          const ry = (ay - wbMapCam.y) / wbMapCam.h;
          wbMapCam.w = nw; wbMapCam.h = nh;
          wbMapCam.x = ax - rx * nw; wbMapCam.y = ay - ry * nh;
          applyWbCam();
        };
        $('#wb-map-zin')?.addEventListener('click', () => zoomWb(0.72));
        $('#wb-map-zout')?.addEventListener('click', () => zoomWb(1.38));
        $('#wb-map-zreset')?.addEventListener('click', () => {
          wbMapCam = { x: baseMapX, y: baseMapY, w: baseMapW, h: baseMapH };
          applyWbCam();
        });
        mapBox.addEventListener('wheel', e => {
          e.preventDefault();
          const rect = liveSvg.getBoundingClientRect();
          const px = (e.clientX - rect.left) / Math.max(1, rect.width);
          const py = (e.clientY - rect.top) / Math.max(1, rect.height);
          zoomWb(e.deltaY < 0 ? 0.8 : 1.25, wbMapCam.x + px * wbMapCam.w, wbMapCam.y + py * wbMapCam.h);
        }, { passive: false });

        let drag = null;
        mapBox.addEventListener('pointerdown', e => {
          if(e.target.closest('.wb-map-controls') || e.button !== 0) return;
          drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, cx: wbMapCam.x, cy: wbMapCam.y, cap: false };
        });
        mapBox.addEventListener('pointermove', e => {
          if(!drag || e.pointerId !== drag.id) return;
          const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
          if(!drag.cap && (Math.abs(dx) > 4 || Math.abs(dy) > 4)){
            drag.cap = true;
            isMapDragging = true;
            mapBox.classList.add('dragging');
            try{ mapBox.setPointerCapture(e.pointerId); }catch(_){}
          }
          if(!drag.cap) return;
          const rect = liveSvg.getBoundingClientRect();
          wbMapCam.x = drag.cx - (dx / Math.max(1, rect.width)) * wbMapCam.w;
          wbMapCam.y = drag.cy - (dy / Math.max(1, rect.height)) * wbMapCam.h;
          applyWbCam();
        });
        const stopDrag = e => {
          if(drag?.cap){ try{ mapBox.releasePointerCapture(e.pointerId); }catch(_){} }
          drag = null;
          isMapDragging = false;
          mapBox.classList.remove('dragging');
        };
        mapBox.addEventListener('pointerup', stopDrag);
        mapBox.addEventListener('pointercancel', stopDrag);

        const hoverPill = $('#wb-map-hover-pill');
        mapBox.querySelectorAll('[data-wb-prov]').forEach(pEl => {
          const updateInspect = () => {
            wbHoveredProv = pEl.dataset.wbProv;
            if(hoverPill){
              const amt = Number((data.province_amounts || {})[wbHoveredProv] || 0);
              hoverPill.innerHTML = `<span>📍 จ.${esc(wbHoveredProv)}</span><strong>${esc(money(amt))}</strong>`;
            }
          };
          pEl.addEventListener('mouseenter', updateInspect);
          pEl.addEventListener('click', updateInspect);
        });
      }

      if(isInitial){
        const tot = Number(data.confirmed_satang || 0);
        const heroEl = $('#wb-hero-amount');
        if(heroEl) rollMoneyElement(heroEl, 0, tot, { duration: 1050, trackHero: true });
        else displayedSatang = tot;
        const soloTotalEl = $('#wb-solo-total-amount');
        if(soloTotalEl) rollMoneyElement(soloTotalEl, 0, tot, { duration: 1050 });
      }
    };

    renderWallboardData(initialData, true);

    // Poll every 5 seconds when visible
    let pollBusy = false;
    const pollNow = async (resetSeen = false) => {
      if(pollBusy || document.hidden) return;
      pollBusy = true;
      try{
        const prevTot = Number(currentData.confirmed_satang || 0);
        const next = await api('wallboard', { campaign_id: wbSelectedCampaign, scope: wbScope });
        if(!shellEl.isConnected) return;
        if(resetSeen){
          seenIds = new Set((next.recent_feed || []).map(x => x.id));
          highlightedIds.clear();
          pulseProvince = (next.recent_feed || []).find(x => x.province)?.province || (next.top_provinces?.[0]?.province || '');
          renderWallboardData(next, true);
        } else {
          const freshItems = (next.recent_feed || []).filter(x => x.id && !seenIds.has(x.id));
          let freshSum = 0;
          let newest = null;
          if(freshItems.length > 0){
            freshItems.forEach(x => {
              seenIds.add(x.id);
              highlightedIds.add(x.id);
              freshSum += Number(x.amount_satang || 0);
            });
            newest = freshItems[0];
            if(newest.province) pulseProvince = newest.province;
            if(soundOn) playBroadcastChime();
            showCelebration(newest);
          }
          renderWallboardData(next, false);
          const nextTot = Number(next.confirmed_satang || 0);
          const delta = nextTot > prevTot ? (nextTot - prevTot) : freshSum;
          if(delta > 0){
            triggerMoneyInAnimation(delta, newest?.province || pulseProvince);
          }
        }
      }catch(_){}
      finally{ pollBusy = false; }
    };

    const pollTimer = setInterval(() => pollNow(false), 5000);
    const onVisChange = () => { if(!document.hidden) pollNow(false); };
    document.addEventListener('visibilitychange', onVisChange);

    // Scene Presets, Auto-Rotation & Custom Widget Popover Wiring
    const rotGroupEl = $('#wb-autorotate-group');
    const rotBtnEl = $('#wb-autorotate-btn');
    const rotSecEl = $('#wb-rotate-sec');
    const rotBarEl = $('#wb-rotate-bar');
    const rotBarFillEl = $('#wb-rotate-bar-fill');

    const syncAutoRotateUi = () => {
      const totalMs = wbRotateCfg.intervalSec * 1000;
      const remainSec = Math.max(1, Math.ceil((totalMs - rotateElapsedMs) / 1000));
      const pct = wbRotateCfg.enabled ? Math.min(100, Math.max(0, Math.round((rotateElapsedMs / Math.max(1, totalMs)) * 100))) : 0;
      rotGroupEl?.classList.toggle('is-running', !!wbRotateCfg.enabled);
      if(rotBtnEl){
        rotBtnEl.textContent = wbRotateCfg.enabled ? `🔄 สลับฉาก (${remainSec}วิ)` : '⏸ สลับอัตโนมัติ';
      }
      if(rotSecEl && Number(rotSecEl.value) !== wbRotateCfg.intervalSec){
        rotSecEl.value = String(wbRotateCfg.intervalSec);
      }
      rotBarEl?.classList.toggle('hidden', !wbRotateCfg.enabled);
      if(rotBarFillEl) rotBarFillEl.className = `w-pct-${pct}`;
    };

    const switchSceneAnimated = (presetKey) => {
      const p = scenePresets[presetKey];
      if(!p || isSceneTransitioning) return;
      isSceneTransitioning = true;
      rotateElapsedMs = 0;
      syncAutoRotateUi();
      if(dynGridEl) dynGridEl.classList.add('wb-scene-out');
      setTimeout(() => {
        wbWidgets = { ...wbWidgets, ...p };
        saveWidgets();
        if(dynGridEl) dynGridEl.classList.remove('wb-scene-out');
        renderWallboardData(currentData, true);
        isSceneTransitioning = false;
      }, 210);
    };

    const advanceNextScene = () => {
      const enabledKeys = sceneOrder.filter(k => wbRotateCfg.scenes[k]);
      if(enabledKeys.length < 2) return;
      const curKey = detectActivePreset();
      const idx = enabledKeys.indexOf(curKey);
      const nextKey = enabledKeys[(idx + 1) % enabledKeys.length];
      switchSceneAnimated(nextKey);
    };

    const rotateTimer = setInterval(() => {
      if(!wbRotateCfg.enabled || document.hidden || isMapDragging || isSceneTransitioning) return;
      rotateElapsedMs += 250;
      const totalMs = wbRotateCfg.intervalSec * 1000;
      if(rotateElapsedMs >= totalMs){
        rotateElapsedMs = 0;
        advanceNextScene();
      } else {
        syncAutoRotateUi();
      }
    }, 250);

    rotBtnEl?.addEventListener('click', () => {
      wbRotateCfg.enabled = !wbRotateCfg.enabled;
      rotateElapsedMs = 0;
      saveRotateCfg();
      syncAutoRotateUi();
    });

    rotSecEl?.addEventListener('change', e => {
      wbRotateCfg.intervalSec = Math.max(5, Number(e.target.value) || 15);
      rotateElapsedMs = 0;
      if(!wbRotateCfg.enabled) wbRotateCfg.enabled = true;
      saveRotateCfg();
      syncAutoRotateUi();
    });

    $('#wb-rot-on-fs')?.addEventListener('change', e => {
      wbRotateCfg.autoOnFullscreen = !!e.target.checked;
      saveRotateCfg();
    });

    shellEl.querySelectorAll('[data-wb-rot-scene]').forEach(chk => {
      chk.addEventListener('change', () => {
        const key = chk.dataset.wbRotScene;
        wbRotateCfg.scenes[key] = chk.checked;
        const activeList = sceneOrder.filter(k => wbRotateCfg.scenes[k]);
        if(activeList.length < 2){
          wbRotateCfg.scenes[key] = true;
          chk.checked = true;
          toast('ต้องเลือกอย่างน้อย 2 ฉากสำหรับการสลับฉากอัตโนมัติ', true);
          return;
        }
        saveRotateCfg();
      });
    });

    shellEl.querySelectorAll('[data-wb-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.wbPreset;
        if(detectActivePreset() === key) return;
        switchSceneAnimated(key);
      });
    });

    const pickerBtn = $('#wb-picker-btn');
    const popoverEl = $('#wb-widget-popover');
    pickerBtn?.addEventListener('click', e => {
      e.stopPropagation();
      popoverEl?.classList.toggle('hidden');
    });
    const onDocClick = e => {
      if(popoverEl && !popoverEl.classList.contains('hidden') && !e.target.closest('#wb-picker-wrap')){
        popoverEl.classList.add('hidden');
      }
    };
    document.addEventListener('click', onDocClick);

    shellEl.querySelectorAll('[data-wb-wchk]').forEach(chk => {
      chk.addEventListener('change', () => {
        const key = chk.dataset.wbWchk;
        wbWidgets[key] = chk.checked;
        if(!wbWidgets.hero && !wbWidgets.goal && !wbWidgets.kpis && !wbWidgets.map && !wbWidgets.ranking && !wbWidgets.feed){
          wbWidgets[key] = true;
          chk.checked = true;
          toast('ต้องเปิดแสดงผลอย่างน้อย 1 ส่วนบนหน้าจอ LIVE', true);
          return;
        }
        saveWidgets();
        renderWallboardData(currentData, true);
      });
    });

    $('#wb-clean-chrome-btn')?.addEventListener('click', () => {
      wbWidgets.cleanChrome = true;
      saveWidgets();
      syncControlsState();
      toast('ซ่อนแถบเมนูแล้ว (เลื่อนเมาส์ไปมุมขวาบนแล้วกด "⚙ ตั้งค่าจอ LIVE" เพื่อเปิดแถบเมนูกลับ)');
    });
    $('#wb-restore-chrome-btn')?.addEventListener('click', () => {
      wbWidgets.cleanChrome = false;
      saveWidgets();
      syncControlsState();
    });

    // Controls wiring
    campSelectEl?.addEventListener('change', e => {
      wbSelectedCampaign = e.target.value;
      pollNow(true);
    });

    shellEl.querySelectorAll('[data-wb-scope]').forEach(b => {
      b.onclick = () => {
        wbScope = b.dataset.wbScope;
        shellEl.querySelectorAll('[data-wb-scope]').forEach(x => x.classList.toggle('active', x.dataset.wbScope === wbScope));
        pollNow(true);
      };
    });

    const soundBtn = $('#wb-sound-btn');
    soundBtn?.addEventListener('click', () => {
      soundOn = !soundOn;
      localStorage.setItem('wb-sound', soundOn ? '1' : '0');
      soundBtn.classList.toggle('active', soundOn);
      soundBtn.textContent = soundOn ? '🔔 เสียงเปิด' : '🔕 ปิดเสียง';
      if(soundOn) playBroadcastChime();
    });

    const privBtn = $('#wb-privacy-btn');
    privBtn?.addEventListener('click', () => {
      strictPrivacy = !strictPrivacy;
      localStorage.setItem('wb-privacy', strictPrivacy ? '1' : '0');
      privBtn.classList.toggle('active', strictPrivacy);
      privBtn.textContent = strictPrivacy ? '👁 ซ่อนชื่อทั้งหมด' : '👁 แสดงชื่อย่อ';
      renderWallboardData(currentData, true);
    });

    $('#wb-test-alert-btn')?.addEventListener('click', () => {
      if(soundOn) playBroadcastChime();
      const sample = currentData.recent_feed?.[0] || {
        id: 'test_don',
        donor_short: 'คุณอับดุลเลาะห์ มี.',
        province: currentData.top_provinces?.[0]?.province || 'ปัตตานี',
        campaign_name: currentData.selected_campaign?.name || 'โครงการระดมทุน',
        amount_satang: 100000
      };
      if(sample.id) highlightedIds.add(sample.id);
      if(sample.province) pulseProvince = sample.province;
      showCelebration(sample);
      renderWallboardData(currentData, false);
      triggerMoneyInAnimation(sample.amount_satang || 100000, sample.province || pulseProvince);
    });

    // Fullscreen + Screen Wake Lock + Idle Control Dimming
    let idleTimer = null;
    const bumpActivity = () => {
      shellEl.classList.remove('wb-idle-controls');
      if(idleTimer) clearTimeout(idleTimer);
      const isFs = document.fullscreenElement === shellEl || shellEl.classList.contains('wb-fixed-fullscreen') || wbWidgets.cleanChrome;
      if(isFs){
        idleTimer = setTimeout(() => shellEl.classList.add('wb-idle-controls'), 4000);
      }
    };
    shellEl.addEventListener('mousemove', bumpActivity);

    const requestWakeLock = async () => {
      try{
        if('wakeLock' in navigator && !wakeLockSentinel){
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        }
      }catch(_){}
    };
    requestWakeLock();

    const fsBtn = $('#wb-fullscreen-btn');
    let autoStartedByFs = false;
    const syncFsButton = () => {
      const isFs = document.fullscreenElement === shellEl || shellEl.classList.contains('wb-fixed-fullscreen');
      if(fsBtn) fsBtn.textContent = isFs ? '✕ ออกจากเต็มจอ' : '⛶ เต็มจอทีวี';
      if(isFs && wbRotateCfg.autoOnFullscreen && !wbRotateCfg.enabled){
        wbRotateCfg.enabled = true;
        autoStartedByFs = true;
        rotateElapsedMs = 0;
        syncAutoRotateUi();
      } else if(!isFs && autoStartedByFs){
        wbRotateCfg.enabled = false;
        autoStartedByFs = false;
        rotateElapsedMs = 0;
        syncAutoRotateUi();
      }
      if(!isFs && !wbWidgets.cleanChrome) shellEl.classList.remove('wb-idle-controls');
      else bumpActivity();
    };
    document.addEventListener('fullscreenchange', syncFsButton);

    fsBtn?.addEventListener('click', async () => {
      const isNativeFs = document.fullscreenElement === shellEl;
      const isCssFs = shellEl.classList.contains('wb-fixed-fullscreen');
      if(isNativeFs){
        await document.exitFullscreen().catch(() => {});
      } else if(isCssFs){
        shellEl.classList.remove('wb-fixed-fullscreen');
        syncFsButton();
      } else if(shellEl.requestFullscreen){
        try{
          await shellEl.requestFullscreen();
        }catch(_){
          shellEl.classList.add('wb-fixed-fullscreen');
          syncFsButton();
        }
      } else {
        shellEl.classList.add('wb-fixed-fullscreen');
        syncFsButton();
      }
    });

    wbCleanupFn = () => {
      clearInterval(clockTimer);
      clearInterval(pollTimer);
      clearInterval(rotateTimer);
      if(celebrateTimer) clearTimeout(celebrateTimer);
      if(idleTimer) clearTimeout(idleTimer);
      if(animFrame) cancelAnimationFrame(animFrame);
      document.removeEventListener('visibilitychange', onVisChange);
      document.removeEventListener('fullscreenchange', syncFsButton);
      document.removeEventListener('click', onDocClick);
      if(wakeLockSentinel){
        wakeLockSentinel.release().catch(() => {});
        wakeLockSentinel = null;
      }
    };
  }
  async function optionNames(module){
    if(state.options[module])return state.options[module];
    const result=await api('options',{module});const names={};const items={};
    for(const item of result.items||[]){names[item.id]=item.name;items[item.id]=item;}
    state.options[module]=names;state.optionItems[module]=items;return names;
  }
  function pillClass(value){
    const success=['active','confirmed','delivered','called','done','resolved','published','1'];
    const danger=['cancelled','closed','returned','unreachable','urgent','0'];
    const info=['shipped','progress','callback','review'];
    return success.includes(String(value))?'green':danger.includes(String(value))?'red':info.includes(String(value))?'blue':'yellow';
  }
  function humanValue(column,value,field,row=null,module=null,canWrite=false){
    if(module==='tasks' && column==='contact_phone'){
      const phone=row?.contact_id?(state.optionItems?.contacts?.[row.contact_id]?.phone||''):'';
      return phone?`<a href="tel:${esc(phone)}" style="font-weight:750;color:var(--accent-text);text-decoration:none" title="คลิกเพื่อโทร">${esc(phone)}</a>`:'<span class="cell-muted">—</span>';
    }
    if(value===null||value===undefined||value==='')return '<span class="cell-muted">—</span>';
    if(['proof_file_id','cover_file_id'].includes(column))return `<a class="btn small" href="?api=file&id=${encodeURIComponent(value)}" target="_blank" rel="noopener">⇩ ดาวน์โหลดไฟล์</a>`;
    if(column==='created_at'||column==='updated_at')return esc(dateDisplay(value));
    if(module==='tasks' && column==='due_date'){
      const dStr=dateDisplay(value);
      if(row && !['done','unreachable'].includes(row.status) && /^\d{4}-\d\d-\d\d$/.test(dStr)){
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
      if(module==='shipments' && column==='status'){
        const iconMap={preparing:'📦',shipped:'🚚',delivered:'✓',returned:'↺',cancelled:'✕'};
        const icon=iconMap[String(value)]||'•';
        return `<span class="pill ${cls}" style="font-size:11.5px;padding:5px 11px;gap:5px;font-weight:800;display:inline-flex;align-items:center">${icon} ${esc(label)}</span>`;
      }
      if(canWrite && row && module && ['status','active','priority'].includes(column)){
        return `<select class="status-pill-select ${cls}" data-quick-module="${esc(module)}" data-quick-id="${esc(row.id)}" data-quick-field="${esc(column)}" title="คลิกเพื่อเปลี่ยนสถานะทันที">${Object.entries(field.options).map(([k,v])=>`<option value="${esc(k)}" ${String(value)===k?'selected':''}>${esc(v)}</option>`).join('')}</select>`;
      }
      return `<span class="pill ${cls}">${esc(label)}</span>`;
    }
    return esc(String(value).length>45?String(value).slice(0,45)+'…':value);
  }
  function quickActionBtn(m,row,canWrite){
    if(!canWrite)return '';
    if(m==='tasks' && !['done','unreachable'].includes(row.status)){
      const callBtn=['open','no_answer','callback'].includes(row.status)?`<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="called" title="เปลี่ยนเป็นโทรแล้วทันที">📞 โทรแล้ว</button>`:'';
      return `${callBtn}<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="done" title="ทำเครื่องหมายว่าเสร็จสิ้นทันที">✓ เสร็จสิ้น</button>`;
    }
    if(m==='donations' && row.status==='pending')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="confirmed" title="ยืนยันยอดบริจาคทันที">✓ ยืนยันยอด</button>`;
    if(m==='feedback' && row.status!=='resolved')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="resolved" title="เปลี่ยนเป็นแก้ไขแล้วทันที">✓ แก้ไขแล้ว</button>`;
    if(m==='announcements' && row.status==='draft')return `<button class="btn small quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="published" title="เผยแพร่ประกาศทันที">✦ เผยแพร่</button>`;
    return '';
  }
  function rowActionButtons(m,row,canWrite){
    if(m==='shipments'){
      const st=row.status||'preparing';
      let acts='';
      if(st==='preparing'){
        acts+=`<button type="button" class="btn small primary" data-print-shipment="${esc(row.id)}" title="พิมพ์ใบปะหน้าพัสดุสำหรับกล่องนี้">🖨 ป้ายส่งของ</button>`;
        if(canWrite){
          acts+=`<button type="button" class="btn small quick-act-btn" data-ship-dispatch="${esc(row.id)}" title="บันทึกเลขพัสดุและจัดส่ง">🚚 ส่งพัสดุ</button>`;
        }
      } else if(st==='shipped'){
        acts+=`<button type="button" class="btn small ghost" data-ship-notify="${esc(row.id)}" title="คัดลอกข้อความแจ้งผู้บริจาคทาง LINE / SMS" style="color:var(--accent-text);border-color:rgba(162,187,59,.4)">💬 แจ้งพัสดุ</button>`;
        if(canWrite){
          acts+=`<button type="button" class="btn small primary quick-act-btn" data-qact-id="${esc(row.id)}" data-qact-val="delivered" title="ผู้รับได้รับของเรียบร้อยแล้ว">✓ รับสำเร็จ</button>`;
          acts+=`<button type="button" class="btn small ghost" data-ship-return="${esc(row.id)}" title="พัสดุตีกลับ (คืนสต็อกเข้าคลัง)" style="color:#e05244">↺ ตีกลับ</button>`;
        }
      } else if(st==='delivered'){
        acts+=`<button type="button" class="btn small ghost" data-ship-notify="${esc(row.id)}" title="ดูหรือคัดลอกข้อความแจ้งพัสดุ">💬 ข้อความแจ้ง</button>`;
      }
      acts+=`<button class="btn small" data-view="${esc(row.id)}">ดูข้อมูล</button>`;
      if(canWrite && !['delivered','returned','cancelled'].includes(st)){
        acts+=`<button class="btn small ghost" data-edit="${esc(row.id)}" title="แก้ไขข้อมูล">แก้ไข</button>`;
      }
      return acts;
    }
    return `${quickActionBtn(m,row,canWrite)}<button class="btn small" data-view="${esc(row.id)}">${m==='contacts'?'♙ ดูโปรไฟล์ 360°':'ดูข้อมูล'}</button>${canWrite?`<button class="btn small ghost" data-edit="${esc(row.id)}">แก้ไข</button>`:''}`;
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
    const shipmentBatchBar=(m==='shipments')?`<div class="shipment-batch-bar">
      <div class="batch-bar-left">
        <span class="batch-title">📦 <strong>จัดการพัสดุเป็นชุด:</strong></span>
        <span class="pill" id="batch-select-label">เลือกแล้ว 0 รายการ</span>
        <button type="button" class="btn small" id="btn-select-preparing" title="เลือกเฉพาะรายการค้างส่งในหน้านี้">⚡ เลือกรายการค้างส่งในหน้านี้</button>
        <button type="button" class="btn small ghost" id="btn-clear-selection">ล้างที่เลือก</button>
      </div>
      <div class="batch-bar-right">
        <button type="button" class="btn primary btn-batch-print" id="btn-batch-print" disabled title="เลือกรายการจากตารางแล้วสั่งพิมพ์พร้อมกัน">🖨 พิมพ์ใบปะหน้าชุดที่เลือก (<span id="batch-count-num">0</span>)</button>
        <button type="button" class="btn" id="btn-print-all-preparing" title="ดึงรายการที่สถานะ 'เตรียมจัดส่ง' ทั้งหมดในระบบมาพิมพ์ทันที">🏷 พิมพ์รายการค้างส่งทั้งหมดในระบบ</button>
        ${canWrite?`<button type="button" class="btn" id="btn-import-tracking" title="นำเข้าเลขพัสดุจากไฟล์ CSV หรือคัดลอกจาก Excel ขนส่งเพื่ออัปเดตเป็นชุด">📥 นำเข้าเลขพัสดุ (CSV)</button>`:''}
      </div>
    </div>`:'';
    $('#page-content').innerHTML=header('MANAGEMENT / '+m.toUpperCase(),schema.label,'จัดการข้อมูลพร้อมระบบค้นหาและบันทึกประวัติการเปลี่ยนแปลง',actions)+
      (showDateFilter?renderDateFilterBar():'')+
      donationSummaryStrip+
      shipmentBatchBar+
      `<div class="toolbar"><div class="toolbar-left"><input id="search-records" class="search-input" type="search" value="${esc(state.q)}" placeholder="ค้นหาชื่อ รหัส หรือรายละเอียด…" aria-label="ค้นหา">${filter}</div><div class="toolbar-right" style="display:flex;gap:8px">${roleAllows('reports')?btn('⇩ ส่งออก CSV','export'):''}</div></div><section class="panel table-panel"><div class="table-header"><div><h3>รายการทั้งหมด</h3><p>พบ ${num(r.total)} รายการ</p></div><span class="pill">หน้า ${num(r.page)} / ${num(r.pages)}</span></div><div class="table-wrap"><table><thead><tr>${m==='shipments'?`<th class="cell-check"><input type="checkbox" id="chk-all-shipments" class="chk-header" title="เลือกทั้งหมดในหน้านี้" aria-label="เลือกทั้งหมด"></th>`:''}${columns.map(col=>`<th>${esc(schema.fields[col]?.label||({created_at:'วันที่สร้าง',updated_at:'อัปเดต',contact_phone:'เบอร์โทรลูกค้า'}[col]||col))}</th>`).join('')}<th>จัดการ</th></tr></thead><tbody>${r.items.length?r.items.map(row=>`<tr>${m==='shipments'?`<td class="cell-check"><input type="checkbox" class="chk-ship-row" data-id="${esc(row.id)}" data-status="${esc(row.status||'')}" aria-label="เลือกรายการ ${esc(row.id)}"></td>`:''}${columns.map((col,i)=>`<td class="${i===0?'cell-primary':''}">${humanValue(col,row[col],schema.fields[col],row,m,canWrite)}</td>`).join('')}<td><div class="table-actions">${rowActionButtons(m,row,canWrite)}</div></td></tr>`).join(''):`<tr><td colspan="${columns.length+1+(m==='shipments'?1:0)}"><div class="empty"><div class="empty-icon">☷</div><h3>ไม่พบข้อมูล</h3><p>ลองค้นหาด้วยคำอื่น ปรับช่วงวันที่ หรือเพิ่มรายการใหม่</p></div></td></tr>`}</tbody></table></div><div class="table-footer"><span>${r.total?`แสดง ${(r.page-1)*20+1}–${Math.min(r.total,r.page*20)} จาก ${num(r.total)}`:'ไม่มีรายการ'}</span><div class="pagination"><button id="prev-page" class="btn small" ${r.page<=1?'disabled':''}>ก่อนหน้า</button><button id="next-page" class="btn small" ${r.page>=r.pages?'disabled':''}>ถัดไป</button></div></div></section>`;
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
    document.querySelectorAll('[data-print-shipment]').forEach(b=>b.addEventListener('click',()=>openShippingLabels({id:b.dataset.printShipment})));
    document.querySelectorAll('[data-ship-dispatch]').forEach(b=>b.addEventListener('click',()=>openQuickDispatchModal(b.dataset.shipDispatch)));
    document.querySelectorAll('[data-ship-notify]').forEach(b=>b.addEventListener('click',()=>openTrackingNotifyModal(b.dataset.shipNotify)));
    document.querySelectorAll('[data-ship-return]').forEach(b=>b.addEventListener('click',()=>confirmReturnShipment(b.dataset.shipReturn)));
    document.querySelectorAll('[data-quick-id]').forEach(sel=>sel.addEventListener('change',e=>{
      updateQuickStatus(sel.dataset.quickModule,sel.dataset.quickId,sel.dataset.quickField,e.target.value,sel);
    }));
    document.querySelectorAll('[data-qact-id]').forEach(btn=>btn.addEventListener('click',()=>{
      updateQuickStatus(m,btn.dataset.qactId,'status',btn.dataset.qactVal,btn);
    }));

    if(m==='shipments'){
      const chkAll=$('#chk-all-shipments');
      const getRowChecks=()=>document.querySelectorAll('.chk-ship-row');
      const batchPrintBtn=$('#btn-batch-print');
      const batchCountNum=$('#batch-count-num');
      const batchLabel=$('#batch-select-label');

      const updateBatchUI=()=>{
        const checkedBoxes=Array.from(getRowChecks()).filter(c=>c.checked);
        const count=checkedBoxes.length;
        if(batchCountNum)batchCountNum.textContent=count;
        if(batchLabel)batchLabel.textContent=`เลือกแล้ว ${count} รายการ`;
        if(batchPrintBtn)batchPrintBtn.disabled=(count===0);
        if(chkAll){
          const allBoxes=Array.from(getRowChecks());
          chkAll.checked=(allBoxes.length>0 && count===allBoxes.length);
          chkAll.indeterminate=(count>0 && count<allBoxes.length);
        }
      };

      chkAll?.addEventListener('change',e=>{
        getRowChecks().forEach(c=>{c.checked=e.target.checked;});
        updateBatchUI();
      });

      document.querySelectorAll('.chk-ship-row').forEach(c=>{
        c.addEventListener('change',updateBatchUI);
      });

      $('#btn-select-preparing')?.addEventListener('click',()=>{
        getRowChecks().forEach(c=>{
          c.checked=(c.dataset.status==='preparing');
        });
        updateBatchUI();
      });

      $('#btn-clear-selection')?.addEventListener('click',()=>{
        getRowChecks().forEach(c=>{c.checked=false;});
        updateBatchUI();
      });

      $('#btn-batch-print')?.addEventListener('click',()=>{
        const ids=Array.from(getRowChecks()).filter(c=>c.checked).map(c=>c.dataset.id);
        if(!ids.length){toast('กรุณาเลือกรายการที่ต้องการพิมพ์อย่างน้อย 1 รายการ',true);return;}
        openShippingLabels({ids});
      });

      $('#btn-print-all-preparing')?.addEventListener('click',()=>{
        openShippingLabels({preparing:1});
      });

      $('#btn-import-tracking')?.addEventListener('click',()=>{
        openBatchImportTrackingModal();
      });
    }
  }
  async function fieldHTML(k,field,value='',editing=false,forModule='',recordId=''){
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
        <input class="relation-search" data-rel="${esc(field.module)}" data-for-module="${esc(forModule)}" data-current-id="${esc(recordId)}" data-current-val="${esc(value)}" data-target="${id}" autocomplete="off" placeholder="${esc(field.placeholder||'คลิกเพื่อเลือก หรือพิมพ์ชื่อ/รหัสเพื่อค้นหา…')}" value="${esc(known)}">
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
    const gridWrap = fieldWrap.parentElement || fieldWrap;
    let existingBox = gridWrap.querySelector('.inline-contact-box');
    if(existingBox){
      existingBox.remove();
      return;
    }
    const isDigits = /^[\d\s+-]+$/.test(initialText.trim());
    const defaultPhone = isDigits ? initialText.trim() : '';
    const defaultName = isDigits ? '' : initialText.trim();

    const boxHtml = `
      <div class="inline-contact-box">
        <div class="inline-contact-head">
          <div class="inline-contact-title-wrap">
            <span class="inline-contact-badge">＋ ผู้บริจาคใหม่</span>
            <span class="inline-contact-sub">บันทึกพร้อมรายการบริจาคอัตโนมัติ</span>
          </div>
          <button type="button" class="btn small ghost inline-contact-close" id="inline-con-close" title="ยกเลิกและกลับไปค้นหาผู้บริจาคเดิม">← กลับไปค้นหาเดิม</button>
        </div>
        <div class="inline-contact-grid">
          <label class="form-field" style="margin:0"><span class="field-title">เบอร์โทรศัพท์ <span class="req-star">*</span></span><input id="quick-con-phone" type="tel" value="${esc(defaultPhone)}" placeholder="เช่น 081-234-5678 (กรอกเบอร์ก่อน)" required autocomplete="off"></label>
          <label class="form-field" style="margin:0"><span class="field-title">ชื่อ-นามสกุล / นามแฝง <span class="req-star">*</span></span><input id="quick-con-name" value="${esc(defaultName)}" placeholder="เช่น คุณสมชาย ใจดี" required autocomplete="off"></label>
          <label class="form-field inline-contact-addr" style="margin:0"><span class="field-title">ที่อยู่จัดส่งพัสดุ <span class="opt-tag">(เว้นว่างได้ เพื่อให้ Call Center โทรสอบถาม)</span></span><input id="quick-con-address" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ" autocomplete="off"></label>
          <label class="form-field" style="margin:0"><span class="field-title">จังหวัด</span><input id="quick-con-province" placeholder="เช่น กรุงเทพฯ" autocomplete="off"></label>
        </div>
      </div>
    `;

    fieldWrap.insertAdjacentHTML('afterend', boxHtml);
    fieldWrap.classList.add('hidden');
    const box = gridWrap.querySelector('.inline-contact-box');

    const nameInput = box.querySelector('#quick-con-name');
    const phoneInput = box.querySelector('#quick-con-phone');
    const addrInput = box.querySelector('#quick-con-address');
    const provInput = box.querySelector('#quick-con-province');

    if(phoneInput){
      if(phoneInput.value)phoneInput.value=formatThaiPhoneAsYouType(phoneInput.value);
      phoneInput.addEventListener('input',()=>applyPhoneMask(phoneInput));
      phoneInput.addEventListener('blur',()=>{phoneInput.value=formatThaiPhone(phoneInput.value);});
    }

    addrInput?.addEventListener('input', () => {
      const p = detectThaiProvince(addrInput.value);
      if(p && provInput && !provInput.value.trim()) provInput.value = p;
    });

    const closeBox = () => { box.remove(); fieldWrap.classList.remove('hidden'); input.focus(); };
    box.querySelector('#inline-con-close')?.addEventListener('click', closeBox);

    setTimeout(() => {
      if(!defaultPhone || defaultPhone.replace(/\D+/g,'').length < 9){
        phoneInput.focus();
        const len = phoneInput.value.length;
        if(typeof phoneInput.setSelectionRange === 'function') phoneInput.setSelectionRange(len, len);
      } else if(!defaultName) nameInput.focus();
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
          const r=await api('options',{
            module:input.dataset.rel,
            q,
            for_module:input.dataset.forModule||'',
            current_id:input.dataset.currentId||'',
            current_donation_id:input.dataset.currentVal||''
          });
          const isContacts=(input.dataset.rel==='contacts');
          let createBtnHtml='';
          if(isContacts && roleAllows('contacts',true)){
            createBtnHtml=`<div class="relation-inline-create-wrap"><button type="button" class="btn small primary relation-inline-create-btn">＋ สร้างผู้บริจาคใหม่ทันที${q?` "${esc(q)}"`:''}</button></div>`;
          }
          results.innerHTML=(r.items.length?r.items.map(o=>`<button type="button" class="relation-option" data-id="${esc(o.id)}" data-name="${esc(o.name)}" data-phone="${esc(o.phone||'')}" data-hadeeya="${esc(o.hadeeya_id||'')}" data-hqty="${esc(o.hadeeya_qty||1)}" data-shipnote="${esc(o.shipping_note||'')}">
            <span class="relation-opt-main"><strong>${esc(o.name)}</strong>${o.phone?`<small class="relation-opt-phone">📞 ${esc(o.phone)}</small>`:''}</span>
            <small class="relation-opt-id">${esc(o.id.slice(0,11))}</small>
          </button>`).join(''):'<div class="relation-empty">ไม่พบข้อมูลที่ตรงกัน</div>')+createBtnHtml;
          results.classList.remove('hidden');

          results.querySelector('.relation-inline-create-btn')?.addEventListener('click',e=>{
            e.preventDefault();e.stopPropagation();
            results.classList.add('hidden');
            showInlineContactCreator(picker,target,input,q);
          });

          results.querySelectorAll('[data-id]').forEach(btn=>btn.addEventListener('click',async()=>{
            target.value=btn.dataset.id;input.value=btn.dataset.phone?`${btn.dataset.name} (${btn.dataset.phone})`:btn.dataset.name;results.classList.add('hidden');syncClear();
            if(input.dataset.rel==='donations'){
              if(btn.dataset.shipnote){
                const noteEl=$('#f_note',form);
                if(noteEl && !noteEl.value.trim()){
                  noteEl.value=btn.dataset.shipnote;
                }
              }
              const hadInput=$('#f_hadeeya_id',form);
              if(btn.dataset.hadeeya && hadInput){
                hadInput.value=btn.dataset.hadeeya;
                await optionNames('hadeeya').catch(()=>({}));
                const hadName=state.options.hadeeya?.[btn.dataset.hadeeya]||btn.dataset.hadeeya;
                const hadSearch=hadInput.parentElement?.querySelector('.relation-search');
                if(hadSearch)hadSearch.value=hadName;
                hadInput.parentElement?.querySelector('.relation-clear')?.classList.remove('hidden');
                const qtyEl=$('#f_quantity',form);
                if(qtyEl && (!qtyEl.value || Number(qtyEl.value)<=1)){
                  qtyEl.value=btn.dataset.hqty||'1';
                }
                const lotInput=$('#f_lot_id',form);
                if(lotInput){
                  await optionNames('stock_lots').catch(()=>({}));
                  const fifoLot=Object.values(state.optionItems.stock_lots||{}).find(l=>l.hadeeya_id===btn.dataset.hadeeya && Number(l.quantity||0)>0);
                  if(fifoLot){
                    lotInput.value=fifoLot.id;
                    const lotSearch=lotInput.parentElement?.querySelector('.relation-search');
                    if(lotSearch)lotSearch.value=fifoLot.name;
                    lotInput.parentElement?.querySelector('.relation-clear')?.classList.remove('hidden');
                  }
                }
                toast('ดึงข้อมูลฮาดียะห์, ล็อตสินค้า และที่อยู่จัดส่งจากรายการบริจาคให้อัตโนมัติ');
              }
            }
            if(input.dataset.rel==='hadeeya'){
              const stEl=$('#f_hadeeya_status',form);
              if(stEl && (!stEl.value || stEl.value==='none'))stEl.value='receive';
              const hQtyEl=$('#f_hadeeya_qty',form);
              if(hQtyEl && (!hQtyEl.value || Number(hQtyEl.value)<=0))hQtyEl.value='1';
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
        if(input.dataset.rel==='contacts' && /^0[\d-]*$/.test(input.value.trim()))applyPhoneMask(input);
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
        if(module==='donations'){record.donated_at??=today;record.status??='pending';record.channel??='bank';record.distribution_period??='once';record.hadeeya_status??='none';}
        if(module==='hadeeya'){record.unit??='ชิ้น';record.active??='1';}
        if(module==='stock_lots')record.quantity??=1;
        if(module==='delivery_companies')record.active??='1';
        if(module==='shipments'){
          record.quantity??=1;record.status??='preparing';
          if(record.donation_id){
            await optionNames('donations').catch(()=>({}));
            const donOpt=state.optionItems.donations?.[record.donation_id];
            if(donOpt){
              if(!record.note && donOpt.shipping_note)record.note=donOpt.shipping_note;
              if(!record.hadeeya_id && donOpt.hadeeya_id){
                record.hadeeya_id=donOpt.hadeeya_id;
                record.quantity=donOpt.hadeeya_qty||record.quantity||1;
              }
            }
            if(record.hadeeya_id && !record.lot_id){
              await optionNames('stock_lots').catch(()=>({}));
              const fifoLot=Object.values(state.optionItems.stock_lots||{}).find(l=>l.hadeeya_id===record.hadeeya_id && Number(l.quantity||0)>0);
              if(fifoLot)record.lot_id=fifoLot.id;
            }
          }
        }
        if(module==='tasks'){record.assigned_to??=state.user?.id||'';record.due_date??=today;record.priority??='normal';record.status??='open';}
        if(module==='feedback'){record.category??='suggestion';record.channel??='phone';record.status??='new';}
        if(module==='announcements')record.status??='published';
      }
      const fields=await Promise.all(Object.entries(schema.fields).map(([k,v])=>fieldHTML(k,v,record[k]??'',!!id,module,id||'')));
      const shipmentStockNote=module==='shipments'?`<div class="secondary-note" style="margin-top:16px"><strong>📦 ระบบอัตโนมัติสำหรับการจัดส่ง:</strong> เลือกฮาดียะห์แล้วระบบจะเลือกล็อตสต็อกที่มีของ (FIFO) ให้อัตโนมัติ · เลือกรายการบริจาคแล้วดึงที่อยู่ผู้รับให้อัตโนมัติ · พิมพ์เลขพัสดุแล้วปรับสถานะเป็น <em>จัดส่งแล้ว</em> พร้อมลงวันที่ส่งให้อัตโนมัติ</div>`:'';
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
          applyPhoneMask(phoneEl);
          const digits=phoneEl.value.replace(/\D+/g,'');
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
            state.optionItems.contacts=state.optionItems.contacts||{};
            state.optionItems.contacts[newCon.id]=newCon;
            data.contact_id=newCon.id;
            const conTarget=formEl.querySelector('#f_contact_id');
            if(conTarget)conTarget.value=newCon.id;
            const conSearch=conTarget?.closest('.relation-picker')?.querySelector('.relation-search');
            if(conSearch)conSearch.value=newCon.name+(newCon.phone?' ('+newCon.phone+')':'');
            inlineConBox.remove();
            conTarget?.closest('.form-field')?.classList.remove('hidden');
          }
          if(submitBtn)submitBtn.disabled=true;
          await api(id?'record':'module',id?{module,id}:{module},id?'PUT':'POST',data);
          delete state.options[module];delete state.optionItems[module];
          if(module==='shipments'){delete state.options.stock_lots;delete state.optionItems.stock_lots;}
          if(module==='donations'){delete state.options.tasks;delete state.optionItems.tasks;}
          closeModal();toast(module==='donations'&&!id?'บันทึกข้อมูลและส่งต่อ Call Center อัตโนมัติเรียบร้อย':'บันทึกข้อมูลเรียบร้อย');render();
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
            <div class="timeline-card-right" style="display:flex;gap:5px;align-items:center">
              <button type="button" class="btn small primary" data-print-shipment="${esc(sh.id)}" title="พิมพ์ใบปะหน้าพัสดุ" style="padding:2px 8px;font-size:11px">🖨 พิมพ์ป้าย</button>
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
      document.querySelectorAll('[data-print-shipment]').forEach(b=>b.addEventListener('click',()=>openShippingLabels({id:b.dataset.printShipment})));
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
      modal('รายละเอียด • '+schema.label,fields+`<div class="detail-block"><div class="detail-label">รหัสระบบ / เวอร์ชัน</div><div class="detail-value">${esc(r.id)} / v${esc(r.version)}</div></div><div class="form-actions">${module==='contacts'?btn('♙ โปรไฟล์ 360°','profile',''):''}${module==='donations'&&roleAllows('shipments',true)?btn('▰ สร้างรายการจัดส่งฮาดียะห์','create-shipment','primary'):''}${module==='shipments'?btn('🖨 พิมพ์ใบปะหน้าพัสดุ','print-label','primary'):''}${module==='shipments'&&(r.tracking_no||['shipped','delivered'].includes(r.status))?btn('💬 แจ้งพัสดุผู้บริจาค','notify-donor',''):''}${module==='stock_lots'&&roleAllows('inventory_moves',true)?btn('⇄ ปรับสต็อก','movement','primary'):''}${['shipments','campaigns'].includes(module)&&roleAllows(module,true)?btn('⇧ แนบหลักฐาน / ภาพ','upload',''):''}${roleAllows(module,true)&&!schema.readonly?btn('แก้ไขรายการ','edit',''):''}</div>`);
      $('[data-action="edit"]')?.addEventListener('click',()=>openForm(module,id));
      $('[data-action="movement"]')?.addEventListener('click',()=>openMovement(id));
      $('[data-action="upload"]')?.addEventListener('click',()=>openUpload(module,id));
      $('[data-action="create-shipment"]')?.addEventListener('click',()=>openForm('shipments',null,{donation_id:id}));
      $('[data-action="print-label"]')?.addEventListener('click',()=>openShippingLabels({id}));
      $('[data-action="notify-donor"]')?.addEventListener('click',()=>openTrackingNotifyModal(id));
    }catch(e){toast(e.message,true);}
  }
  async function openShippingLabels(opts={}){
    try{
      toast('กำลังเตรียมข้อมูลใบปะหน้าพัสดุ…');
      const params={};
      if(opts.id)params.id=opts.id;
      else if(opts.ids)params.ids=Array.isArray(opts.ids)?opts.ids.join(','):opts.ids;
      else if(opts.preparing)params.preparing=1;
      const data=await api('shipping-labels',params);
      if(!data.labels||data.labels.length===0){
        toast('ไม่พบรายการที่พร้อมพิมพ์ใบปะหน้า',true);
        return;
      }
      const sender=data.sender||{};
      const labels=data.labels;
      const today=fmtIsoDate(new Date());

      const wcLogoSvg=`<svg viewBox="0 0 256 256" width="34" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="256" height="256" rx="62" fill="#172a42"/><path d="M46 77l30 103h28l24-60 24 60h28l30-103h-31l-17 65-22-65h-24l-22 65-17-65z" fill="white"/><circle cx="210" cy="184" r="15" fill="#a2bb3b"/></svg>`;

      function cleanShippingNote(note){
        if(!note || !note.trim()) return '';
        const lines=note.split(/[|\n]/).map(s=>s.trim()).filter(Boolean);
        const filtered=lines.filter(line=>{
          if(/^ผู้รับ\s*[:：]/i.test(line)) return false;
          if(/^โทร\s*[:：]/i.test(line)) return false;
          if(/^ที่อยู่\s*[:：]/i.test(line)) return false;
          return true;
        });
        return filtered.join(' · ').trim();
      }

      function formatShippingRecipientAddress(rawAddress, fallbackProvince=''){
        if(!rawAddress || !rawAddress.trim()) return '<div class="ship-addr-base muted">— ไม่ระบุที่อยู่จัดส่ง —</div>';
        let addr=rawAddress.trim();
        let zipcode='';
        const zipMatch=addr.match(/\b(\d{5})\b/);
        if(zipMatch){
          zipcode=zipMatch[1];
          addr=addr.replace(zipMatch[0],'').trim();
        }
        let province=fallbackProvince||'';
        const provMatch=addr.match(/(?:จังหวัด|จ\.)\s*([^\s]+)/u) || addr.match(/(กรุงเทพมหานคร|กรุงเทพฯ|กทม\.?)/u);
        if(provMatch){
          province=(provMatch[1]==='กรุงเทพฯ'||provMatch[1]==='กทม.'||provMatch[1]==='กทม')?'กรุงเทพมหานคร':(provMatch[1].startsWith('จ')?provMatch[1]:(provMatch[2]||provMatch[1]));
        }
        let district='';
        const distMatch=addr.match(/(อำเภอ|อ\.|เขต)\s*([^\s,]+)/u);
        if(distMatch){
          district=`${distMatch[1]} ${distMatch[2]}`;
        }
        let subdistrict='';
        const subMatch=addr.match(/(ตำบล|ต\.|แขวง)\s*([^\s,]+)/u);
        if(subMatch){
          subdistrict=`${subMatch[1]} ${subMatch[2]}`;
        }

        let cutIndex=addr.length;
        for(const prefix of [subdistrict, district, 'จังหวัด', 'จ.', 'กรุงเทพ']){
          if(prefix){
            const kw=prefix.split(' ')[0];
            const pos=addr.indexOf(kw);
            if(pos>0 && pos<cutIndex) cutIndex=pos;
          }
        }
        const baseStreet=addr.substring(0,cutIndex).trim().replace(/[,]+$/,'');
        const zipBoxes=zipcode?`<div class="ship-zipcode-boxes" title="รหัสไปรษณีย์ ${esc(zipcode)}">${zipcode.split('').map(d=>`<span class="ship-zip-digit">${esc(d)}</span>`).join('')}</div>`:'';

        let html='<div class="ship-address-structured">';
        if(baseStreet && (subdistrict || district || province)){
          html+=`<div class="ship-addr-base">${esc(baseStreet)}</div>`;
          if(subdistrict || district){
            html+=`<div class="ship-addr-subdist">
              ${subdistrict?`<span>${esc(subdistrict)}</span>`:''}
              ${district?`<span>${esc(district)}</span>`:''}
            </div>`;
          }
          html+=`<div class="ship-addr-province">
            <span class="ship-prov-tag">จ. ${esc(province||'—')}</span>
            ${zipBoxes}
          </div>`;
        } else {
          html+=`<div class="ship-addr-base">${esc(rawAddress)}</div>`;
          if(province && !rawAddress.includes(province)){
            html+=`<div class="ship-addr-province"><span class="ship-prov-tag">จ. ${esc(province)}</span> ${zipBoxes}</div>`;
          } else if(zipBoxes){
            html+=`<div class="ship-addr-province">${zipBoxes}</div>`;
          }
        }
        html+='</div>';
        return html;
      }

      const modalHtml=`
        <div id="shipping-label-modal" class="label-modal-backdrop">
          <div class="label-modal-box">
            <div class="label-modal-head">
              <div class="label-modal-title">
                <span>🖨 พิมพ์ใบปะหน้าพัสดุฮาดียะห์ (Shipping Labels)</span>
                <span class="pill green">${num(labels.length)} รายการ</span>
              </div>
              <div class="label-modal-actions">
                <div class="label-paper-switch" title="เลือกขนาดกระดาษสำหรับพิมพ์">
                  <button type="button" class="label-paper-btn active" data-paper="a6">🏷 A6 (105×148 มม. / สติกเกอร์แปะกล่อง)</button>
                  <button type="button" class="label-paper-btn" data-paper="a5">📄 A5 (148×210 มม. / ครึ่ง A4)</button>
                  <button type="button" class="label-paper-btn" data-paper="a4">📑 A4 (4 ป้าย/แผ่น)</button>
                </div>
                <button type="button" class="btn primary btn-label-action" id="do-print-labels">🖨 สั่งพิมพ์ (Print)</button>
                <button type="button" class="btn btn-label-action" id="do-pdf-labels" title="พิมพ์เป็นไฟล์ PDF ผ่านหน้าต่างเบราว์เซอร์">📥 บันทึก PDF</button>
                <button type="button" class="btn" id="close-label-modal">✕ ปิด</button>
              </div>
            </div>
            <div class="label-notice-bar">
              <div>💡 <strong>คำแนะนำการพิมพ์:</strong> รองรับเครื่องพิมพ์ความร้อน (A6) และเครื่องพิมพ์ทั่วไป (A5, A4) · ในหน้าต่างพิมพ์แนะนำตั้งค่า Margins เป็น <em>"None (ไม่มีขอบ)"</em> เพื่อสัดส่วนที่พอดีที่สุด</div>
              <div class="muted">วันที่: ${esc(today)}</div>
            </div>
            <div class="label-preview-stage">
              <div id="print-labels-container" class="paper-a6">
                ${labels.map(lbl=>{
                  const cleanNote=cleanShippingNote(lbl.note);
                  const formattedPhone=formatThaiPhone(lbl.recipient.phone||'');
                  const addrHtml=formatShippingRecipientAddress(lbl.recipient.address, lbl.recipient.province);
                  const barcodeText=lbl.tracking_no || lbl.barcode_text || '';
                  return `
                    <div class="ship-label">
                      <!-- Header: Brand & Courier -->
                      <div class="ship-label-head">
                        <div class="ship-brand-group">
                          <div class="ship-brand-logo">${wcLogoSvg}</div>
                          <div class="ship-brand-text">
                            <span class="ship-brand-title">WHITE CHANNEL</span>
                            <span class="ship-brand-sub">ใบนำส่งพัสดุของที่ระลึก (ฮาดียะห์)</span>
                            <span class="ship-brand-org">มูลนิธิศรัทธาชนเพื่อการศึกษาและเด็กกำพร้า</span>
                          </div>
                        </div>
                        <div class="ship-head-meta">
                          <span class="ship-courier-tag">🚚 ${esc(lbl.courier_name||'พัสดุด่วน')}</span>
                        </div>
                      </div>

                      <!-- Sender & Internal Reference Bar -->
                      <div class="ship-sender-bar">
                        <div class="ship-sender-info">
                          <div class="ship-sender-label">ผู้ส่ง (FROM / SENDER)</div>
                          <div class="ship-sender-name">${esc(sender.name||'สถานีโทรทัศน์ไวท์แชนแนล (White Channel)')}</div>
                          <div class="ship-sender-detail">${esc(sender.address||'58 ซ.รามคำแหง 60 แยก 7 แขวงหัวหมาก เขตบางกะปิ กทม. 10240')} · โทร. ${esc(sender.phone||'02-103-6000')}</div>
                        </div>
                        <div class="ship-ref-info">
                          <div class="ship-ref-title">เลขอ้างอิงบริจาค</div>
                          <div class="ship-ref-code">${esc(lbl.donation_barcode||lbl.shipment_id.slice(0,12))}</div>
                        </div>
                      </div>

                      <!-- Recipient Card (High Prominence) -->
                      <div class="ship-recipient-card">
                        <div class="ship-to-header">
                          <span class="ship-to-badge">📍 ผู้รับพัสดุ (TO / RECIPIENT)</span>
                          <span class="ship-to-subtag">✓ ตรวจสอบผู้รับแล้ว</span>
                        </div>
                        <div class="ship-to-name">${esc(lbl.recipient.name||'ผู้บริจาค (ไม่ระบุนาม)')}</div>
                        <div class="ship-to-phone-row">
                          <div class="ship-phone-badge" title="เบอร์โทรผู้รับสำหรับเจ้าหน้าที่ขนส่ง">
                            <span class="phone-icon">📞</span>
                            <span class="phone-digits">${esc(formattedPhone || '—')}</span>
                          </div>
                        </div>
                        ${addrHtml}
                      </div>

                      <!-- Packing Checklist (Warehouse & Picking) -->
                      <div class="ship-checklist-card">
                        <div class="ship-checklist-title">
                          <span>📦 รายการของที่ระลึกที่ต้องบรรจุ (Packing Checklist)</span>
                        </div>
                        <table class="ship-checklist-table">
                          <thead>
                            <tr>
                              <th class="ship-th-item">รายการของที่ระลึก</th>
                              <th class="ship-th-lot">รหัส LOT</th>
                              <th class="ship-th-loc">ที่เก็บ</th>
                              <th class="ship-th-qty">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td class="ship-td-item">
                                <div class="ship-item-name">${esc(lbl.item.name)}</div>
                                ${lbl.item.sku?`<div class="ship-item-sku">SKU: ${esc(lbl.item.sku)}</div>`:''}
                              </td>
                              <td class="ship-td-lot"><span class="ship-lot-badge">${esc(lbl.item.lot_code||'—')}</span></td>
                              <td class="ship-td-loc"><span class="ship-loc-badge">${esc(lbl.item.location||'คลังหลัก')}</span></td>
                              <td class="ship-td-qty"><span class="ship-qty-badge">${num(lbl.item.quantity)} ${esc(lbl.item.unit)}</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <!-- Delivery Note (Only genuine notes, no duplicate recipient) -->
                      ${cleanNote?`
                        <div class="ship-custom-note">
                          <strong>📌 หมายเหตุจัดส่ง:</strong> ${esc(cleanNote)}
                        </div>
                      `:''}

                      <!-- Barcode & Tracking Section -->
                      <div class="ship-barcode-card">
                        <div class="ship-barcode-wrap">
                          ${lbl.barcode_svg||''}
                        </div>
                        <div class="ship-tracking-title">
                          ${lbl.tracking_no?`TRACKING NO: ${esc(lbl.tracking_no)}`:`REF: ${esc(barcodeText)}`}
                        </div>
                        <div class="ship-tracking-refs">
                          <span>รหัสจัดส่ง: <code>${esc(lbl.shipment_id)}</code></span>
                          ${lbl.donation_barcode?`<span>อ้างอิง: <code>${esc(lbl.donation_barcode)}</code></span>`:''}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      $('#shipping-label-modal')?.remove();
      document.body.insertAdjacentHTML('beforeend',modalHtml);
      const modalEl=$('#shipping-label-modal');
      const containerEl=$('#print-labels-container');
      modalEl.querySelectorAll('[data-paper]').forEach(b=>{
        b.onclick=()=>{
          modalEl.querySelectorAll('[data-paper]').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          const paper=b.dataset.paper;
          containerEl.className='paper-'+paper;
        };
      });

      const executePrint=()=>{
        const oldTitle=document.title;
        document.title=`Shipping_Labels_WhiteChannel_${today}`;
        window.print();
        setTimeout(()=>{document.title=oldTitle;},1000);
      };

      $('#do-print-labels').onclick=executePrint;
      $('#do-pdf-labels').onclick=()=>{
        toast('เลือก "Save as PDF" หรือ "บันทึกเป็น PDF" ในหน้าต่างพิมพ์');
        executePrint();
      };

      const closePrintModal=()=>{modalEl.remove();document.removeEventListener('keydown',handleEsc);};
      const handleEsc=e=>{if(e.key==='Escape')closePrintModal();};
      $('#close-label-modal').onclick=closePrintModal;
      modalEl.onclick=e=>{if(e.target===modalEl)closePrintModal();};
      document.addEventListener('keydown',handleEsc);
    }catch(e){toast(e.message||'ไม่สามารถโหลดใบปะหน้าพัสดุได้',true);}
  }
  async function openQuickDispatchModal(shipmentId){
    try{
      const r=(await api('record',{module:'shipments',id:shipmentId})).record;
      await optionNames('delivery_companies').catch(()=>({}));
      await optionNames('hadeeya').catch(()=>({}));
      const couriers=state.options.delivery_companies||{};
      const today=fmtIsoDate(new Date());
      const hadeeyaName=state.options.hadeeya?.[r.hadeeya_id]||r.hadeeya_id||'ฮาดียะห์';

      const modalHtml=`
        <form id="quick-dispatch-form" class="stack" style="display:grid;gap:16px">
          <div style="background:var(--card-sub);padding:13px 15px;border-radius:11px;border:1px solid var(--line);font-size:12.5px;line-height:1.55">
            <div><strong>รายการจัดส่ง:</strong> <span class="muted">${esc(r.id)}</span></div>
            <div><strong>ของที่ระลึก:</strong> <strong>${esc(hadeeyaName)}</strong> (จำนวน ${num(r.quantity||1)} ชิ้น)</div>
          </div>

          <label class="form-field">
            <span class="field-title">หมายเลขพัสดุ (Tracking No.)</span>
            <input type="text" name="tracking_no" id="dispatch-tracking-input" value="${esc(r.tracking_no||'')}" placeholder="เช่น EF123456789TH หรือยิงบาร์โค้ดจากม้วนสติกเกอร์ขนส่ง…" autofocus>
          </label>

          <div class="form-grid">
            <label class="form-field">
              <span class="field-title">บริษัทขนส่ง</span>
              <select name="delivery_company_id">
                <option value="">— เลือกขนส่ง (ถ้ามี) —</option>
                ${Object.entries(couriers).map(([cid,cname])=>`<option value="${esc(cid)}" ${r.delivery_company_id===cid?'selected':''}>${esc(cname)}</option>`).join('')}
              </select>
            </label>

            <label class="form-field">
              <span class="field-title">วันที่ส่งพัสดุ</span>
              <input type="date" name="sent_at" value="${esc(r.sent_at||today)}">
            </label>
          </div>

          <p class="secondary-note" style="margin:0">📦 เมื่อบันทึก ระบบจะปรับสถานะเป็น <strong>"จัดส่งแล้ว"</strong> และตัดสต็อกจากล็อตให้อัตโนมัติ</p>

          <div class="form-actions" style="margin-top:14px;padding-top:14px">
            <button type="button" class="btn" id="cancel-modal">ยกเลิก</button>
            <button type="submit" class="btn primary" style="font-weight:800;gap:6px">🚚 บันทึกการจัดส่ง</button>
          </div>
        </form>
      `;

      modal('🚚 บันทึกการจัดส่งพัสดุ', modalHtml);
      $('#cancel-modal').onclick=closeModal;
      setTimeout(()=>$('#dispatch-tracking-input')?.focus(),120);

      $('#quick-dispatch-form').onsubmit=async e=>{
        e.preventDefault();
        const fd=new FormData(e.target);
        const trackingNo=(fd.get('tracking_no')||'').trim();
        const courierId=fd.get('delivery_company_id')||'';
        const sentAt=fd.get('sent_at')||today;
        try{
          await api('quick-status',{},'POST',{
            module:'shipments',
            id:shipmentId,
            field:'status',
            value:'shipped',
            tracking_no:trackingNo,
            delivery_company_id:courierId,
            sent_at:sentAt
          });
          delete state.options.stock_lots;
          closeModal();
          toast('บันทึกการจัดส่งเรียบร้อยแล้ว');
          render();
          if(trackingNo){
            setTimeout(()=>openTrackingNotifyModal(shipmentId), 180);
          }
        }catch(err){
          toast(err.message,true);
        }
      };
    }catch(err){
      toast(err.message,true);
    }
  }
  async function confirmReturnShipment(shipmentId){
    if(!confirm('ยืนยันบันทึกเป็น "พัสดุตีกลับ" หรือไม่?\n\n• ระบบจะปรับสถานะเป็น ตีกลับ (คืนสต็อก)\n• นำของที่ระลึกคืนเข้าสต็อกในคลังให้อัตโนมัติ\n• สร้างงานติดตามให้ Call Center โทรตรวจสอบที่อยู่ใหม่'))return;
    try{
      await api('quick-status',{},'POST',{module:'shipments',id:shipmentId,field:'status',value:'returned'});
      delete state.options.stock_lots;
      toast('บันทึกพัสดุตีกลับและคืนสต็อกเรียบร้อย');
      render();
    }catch(err){
      toast(err.message,true);
    }
  }
  async function openTrackingNotifyModal(shipmentId){
    try{
      toast('กำลังดึงข้อมูลพัสดุและจัดเตรียมข้อความ…');
      const data=await api('shipping-labels',{id:shipmentId});
      const lbl=data.labels?.[0];
      if(!lbl)throw new Error('ไม่พบข้อมูลรายการจัดส่งนี้');

      const recipName=lbl.recipient?.name||'ผู้มีจิตศรัทธา';
      const recipPhone=lbl.recipient?.phone||'';
      const cleanPhone=recipPhone.replace(/\D/g,'');
      const itemName=lbl.item?.name||'ของที่ระลึก ฮาดียะห์ White Channel';
      const itemQty=lbl.item?.quantity||1;
      const itemUnit=lbl.item?.unit||'ชิ้น';
      const courierName=lbl.courier_name||'ขนส่งพัสดุด่วน';
      const trackingNo=lbl.tracking_no||'—';
      const trackingUrl=lbl.tracking_url||(trackingNo!=='—'?`https://www.google.com/search?q=${encodeURIComponent(trackingNo)}`:'');

      let defaultMsg=`เรียน คุณ${recipName}\n`;
      defaultMsg+=`มูลนิธิศรัทธาชนเพื่อการศึกษาและเด็กกำพร้า (White Channel) ขอขอบพระคุณท่านเป็นอย่างยิ่งที่ได้ร่วมบริจาคสนับสนุน\n\n`;
      defaultMsg+=`ทางมูลนิธิฯ ได้จัดส่งของที่ระลึกฮาดียะห์ "${itemName}" (${itemQty} ${itemUnit}) ให้ท่านเรียบร้อยแล้วครับ\n\n`;
      defaultMsg+=`🚚 ขนส่ง: ${courierName}\n`;
      defaultMsg+=`📦 หมายเลขพัสดุ (Tracking No.): ${trackingNo}\n`;
      if(trackingUrl){
        defaultMsg+=`🔍 ตรวจสอบสถานะการจัดส่งได้ที่:\n${trackingUrl}\n`;
      }
      defaultMsg+=`\nขออัลลอฮฺทรงตอบแทนความดีงามและความจำเริญแด่ท่านและครอบครัวครับ (ญะซากุมุลลอฮุค็อยร็อน)`;

      const lineShareUrl=`https://line.me/R/msg/text/?${encodeURIComponent(defaultMsg)}`;
      const smsUrl=cleanPhone?`sms:${cleanPhone}?body=${encodeURIComponent(defaultMsg)}`:'';

      const modalHtml=`
        <div class="stack" style="display:grid;gap:14px">
          <div style="background:var(--card-sub);padding:14px 16px;border-radius:12px;border:1px solid var(--line);display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;font-size:12.5px">
            <div><span class="muted">ผู้รับ:</span> <strong>${esc(recipName)}</strong></div>
            <div><span class="muted">เบอร์โทร:</span> ${recipPhone?`<a href="tel:${esc(cleanPhone)}" style="color:var(--accent-text);font-weight:700">📞 ${esc(recipPhone)}</a>`:'—'}</div>
            <div><span class="muted">ขนส่ง:</span> <strong>${esc(courierName)}</strong></div>
            <div><span class="muted">เลขพัสดุ:</span> <strong style="font-family:monospace;font-size:13px">${esc(trackingNo)}</strong> ${trackingUrl?`<a href="${esc(trackingUrl)}" target="_blank" rel="noopener" class="pill green" style="padding:1px 6px;margin-left:4px;font-size:10px">↗ เช็กพัสดุ</a>`:''}</div>
          </div>

          <div>
            <label class="form-field" style="margin-top:0">
              <span class="field-title" style="display:flex;justify-content:space-between;align-items:center">
                <span>ข้อความแจ้งผู้บริจาค (สามารถแก้ไขเพิ่มเติมได้ก่อนกดก๊อปปี้)</span>
                <span class="muted" style="font-weight:normal;font-size:11px">พร้อมส่งใน LINE หรือ SMS ทันที</span>
              </span>
              <textarea id="notify-msg-text" rows="10" style="font-size:13px;line-height:1.6;font-family:inherit">${esc(defaultMsg)}</textarea>
            </label>
          </div>

          <div class="form-actions" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:14px">
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn primary" id="btn-copy-notify-msg" style="gap:6px">
                <span>📋 คัดลอกข้อความ (Copy)</span>
              </button>
              <a href="${esc(lineShareUrl)}" target="_blank" rel="noopener" class="btn" style="background:#06c755;color:#fff;border-color:#06c755;gap:6px" id="btn-line-share">
                <span>🟢 เปิดแชร์เข้า LINE</span>
              </a>
              ${cleanPhone?`<a href="${esc(smsUrl)}" class="btn" style="gap:6px" id="btn-sms-send"><span>📱 ส่ง SMS</span></a>`:''}
            </div>
            <button type="button" class="btn ghost" id="notify-modal-close">ปิด</button>
          </div>
        </div>
      `;

      modal('💬 ข้อความแจ้งเลขพัสดุผู้บริจาค (LINE / SMS)', modalHtml, true);
      $('#notify-modal-close')?.addEventListener('click', closeModal);

      const msgArea=$('#notify-msg-text');
      const lineBtn=$('#btn-line-share');
      const smsBtn=$('#btn-sms-send');
      msgArea?.addEventListener('input',()=>{
        const txt=msgArea.value;
        if(lineBtn)lineBtn.href=`https://line.me/R/msg/text/?${encodeURIComponent(txt)}`;
        if(smsBtn&&cleanPhone)smsBtn.href=`sms:${cleanPhone}?body=${encodeURIComponent(txt)}`;
      });

      $('#btn-copy-notify-msg')?.addEventListener('click', async ()=>{
        const txt=msgArea?.value||defaultMsg;
        try{
          if(navigator.clipboard && window.isSecureContext){
            await navigator.clipboard.writeText(txt);
          } else {
            const ta=document.createElement('textarea');
            ta.value=txt;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
          }
          toast('✓ คัดลอกข้อความเรียบร้อย นำไปวางใน LINE หรือแชทได้ทันที!');
        }catch(e){
          toast('คัดลอกไม่สำเร็จ โปรดลากแถบดำเพื่อคัดลอกด้วยตนเอง', true);
        }
      });
    }catch(err){
      toast(err.message,true);
    }
  }
  async function openBatchImportTrackingModal(){
    const couriers=state.optionItems?.delivery_companies||{};
    const courierOptions=Object.values(couriers).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    const today=new Date().toISOString().slice(0,10);

    const parseTrackingInput=(raw)=>{
      const lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
      const items=[];
      const isTracking=t=>/^(TH\d|[A-Z]{2}\d{9}[A-Z]{2}|JT\w+|KEX\w+|KER\w+|SHP\w+|SPX\w+|\d{10,22})/i.test(t);

      const cleanMatchKey=(str)=>{
        const rcp=str.match(/RCP-[\w-]+/i);
        if(rcp)return rcp[0];
        const shp=str.match(/shp_[\w-]+/i);
        if(shp)return shp[0];
        const phone=str.match(/0[2-9][0-9-]{7,11}/);
        if(phone)return phone[0];
        return str.trim();
      };

      let pendingRef=null;
      let pendingTracking=null;

      for(let i=0;i<lines.length;i++){
        const line=lines[i];
        let parts=line.split(/[\t,;|]/).map(p=>p.trim()).filter(Boolean);
        if(parts.length<2)parts=line.split(/\s+/).map(p=>p.trim()).filter(Boolean);

        if(parts.length>=2){
          let tracking='';
          let match='';
          const trkIdx=parts.findIndex(isTracking);
          if(trkIdx!==-1){
            tracking=parts[trkIdx];
            const rest=parts.filter((_,idx)=>idx!==trkIdx);
            match=rest.join(' ');
          } else {
            match=parts.join(' ');
          }

          if(tracking && match){
            items.push({tracking_no:tracking,match:cleanMatchKey(match)});
            pendingRef=null;pendingTracking=null;
            continue;
          } else {
            if(pendingTracking){
              items.push({tracking_no:pendingTracking,match:cleanMatchKey(match)});
              pendingTracking=null;
              continue;
            } else {
              pendingRef=match;
              continue;
            }
          }
        }

        const single=parts[0]||line;
        if(isTracking(single)){
          if(pendingRef){
            items.push({tracking_no:single,match:cleanMatchKey(pendingRef)});
            pendingRef=null;
          } else {
            pendingTracking=single;
          }
        } else {
          if(pendingTracking){
            items.push({tracking_no:pendingTracking,match:cleanMatchKey(single)});
            pendingTracking=null;
          } else {
            pendingRef=single;
          }
        }
      }
      return items;
    };

    const modalHtml=`
      <div class="stack" style="display:grid;gap:14px">
        <div class="secondary-note" style="font-size:12px;line-height:1.6">
          <strong>💡 วิธีนำเข้าเลขพัสดุ (ยืดหยุ่นสูง วางได้ทันที):</strong>
          <br>• <strong>ในบรรทัดเดียวกัน:</strong> คั่นด้วยเคาะเว้นวรรค แท็บ หรือเครื่องหมายจุลภาค <code>,</code> เช่น:
          <br>&nbsp;&nbsp;<code>TH8899001122B  RCP-20261111-001</code> หรือ <code>TH8899001122B  081-234-5678</code>
          <br>• <strong>สลับหน้าหลังได้:</strong> <code>RCP-20261111-001  TH8899001122B</code> (ระบบแยกแยะเลขพัสดุและเลขอ้างอิงให้อัตโนมัติ)
          <br>• <strong>คนละบรรทัด:</strong> บรรทัดหนึ่งเป็นเลขอ้างอิง/เบอร์โทร และอีกบรรทัดเป็นเลขพัสดุ ระบบก็จับคู่ให้เองได้ครับ
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span class="field-title">บริษัทขนส่ง</span>
            <select id="import-courier-select">
              <option value="">— เลือกบริษัทขนส่ง (ถ้ามี) —</option>
              ${courierOptions}
            </select>
          </label>
          <label class="form-field">
            <span class="field-title">วันที่จัดส่ง</span>
            <input type="date" id="import-sent-date" value="${today}">
          </label>
          <label class="form-field field-full">
            <span class="field-title">เลือกไฟล์ CSV หรือ TXT (หรือวางข้อความด้านล่างโดยตรง)</span>
            <input type="file" id="import-file-input" accept=".csv,.txt">
          </label>
          <label class="form-field field-full">
            <span class="field-title">กล่องข้อความข้อมูลพัสดุ (คัดลอกจาก Excel มาวางได้เลย) <span class="req-star">*</span></span>
            <textarea id="import-raw-text" rows="7" placeholder="วางข้อมูลที่นี่ เช่น:\nTH8899001122B  RCP-20261111-001\nEF582568151TH  081-234-5678\nJTTH208578789576  อับดุลเลาะห์"></textarea>
            <div id="import-preview-box" style="margin-top:8px;padding:8px 12px;border-radius:8px;background:var(--card-sub);border:1px solid var(--line);font-size:12px;display:none"></div>
          </label>
        </div>

        <div class="form-actions" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:14px">
          <span id="import-status-text" class="muted" style="font-size:12px">ยังไม่ได้นำเข้า</span>
          <div style="display:flex;gap:10px">
            <button type="button" class="btn" id="btn-cancel-import">ยกเลิก</button>
            <button type="button" class="btn primary" id="btn-execute-import" style="gap:6px">
              <span>✓ นำเข้าและอัปเดตสถานะจัดส่ง</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal('📥 นำเข้าเลขพัสดุเป็นชุด (Batch Tracking Import)', modalHtml, true);
    $('#btn-cancel-import')?.addEventListener('click', closeModal);

    const rawArea=$('#import-raw-text');
    const previewBox=$('#import-preview-box');
    const statusText=$('#import-status-text');

    const updateLivePreview=()=>{
      const raw=(rawArea?.value||'').trim();
      if(!raw){
        if(previewBox)previewBox.style.display='none';
        if(statusText)statusText.textContent='ยังไม่ได้ระบุข้อมูล';
        return;
      }
      const items=parseTrackingInput(raw);
      if(items.length>0){
        previewBox.style.display='block';
        previewBox.innerHTML=`
          <div style="color:var(--accent-text);font-weight:750;margin-bottom:5px">✓ ตรวจพบ ${num(items.length)} รายการที่พร้อมนำเข้า:</div>
          <div style="display:grid;gap:4px;max-height:120px;overflow-y:auto;padding-right:4px">
            ${items.slice(0,5).map((it,idx)=>`
              <div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);padding:3px 8px;border-radius:5px">
                <span class="muted">${idx+1}.</span>
                <span>เลขพัสดุ: <strong style="font-family:monospace;color:var(--text)">${esc(it.tracking_no)}</strong></span>
                <span class="muted">➔</span>
                <span>อ้างอิง: <span class="pill" style="font-size:11px;padding:1px 6px">${esc(it.match)}</span></span>
              </div>
            `).join('')}
            ${items.length>5?`<div class="muted" style="font-size:11px;margin-top:2px">…และอีก ${num(items.length-5)} รายการ</div>`:''}
          </div>
        `;
        if(statusText)statusText.textContent=`พร้อมนำเข้า ${num(items.length)} รายการ`;
      } else {
        previewBox.style.display='block';
        previewBox.innerHTML=`<span style="color:#eab308">⚠️ ยังไม่พบรูปแบบคู่เลขพัสดุกับข้อมูลอ้างอิง กรุณาตรวจสอบข้อความ</span>`;
        if(statusText)statusText.textContent='ยังไม่พบข้อมูลที่ตรงรูปแบบ';
      }
    };

    rawArea?.addEventListener('input', updateLivePreview);

    $('#import-file-input')?.addEventListener('change', e=>{
      const file=e.target.files?.[0];
      if(!file)return;
      const reader=new FileReader();
      reader.onload=evt=>{
        rawArea.value=evt.target.result;
        updateLivePreview();
      };
      reader.readAsText(file);
    });

    $('#btn-execute-import')?.addEventListener('click', async ()=>{
      const raw=(rawArea?.value||'').trim();
      if(!raw){
        toast('กรุณาระบุข้อมูลเลขพัสดุในช่องข้อความ', true);
        return;
      }

      const items=parseTrackingInput(raw);

      if(!items.length){
        toast('ไม่พบรูปแบบ "เลขพัสดุ และ ข้อมูลอ้างอิง" ในข้อความที่ระบุ กรุณาตรวจสอบ', true);
        return;
      }

      const btn=$('#btn-execute-import');
      btn.disabled=true;
      btn.textContent='กำลังนำเข้าและจับคู่ข้อมูล…';

      try{
        const courierId=$('#import-courier-select')?.value||'';
        const sentAt=$('#import-sent-date')?.value||today;

        const res=await api('import-tracking',{},'POST',{
          items,
          courier_id:courierId,
          sent_at:sentAt
        });

        closeModal();
        delete state.options.stock_lots;
        toast(`✓ นำเข้าสำเร็จ ${res.updated_count} รายการ${res.failed_count>0?` (ไม่พบ ${res.failed_count} รายการ)`:''}`);
        render();
      }catch(err){
        toast(err.message,true);
        btn.disabled=false;
        btn.innerHTML='<span>✓ นำเข้าและอัปเดตสถานะจัดส่ง</span>';
      }
    });
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
  let cachedThailandGeo = null;
  async function loadThailandGeo(){
    if(cachedThailandGeo) return cachedThailandGeo;
    const res = await fetch('assets/thailand-map.json', {credentials:'same-origin'});
    if(!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลพิกัดแผนที่ประเทศไทยได้');
    cachedThailandGeo = await res.json();
    return cachedThailandGeo;
  }
  const regionLabelLookup = {
    south:'ภาคใต้', bkk_metro:'กรุงเทพฯ และปริมณฑล', central:'ภาคกลาง',
    northeast:'ภาคตะวันออกเฉียงเหนือ', north:'ภาคเหนือ', east:'ภาคตะวันออก', west:'ภาคตะวันตก', unknown:'ไม่ระบุจังหวัด'
  };
  let repCampaignMode = 'share';
  let repProvinceSort = 'amount';
  let repRegionFilter = 'all';

  async function reports(){
    const [a, thGeo] = await Promise.all([
      api('summary',{...(state.dateFrom?{date_from:state.dateFrom}:{}),...(state.dateTo?{date_to:state.dateTo}:{})}),
      loadThailandGeo().catch(()=>null)
    ]);
    const c=a.counts||{};
    const periodNote=(state.dateFrom||state.dateTo)?`ช่วงวันที่ ${state.dateFrom||'เริ่มต้น'} ถึง ${state.dateTo||'ปัจจุบัน'}`:'ข้อมูลสะสมทุกช่วงเวลา';
    const activeProvinces=(a.by_province||[]).filter(p=>p.province&&p.province!=='ไม่ระบุจังหวัด');
    const activeRegions=(a.by_region||[]).filter(r=>r.region!=='unknown'&&(Number(r.amount_satang)||0)>0);
    const stats=[
      ['ยอดบริจาคยืนยันแล้ว',money(a.confirmed_satang),'donations',`${num(a.confirmed_count||0)} บิลยืนยัน · เฉลี่ย ${money(a.avg_donation_satang||0)}/บิล`],
      ['ยอดบริจาครอตรวจสอบ',money(a.pending_satang||0),'donations',`${num(a.donation_status?.pending||0)} รายการรอตรวจสอบ`],
      ['ผู้บริจาคที่ร่วมบริจาค',`${num(a.unique_donors_count||0)} คน`,'contacts',`จากฐานสมาชิกทั้งหมด ${num(c.contacts||0)} คน`],
      ['พื้นที่ผู้บริจาคทั่วประเทศ',`${num(activeProvinces.length)} จังหวัด`,'campaigns',`ครอบคลุม ${num(activeRegions.length)} ภูมิภาค`]
    ];
    const trend=buildTrendChart(a.by_month, a.by_month_counts||{}, 'ไม่มีรายการบริจาคที่ยืนยันในช่วงเวลานี้', currentChartMode);
    const campDetails=Array.isArray(a.campaign_details)?a.campaign_details:[];
    const provinces=Array.isArray(a.by_province)?a.by_province:[];
    const regions=Array.isArray(a.by_region)?a.by_region:[];

    const provDataMap={};
    provinces.forEach(p=>{provDataMap[p.province]=p;});
    const geoProvMap={};
    if(thGeo?.provinces){thGeo.provinces.forEach(gp=>{geoProvMap[gp.th]=gp;});}

    const renderCampaignList=(mode)=>{
      if(!campDetails.length)return '<div class="empty">ไม่มีข้อมูลโครงการในช่วงเวลานี้</div>';
      const maxAmt=Math.max(1,...campDetails.map(x=>Number(x.amount_satang)||0));
      return `<div class="rank-list">${campDetails.slice(0,10).map((cam,idx)=>{
        const amt=Number(cam.amount_satang)||0;
        const goal=Number(cam.goal_satang)||0;
        const hasGoal=goal>0;
        const goalPct=hasGoal?Math.round((amt/goal)*100):0;
        const barPct=mode==='goal'
          ?(hasGoal?Math.min(100,Math.max(0,goalPct)):Math.min(100,Math.max(0,Math.round((amt/maxAmt)*100))))
          :Math.min(100,Math.max(0,Math.round((amt/maxAmt)*100)));
        const rankCls=idx===0?'top-1':idx===1?'top-2':idx===2?'top-3':'';
        const overGoal=mode==='goal'&&hasGoal&&goalPct>=100;
        const metaRight=mode==='goal'
          ?(hasGoal?`เป้าหมาย ${money(goal)} (${num(goalPct)}%)`:'ไม่จำกัดเป้าหมาย')
          :`${num(cam.count||0)} รายการ · สัดส่วน ${cam.share_pct||0}%`;
        return `<div class="rank-card">
          <div class="rank-row-top">
            <div class="rank-left">
              <span class="rank-num ${rankCls}">${idx+1}</span>
              <div class="rank-title-wrap">
                <div class="rank-title">${esc(cam.name)} ${hasGoal&&goalPct>=100?'<span class="pill green">ทะลุเป้าหมาย</span>':''}</div>
                <div class="rank-meta"><span>${num(cam.count||0)} บิลยืนยัน</span><span>·</span><span>${esc(metaRight)}</span></div>
              </div>
            </div>
            <div class="rank-right">
              <strong class="rank-amount">${money(amt)}</strong>
              <span class="rank-share">${mode==='goal'&&hasGoal?`${num(goalPct)}% ของเป้า`:`${cam.share_pct||0}% ของยอดรวม`}</span>
            </div>
          </div>
          <div class="progress-line compact"><div class="w-pct-${barPct} ${overGoal?'goal-over':''}"></div></div>
        </div>`;
      }).join('')}</div>`;
    };

    const regionMapMeta={};
    regions.forEach(r=>{regionMapMeta[r.region]=r;});
    const maxProvAmt=Math.max(1,...activeProvinces.map(p=>Number(p.amount_satang)||0));
    const provHeatClass=(provName)=>{
      const amt=Number(provDataMap[provName]?.amount_satang||0);
      if(amt<=0)return 'heat-0';
      const norm=Math.sqrt(amt/maxProvAmt);
      if(norm>=0.82)return 'heat-4';
      if(norm>=0.56)return 'heat-3';
      if(norm>=0.32)return 'heat-2';
      return 'heat-1';
    };

    const buildRealThailandMapSvg=()=>{
      if(!thGeo?.provinces?.length){
        return '<div class="empty">ไม่พบข้อมูลแผนที่จังหวัด</div>';
      }
      const [vx,vy,vw,vh]=thGeo.viewBox||[0,0,608,1080];
      const pathsHtml=thGeo.provinces.map(gp=>{
        const pStat=provDataMap[gp.th];
        const hCls=provHeatClass(gp.th);
        const dimCls=(repRegionFilter!=='all'&&gp.reg!==repRegionFilter)?'dimmed':'';
        const tip=pStat
          ?`${gp.th} (${regionLabelLookup[gp.reg]||''}) — ยอด ${money(pStat.amount_satang)} | ผู้บริจาค ${num(pStat.donor_count)} คน (${num(pStat.count)} บิล)`
          :`${gp.th} (${regionLabelLookup[gp.reg]||''}) — ยังไม่มีรายการบริจาคในช่วงเวลานี้`;
        return `<path class="th-prov-path ${hCls} ${dimCls}" data-prov-poly="${esc(gp.th)}" data-prov-reg="${esc(gp.reg)}" d="${gp.d}"><title>${esc(tip)}</title></path>`;
      }).join('');

      // Place proportional markers + non-overlapping labels for top provinces
      const placedLabels=[];
      const pinsHtml=activeProvinces.map((p,idx)=>{
        const gp=geoProvMap[p.province];
        if(!gp)return '';
        const ratio=Math.sqrt((Number(p.amount_satang)||0)/maxProvAmt);
        const rDot=Math.round(5 + ratio*6);
        const rPulse=rDot+6;
        let showLbl=false;
        if(idx<8){
          const tooClose=placedLabels.some(([px,py])=>Math.abs(px-gp.cx)<85 && Math.abs(py-gp.cy)<30);
          if(!tooClose){
            showLbl=true;
            placedLabels.push([gp.cx,gp.cy]);
          }
        }
        const lx=gp.cx>=290?gp.cx+rDot+6:gp.cx-rDot-6;
        const anchor=gp.cx>=290?'start':'end';
        return `<g class="th-prov-pin" data-prov="${esc(p.province)}" data-reg="${esc(p.region)}">
          <circle class="pin-pulse" cx="${gp.cx}" cy="${gp.cy}" r="${rPulse}"></circle>
          <circle class="pin-dot" cx="${gp.cx}" cy="${gp.cy}" r="${rDot}"></circle>
          ${showLbl?`<text class="th-map-label" x="${lx}" y="${gp.cy+5}" text-anchor="${anchor}">${esc(p.province)}</text>`:''}
        </g>`;
      }).join('');

      return `<div class="th-map-viewport" id="th-map-viewport">
        <div class="th-map-badge" id="th-map-badge">77 จังหวัด · ซูม 1.0×</div>
        <div class="th-map-controls">
          <button type="button" class="th-zoom-btn" id="th-zoom-in" title="ซูมเข้า (+)">＋</button>
          <button type="button" class="th-zoom-btn" id="th-zoom-out" title="ซูมออก (−)">−</button>
          <button type="button" class="th-zoom-btn" id="th-zoom-reset" title="รีเซ็ตมุมมองทั้งประเทศ">⟲</button>
        </div>
        <svg class="th-map-svg" id="th-real-svg" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" aria-label="แผนที่ขอบเขต 77 จังหวัดประเทศไทย">
          <g id="th-provinces-layer">${pathsHtml}</g>
          <g id="th-pins-layer">${pinsHtml}</g>
        </svg>
      </div>`;
    };

    const renderProvinceList=(sortMode,regFilter)=>{
      const filtered=provinces.filter(p=>regFilter==='all'||p.region===regFilter);
      if(!filtered.length)return '<div class="empty">ไม่มีข้อมูลผู้บริจาคในภูมิภาคที่เลือก</div>';
      const sorted=[...filtered].sort((x,y)=>sortMode==='donors'
        ?(y.donor_count-x.donor_count || y.amount_satang-x.amount_satang)
        :(y.amount_satang-x.amount_satang || y.donor_count-x.donor_count));
      const maxVal=Math.max(1,...sorted.map(x=>sortMode==='donors'?(Number(x.donor_count)||0):(Number(x.amount_satang)||0)));
      return `<div class="rank-list prov-scroll-list">${sorted.map((p,idx)=>{
        const val=sortMode==='donors'?(Number(p.donor_count)||0):(Number(p.amount_satang)||0);
        const pct=Math.min(100,Math.max(0,Math.round((val/maxVal)*100)));
        const rankCls=idx===0?'top-1':idx===1?'top-2':idx===2?'top-3':'';
        return `<div class="rank-card" data-prov-row="${esc(p.province)}">
          <div class="rank-row-top">
            <div class="rank-left">
              <span class="rank-num ${rankCls}">${idx+1}</span>
              <div class="rank-title-wrap">
                <div class="rank-title">${esc(p.province)} <span class="pill">${esc(p.region_label)}</span></div>
                <div class="rank-meta">
                  <span>ผู้บริจาค ${num(p.donor_count)} คน</span>
                  <span>·</span>
                  <span>${num(p.count)} รายการ</span>
                  <span>·</span>
                  <span>เฉลี่ย ${money(p.avg_satang)}/บิล</span>
                </div>
              </div>
            </div>
            <div class="rank-right">
              <strong class="rank-amount">${sortMode==='donors'?`${num(p.donor_count)} คน`:money(p.amount_satang)}</strong>
              <span class="rank-share">${sortMode==='donors'?money(p.amount_satang):`${p.share_pct}% ของยอดรวม`}</span>
            </div>
          </div>
          <div class="progress-line compact"><div class="w-pct-${pct}"></div></div>
        </div>`;
      }).join('')}</div>`;
    };

    const topProv=activeProvinces[0]||provinces[0]||null;
    const defaultInspectorHtml=topProv
      ?`<div class="th-map-inspector-title"><span>📍 อันดับ 1: ${esc(topProv.province)}</span><span class="pill green">${esc(topProv.region_label)}</span></div>
        <div class="th-map-inspector-metrics"><span>ยอดรวม: <strong>${money(topProv.amount_satang)}</strong> (${topProv.share_pct}%)</span><span>ผู้บริจาค: <strong>${num(topProv.donor_count)} คน</strong></span><span>จำนวน: <strong>${num(topProv.count)} บิล</strong></span></div>`
      :`<div class="th-map-inspector-title"><span>📍 แผนที่ผู้บริจาคประเทศไทย</span></div><div class="th-map-inspector-metrics"><span>คลิกภูมิภาคหรือจุดจังหวัดบนแผนที่เพื่อดูรายละเอียด</span></div>`;

    const box=$('#page-content');
    box.innerHTML=header('ANALYTICS / EXECUTIVE REPORTS','รายงานวิเคราะห์ผู้บริหาร','วิเคราะห์แนวโน้มยอดบริจาค เปรียบเทียบโครงการตามเป้าหมาย และแผนที่จังหวัดผู้บริจาค',roleAllows('donations',true)?btn('＋ เพิ่มรายการบริจาค','new-donation','primary'):'')+
      renderDateFilterBar()+
      `<div class="stat-grid">${stats.map(([name,val,mod,sub])=>`<div class="stat-card"><div class="stat-top">${esc(name)}<span class="stat-icon">${icons[mod]}</span></div><div class="stat-num">${esc(val)}</div><div class="stat-sub">${esc(sub)}</div></div>`).join('')}</div>

      <div class="dashboard-grid">
        <section class="panel">
          <div class="panel-head">
            <div><h3>แนวโน้มยอดบริจาครายเดือน</h3><small>${esc(periodNote)} · ยอดเงินรวม <strong>${money(trend.totalSatang)}</strong> · จำนวน <strong>${num(trend.totalCount)}</strong> รายการ</small></div>
            <div class="chart-toggle-pill">
              <button type="button" class="chart-mode-btn ${currentChartMode==='amount'?'active':''}" data-rep-chart-mode="amount">฿ ยอดเงิน</button>
              <button type="button" class="chart-mode-btn ${currentChartMode==='count'?'active':''}" data-rep-chart-mode="count"># จำนวนรายการ</button>
            </div>
          </div>
          <div class="bars" id="rep-trend-bars">${trend.html}</div>
          <div class="chart-spacer"></div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div><h3>ยอดบริจาคแยกตามโครงการ</h3><small>${esc(periodNote)}</small></div>
            <div class="panel-head-actions">
              <div class="chart-toggle-pill">
                <button type="button" class="chart-mode-btn ${repCampaignMode==='share'?'active':''}" data-camp-mode="share">สัดส่วนรวม</button>
                <button type="button" class="chart-mode-btn ${repCampaignMode==='goal'?'active':''}" data-camp-mode="goal">% เป้าหมาย</button>
              </div>
              <button type="button" class="btn small" data-analytics-export="campaigns" title="ส่งออกสรุปยอดตามโครงการเป็น CSV">⇩ CSV</button>
            </div>
          </div>
          <div id="rep-campaign-box">${renderCampaignList(repCampaignMode)}</div>
        </section>
      </div>

      <section class="panel analytics-panel-mb">
        <div class="panel-head">
          <div>
            <h3>🗺️ แผนที่ประเทศไทยจริง 77 จังหวัด และอันดับพื้นที่ผู้บริจาค (Thailand GIS Choropleth)</h3>
            <small>ซูมเข้า-ออกด้วยลูกกลิ้งเมาส์ ลากเพื่อเลื่อนแผนที่ หรือคลิกเลือกจังหวัด/ภูมิภาคเพื่อดูยอดบริจาคเชิงลึก · ${esc(periodNote)}</small>
          </div>
          <div class="panel-head-actions">
            <div class="chart-toggle-pill">
              <button type="button" class="chart-mode-btn ${repProvinceSort==='amount'?'active':''}" data-prov-sort="amount">฿ ยอดบริจาค</button>
              <button type="button" class="chart-mode-btn ${repProvinceSort==='donors'?'active':''}" data-prov-sort="donors">♙ จำนวนผู้บริจาค</button>
            </div>
            <button type="button" class="btn small" data-analytics-export="provinces">⇩ ส่งออก CSV จังหวัด</button>
          </div>
        </div>

        <div class="geo-layout">
          <div class="th-map-stage">
            <div id="th-map-wrap">${buildRealThailandMapSvg()}</div>
            <div class="th-map-legend">
              <span>ความหนาแน่นยอดบริจาครายจังหวัด</span>
              <span class="legend-scale">฿0 <i class="legend-swatch h0"></i><i class="legend-swatch h1"></i><i class="legend-swatch h2"></i><i class="legend-swatch h3"></i><i class="legend-swatch h4"></i> สูงสุด</span>
            </div>
            <div class="th-map-inspector" id="th-map-inspector">${defaultInspectorHtml}</div>
          </div>

          <div>
            <div class="region-chips" id="rep-region-chips">
              <button type="button" class="region-chip ${repRegionFilter==='all'?'active':''}" data-reg-chip="all">ทุกภูมิภาค <small>(${num(provinces.length)})</small></button>
              ${regions.map(r=>`<button type="button" class="region-chip ${repRegionFilter===r.region?'active':''}" data-reg-chip="${esc(r.region)}">${esc(r.label)} <small>(${money(r.amount_satang)})</small></button>`).join('')}
            </div>
            <div id="rep-province-box">${renderProvinceList(repProvinceSort,repRegionFilter)}</div>
          </div>
        </div>
      </section>

      <section class="panel"><h3>⇩ ส่งออกฐานข้อมูลดิบตามโมดูล (CSV สำหรับ Excel)</h3><p class="muted">คลิกเพื่อดาวน์โหลดไฟล์ CSV รายการข้อมูลดิบ (${esc(periodNote)})</p><div class="quick-actions">${['donations','contacts','campaigns','hadeeya','stock_lots','shipments'].filter(roleAllows).map(m=>btn('⇩ ส่งออก '+labelFor(m),'export-'+m)).join('')}</div></section>`;

    // Wire Monthly Trend toggle
    box.querySelectorAll('[data-rep-chart-mode]').forEach(b => {
      b.onclick = () => {
        currentChartMode = b.dataset.repChartMode;
        box.querySelectorAll('[data-rep-chart-mode]').forEach(x => x.classList.toggle('active', x.dataset.repChartMode === currentChartMode));
        const updated = buildTrendChart(a.by_month, a.by_month_counts||{}, 'ไม่มีรายการบริจาคที่ยืนยันในช่วงเวลานี้', currentChartMode);
        const barsEl = $('#rep-trend-bars');
        if(barsEl) barsEl.innerHTML = updated.html;
      };
    });

    // Wire Campaign Mode toggle
    box.querySelectorAll('[data-camp-mode]').forEach(b => {
      b.onclick = () => {
        repCampaignMode = b.dataset.campMode;
        box.querySelectorAll('[data-camp-mode]').forEach(x => x.classList.toggle('active', x.dataset.campMode === repCampaignMode));
        const el = $('#rep-campaign-box');
        if(el) el.innerHTML = renderCampaignList(repCampaignMode);
      };
    });

    // Interactive GIS Camera (Zoom / Pan / Region Auto-Zoom)
    const svgEl = $('#th-real-svg');
    const viewportEl = $('#th-map-viewport');
    const badgeEl = $('#th-map-badge');
    const [baseX, baseY, baseW, baseH] = thGeo?.viewBox || [0, 0, 608, 1080];
    let cam = { x: baseX, y: baseY, w: baseW, h: baseH };

    const applyCamera = () => {
      if(!svgEl) return;
      cam.w = Math.max(baseW / 9, Math.min(baseW, cam.w));
      cam.h = cam.w * (baseH / baseW);
      cam.x = Math.max(baseX - cam.w * 0.25, Math.min(baseX + baseW - cam.w * 0.75, cam.x));
      cam.y = Math.max(baseY - cam.h * 0.25, Math.min(baseY + baseH - cam.h * 0.75, cam.y));
      svgEl.setAttribute('viewBox', `${cam.x.toFixed(1)} ${cam.y.toFixed(1)} ${cam.w.toFixed(1)} ${cam.h.toFixed(1)}`);
      if(badgeEl){
        const z = (baseW / cam.w).toFixed(1);
        const regTitle = repRegionFilter !== 'all' ? (regionLabelLookup[repRegionFilter] || '77 จังหวัด') : '77 จังหวัด';
        badgeEl.textContent = `${regTitle} · ซูม ${z}×`;
      }
    };

    const zoomAt = (factor, anchorX = cam.x + cam.w / 2, anchorY = cam.y + cam.h / 2) => {
      const nextW = Math.max(baseW / 9, Math.min(baseW, cam.w * factor));
      const nextH = nextW * (baseH / baseW);
      const rx = (anchorX - cam.x) / cam.w;
      const ry = (anchorY - cam.y) / cam.h;
      cam.w = nextW;
      cam.h = nextH;
      cam.x = anchorX - rx * nextW;
      cam.y = anchorY - ry * nextH;
      applyCamera();
    };

    const fitMapBbox = (bbox, padFactor = 0.22) => {
      if(!bbox) {
        cam = { x: baseX, y: baseY, w: baseW, h: baseH };
        applyCamera();
        return;
      }
      const [x1, y1, x2, y2] = bbox;
      const bw = Math.max(45, x2 - x1);
      const bh = Math.max(60, y2 - y1);
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const aspect = baseW / baseH;
      let targetW = bw * (1 + padFactor * 2);
      let targetH = bh * (1 + padFactor * 2);
      if(targetW / targetH > aspect) {
        targetH = targetW / aspect;
      } else {
        targetW = targetH * aspect;
      }
      cam.w = Math.max(baseW / 8, Math.min(baseW, targetW));
      cam.h = cam.w / aspect;
      cam.x = cx - cam.w / 2;
      cam.y = cy - cam.h / 2;
      applyCamera();
    };

    $('#th-zoom-in')?.addEventListener('click', () => zoomAt(0.7));
    $('#th-zoom-out')?.addEventListener('click', () => zoomAt(1.42));
    $('#th-zoom-reset')?.addEventListener('click', () => {
      repRegionFilter = 'all';
      fitMapBbox(null);
      syncRegionUI(false);
    });

    if(viewportEl && svgEl){
      viewportEl.addEventListener('wheel', e => {
        e.preventDefault();
        const rect = svgEl.getBoundingClientRect();
        const px = (e.clientX - rect.left) / Math.max(1, rect.width);
        const py = (e.clientY - rect.top) / Math.max(1, rect.height);
        const ax = cam.x + px * cam.w;
        const ay = cam.y + py * cam.h;
        zoomAt(e.deltaY < 0 ? 0.8 : 1.25, ax, ay);
      }, { passive: false });

      let dragState = null;
      let didDrag = false;
      viewportEl.addEventListener('pointerdown', e => {
        if(e.target.closest('.th-map-controls') || e.button !== 0) return;
        dragState = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, camX: cam.x, camY: cam.y, captured: false };
        didDrag = false;
      });
      viewportEl.addEventListener('pointermove', e => {
        if(!dragState || e.pointerId !== dragState.pointerId) return;
        const dxPx = e.clientX - dragState.startX;
        const dyPx = e.clientY - dragState.startY;
        if(!didDrag && (Math.abs(dxPx) > 4 || Math.abs(dyPx) > 4)) {
          didDrag = true;
          viewportEl.classList.add('dragging');
          try { viewportEl.setPointerCapture(e.pointerId); dragState.captured = true; } catch(_) {}
        }
        if(!didDrag) return;
        const rect = svgEl.getBoundingClientRect();
        cam.x = dragState.camX - (dxPx / Math.max(1, rect.width)) * cam.w;
        cam.y = dragState.camY - (dyPx / Math.max(1, rect.height)) * cam.h;
        applyCamera();
      });
      const endDrag = e => {
        if(dragState && dragState.captured) {
          try { viewportEl.releasePointerCapture(e.pointerId); } catch(_) {}
        }
        dragState = null;
        viewportEl.classList.remove('dragging');
      };
      viewportEl.addEventListener('pointerup', endDrag);
      viewportEl.addEventListener('pointercancel', endDrag);
      viewportEl.addEventListener('click', e => {
        if(didDrag){
          e.stopPropagation();
          didDrag = false;
        }
      }, true);
    }

    const inspectProvince = (provName) => {
      const insp = $('#th-map-inspector');
      if(!insp) return;
      const p = provDataMap[provName];
      const gp = geoProvMap[provName];
      const regLbl = p?.region_label || regionLabelLookup[gp?.reg] || 'ประเทศไทย';
      if(p){
        insp.innerHTML = `<div class="th-map-inspector-title"><span>📍 จังหวัด${esc(provName)}</span><span class="pill green">${esc(regLbl)}</span></div>
          <div class="th-map-inspector-metrics"><span>ยอดรวม: <strong>${money(p.amount_satang)}</strong> (${p.share_pct}%)</span><span>ผู้บริจาค: <strong>${num(p.donor_count)} คน</strong></span><span>จำนวน: <strong>${num(p.count)} บิล</strong></span></div>`;
      } else {
        insp.innerHTML = `<div class="th-map-inspector-title"><span>📍 จังหวัด${esc(provName)}</span><span class="pill">${esc(regLbl)}</span></div>
          <div class="th-map-inspector-metrics"><span>ยอดรวม: <strong>฿0.00</strong></span><span>ยังไม่มีรายการบริจาคยืนยันในช่วงเวลานี้</span></div>`;
      }
      box.querySelectorAll('.th-prov-path').forEach(el => el.classList.toggle('active-prov', el.dataset.provPoly === provName));
      box.querySelectorAll('.th-prov-pin').forEach(pin => pin.classList.toggle('active-pin', pin.dataset.prov === provName));
      box.querySelectorAll('[data-prov-row]').forEach(row => row.classList.toggle('active-prov-row', row.dataset.provRow === provName));
    };

    const inspectRegion = (regKey) => {
      const r = regionMapMeta[regKey];
      const insp = $('#th-map-inspector');
      if(!r || !insp) return;
      insp.innerHTML = `<div class="th-map-inspector-title"><span>🗺️ ${esc(r.label)}</span><span class="pill blue">${num(r.province_count)} จังหวัดที่ร่วมบริจาค</span></div>
        <div class="th-map-inspector-metrics"><span>ยอดรวม: <strong>${money(r.amount_satang)}</strong> (${r.share_pct}%)</span><span>ผู้บริจาค: <strong>${num(r.donor_count)} คน</strong></span><span>จำนวน: <strong>${num(r.count)} บิล</strong></span></div>`;
    };

    function wireProvinceRowHover(){
      box.querySelectorAll('[data-prov-row]').forEach(row => {
        const pName = row.dataset.provRow;
        row.addEventListener('mouseenter', () => inspectProvince(pName));
        row.addEventListener('click', () => {
          inspectProvince(pName);
          const gp = geoProvMap[pName];
          if(gp?.bbox) fitMapBbox(gp.bbox, 0.9);
        });
      });
    }

    const syncRegionUI = (autoZoom = true) => {
      box.querySelectorAll('[data-reg-chip]').forEach(c => c.classList.toggle('active', c.dataset.regChip === repRegionFilter));
      box.querySelectorAll('.th-prov-path').forEach(p => {
        p.classList.toggle('dimmed', repRegionFilter !== 'all' && p.dataset.provReg !== repRegionFilter);
      });
      const pBox = $('#rep-province-box');
      if(pBox) pBox.innerHTML = renderProvinceList(repProvinceSort, repRegionFilter);
      wireProvinceRowHover();
      if(autoZoom){
        if(repRegionFilter === 'all' || repRegionFilter === 'unknown'){
          fitMapBbox(null);
        } else if(thGeo?.regionBboxes?.[repRegionFilter]){
          fitMapBbox(thGeo.regionBboxes[repRegionFilter], 0.16);
        }
      } else {
        applyCamera();
      }
    };

    box.querySelectorAll('[data-prov-sort]').forEach(b => {
      b.onclick = () => {
        repProvinceSort = b.dataset.provSort;
        box.querySelectorAll('[data-prov-sort]').forEach(x => x.classList.toggle('active', x.dataset.provSort === repProvinceSort));
        syncRegionUI(false);
      };
    });

    box.querySelectorAll('[data-reg-chip]').forEach(chip => {
      chip.onclick = () => {
        repRegionFilter = chip.dataset.regChip;
        if(repRegionFilter !== 'all') inspectRegion(repRegionFilter);
        syncRegionUI(true);
      };
    });

    box.querySelectorAll('.th-prov-path').forEach(path => {
      const pName = path.dataset.provPoly;
      path.addEventListener('mouseenter', () => inspectProvince(pName));
      path.addEventListener('click', () => {
        inspectProvince(pName);
        const gp = geoProvMap[pName];
        if(gp?.bbox) fitMapBbox(gp.bbox, 0.95);
      });
    });

    if(repRegionFilter !== 'all' && thGeo?.regionBboxes?.[repRegionFilter]){
      fitMapBbox(thGeo.regionBboxes[repRegionFilter], 0.16);
    }
    wireProvinceRowHover();
    wireDateFilterBar();

    // Wire Analytics CSV Exports
    box.querySelectorAll('[data-analytics-export]').forEach(b => {
      b.onclick = () => {
        const type = b.dataset.analyticsExport;
        const u = new URL(location.pathname, location.href);
        u.searchParams.set('api', 'export-analytics');
        u.searchParams.set('type', type);
        if(state.dateFrom) u.searchParams.set('date_from', state.dateFrom);
        if(state.dateTo) u.searchParams.set('date_to', state.dateTo);
        location.href = u.toString();
      };
    });

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
    if(isAdmin){try{aiCfg=await api('ai-config');}catch(e){}}
    if(isAdmin){try{dbInfo=await api('db-info');}catch(e){}}
    const fmtKB=b=>b>=1048576?(b/1048576).toFixed(2)+' MB':Math.max(1,Math.round((b||0)/1024))+' KB';
    $('#page-content').innerHTML=header('PREFERENCES / SETTINGS','ตั้งค่าระบบส่วนตัว',isAdmin?'เปลี่ยนธีม รหัสผ่าน สำรองฐานข้อมูล และตั้งค่า Gemini AI ช่วยค้นหา':'เปลี่ยนธีมและรหัสผ่านส่วนตัว')+
      `<div class="dashboard-grid">
        <section class="panel"><h3>ธีมสีแอปพลิเคชัน</h3><p class="muted">ระบบรองรับธีมดั้งเดิม Modern Navy และ Dark Mode</p><div class="form-grid"><button type="button" class="btn ${t==='premium'?'primary':''}" data-theme="premium">◉ Premium Navy + Olive</button><button type="button" class="btn ${t==='classic'?'primary':''}" data-theme="classic">◉ Classic Green + White</button><button type="button" class="btn ${t==='dark'?'primary':''}" data-theme="dark">◉ Dark Professional</button></div></section>
        <section class="panel"><h3>เปลี่ยนรหัสผ่าน</h3><div id="password-form" class="stack" style="display:grid;gap:14px"><label class="form-field"><span class="field-title">รหัสผ่านปัจจุบัน <span class="req-star">*</span></span><input name="current_password" type="password" placeholder="กรอกรหัสผ่านที่ใช้งานอยู่ในปัจจุบัน…" autocomplete="current-password"></label><label class="form-field"><span class="field-title">รหัสผ่านใหม่ (12 ตัวขึ้นไป) <span class="req-star">*</span></span><input name="new_password" type="password" minlength="12" placeholder="ตั้งรหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร…" autocomplete="new-password"></label><div class="form-actions" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><small class="muted">🔒 รหัสผ่านต้องมีความยาว 12 ตัวขึ้นไป</small><button type="button" id="save-password-btn" class="btn primary" style="font-weight:800;padding:0 18px">✓ บันทึกรหัสผ่านใหม่</button></div></div></section>
      </div>
      ${isAdmin?`<section class="panel" style="margin-bottom:18px">
        <div class="panel-head"><div><h3>✦ ตั้งค่า Gemini AI ช่วยค้นหาอัจฉริยะ</h3><small>ช่วยให้พิมพ์ค้นหาหรือสั่งเปิดหน้าต่างๆ ได้แม่นยำแม้พิมพ์สะกดผิด หรือพิมพ์คำใกล้เคียง</small></div><span id="ai-status-pill" class="pill ${aiCfg.enabled&&aiCfg.has_key?'green':'yellow'}">${aiCfg.enabled&&aiCfg.has_key?'✦ เปิดใช้งาน AI แล้ว':'ยังไม่ได้ตั้งค่า API Key'}</span></div>
        <div id="ai-config-form" class="stack" style="display:grid;gap:18px">
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
        </div>
      </section>`:''}
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
            <div class="db-stat-box">
              <span>สำรองข้อมูลผ่านเว็บล่าสุด</span>
              <strong id="db-last-bkp-label">${esc(dbInfo.last_backup_at?dateDisplay(dbInfo.last_backup_at):'ยังไม่เคย')}</strong>
              <span id="db-last-bkp-sub">${dbInfo.last_backup_format?`ไฟล์ .${esc(dbInfo.last_backup_format)}${dbInfo.last_backup_by?' · โดย '+esc(dbInfo.last_backup_by):''}`:'ยังไม่มีประวัติ'}</span>
            </div>
          </div>

          <div class="wcb-vault-box">
            <div class="wcb-vault-head">
              <div>
                <h4>🔐 สำรองข้อมูลแบบเข้ารหัสลับ (.wcb — Encrypted Full Backup)</h4>
                <p>แพ็กฐานข้อมูล <code>crm.sqlite</code> พร้อมไฟล์สลิป/รูปแนบทั้งหมดใน <code>storage/uploads/</code> เข้ารหัสด้วย Libsodium (<code>XChaCha20-Poly1305</code>) รองรับการกู้คืนผ่าน <code>scripts/restore.php</code> ได้ทันที</p>
              </div>
              <span class="pill ${dbInfo.sodium_loaded!==false?'green':'red'}">${dbInfo.sodium_loaded!==false?'✓ พร้อมเข้ารหัส Libsodium':'⚠ ไม่พบ PHP sodium'}</span>
            </div>

            <div class="form-grid">
              <label class="form-field">
                <span class="field-title">
                  <span>รหัสผ่านเข้ารหัสไฟล์สำรอง (อย่างน้อย 12 ตัวอักษร) <span class="req-star">*</span></span>
                  <span id="wcb-strength-pill" class="opt-tag">ขั้นต่ำ 12 ตัว</span>
                </span>
                <div class="pass-input-wrap">
                  <input id="wcb-pass" type="password" minlength="12" placeholder="ตั้งรหัสผ่านสำหรับล็อกไฟล์ .wcb (12 ตัวขึ้นไป)…" autocomplete="new-password">
                  <button type="button" class="pass-toggle-btn" id="wcb-toggle-pass">แสดง</button>
                </div>
              </label>

              <label class="form-field">
                <span class="field-title">
                  <span>ยืนยันรหัสผ่านเข้ารหัสอีกครั้ง <span class="req-star">*</span></span>
                  <span id="wcb-match-pill" class="opt-tag">รอตรวจสอบ</span>
                </span>
                <div class="pass-input-wrap">
                  <input id="wcb-pass-confirm" type="password" minlength="12" placeholder="พิมพ์รหัสผ่านเดิมซ้ำอีกครั้งเพื่อป้องกันพิมพ์ผิด…" autocomplete="new-password">
                </div>
              </label>
            </div>

            <div class="wcb-actions-bar">
              <div class="wcb-warning-text">
                <strong>⚠ สำคัญ:</strong> กรุณาจดจำรหัสผ่านนี้ไว้ให้แม่นยำ ระบบไม่บันทึกรหัสผ่านไว้บนเซิร์ฟเวอร์ หากลืมรหัสผ่านจะไม่สามารถถอดรหัสไฟล์ <code>.wcb</code> ได้
                <span id="wcb-last-meta">${dbInfo.last_wcb_backup_at?` · ล่าสุด: <strong>${esc(dateDisplay(dbInfo.last_wcb_backup_at))}</strong> (${esc(fmtKB(dbInfo.last_wcb_bytes||0))})`:''}</span>
              </div>
              <button type="button" class="btn primary" id="btn-backup-wcb" ${dbInfo.sodium_loaded===false?'disabled':''}>🔐 สร้างและดาวน์โหลดไฟล์สำรอง (.wcb)</button>
            </div>

            <details class="restore-guide-details">
              <summary>📖 ดูคำสั่งกู้คืนข้อมูล (Restore) จากไฟล์ .wcb ผ่าน Terminal</summary>
              <pre class="cli-code-block"># Windows PowerShell (ปิด Apache / Web Process ก่อนรันกู้คืน)
$env:CRM_BACKUP_PASSWORD="รหัสผ่านที่ตั้งไว้ตอนสำรองข้อมูล"
php scripts/restore.php C:\path\to\whitechannel-crm-backup.wcb --i-understand
Remove-Item Env:CRM_BACKUP_PASSWORD</pre>
            </details>
          </div>

          <div class="db-sub-actions-title">เครื่องมือสแนปช็อตด่วน (ไม่เข้ารหัส) และดูแลรักษาฐานข้อมูล</div>
          <div class="db-actions-row">
            <button type="button" class="btn" id="btn-backup-sqlite">⇩ ดาวน์โหลดเฉพาะฐานข้อมูล (.sqlite)</button>
            <button type="button" class="btn" id="btn-backup-full">⇩ ดาวน์โหลดชุดข้อมูล + ไฟล์แนบ (.tar)</button>
            <button type="button" class="btn ghost" id="btn-optimize-db">⚡ จัดระเบียบและบีบอัดฐานข้อมูล (VACUUM)</button>
          </div>
        ` : `<p class="secondary-note">ฐานข้อมูลเก็บอยู่ที่ <code>storage/crm.sqlite</code> เฉพาะผู้ดูแลระบบ (Admin) สามารถดาวน์โหลดไฟล์สำรองฐานข้อมูลผ่านหน้าเว็บได้โดยตรง</p>`}
      </section>`;

    // Wire Encrypted .wcb Backup form controls
    const wcbPassEl=$('#wcb-pass');
    const wcbConfirmEl=$('#wcb-pass-confirm');
    const wcbStrengthEl=$('#wcb-strength-pill');
    const wcbMatchEl=$('#wcb-match-pill');
    const updateWcbIndicators=()=>{
      if(!wcbPassEl||!wcbConfirmEl)return;
      const p=wcbPassEl.value;
      const c=wcbConfirmEl.value;
      if(wcbStrengthEl){
        if(!p.length){wcbStrengthEl.className='opt-tag';wcbStrengthEl.textContent='ขั้นต่ำ 12 ตัว';}
        else if(p.length<12){wcbStrengthEl.className='pill red';wcbStrengthEl.textContent=`สั้นเกินไป (${p.length}/12)`;}
        else if(p.length>=16 && /[A-Z]/.test(p) && /\d/.test(p)){wcbStrengthEl.className='pill green';wcbStrengthEl.textContent='ความปลอดภัยสูงมาก';}
        else{wcbStrengthEl.className='pill green';wcbStrengthEl.textContent=`พร้อมใช้งาน (${p.length} ตัว)`;}
      }
      if(wcbMatchEl){
        if(!c.length){wcbMatchEl.className='opt-tag';wcbMatchEl.textContent='รอตรวจสอบ';}
        else if(p===c){wcbMatchEl.className='pill green';wcbMatchEl.textContent='✓ รหัสผ่านตรงกัน';}
        else{wcbMatchEl.className='pill red';wcbMatchEl.textContent='✕ รหัสผ่านไม่ตรงกัน';}
      }
    };
    wcbPassEl?.addEventListener('input',updateWcbIndicators);
    wcbConfirmEl?.addEventListener('input',updateWcbIndicators);
    $('#wcb-toggle-pass')?.addEventListener('click',e=>{
      if(!wcbPassEl||!wcbConfirmEl)return;
      const show=wcbPassEl.type==='password';
      wcbPassEl.type=show?'text':'password';
      wcbConfirmEl.type=show?'text':'password';
      e.currentTarget.textContent=show?'ซ่อน':'แสดง';
    });
    $('#btn-backup-wcb')?.addEventListener('click',async e=>{
      const btnEl=e.currentTarget;
      const password=wcbPassEl?.value||'';
      const confirmPass=wcbConfirmEl?.value||'';
      if(password.length<12){
        toast('กรุณาตั้งรหัสผ่านเข้ารหัสไฟล์สำรองอย่างน้อย 12 ตัวอักษร',true);
        wcbPassEl?.focus();
        return;
      }
      if(password!==confirmPass){
        toast('รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง',true);
        wcbConfirmEl?.focus();
        return;
      }
      const origLabel=btnEl.textContent;
      btnEl.disabled=true;
      btnEl.textContent='⏳ กำลังสร้างสแนปช็อตและเข้ารหัสไฟล์ .wcb…';
      try{
        const url=new URL(location.pathname,location.href);
        url.searchParams.set('api','backup-encrypted');
        const res=await fetch(url,{
          method:'POST',
          credentials:'same-origin',
          headers:{'Content-Type':'application/json','X-CSRF-Token':csrf()},
          body:JSON.stringify({password}),
          cache:'no-store'
        });
        if(!res.ok){
          const errJson=await res.json().catch(()=>({error:`HTTP ${res.status}`}));
          throw new Error(errJson.error||`เกิดข้อผิดพลาด (HTTP ${res.status})`);
        }
        const blob=await res.blob();
        const headerName=res.headers.get('X-Backup-Filename');
        const stamp=new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
        const filename=headerName||`whitechannel-crm-backup-${stamp}.wcb`;
        const dlUrl=URL.createObjectURL(blob);
        const aTag=document.createElement('a');
        aTag.href=dlUrl;
        aTag.download=filename;
        document.body.appendChild(aTag);
        aTag.click();
        aTag.remove();
        setTimeout(()=>URL.revokeObjectURL(dlUrl),5000);

        if(wcbPassEl)wcbPassEl.value='';
        if(wcbConfirmEl)wcbConfirmEl.value='';
        updateWcbIndicators();
        toast(`เข้ารหัสและดาวน์โหลดไฟล์ ${filename} (${fmtKB(blob.size)}) เรียบร้อยแล้ว`);

        try{
          const fresh=await api('db-info');
          const lastLbl=$('#db-last-bkp-label');
          const lastSub=$('#db-last-bkp-sub');
          const wcbMeta=$('#wcb-last-meta');
          if(lastLbl&&fresh.last_backup_at)lastLbl.textContent=dateDisplay(fresh.last_backup_at);
          if(lastSub)lastSub.textContent=`ไฟล์ .${fresh.last_backup_format||'wcb'}${fresh.last_backup_by?' · โดย '+fresh.last_backup_by:''}`;
          if(wcbMeta&&fresh.last_wcb_backup_at)wcbMeta.innerHTML=` · ล่าสุด: <strong>${esc(dateDisplay(fresh.last_wcb_backup_at))}</strong> (${esc(fmtKB(fresh.last_wcb_bytes||blob.size))})`;
        }catch(_){}
      }catch(err){
        toast(err.message||'ไม่สามารถสร้างไฟล์สำรองข้อมูลเข้ารหัสได้',true);
      }finally{
        btnEl.disabled=false;
        btnEl.textContent=origLabel;
      }
    });
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
    if(state.user?.role!=='admin')return;
    let aiCfg={enabled:false,has_key:false,masked_key:'',model:'gemini-3.5-flash-lite',auto_fallback:true,usage:{},can_edit:true};
    try{aiCfg=await api('ai-config');}catch(e){}
    if(!aiCfg.can_edit)return;
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
        e.stopPropagation();const q=input.value.trim();if(q)runAiSearch(q);else if(state.user?.role==='admin')openAiConfigModal();else input.focus();
      });
      container.querySelector('#open-ai-config')?.addEventListener('click',e=>{
        e.stopPropagation();hide();openAiConfigModal();
      });
    };
    const renderQuickNav=()=>{
      const quick=['contacts','donations','campaigns','shipments','tasks','hadeeya'].filter(m=>roleAllows(m));
      const aiConfigBtn=state.user?.role==='admin'?`<button type="button" class="btn small ghost" id="open-ai-config" style="padding:2px 7px;min-height:22px;font-size:10px;color:var(--accent-text)">⚙ ตั้งค่า AI</button>`:'';
      box.innerHTML=`<div class="top-search-head"><span>ทางลัดไปยังโมดูล</span>${aiConfigBtn}</div>`+quick.map(m=>`<button type="button" class="top-search-item" data-qnav="${esc(m)}"><span class="top-search-item-icon">${icons[m]||'•'}</span><div class="top-search-item-body"><div class="top-search-item-title">${esc(labelFor(m))}</div><div class="top-search-item-sub">เปิดหน้าจัดการ${esc(labelFor(m))}</div></div><span class="top-search-item-badge">โมดูล</span></button>`).join('');
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
    document.addEventListener('click',e=>{
      const notifyBtn=e.target.closest('[data-ship-notify]');
      if(notifyBtn){
        e.preventDefault();
        openTrackingNotifyModal(notifyBtn.dataset.shipNotify);
      }
    });
    window.addEventListener('popstate',()=>{state.module=new URLSearchParams(location.search).get('module')||'dashboard';state.page=1;makeNav();render();});
    window.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
    await render();
    if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(r=>r.unregister())).catch(()=>{});}
  }
  init().catch(e=>console.error(e));
})();
