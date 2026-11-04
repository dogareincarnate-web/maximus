const LS_KEY = 'maximus.v1';

const LEAGUES = [
  {name:'Bronze',   min:1,  c1:'#ffd7a8', c2:'#c47b2a'},
  {name:'Silver',   min:5,  c1:'#f4f7fb', c2:'#9fb0c3'},
  {name:'Gold',     min:10, c1:'#ffe680', c2:'#d99b00'},
  {name:'Platinum', min:16, c1:'#d6fff4', c2:'#2fb8a0'},
  {name:'Diamond',  min:24, c1:'#d8f4ff', c2:'#3aa8e0'},
  {name:'Master',   min:34, c1:'#e6d8ff', c2:'#7a5ae0'},
  {name:'Legend',   min:48, c1:'#ffd8ec', c2:'#e0459a'},
];

const ACHIEVEMENTS = [
  {id:'first',  n:'First Light',     d:'Complete your first quest',   i:'🌅', f:s=>s.stats.totalCompleted>=1},
  {id:'ten',    n:'Getting Warm',    d:'Complete 10 quests',          i:'🔥', f:s=>s.stats.totalCompleted>=10},
  {id:'fifty',  n:'Momentum',        d:'Complete 50 quests',          i:'🚀', f:s=>s.stats.totalCompleted>=50},
  {id:'hundred',n:'Centurion',       d:'Complete 100 quests',         i:'🏛️', f:s=>s.stats.totalCompleted>=100},
  {id:'lv5',    n:'Apprentice',      d:'Reach level 5',               i:'⭐', f:s=>level(s.player.totalXp)>=5},
  {id:'lv10',   n:'Adept',           d:'Reach level 10',              i:'🌟', f:s=>level(s.player.totalXp)>=10},
  {id:'lv20',   n:'Champion',        d:'Reach level 20',              i:'💫', f:s=>level(s.player.totalXp)>=20},
  {id:'lv50',   n:'Ascendant',       d:'Reach level 50',              i:'👑', f:s=>level(s.player.totalXp)>=50},
  {id:'streak3',n:'On a Roll',       d:'3-day streak',                i:'📆', f:s=>s.player.streak>=3},
  {id:'streak7',n:'Week Warrior',    d:'7-day streak',                i:'🗓️', f:s=>s.player.streak>=7},
  {id:'streak30',n:'Unbroken',       d:'30-day streak',               i:'💎', f:s=>s.player.streak>=30},
  {id:'perfect',n:'Perfect Day',     d:'Complete every quest in a day',i:'✅', f:s=>s._perfectDay===true},
];

const DEFAULT_DIALOGUES = {
  mentor: [
    "Small steps become legends. {q} is waiting — you know what to do.",
    "The strongest version of you is built one action at a time. Start with {q}.",
    "You don't need motivation. You need momentum. {q} is one rep away.",
    "Your future self just sent a thank-you note. It starts with {q}.",
    "Discipline is self-respect in motion. Honour it with {q}.",
  ],
  sarcastic: [
    "Oh look, {q} isn't going to do itself. Shocking, I know.",
    "The couch will survive without you. {q}. Now.",
    "Congratulations, you've unlocked '{q}'. Also known as 'responsibility'.",
    "Your phone battery is at stake. {q} — go, before it dies.",
    "I'd remind you of {q}, but I assumed you'd forget anyway.",
  ],
  ruthless: [
    "{q}. No excuses. No negotiating. Move.",
    "Comfort is a liar. {q}. Now.",
    "You promised. Deliver. {q}.",
    "Every minute you hesitate, someone hungrier is working. {q}.",
    "Silence the noise. Execute {q}. That is all.",
  ]
};

function uid(){ return (crypto.randomUUID?crypto.randomUUID():'id'+Math.random().toString(36).slice(2)+Date.now().toString(36)); }
function todayStr(){ const d=new Date(); return dateStr(d); }
function dateStr(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function level(totalXp){ let L=1; while(50*(L+1)*L <= totalXp) L++; return L; }
function xpForLevel(L){ return 50*L*(L-1); }
function xpIntoLevel(tx){ const L=level(tx); return tx - xpForLevel(L); }
function xpForNext(L){ return 100*L; }
function leagueFor(L){ let idx=0; for(let i=0;i<LEAGUES.length;i++) if(L>=LEAGUES[i].min) idx=i; return idx; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function $(sel,root){ return (root||document).querySelector(sel); }
function $$(sel,root){ return [...(root||document).querySelectorAll(sel)]; }

function freshState(){
  const cat = [
    {id:uid(), name:'Fitness',  color:'#ff9f1c', icon:'💪'},
    {id:uid(), name:'Learning', color:'#00d4ff', icon:'📚'},
    {id:uid(), name:'Work',     color:'#22c55e', icon:'💼'},
    {id:uid(), name:'Wellness', color:'#a3e635', icon:'🌿'},
    {id:uid(), name:'Home',     color:'#ffe14d', icon:'🏠'},
  ];
  const attrs = [
    {id:uid(), name:'Body',   icon:'💪', xp:0},
    {id:uid(), name:'Mind',   icon:'🧠', xp:0},
    {id:uid(), name:'Spirit', icon:'✨', xp:0},
    {id:uid(), name:'Craft',  icon:'🛠️', xp:0},
    {id:uid(), name:'Social', icon:'🤝', xp:0},
  ];
  return {
    version:1,
    player:{ totalXp:0, streak:0, lastComplete:null, achievements:[] },
    quests:[
      {id:uid(), title:'Morning stretch',   catId:cat[0].id, attrId:attrs[0].id, xp:15, priority:'med', schedule:'daily', completions:[], reminder:'07:30', note:''},
      {id:uid(), title:'Read 10 pages',     catId:cat[1].id, attrId:attrs[1].id, xp:20, priority:'med', schedule:'daily', completions:[], reminder:'', note:''},
      {id:uid(), title:'Deep work block',   catId:cat[2].id, attrId:attrs[3].id, xp:40, priority:'high', schedule:'weekdays', completions:[], reminder:'09:00', note:'90 minutes, no phone'},
      {id:uid(), title:'Evening walk',      catId:cat[3].id, attrId:attrs[0].id, xp:25, priority:'low', schedule:'daily', completions:[], reminder:'', note:''},
    ],
    categories:cat,
    attributes:attrs,
    settings:{ personality:'mentor', music:true, musicVol:0.35, track:'aero', sfx:true, sfxVol:0.6 },
    dialogues: JSON.parse(JSON.stringify(DEFAULT_DIALOGUES)),
    stats:{ totalCompleted:0, dailyHistory:{} },
    createdAt: todayStr(),
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){
      const s = JSON.parse(raw);
      if(!s.dialogues) s.dialogues = JSON.parse(JSON.stringify(DEFAULT_DIALOGUES));
      if(!s.stats) s.stats = {totalCompleted:0,dailyHistory:{}};
      if(!s.settings.personality) s.settings.personality='mentor';
      return s;
    }
  }catch(e){ console.warn('load failed',e); }
  return freshState();
}
let S = loadState();
function save(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){ console.warn('save failed',e); } }

const Music = {
  ctx:null, master:null, playing:false, track:'aero', timer:null, step:0, nextTime:0,
  tracks:{
    aero:{ name:'Aero Dawn', bpm:72, root:261.63, chords:[[0,4,7,11],[7,11,14,17],[5,9,12,16],[2,5,9,12]], arp:[0,4,7,11,14,7,4,0] },
    lagoon:{ name:'Lagoon Drift', bpm:64, root:220, chords:[[0,3,7,10],[5,8,12,15],[3,7,10,14],[8,12,15,19]], arp:[0,3,7,10,14,10,7,3] },
    canopy:{ name:'Sunlit Canopy', bpm:84, root:293.66, chords:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]], arp:[0,4,7,11,16,11,7,4] },
  },
  init(){
    if(this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = S.settings.musicVol;
    this.master.connect(this.ctx.destination);
  },
  start(){
    if(!S.settings.music) return;
    this.init(); if(!this.ctx) return;
    if(this.ctx.state==='suspended') this.ctx.resume();
    this.playing = true; this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    clearInterval(this.timer);
    this.timer = setInterval(()=>this.tick(), 100);
  },
  stop(){ this.playing = false; clearInterval(this.timer); },
  setVolume(v){ if(this.master) this.master.gain.value = v; },
  tick(){
    if(!this.playing || !this.ctx) return;
    const t = this.tracks[this.track];
    const beat = 60/t.bpm; const stepDur = beat/2;
    while(this.nextTime < this.ctx.currentTime + 0.4){
      const s = this.step;
      if(s % 8 === 0) this.pad(t.chords[Math.floor(s/8) % t.chords.length], this.nextTime, beat*3.6, t.root);
      if(s % 2 === 0) this.pluck(t.root * Math.pow(2, t.arp[s % t.arp.length]/12), this.nextTime);
      this.nextTime += stepDur; this.step = (this.step + 1) % 64;
    }
  },
  pad(semis, when, dur, root){
    const ctx = this.ctx; const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.12, when + 0.6);
    g.gain.setValueAtTime(0.12, when + dur*0.7);
    g.gain.linearRampToValueAtTime(0, when + dur);
    g.connect(this.master);
    semis.forEach(s=>{
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = root * Math.pow(2, s/12) / 2;
      o.connect(g); o.start(when); o.stop(when + dur + 0.1);
    });
  },
  pluck(freq, when){
    const ctx = this.ctx; const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.08, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.5);
    o.connect(g); g.connect(this.master);
    o.start(when); o.stop(when + 0.55);
  },
};

const SFX = {
  ctx:null,
  init(){ if(!this.ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(AC) this.ctx=new AC(); } },
  tone(freq, when, dur, type='sine', vol=0.18){
    if(!S.settings.sfx) return;
    this.init(); if(!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol*S.settings.sfxVol, t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t+dur+0.05);
  },
  xp(){ this.tone(660,0,0.14,'sine',0.16); this.tone(880,0.06,0.18,'sine',0.14); },
  levelUp(){ [523,659,784,1047].forEach((f,i)=>this.tone(f, i*0.09, 0.35,'triangle',0.2)); },
  league(){ [392,523,659,784,1047,1319].forEach((f,i)=>this.tone(f, i*0.07, 0.4,'triangle',0.2)); },
  achievement(){ this.tone(1047,0,0.12,'sine',0.18); this.tone(1568,0.08,0.2,'sine',0.15); this.tone(2093,0.16,0.25,'sine',0.12); },
  tap(){ this.tone(440,0,0.06,'sine',0.1); },
};

const Notify = {
  permission: (typeof Notification!=='undefined')?Notification.permission:'unsupported',
  timers: {},
  async request(){
    if(typeof Notification==='undefined'){ toast('Notifications not supported here'); return; }
    if(Notification.permission==='granted'){ this.permission='granted'; return; }
    try{ const p = await Notification.requestPermission(); this.permission=p; }catch(e){}
    save(); render();
  },
  pick(personality, questTitle){
    const bank = S.dialogues[personality] || S.dialogues.mentor;
    return bank[Math.floor(Math.random()*bank.length)].replace('{q}', questTitle);
  },
  send(title, body){
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification(title, {body, icon:'icon.svg', tag:'maximus-'+Date.now()}); return; }catch(e){}
    }
    toast(body, 5000);
  },
  scheduleAll(){
    Object.values(this.timers).forEach(t=>clearTimeout(t));
    this.timers = {};
    if(this.permission!=='granted') return;
    if(typeof Push !== 'undefined' && Push.subscribed) return;
    S.quests.forEach(q=>{
      if(!q.reminder || !questDueToday(q) || isDoneToday(q)) return;
      const [h,m] = q.reminder.split(':').map(Number);
      const now = new Date();
      const target = new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0,0);
      let delay = target - now;
      if(delay < 0) delay += 24*3600*1000;
      if(delay > 12*3600*1000) return;
      this.timers[q.id] = setTimeout(()=>{
        this.send('MAXIMUS — '+q.title, this.pick(S.settings.personality, q.title));
      }, delay);
    });
  }
};

function urlBase64ToUint8Array(base64String){
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g,'+').replace(/_/g,'/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) out[i] = raw.charCodeAt(i);
  return out;
}

function scheduleToDays(s){
  if (s==='daily')    return [0,1,2,3,4,5,6];
  if (s==='weekdays') return [1,2,3,4,5];
  if (s==='weekends') return [0,6];
  if (s==='once')     return [];
  return [0,1,2,3,4,5,6];
}

const Push = {
  subscribed: false,
  serverUrl: localStorage.getItem('maximus.push.url') || '',
  async init(){
    if(!('serviceWorker' in navigator) || !('PushManager' in window)){ this.subscribed=false; return; }
    try{
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      this.subscribed = !!sub;
    }catch(e){ this.subscribed = false; }
  },
  async getStatus(){
    if(!('serviceWorker' in navigator)) return 'unsupported';
    if(!('PushManager' in window))      return 'unsupported (iOS 16.4+ & installed PWA required)';
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if(!sub) return 'not subscribed';
    return 'subscribed';
  },
  async subscribe(serverUrl){
    if(!serverUrl) throw new Error('Server URL required');
    if(!('PushManager' in window)) throw new Error('Push unsupported on this device');
    if(typeof Notification === 'undefined') throw new Error('Notifications unsupported');
    if(Notification.permission !== 'granted'){
      const p = await Notification.requestPermission();
      if(p !== 'granted') throw new Error('Permission denied');
      this.permission = p;
    }
    this.serverUrl = serverUrl.replace(/\/$/,'');
    localStorage.setItem('maximus.push.url', this.serverUrl);
    const reg = await navigator.serviceWorker.ready;
    const r = await fetch(this.serverUrl + '/vapid-public');
    if(!r.ok) throw new Error('Worker unreachable: ' + r.status);
    const { publicKey } = await r.json();
    if(!publicKey) throw new Error('No VAPID key on server');
    let sub = await reg.pushManager.getSubscription();
    if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    this.subscribed = true;
    await this.sync();
  },
  async sync(){
    if(!this.subscribed || !this.serverUrl) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if(!sub){ this.subscribed = false; return; }
    const today = todayStr();
    const reminders = S.quests.filter(q => q.reminder).map(q => ({
      id: q.id, title: q.title, time: q.reminder,
      days: scheduleToDays(q.schedule),
      date: q.schedule === 'once' ? (isDoneToday(q) ? null : today) : null
    })).filter(r => r.date || r.days.length > 0);
    const payload = {
      subscription: sub.toJSON(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      personality: S.settings.personality,
      reminders, dialogues: S.dialogues
    };
    const r = await fetch(this.serverUrl + '/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('Sync failed: ' + r.status);
  },
  async test(){
    if(!this.serverUrl) throw new Error('No server configured');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if(!sub) throw new Error('Not subscribed');
    const r = await fetch(this.serverUrl + '/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, personality: S.settings.personality })
    });
    if(!r.ok) throw new Error('Test failed: ' + r.status);
  },
  async unsubscribe(){
    try{
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if(sub){
        await fetch(this.serverUrl + '/unsubscribe', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        }).catch(()=>{});
        await sub.unsubscribe();
      }
    }catch(e){}
    this.subscribed = false; save();
  }
};

function questDueToday(q){
  if(q.schedule==='once') return q.completions.length===0;
  const d = new Date().getDay();
  if(q.schedule==='daily') return true;
  if(q.schedule==='weekdays') return d>=1 && d<=5;
  if(q.schedule==='weekends') return d===0 || d===6;
  if(Array.isArray(q.schedule)) return q.schedule.includes(d);
  return true;
}
function isDoneToday(q){ return q.completions.includes(todayStr()); }
function getCat(id){ return S.categories.find(c=>c.id===id); }
function getAttr(id){ return S.attributes.find(a=>a.id===id); }

function awardXp(amount, attrId){
  const oldLevel = level(S.player.totalXp);
  const oldLeague = leagueFor(oldLevel);
  S.player.totalXp += amount;
  const newLevel = level(S.player.totalXp);
  const newLeague = leagueFor(newLevel);
  if(attrId){ const a = getAttr(attrId); if(a) a.xp += amount; }
  return { oldLevel, newLevel, oldLeague, newLeague };
}

function completeQuest(id){
  const q = S.quests.find(x=>x.id===id);
  if(!q) return;
  if(isDoneToday(q)){ toast('Already complete today'); return; }
  const res = awardXp(q.xp, q.attrId);
  q.completions.push(todayStr());
  S.stats.totalCompleted++;
  const t = todayStr();
  S.stats.dailyHistory[t] = (S.stats.dailyHistory[t]||0)+1;
  if(S.player.lastComplete !== t){
    const y = new Date(); y.setDate(y.getDate()-1);
    if(S.player.lastComplete === dateStr(y)) S.player.streak++;
    else S.player.streak = 1;
    S.player.lastComplete = t;
  }
  const dueToday = S.quests.filter(questDueToday);
  S._perfectDay = dueToday.length>0 && dueToday.every(isDoneToday);
  if(res.newLeague > res.oldLeague){ SFX.league(); toast('🏆 League promotion — '+LEAGUES[res.newLeague].name+'!', 4000); }
  else if(res.newLevel > res.oldLevel){ SFX.levelUp(); toast('⭐ Level '+res.newLevel+' — level up!', 3500); }
  else { SFX.xp(); toast('+'+q.xp+' XP · '+q.title); }
  checkAchievements();
  save(); render(); Notify.scheduleAll();
  if(Push && Push.subscribed) Push.sync().catch(()=>{});
}

function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(S.player.achievements.includes(a.id)) return;
    if(a.f(S)){
      S.player.achievements.push(a.id);
      setTimeout(()=>{ SFX.achievement(); toast('🏅 '+a.n+' — '+a.d, 3500); }, 400);
    }
  });
  delete S._perfectDay;
}
