let currentTab = 'home';
const view = $('#view');

function render(){
  renderStreakPill();
  if(currentTab==='home') renderHome();
  else if(currentTab==='quests') renderQuests();
  else if(currentTab==='stats') renderStats();
  else if(currentTab==='settings') renderSettings();
  $$('nav button').forEach(b=>b.classList.toggle('active', b.dataset.tab===currentTab));
}

function renderStreakPill(){
  $('#streakpill').innerHTML = S.player.streak>0
    ? `<span class="streak">🔥 ${S.player.streak}-day streak</span>` : '';
}

function leagueBadge(L){
  const li = leagueFor(L); const lg = LEAGUES[li];
  return `<span class="league" style="background:linear-gradient(180deg,${lg.c1},${lg.c2});color:#2a1a00;border-color:#fff">${lg.name} League</span>`;
}

function renderHome(){
  const L = level(S.player.totalXp);
  const into = xpIntoLevel(S.player.totalXp);
  const need = xpForNext(L);
  const pct = Math.min(100, Math.round(into/need*100));
  const due = S.quests.filter(questDueToday);
  const open = due.filter(q=>!isDoneToday(q));
  const done = due.filter(isDoneToday);
  const todayCount = S.stats.dailyHistory[todayStr()]||0;
  view.innerHTML = `
    <div class="glass hero">
      <div class="orb"><div class="lvl">${L}</div><div class="lab">LEVEL</div></div>
      <div class="hero-info">
        ${leagueBadge(L)}
        <div class="xpbar"><div class="xpfill" style="width:${pct}%"></div></div>
        <div class="xptext">${into} / ${need} XP to level ${L+1} · ${S.player.totalXp} total XP</div>
      </div>
    </div>
    <div class="glass">
      <h3>Today at a glance</h3>
      <div class="row" style="gap:10px">
        <div style="text-align:center"><div style="font-size:26px;font-weight:900">${done.length}/${due.length}</div><div class="muted">Quests done</div></div>
        <div style="text-align:center"><div style="font-size:26px;font-weight:900">${todayCount}</div><div class="muted">Completed today</div></div>
        <div style="text-align:center"><div style="font-size:26px;font-weight:900">${S.player.streak}</div><div class="muted">Day streak</div></div>
      </div>
    </div>
    <div class="glass">
      <h3>Open quests (${open.length})</h3>
      ${open.length===0 ? `<p class="muted">All clear — enjoy the sunshine. ☀️</p>` : open.map(questCard).join('')}
    </div>
    ${done.length? `<div class="glass"><h3>Completed today (${done.length})</h3>${done.map(questCard).join('')}</div>`:''}
  `;
}

function renderQuests(){
  const due = S.quests.filter(questDueToday);
  const other = S.quests.filter(q=>!questDueToday(q));
  view.innerHTML = `
    <div class="glass">
      <h2>Today's quests</h2>
      ${due.length? due.map(questCard).join('') : '<p class="muted">No quests scheduled for today.</p>'}
    </div>
    ${other.length? `<div class="glass"><h3>Not scheduled today (${other.length})</h3>${other.map(questCard).join('')}</div>`:''}
    ${S.quests.length===0? '<p class="muted" style="text-align:center;padding:30px">Tap + to create your first quest.</p>':''}
  `;
}

function questCard(q){
  const cat = getCat(q.catId) || {color:'#00d4ff', icon:'📌', name:'General'};
  const done = isDoneToday(q);
  return `<div class="quest ${done?'done':''}">
    <div class="cat" style="background:linear-gradient(180deg,${cat.color},${shade(cat.color,-25)})">${cat.icon}</div>
    <div class="body">
      <div class="title">${esc(q.title)}</div>
      <div class="meta">
        <span>${esc(cat.name)}</span>
        ${q.attrId? `<span>· ${esc((getAttr(q.attrId)||{}).name||'')}</span>`:''}
        ${q.reminder? `<span>· ⏰ ${q.reminder}</span>`:''}
        ${q.priority==='high'? `<span>· 🔴 high</span>`:q.priority==='low'? `<span>· 🟢 low</span>`:''}
      </div>
    </div>
    <div class="xpbadge">+${q.xp} XP</div>
    <button class="qbtn" data-action="complete" data-id="${q.id}" ${done?'disabled':''}>${done?'✓':'▶'}</button>
    <button class="qbtn ghost" data-action="edit" data-id="${q.id}">✎</button>
  </div>`;
}

function shade(hex, amt){
  const h = hex.replace('#','');
  const n = parseInt(h,16);
  let r=(n>>16)+amt, g=((n>>8)&0xff)+amt, b=(n&0xff)+amt;
  r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b));
  return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}

function renderStats(){
  const L = level(S.player.totalXp);
  const maxAttr = Math.max(1, ...S.attributes.map(a=>a.xp));
  view.innerHTML = `
    <div class="glass">
      <h2>Attributes</h2>
      ${S.attributes.map(a=>{
        const pct = Math.round(a.xp/maxAttr*100);
        return `<div class="attr">
          <div class="top"><span>${a.icon} ${esc(a.name)}</span><span>${a.xp} XP</span></div>
          <div class="attrbar"><div class="attrfill" style="width:${pct}%"></div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="glass">
      <h2>Achievements (${S.player.achievements.length}/${ACHIEVEMENTS.length})</h2>
      <div class="ach-grid">
        ${ACHIEVEMENTS.map(a=>{
          const unlocked = S.player.achievements.includes(a.id);
          return `<div class="ach ${unlocked?'':'locked'}">
            <div class="aic">${a.i}</div>
            <div class="an">${a.n}</div>
            <div class="ad">${a.d}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="glass">
      <h2>Career</h2>
      <div class="row">
        <div><div class="muted">Level</div><div style="font-size:26px;font-weight:900">${L}</div></div>
        <div><div class="muted">League</div><div style="font-size:26px;font-weight:900">${LEAGUES[leagueFor(L)].name}</div></div>
        <div><div class="muted">Quests completed</div><div style="font-size:26px;font-weight:900">${S.stats.totalCompleted}</div></div>
        <div><div class="muted">Total XP</div><div style="font-size:26px;font-weight:900">${S.player.totalXP ?? S.player.totalXp}</div></div>
      </div>
    </div>
  `;
}

function renderSettings(){
  const s = S.settings;
  const p = Notify.permission;
  view.innerHTML = `
    <div class="glass">
      <h2>Push notifications (WiFi)</h2>
      <div class="note">
        <b>Delivered while closed — over WiFi.</b> Uses a free Cloudflare Worker.
        Requires the app installed to Home Screen (iOS 16.4+, Safari only).
        Your iPad needs internet at the moment the reminder fires.
      </div>
      <p class="muted">Status: <b id="push-status">…</b></p>
      <label>Server URL</label>
      <input id="push-url" type="url" placeholder="https://maximus-push.yourname.workers.dev" value="${localStorage.getItem('maximus.push.url')||''}">
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="primary" data-action="push-subscribe">Subscribe</button>
        <button class="ghost"   data-action="push-sync">Sync reminders</button>
        <button class="ghost"   data-action="push-test">Test push</button>
        <button class="danger"  data-action="push-unsub">Unsubscribe</button>
      </div>
    </div>
    <div class="glass">
      <h2>Notifications</h2>
      <div class="note">
        <b>Fallback:</b> when the app is open or in the background, local notifications fire here.
        Push (above) handles fully-closed delivery.
      </div>
      <p class="muted">Permission status: <b>${p}</b></p>
      <button class="primary" data-action="notif-permission">Enable notifications</button>
      <button class="ghost" data-action="notif-test" style="margin-left:8px">Send test</button>
      <label>Personality</label>
      <div class="pill-group">
        ${['mentor','sarcastic','ruthless'].map(x=>`<button class="pill ${s.personality===x?'sel':''}" data-action="set-personality" data-val="${x}">${x[0].toUpperCase()+x.slice(1)}</button>`).join('')}
      </div>
    </div>
    <div class="glass">
      <h2>Music</h2>
      <div class="switch"><span>Background music</span><input type="checkbox" ${s.music?'checked':''} data-action="toggle-music"></div>
      <label>Soundtrack</label>
      <div class="pill-group">
        ${Object.entries(Music.tracks).map(([k,t])=>`<button class="pill ${s.track===k?'sel':''}" data-action="set-track" data-val="${k}">${t.name}</button>`).join('')}
      </div>
      <label>Music volume</label>
      <input type="range" class="slider" min="0" max="1" step="0.05" value="${s.musicVol}" data-action="music-vol">
    </div>
    <div class="glass">
      <h2>Sound effects</h2>
      <div class="switch"><span>SFX enabled</span><input type="checkbox" ${s.sfx?'checked':''} data-action="toggle-sfx"></div>
      <label>SFX volume</label>
      <input type="range" class="slider" min="0" max="1" step="0.05" value="${s.sfxVol}" data-action="sfx-vol">
    </div>
    <div class="glass">
      <h2>Categories</h2>
      ${S.categories.map(c=>`<div class="quest" style="margin-bottom:6px">
        <div class="cat" style="background:linear-gradient(180deg,${c.color},${shade(c.color,-25)})">${c.icon}</div>
        <div class="body"><div class="title">${esc(c.name)}</div></div>
        <button class="qbtn ghost" data-action="del-cat" data-id="${c.id}">🗑</button>
      </div>`).join('')}
      <button class="ghost" data-action="add-cat">+ Add category</button>
    </div>
    <div class="glass">
      <h2>Attributes</h2>
      ${S.attributes.map(a=>`<div class="quest" style="margin-bottom:6px">
        <div class="cat" style="background:linear-gradient(180deg,#eaffff,#7fe8ff)">${a.icon}</div>
        <div class="body"><div class="title">${esc(a.name)}</div><div class="meta">${a.xp} XP</div></div>
        <button class="qbtn ghost" data-action="del-attr" data-id="${a.id}">🗑</button>
      </div>`).join('')}
      <button class="ghost" data-action="add-attr">+ Add attribute</button>
    </div>
    <div class="glass">
      <h2>Data</h2>
      <button class="primary" data-action="export">Export JSON backup</button>
      <button class="ghost" data-action="import" style="margin-left:8px">Import backup</button>
      <input type="file" id="importFile" accept="application/json" style="display:none">
      <button class="danger" data-action="reset" style="margin-top:12px">Reset all progress</button>
    </div>
  `;
  Push.getStatus().then(s => {
    const el = $('#push-status');
    if(el) el.textContent = s;
  }).catch(()=>{});
  const fi = $('#importFile');
  if(fi) fi.addEventListener('change', handleImportFile);
}

function openQuestModal(quest){
  const q = quest || { id:null, title:'', catId:S.categories[0]?.id, attrId:S.attributes[0]?.id, xp:20, priority:'med', schedule:'daily', reminder:'', note:'', completions:[] };
  const isEdit = !!quest;
  const sheet = $('#sheet');
  sheet.innerHTML = `
    <h2>${isEdit?'Edit quest':'New quest'}</h2>
    <label>Title</label>
    <input id="f-title" value="${esc(q.title)}" placeholder="e.g. Read 10 pages">
    <div class="row">
      <div><label>Category</label>
        <select id="f-cat">${S.categories.map(c=>`<option value="${c.id}" ${c.id===q.catId?'selected':''}>${c.icon} ${esc(c.name)}</option>`).join('')}</select>
      </div>
      <div><label>Attribute</label>
        <select id="f-attr"><option value="">— none —</option>${S.attributes.map(a=>`<option value="${a.id}" ${a.id===q.attrId?'selected':''}>${a.icon} ${esc(a.name)}</option>`).join('')}</select>
      </div>
    </div>
    <div class="row">
      <div><label>XP reward</label><input id="f-xp" type="number" min="1" max="500" value="${q.xp}"></div>
      <div><label>Priority</label>
        <select id="f-pri">
          <option value="low" ${q.priority==='low'?'selected':''}>Low</option>
          <option value="med" ${q.priority==='med'?'selected':''}>Medium</option>
          <option value="high" ${q.priority==='high'?'selected':''}>High</option>
        </select>
      </div>
    </div>
    <label>Schedule</label>
    <select id="f-sched">
      <option value="daily" ${q.schedule==='daily'?'selected':''}>Every day</option>
      <option value="weekdays" ${q.schedule==='weekdays'?'selected':''}>Weekdays</option>
      <option value="weekends" ${q.schedule==='weekends'?'selected':''}>Weekends</option>
      <option value="once" ${q.schedule==='once'?'selected':''}>One-off</option>
    </select>
    <label>Reminder time (optional)</label>
    <input id="f-rem" type="time" value="${q.reminder||''}">
    <label>Note</label>
    <textarea id="f-note" rows="2" placeholder="Optional details">${esc(q.note||'')}</textarea>
    <div class="row" style="margin-top:16px">
      <button class="primary" data-action="save-quest" data-id="${q.id||''}">Save</button>
      <button class="ghost" data-action="close-modal">Cancel</button>
      ${isEdit? `<button class="danger" data-action="delete-quest" data-id="${q.id}">Delete</button>`:''}
    </div>
  `;
  $('#modal').classList.add('open');
}
function closeModal(){ $('#modal').classList.remove('open'); }

function saveQuestForm(existingId){
  const title = $('#f-title').value.trim();
  if(!title){ toast('Title required'); return; }
  const payload = {
    title,
    catId: $('#f-cat').value,
    attrId: $('#f-attr').value || null,
    xp: Math.max(1, Math.min(500, parseInt($('#f-xp').value)||10)),
    priority: $('#f-pri').value,
    schedule: $('#f-sched').value,
    reminder: $('#f-rem').value || '',
    note: $('#f-note').value.trim(),
  };
  if(existingId){
    const q = S.quests.find(x=>x.id===existingId);
    if(q) Object.assign(q, payload);
  } else {
    S.quests.push({ id:uid(), completions:[], ...payload });
  }
  save(); closeModal(); render(); Notify.scheduleAll();
  if(Push && Push.subscribed) Push.sync().catch(()=>{});
}

$('#view').addEventListener('click', async e=>{
  const b = e.target.closest('[data-action]');
  if(!b) return;
  const a = b.dataset.action;
  const id = b.dataset.id;
  const val = b.dataset.val;
  switch(a){
    case 'complete': completeQuest(id); break;
    case 'edit': openQuestModal(S.quests.find(q=>q.id===id)); break;
    case 'set-personality':
      S.settings.personality = val; save(); render();
      if(Push && Push.subscribed) Push.sync().catch(()=>{});
      break;
    case 'toggle-music':
      S.settings.music = !S.settings.music;
      if(S.settings.music) Music.start(); else Music.stop();
      save(); render(); break;
    case 'set-track':
      S.settings.track = val;
      if(S.settings.music){ Music.track = val; Music.stop(); Music.start(); }
      save(); render(); break;
    case 'toggle-sfx': S.settings.sfx = !S.settings.sfx; save(); render(); break;
    case 'notif-permission': Notify.request().then(()=>Notify.scheduleAll()); break;
    case 'notif-test': Notify.send('MAXIMUS — test', Notify.pick(S.settings.personality,'your next quest')); break;
    case 'push-subscribe': {
      const url = ($('#push-url')?.value || '').trim();
      if(!url){ toast('Enter server URL'); break; }
      try { await Push.subscribe(url); toast('Push subscribed ✓'); render(); }
      catch(err){ toast('Subscribe failed: ' + err.message, 4000); }
      break;
    }
    case 'push-sync': {
      try { await Push.sync(); toast('Reminders synced'); }
      catch(err){ toast('Sync failed: ' + err.message, 4000); }
      break;
    }
    case 'push-test': {
      try { await Push.test(); toast('Test push sent — check your iPad'); }
      catch(err){ toast('Test failed: ' + err.message, 4000); }
      break;
    }
    case 'push-unsub': await Push.unsubscribe(); toast('Unsubscribed'); render(); break;
    case 'add-cat': addCategory(); break;
    case 'del-cat': delCategory(id); break;
    case 'add-attr': addAttribute(); break;
    case 'del-attr': delAttribute(id); break;
    case 'export': exportBackup(); break;
    case 'import': $('#importFile').click(); break;
    case 'reset':
      if(confirm('Reset ALL progress? This cannot be undone.')){
        localStorage.removeItem(LS_KEY); S = freshState(); save(); render(); Music.stop();
      }
      break;
    case 'close-modal': closeModal(); break;
    case 'save-quest': saveQuestForm(id||null); break;
    case 'delete-quest':
      if(confirm('Delete this quest?')){
        S.quests = S.quests.filter(q=>q.id!==id);
        save(); closeModal(); render();
        if(Push && Push.subscribed) Push.sync().catch(()=>{});
      }
      break;
  }
});

$('#view').addEventListener('input', e=>{
  const b = e.target.closest('[data-action]');
  if(!b) return;
  const a = b.dataset.action;
  if(a==='music-vol'){ S.settings.musicVol = parseFloat(b.value); Music.setVolume(b.value); save(); }
  if(a==='sfx-vol'){ S.settings.sfxVol = parseFloat(b.value); save(); }
});

$('#modal').addEventListener('click', e=>{ if(e.target.id==='modal') closeModal(); });

$$('nav button').forEach(b=>{
  b.addEventListener('click', ()=>{ currentTab = b.dataset.tab; render(); });
});

$('#fab').addEventListener('click', ()=>{
  if(currentTab!=='quests' && currentTab!=='home'){ currentTab='quests'; render(); }
  openQuestModal(null);
});

function addCategory(){
  const name = prompt('Category name?'); if(!name) return;
  const color = prompt('Colour hex (e.g. #ff9f1c):', '#00d4ff') || '#00d4ff';
  const icon = prompt('Emoji icon:', '⭐') || '⭐';
  S.categories.push({ id:uid(), name, color, icon });
  save(); render();
}
function delCategory(id){
  if(S.categories.length<=1){ toast('Keep at least one category'); return; }
  if(!confirm('Delete category? Quests in it will lose their category.')) return;
  S.categories = S.categories.filter(c=>c.id!==id);
  S.quests.forEach(q=>{ if(q.catId===id) q.catId = S.categories[0].id; });
  save(); render();
}
function addAttribute(){
  const name = prompt('Attribute name?'); if(!name) return;
  const icon = prompt('Emoji icon:', '✨') || '✨';
  S.attributes.push({ id:uid(), name, icon, xp:0 });
  save(); render();
}
function delAttribute(id){
  if(!confirm('Delete attribute?')) return;
  S.attributes = S.attributes.filter(a=>a.id!==id);
  S.quests.forEach(q=>{ if(q.attrId===id) q.attrId = null; });
  save(); render();
}

function exportBackup(){
  const blob = new Blob([JSON.stringify(S,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'maximus-backup-'+todayStr()+'.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 1000);
  toast('Backup exported');
}
function handleImportFile(e){
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const data = JSON.parse(r.result);
      if(!data.player || !data.quests) throw new Error('Invalid file');
      if(!confirm('Import will replace current progress. Continue?')) return;
      S = data;
      if(!S.dialogues) S.dialogues = JSON.parse(JSON.stringify(DEFAULT_DIALOGUES));
      save(); render(); toast('Backup restored');
    }catch(err){ toast('Invalid backup file'); }
  };
  r.readAsText(file);
  e.target.value = '';
}

let toastTimer;
function toast(msg, ms=2400){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), ms);
}

(function makeBubbles(){
  const sky = $('#sky');
  for(let i=0;i<14;i++){
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 40 + Math.random()*120;
    b.style.width = b.style.height = size+'px';
    b.style.left = Math.random()*100+'%';
    b.style.top = Math.random()*100+'%';
    b.style.animationDuration = (8+Math.random()*10)+'s';
    b.style.animationDelay = (-Math.random()*10)+'s';
    b.style.opacity = 0.4+Math.random()*0.4;
    sky.appendChild(b);
  }
})();

async function boot(){
  await Push.init().catch(()=>{});
  render();
  const startMusic = ()=>{
    if(S.settings.music && !Music.playing){ Music.track = S.settings.track; Music.start(); }
    document.removeEventListener('touchstart', startMusic);
    document.removeEventListener('click', startMusic);
  };
  document.addEventListener('touchstart', startMusic, {once:true});
  document.addEventListener('click', startMusic, {once:true});
  if(Notify.permission==='default') setTimeout(()=>{ toast('Enable reminders in Settings → Notifications', 3500); }, 2500);
  Notify.scheduleAll();
  setInterval(()=>{ if(todayStr() !== S._lastRenderDay){ S._lastRenderDay=todayStr(); render(); Notify.scheduleAll(); } }, 60000);
  S._lastRenderDay = todayStr();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
}
boot();
