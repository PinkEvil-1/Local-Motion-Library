// ===== 頁面邏輯：卡片、篩選（元件 × 時機）、複製提示詞 =====
const $=id=>document.getElementById(id);
const COMP=Object.fromEntries(COMPS.map(([k,l,c])=>[k,{label:l,color:c}]));
const WHEN=Object.fromEntries(WHENS);
// 提示詞本身不寫顏色，複製時統一請 AI 依網站主題配色
const PALETTE="\n配色：請依照網站既有的主題色與風格自行搭配，不要另外指定顏色。";
const LATEST=ITEMS.reduce((m,it)=>it.added>m?it.added:m,'');

function legacyCopy(t){try{const ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0';document.body.append(ta);ta.select();ta.setSelectionRange(0,t.length);const ok=document.execCommand('copy');ta.remove();return ok}catch(e){return false}}
function flash(btn,msg){btn.textContent=msg;setTimeout(()=>btn.textContent='複製 AI 提示詞',1600)}
function showPrompt(t){let m=$('pm');if(!m){m=document.createElement('div');m.id='pm';m.innerHTML='<div class="pm-box"><div class="pm-h">無法自動複製，請手動全選複製（已幫你選好）</div><textarea readonly></textarea><button>關閉</button></div>';document.body.append(m);m.querySelector('button').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()}}const ta=m.querySelector('textarea');ta.value=t;ta.focus();ta.select()}
async function copyPrompt(t,btn){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);return flash(btn,'已複製 ✓')}}catch(e){}if(legacyCopy(t))return flash(btn,'已複製 ✓');showPrompt(t)}

// ===== 每個效果的分享連結：分享的是效果單頁 /fx/123/（社群預覽會顯示該效果）；首頁 /#123 仍會捲到那張卡片並亮一下 =====
const SITE='https://kittenjam-motion-library.vercel.app/';
async function shareFx(it,btn){const url=SITE+'fx/'+it.id+'/',lab=btn.querySelector('span');
  // 手機優先叫出系統分享選單；桌機直接複製連結
  if(navigator.share&&matchMedia('(hover:none)').matches){try{await navigator.share({title:`${it.zh}（${it.en}）｜Motion Library`,text:`${it.zh}：${it.desc}`,url});return}catch(e){if(e.name==='AbortError')return}}
  let ok=false;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);ok=true}}catch(e){}if(!ok)ok=legacyCopy(url);
  if(!ok)return showPrompt(url);lab.textContent='已複製連結 ✓';btn.classList.add('ok');setTimeout(()=>{lab.textContent='分享';btn.classList.remove('ok')},1800)}

const cards=ITEMS.map(it=>{const card=el('article','card');card.style.setProperty('--a',COMP[it.comp].color);
  const st=el('div',`stage ${it.bg} fx${it.id}`);if(it.bg==='acc')st.style.background='var(--a)';
  const tags=[...it.when.map(w=>`<em class="w">${WHEN[w]}</em>`),...it.uses.map(u=>`<em>${USES[u]}</em>`),`<em class="tech">${it.tech}</em>`].join('');
  card.append(st);card.insertAdjacentHTML('beforeend',`<div class="meta"><div class="no">${String(it.id).padStart(3,'0')}</div><div><div class="nm"><a class="nm-a" href="/fx/${it.id}/">${it.zh}　<span class="en">${it.en}</span><i class="go" aria-hidden="true">↗</i></a>${it.added===LATEST?'<span class="new">NEW</span>':''}</div><div class="zh">${it.desc}</div><div class="uses">${tags}</div></div></div><div class="acts"><button class="cp">複製 AI 提示詞</button><button class="sh" aria-label="分享這個效果的連結"><svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg><span>分享</span></button></div>`);
  card.id='fx-'+it.id;
  Object.assign(card,{_it:it,_st:st,_timers:[],_kill:[]});
  card.querySelector('.cp').onclick=e=>{copyPrompt(`「${it.zh}（${it.en}）」動態效果：${it.prompt}${PALETTE}`,e.target);kitReact('copy',true)};
  card.querySelector('.sh').onclick=e=>shareFx(it,e.currentTarget);
  card._q=[it.zh,it.en,it.desc,it.tag,it.style,it.tech,COMP[it.comp].label,...it.when.map(w=>WHEN[w]),...it.uses.map(u=>USES[u]),it.prompt].join(' ').toLowerCase();
  return card});

const state={comp:'all',when:'all',use:'all',tech:'all',sort:'comp',q:''};
const has={comp:(it,k)=>it.comp===k,when:(it,k)=>it.when.includes(k),use:(it,k)=>it.uses.includes(k),tech:(it,k)=>it.tech===k};
// skip：計算某一排 chip 的數量時，忽略那一排自己的篩選
const match=(c,skip)=>Object.keys(has).every(k=>k===skip||state[k]==='all'||has[k](c._it,state[k]))&&(!state.q||c._q.includes(state.q));
const count=(key,k)=>cards.filter(cd=>match(cd,key)&&(k==='all'||has[key](cd._it,k))).length;
function chips(box,key,opts){box.innerHTML='';[['all','全部'],...opts].forEach(([k,l,c])=>{const n=count(key,k);
  const b=el('button','chip'+(state[key]===k?' on':'')+(n===0?' zero':''));b.innerHTML=(c?`<i class="dot" style="background:${c}"></i>`:'')+l+`<small>${n}</small>`;b.onclick=()=>{state[key]=k;render()};box.append(b)})}
// 精簡 Bar 的下拉選單：和上方 chips 共用同一份 state
const TECHS=[['CSS','CSS'],['GSAP','GSAP'],['Canvas','Canvas']];
function selects(){[['sComp','comp','全部元件',COMPS],['sWhen','when','全部時機',WHENS],['sUse','use','全部情境',Object.entries(USES)],['sTech','tech','全部技術',TECHS]].forEach(([id,key,all,opts])=>{const s=$(id);
  s.innerHTML=[['all',all],...opts].map(([k,l])=>{const n=count(key,k);return `<option value="${k}"${n===0&&state[key]!==k?' disabled':''}>${l}（${n}）</option>`}).join('');s.value=state[key];s.classList.toggle('act',state[key]!=='all')})}
const nActive=()=>['comp','when','use','tech'].filter(k=>state[k]!=='all').length+(state.q?1:0);

// 版面：依元件分組，或「最新收錄」一整區；只有切換排序時才搬動卡片
let laidOut='';const secWrap=$('sections');
function layout(){if(laidOut===state.sort)return;laidOut=state.sort;secWrap.innerHTML='';
  const groups=state.sort==='new'?[['new','最新收錄','#f2f2f0',[...cards].sort((a,b)=>b._it.added.localeCompare(a._it.added)||b._it.id-a._it.id)]]:COMPS.map(([k,l,c])=>[k,l,c,cards.filter(cd=>cd._it.comp===k)]);
  groups.forEach(([k,l,c,cs])=>{const sec=el('section','cat');sec.innerHTML=`<div class="sec"><i class="dot" style="background:${c}"></i><h2>${l}</h2><span></span></div>`;const grid=el('div','grid');cs.forEach(cd=>grid.append(cd));sec.append(grid);secWrap.append(sec)});
  stRefresh()}
function render(){chips($('fComp'),'comp',COMPS);chips($('fWhen'),'when',WHENS);chips($('fUse'),'use',Object.entries(USES));layout();
  cards.forEach(c=>c.style.display=match(c)?'':'none');let total=0;
  secWrap.querySelectorAll('section.cat').forEach(s=>{const n=[...s.querySelectorAll('.card')].filter(c=>c.style.display!=='none').length;total+=n;s.style.display=n?'':'none';s.querySelector('.sec span').textContent=n+' 種'});
  $('empty').style.display=total?'none':'';
  selects();$('tech').value=state.tech;$('mCnt').textContent=`顯示 ${total} / ${cards.length}`;const na=nActive();$('mClear').style.display=na?'':'none';[$('mFilt'),$('fTog')].forEach(x=>{const bd=x.querySelector('b');bd.textContent=na;bd.classList.toggle('on',na>0)});
  stRefresh()}
function stRefresh(){if(HAS_GS)requestAnimationFrame(()=>ScrollTrigger.refresh())}

// 拆掉卡片的動畫：計時器、rAF、事件、GSAP 全部清掉
function teardown(card){card._timers.forEach(clearInterval);card._timers=[];ticks.delete(card);card._kill.forEach(f=>f());card._kill=[];if(card._ctx){card._ctx.revert();card._ctx=null}card._st.innerHTML=`<span class="tag">${card._it.tag}</span>`;card._live=false}
function build(card){teardown(card);card._live=true;
  const it=card._it,st=card._st;
  const cu=$('custom').value.trim();const x=(cu&&!it.fixed)?cu:it.txt;
  if(!FX[it.id]){st.insertAdjacentHTML('beforeend','<div class="gerr">預覽製作中</div>');return}
  if(it.tech==='GSAP'){if(!HAS_GS){st.insertAdjacentHTML('beforeend','<div class="gerr">GSAP 載入失敗，請重新整理</div>');return}card._ctx=gsap.context(()=>FX[it.id](st,x,card),st);return}
  FX[it.id](st,x,card)}

// 效能：只有在畫面內（含上下一點緩衝）的卡片才跑動畫，捲出去就拆掉，回來再重建
const lazy=new IntersectionObserver(es=>es.forEach(e=>{const c=e.target;if(e.isIntersecting){if(!c._live){build(c);stRefresh()}}else if(c._live)teardown(c)}),{rootMargin:'250px 0px'});
cards.forEach(c=>lazy.observe(c));
$('cnt').textContent=ITEMS.length;
render();if(document.fonts)document.fonts.ready.then(stRefresh);
let tm;$('custom').addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{cards.forEach(c=>c._live&&build(c));stRefresh()},350)});
['q','q2'].forEach(id=>$(id).addEventListener('input',e=>{const v=e.target.value;$(id==='q'?'q2':'q').value=v;state.q=v.trim().toLowerCase();render();if(id==='q2')toResults()}));

// ===== 精簡 Bar：上方篩選區離開畫面時，從頂端滑出 =====
const mini=$('mini');
// 用捲動位置判斷（IntersectionObserver 在快速捲動／跳轉時可能漏掉，手機上尤其明顯）：頁首（含篩選區）整個被 Bar 蓋住或捲出畫面就顯示
let miniRaf=0;const miniCheck=()=>{miniRaf=0;const show=document.querySelector('header').getBoundingClientRect().bottom<mini.offsetHeight;mini.classList.toggle('show',show);if(!show)mini.classList.remove('open')};
['scroll','resize'].forEach(ev=>addEventListener(ev,()=>{if(!miniRaf)miniRaf=requestAnimationFrame(miniCheck)},{passive:true}));miniCheck();
// 在 Bar 上改篩選後，若已捲過結果開頭就回到開頭，避免停在一片空白
function toResults(){const top=$('sections').getBoundingClientRect().top+scrollY-mini.offsetHeight-12;if(scrollY>top)scrollTo({top,behavior:'smooth'})}
[['sComp','comp'],['sWhen','when'],['sUse','use'],['sTech','tech']].forEach(([id,key])=>$(id).addEventListener('change',e=>{state[key]=e.target.value;render();toResults()}));
$('mFilt').onclick=()=>{const o=mini.classList.toggle('open');$('mFilt').setAttribute('aria-expanded',o)};
$('mClear').onclick=()=>{Object.assign(state,{comp:'all',when:'all',use:'all',tech:'all',q:''});$('q').value=$('q2').value='';render();toResults()};
// 手機上搜尋框較窄，換成短的提示文字
const qPh=$('q').placeholder,mq=matchMedia('(max-width:760px)');const setPh=()=>$('q').placeholder=mq.matches?'搜尋效果、標籤…':qPh;setPh();mq.addEventListener('change',setPh);
$('fTog').onclick=()=>{const o=document.querySelector('header').classList.toggle('fopen');$('fTog').setAttribute('aria-expanded',o)};
$('mTop').onclick=()=>scrollTo({top:0,behavior:'smooth'});
$('tech').addEventListener('change',e=>{state.tech=e.target.value;render()});
$('sort').addEventListener('change',e=>{state.sort=e.target.value;render()});

// ===== 右下角投稿：在網頁上直接送出（FormSubmit 轉寄到 Email，不需開郵件 App）=====
// 附件：FormSubmit 單次上限約 10MB，大張圖片先在瀏覽器壓縮；GIF 保留原檔（才會動）
const MAIL=['kittenjamc','gmail.com'].join('@');const dlg=$('subDlg'),form=$('subForm');const FORM_HTML=form.innerHTML;
const MAXF=3,MAXB=10*1024*1024;const kb=n=>n<1048576?Math.round(n/1024)+'KB':(n/1048576).toFixed(1)+'MB';
$('sub').onclick=()=>{if(!form.querySelector('#sName')){form.innerHTML=FORM_HTML;bindForm()}$('subMsg').hidden=true;dlg.showModal();$('sName').focus()};
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
function shrink(f){if(!/^image\/(jpeg|png|webp)$/.test(f.type)||f.size<1.2*1048576)return Promise.resolve(f);
  return new Promise(res=>{const img=new Image(),u=URL.createObjectURL(f);img.onload=()=>{const k=Math.min(1,1920/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);
    c.toBlob(b=>res(b&&b.size<f.size?new File([b],f.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):f),'image/jpeg',.85)};img.onerror=()=>{URL.revokeObjectURL(u);res(f)};img.src=u})}
function bindForm(){$('subX').onclick=()=>dlg.close();const msg2=$('subMsg'),go2=$('subGo'),drop=$('sDrop'),inp=$('sFile'),list=$('sFiles');let files=[];
  const warn=h=>{msg2.hidden=false;msg2.classList.add('err');msg2.innerHTML=h};
  const draw=()=>{list.innerHTML='';files.forEach((f,i)=>{const d=el('div','fi'),u=URL.createObjectURL(f),m=el(f.type.startsWith('video')?'video':'img');m.src=u;if(m.tagName==='VIDEO'){m.muted=true;m.playsInline=true}
    const n=el('small');n.textContent=kb(f.size)+' '+f.name;const x=el('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','移除 '+f.name);x.onclick=()=>{URL.revokeObjectURL(u);files.splice(i,1);draw()};d.append(m,n,x);list.append(d)})};
  const tip=drop.querySelector('span'),TIP=tip.textContent;
  const add=async fl=>{msg2.hidden=true;tip.textContent='處理中…';for(const f0 of fl){if(!/^(image|video)\//.test(f0.type)){warn('只能上傳圖片或影片');continue}
      if(files.length>=MAXF){warn(`最多 ${MAXF} 個檔案`);break}const f=await shrink(f0);
      if(files.reduce((s,x)=>s+x.size,0)+f.size>MAXB){warn(f.type.startsWith('video')?'影片太大了（合計需在 10MB 以內），可以改把影片上傳到 YouTube 或雲端硬碟，再把連結貼在「參考連結」':'檔案合計需在 10MB 以內');continue}
      files.push(f)}tip.textContent=TIP;draw()};
  inp.onchange=()=>{add([...inp.files]);inp.value=''};
  ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
  ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,()=>drop.classList.remove('over')));drop.addEventListener('drop',e=>{e.preventDefault();add([...e.dataTransfer.files])});
  form.onsubmit=async e=>{e.preventDefault();const name=$('sName').value.trim(),link=$('sLink').value.trim(),who=$('sWho').value.trim();
    if($('sHoney').value)return dlg.close();
    go2.disabled=true;go2.textContent=files.length?'上傳中…':'送出中…';msg2.hidden=true;
    const F={效果:name,參考連結:link||'（無）',投稿人:who||'（未填）',附件:files.length?files.length+' 個':'（無）',來源:location.href,_subject:'[Motion Library 投稿] '+name.slice(0,30),_template:'table',_captcha:'false'};
    try{if(files.length)await postFiles(F,files);else{const r=await fetch('https://formsubmit.co/ajax/'+MAIL,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(F)});
        const j=await r.json().catch(()=>({}));if(!r.ok||String(j.success)!=='true')throw 0}
      kitReact('submit',true);form.innerHTML='<div class="done"><b>✓</b><h3>謝謝您的投稿</h3><p>我收到囉~會找時間收錄進來。</p><div class="row" style="justify-content:center"><button type="button" id="subX">關閉</button></div></div>';$('subX').onclick=()=>dlg.close()}
    catch(_){go2.disabled=false;go2.textContent='送出投稿';warn(`送出失敗，請稍後再試，或直接寄信到 <a href="mailto:${MAIL}">${MAIL}</a>`)}}}
bindForm();
// 有附件時：FormSubmit 的 AJAX 端點不會轉寄附件，改用一般表單（multipart）送到隱藏的 iframe
function postFiles(F,files){return new Promise((ok,fail)=>{const name='subFrame'+Date.now(),ifr=el('iframe');ifr.name=name;ifr.hidden=true;
  const f=el('form');f.method='POST';f.enctype='multipart/form-data';f.action='https://formsubmit.co/'+MAIL;f.target=name;f.hidden=true;
  Object.entries(F).forEach(([k,v])=>{const i=el('input');i.type='hidden';i.name=k;i.value=v;f.append(i)});
  files.forEach((x,n)=>{const i=el('input');i.type='file';i.name='attachment'+(n+1);const dt=new DataTransfer();dt.items.add(x);i.files=dt.files;f.append(i)});
  const done=fn=>{clearTimeout(tm);setTimeout(()=>{ifr.remove();f.remove()},1000);fn()};const tm=setTimeout(()=>done(fail),90000);
  ifr.onload=()=>done(ok);document.body.append(ifr,f);f.submit()})}

// ===== 左下角的迷你我：點她依序換一組對話，對話泡泡的 CTA 連到作品集對應頁面 =====
// 新增、修改、調整順序都改這個陣列就好。href 以 / 開頭＝作品集內的頁面，完整網址（https://…）＝外部網站。pose＝人物姿勢（wave 舉手揮、present 手掌攤開介紹），act＝人物動作（CSS 動畫 kit-act-*），props＝動作前後手邊冒出的小道具
const PORTFOLIO='https://hannahchao-portfolio.vercel.app';
const KIT_TALKS=[
  // 常駐的新功能說明：CTA 不跳頁，改成在畫面上示範（demo:true）
  {id:'00',pose:'present',lines:['新功能上線 ✨','點效果名稱能看大預覽，','還能把單一效果分享給朋友！'],cta:'示範給我看 →',demo:true,act:'proud',props:['🎉','✨']},
  {id:'01',pose:'present',lines:['我這麼努力學 AI，','結果還是被資遣了 🥹'],note:'（默默掏出作品集）',cta:'收留我這位設計師 ♡',href:'/#contact',act:'teary',props:['💧','📁']},
  {id:'02',pose:'present',lines:['這網站，其實是我自己要使用的。','但只給自己用太可惜，','就想分享UI/網頁設計師們～'],cta:'我也很會跨部門協作 ↗',href:'/how-i-work',act:'present',props:['🛠️','🎁']},
  {id:'03',pose:'wave',lines:['設計稿我會畫，','HTML、CSS 我也會寫。','老闆真的不考慮一人雙用嗎（？）'],cta:'看看我切了什麼 ↗',href:'/portfolio?filter=Html%20%2F%20CSS',act:'proud',props:['⌨️','😤']},
  {id:'04',pose:'wave',lines:['AI 可以幫大家省時間，','但好像沒幫我保住工作 🫠','其實我還做了不少 AI 工具耶！'],cta:'看看我的 AI 超能力 ↗',href:'/portfolio?filter=AI%20Workflow',act:'type',props:['💻','🪄']},
  {id:'05',pose:'present',lines:['我其實還有經營過年商品，','自己的年終自己賺。'],cta:'羊年斗方搶先看 ↗',href:'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4NDM2MzA4MDczMTgyNjQx?cplk=MTdxcXc0NngydnE5cg==',act:'proud',props:['🧧','🏮']},
  {id:'06',pose:'present',lines:['恭喜你！全部都看完了～','所以……有考慮收留作者嗎？'],cta:'來看看作者本人 ↗',href:'/about',act:'cool',props:['🕶️','📄']},
];
// 看情況插一句：訪客做了某些事時她短短回應，約 4 秒後回到原本那組對話（不換組、不改 CTA）
const KIT_REACTS={
  copy:['複製好了！<br>拿去用吧 ✨','提示詞到手～<br>做出來給我看看！'],
  filter:['找到喜歡的<br>效果了嗎？','這類我收了<br>不少喔 😎'],
  scroll:['滑這麼久了，<br>要不要認識我一下？'],
  submit:['謝謝你的投稿！<br>我會認真看的 🙏'],
  poke:['別戳了啦 😆<br>按「下一則」比較有用'],
};
let kitReact=()=>{};
(()=>{const kit=$('kit');if(!kit)return;
  const bub=kit.querySelector('.kit-say'),body=bub.querySelector('span'),cta=bub.querySelector('.kit-cta'),nxt=kit.querySelector('.kit-next'),fig=kit.querySelector('.kit-fig'),prop=kit.querySelector('.kit-prop');
  const get=(k,s)=>{try{return (s?sessionStorage:localStorage).getItem(k)}catch(e){return null}},put=(k,v,s)=>{try{(s?sessionStorage:localStorage).setItem(k,v)}catch(e){}};
  const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  // 從哪一則開始：距離上次來不到 12 小時（重新整理、同一天再逛）都從 01 開始；隔了 12 小時以上的回訪才隨機挑一組
  const last=+get('kit-last')||0,now=Date.now();put('kit-last',String(now));
  let cur=last&&now-last>12*3600e3?Math.floor(Math.random()*KIT_TALKS.length):0;const tm=[];
  let reactT=0;
  const text=(html,anim)=>{const go=()=>{body.innerHTML=html;body.classList.remove('sw')};if(anim){body.classList.add('sw');tm.push(setTimeout(go,220))}else go()};
  const talkHTML=d=>d.lines.map(esc).join('<br>')+(d.note?`<em>${esc(d.note)}</em>`:'');
  const render=(n,anim)=>{const d=KIT_TALKS[n];cur=n;clearTimeout(reactT);bub.classList.remove('react');
    text(talkHTML(d),anim);cta.textContent=d.cta;
    if(d.demo){cta.removeAttribute('href');cta.removeAttribute('target');cta.setAttribute('role','button');cta.tabIndex=0}else{cta.href=/^https?:/.test(d.href)?d.href:PORTFOLIO+d.href;cta.target='_blank';cta.removeAttribute('role');cta.removeAttribute('tabindex')}bub.dataset.talk=d.id;nxt.querySelector('small').textContent=`${n+1}/${KIT_TALKS.length}`;
    // 人物動作：先換姿勢（CSS），道具依序冒出第一個、再換第二個
    fig.className='kit-fig'+(d.pose==='present'?' present':'');void fig.offsetWidth;fig.classList.add('kit-act-'+d.act);
    prop.className='kit-prop';prop.textContent=d.props[0];void prop.offsetWidth;prop.classList.add('on');
    tm.push(setTimeout(()=>{prop.className='kit-prop';prop.textContent=d.props[1];void prop.offsetWidth;prop.classList.add('on','two')},1100));
    tm.push(setTimeout(()=>prop.classList.remove('on'),3600))};
  render(cur,false);fig.classList.remove('kit-act-'+KIT_TALKS[cur].act);prop.className='kit-prop';
  // 示範：找畫面上（或最近）一張看得到的卡片，捲到中間，讓名稱和分享按鈕亮起來
  const demo=()=>{const cs=[...document.querySelectorAll('.card')].filter(c=>c.style.display!=='none');if(!cs.length)return;
    const vis=cs.find(c=>{const r=c.getBoundingClientRect();return r.top>60&&r.bottom<innerHeight-40})||cs[0];
    // 手機上迷你我的泡泡在畫面下半部，卡片要捲到上方才不會被擋住
    const top=vis.getBoundingClientRect().top+scrollY-(innerWidth<=760?96:Math.max(80,(innerHeight-vis.offsetHeight)/2));
    scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
    vis.querySelectorAll('.demo-tip').forEach(n=>n.remove());vis.classList.remove('demo');void vis.offsetWidth;vis.classList.add('demo');
    const cr=vis.getBoundingClientRect(),tip=(target,txt)=>{const r=target.getBoundingClientRect(),n=el('span','demo-tip',txt);n.style.left=Math.max(6,Math.min(r.left-cr.left,cr.width-170))+'px';n.style.top=(r.top-cr.top-34)+'px';vis.append(n);return n};
    tip(vis.querySelector('.nm-a'),'① 點名稱看大預覽');{const sh=vis.querySelector('.sh'),n=tip(sh,'② 分享給朋友'),r=sh.getBoundingClientRect();n.classList.add('r');n.style.left=Math.max(6,r.right-cr.left-n.offsetWidth)+'px'}
    setTimeout(()=>{vis.classList.remove('demo');vis.querySelectorAll('.demo-tip').forEach(n=>n.remove())},5200);
    // 手機畫面窄，示範期間先把迷你我收到下面，免得擋住亮起來的按鈕
    if(innerWidth<=760){kit.classList.remove('in');setTimeout(()=>kit.classList.add('in'),5200)}};
  cta.addEventListener('click',e=>{if(!KIT_TALKS[cur].demo)return;e.preventDefault();demo()});
  cta.addEventListener('keydown',e=>{if(KIT_TALKS[cur].demo&&(e.key==='Enter'||e.key===' ')){e.preventDefault();demo()}});
  // 對話泡泡被關掉（這個分頁內）就只留人物；點人物會再打開
  const closed=()=>kit.classList.contains('quiet');
  if(get('kit-quiet',1)==='1')kit.classList.add('quiet');
  tm.push(setTimeout(()=>{kit.classList.add('in');if(!closed())render(cur,false)},2200));
  // 換下一則：泡泡裡的「下一則」按鈕，或直接點人物；關掉泡泡時點人物會先打開
  const next=()=>{nxt.classList.remove('hint');put('kit-next','1');render((cur+1)%KIT_TALKS.length,true)};
  nxt.onclick=next;
  let pokes=0,pokeT=0;
  fig.onclick=()=>{if(closed()){kit.classList.remove('quiet');put('kit-quiet','0',1);render(cur,false);return}
    pokes++;clearTimeout(pokeT);pokeT=setTimeout(()=>pokes=0,2500);if(pokes===5){react('poke',true);return}next()};
  let lastReact=0;
  const react=(k,force)=>{if(!kit.classList.contains('in')||closed())return;const now=Date.now();if(!force&&now-lastReact<2500)return;lastReact=now;
    const a=KIT_REACTS[k];text(a[Math.floor(Math.random()*a.length)],true);bub.classList.remove('react');void bub.offsetWidth;bub.classList.add('react');
    fig.classList.remove('kit-act-hop');void fig.offsetWidth;fig.classList.add('kit-act-hop');
    clearTimeout(reactT);reactT=setTimeout(()=>{bub.classList.remove('react');text(talkHTML(KIT_TALKS[cur]),true)},4200)};
  kitReact=react;
  // 捲超過 6 個畫面高時說一次
  let saidScroll=false;addEventListener('scroll',()=>{if(!saidScroll&&scrollY>innerHeight*6){saidScroll=true;react('scroll',true)}},{passive:true});
  // 還沒按過「下一則」的訪客：出場幾秒後讓按鈕呼吸兩下，提示還有別的話
  if(get('kit-next')!=='1')tm.push(setTimeout(()=>{if(!closed())nxt.classList.add('hint')},6500));
  kit.querySelector('.kit-x').onclick=()=>{kit.classList.add('quiet');put('kit-quiet','1',1);prop.classList.remove('on')};
})();
// 篩選或搜尋時讓迷你我回應一句（搜尋要停下來才算）
document.querySelectorAll('#fComp,#fWhen,#fUse').forEach(b=>b.addEventListener('click',e=>{if(e.target.closest('.chip'))kitReact('filter')}));
['sComp','sWhen','sUse','sTech','tech'].forEach(id=>$(id).addEventListener('change',()=>kitReact('filter')));
let kitQ;['q','q2'].forEach(id=>$(id).addEventListener('input',()=>{clearTimeout(kitQ);kitQ=setTimeout(()=>kitReact('filter'),1200)}));
// 網址帶 #編號（或 #fx-編號）時：清掉會把它藏起來的篩選，捲到那張卡片並亮一下
function goHash(smooth){const m=location.hash.match(/^#(?:fx-)?0*(\d+)$/);if(!m)return;const card=$('fx-'+m[1]);if(!card)return;
  if(!match(card)){Object.assign(state,{comp:'all',when:'all',use:'all',tech:'all',q:''});$('q').value=$('q2').value='';render()}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const top=card.getBoundingClientRect().top+scrollY-(innerHeight-card.offsetHeight)/2;
    scrollTo({top:Math.max(0,top),behavior:smooth?'smooth':'auto'});card.classList.remove('hl');void card.offsetWidth;card.classList.add('hl')}))}
addEventListener('hashchange',()=>goHash(true));
if(document.readyState==='complete')goHash(false);else addEventListener('load',()=>goHash(false));

