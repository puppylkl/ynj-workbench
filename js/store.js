/* =========================================================
 * store.js — 状态管理：本地存储、每日轮换、打卡积分、错题本
 * ========================================================= */
(function(){
"use strict";

const LS_KEY = "ynj_workbench_v1";

/* ---------- 工具 ---------- */
function pad(n){ return String(n).padStart(2,"0"); }
function fmtDate(d){
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
}
function todayStr(){ return fmtDate(new Date()); }
// 把一个日期字符串转成连续天数（用于内容轮换）
function dayIndex(dateStr){
  const p = dateStr.split("-").map(Number);
  const t = new Date(p[0], p[1]-1, p[2]).getTime();
  return Math.floor(t / 86400000);
}
function uid(prefix){ return (prefix||"x") + "_" + Date.now().toString(36) + Math.floor(Math.random()*1000); }
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

/* ---------- 默认数据 ---------- */
function defaultTasks(){
  return [
    {id:"yuwen",   name:"语文学习", icon:"📖", desc:"古诗 · 成语 · 识字 · 拼音 · 写字 · 阅读", required:true,  link:"yuwen"},
    {id:"shuxue",  name:"数学练习", icon:"🔢", desc:"口算 · 100以内加减 · 钟表 · 人民币 · 错题", required:true,  link:"shuxue"},
    {id:"yingyu",  name:"英语听说", icon:"🔤", desc:"每日5句 · 每日5词（跟着读）",           required:true,  link:"yingyu"},
    {id:"yundong", name:"运动锻炼", icon:"🏃", desc:"每天 1 小时，分 3 段完成",          required:true,  link:"yundong"},
    {id:"youxi",   name:"游戏时间", icon:"🎮", desc:"玩一关小游戏，快乐学习",            required:true,  link:"games"}
  ];
}
function defaultRewards(){
  return [
    {id:uid("r"), name:"小零食",   icon:"🍬", points:10, claimed:[]},
    {id:uid("r"), name:"小玩具",   icon:"🧸", points:20, claimed:[]},
    {id:uid("r"), name:"儿童乐园", icon:"🎡", points:30, claimed:[]}
  ];
}
function defaultState(){
  return {
    version: 1,
    createdAt: todayStr(),
    points: 0,
    checkins: {},
    tasks: defaultTasks(),
    rewards: defaultRewards(),
    progress: {
      hanzi: { learned: [], cursor: 0, last: "", today: null },
      poems: { learned: [], last: "" },
      idioms: { last: "" },
      english: { sIndex: 0, wIndex: 0, last: "" },
      thinking: { done: {} }
    },
    mistakes: [],
    games: { pinyin: {level:1, best:0}, english: {best:0}, goose: {level:1} },
    reading: [],
    settings: { sound: true, theme: "default", streak: 0, lastStreakDate: "" },
    stats: { math:{right:0,wrong:0}, listen:0, games:0, gameStars:0, history:{} }
  };
}

/* ---------- 状态 ---------- */
let state = null;

function load(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){
      const d = JSON.parse(raw);
      state = Object.assign(defaultState(), d);
      state.tasks = d.tasks && d.tasks.length ? d.tasks : defaultTasks();
      state.rewards = d.rewards && d.rewards.length ? d.rewards : defaultRewards();
      state.progress = Object.assign(defaultState().progress, d.progress||{});
      state.settings = Object.assign(defaultState().settings, d.settings||{});
      state.stats = Object.assign({math:{right:0,wrong:0},listen:0,games:0,gameStars:0,history:{}}, d.stats||{});
      state.stats.math = Object.assign({right:0,wrong:0}, (d.stats&&d.stats.math)||{});
      return state;
    }
  }catch(e){ console.warn("load state failed", e); }
  state = defaultState();
  save();
  return state;
}
function save(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  catch(e){ console.warn("save failed", e); }
}
function resetAll(){
  state = defaultState();
  save();
  return state;
}

/* ---------- 打卡 ---------- */
function getCheckin(dateStr){
  const d = dateStr || todayStr();
  if(!state.checkins[d]){
    state.checkins[d] = { tasks:{}, bonus:0, awarded:false };
    save();
  }
  return state.checkins[d];
}
function isTaskDone(taskId, dateStr){
  return !!getCheckin(dateStr).tasks[taskId];
}
function setTaskDone(taskId, done, dateStr){
  const d = dateStr || todayStr();
  const c = getCheckin(d);
  if(done) c.tasks[taskId] = true; else delete c.tasks[taskId];
  save();
  awardIfNeeded(d);
}
function requiredTasks(){
  return state.tasks.filter(t=>t.required);
}
function allRequiredDone(dateStr){
  const c = getCheckin(dateStr);
  const req = requiredTasks();
  return req.length > 0 && req.every(t=>c.tasks[t.id]);
}
function todayDoneCount(dateStr){
  const c = getCheckin(dateStr);
  return state.tasks.filter(t=>c.tasks[t.id]).length;
}
function awardIfNeeded(dateStr){
  const d = dateStr || todayStr();
  const c = getCheckin(d);
  if(allRequiredDone(d) && !c.awarded){
    c.awarded = true;
    state.points += 1;
    bumpDaily("points", 1, d);
    updateStreak(d);
    save();
    return true;
  }
  // 撤销情况：如果任务被取消且当天已发分，则扣回
  if(!allRequiredDone(d) && c.awarded){
    c.awarded = false;
    if(state.points > 0) state.points -= 1;
    save();
  }
  return false;
}
function updateStreak(d){
  const yesterday = fmtDate(new Date(new Date().getTime() - 86400000));
  if(state.settings.lastStreakDate === yesterday){
    state.settings.streak += 1;
  } else if(state.settings.lastStreakDate === d){
    // 同一天不重复加
  } else {
    state.settings.streak = 1;
  }
  state.settings.lastStreakDate = d;
}

/* ---------- 任务管理 ---------- */
function getTasks(){ return state.tasks; }
function addTask(t){ t.id = uid("t"); state.tasks.push(t); save(); return t; }
function updateTask(id, patch){
  const t = state.tasks.find(x=>x.id===id);
  if(t){ Object.assign(t, patch); save(); return t; }
  return null;
}
function deleteTask(id){
  state.tasks = state.tasks.filter(t=>t.id!==id);
  save();
}

/* ---------- 奖励管理 ---------- */
function getRewards(){ return state.rewards; }
function addReward(r){ r.id = uid("r"); r.claimed = []; state.rewards.push(r); save(); return r; }
function updateReward(id, patch){
  const r = state.rewards.find(x=>x.id===id);
  if(r){ Object.assign(r, patch); save(); return r; }
  return null;
}
function deleteReward(id){
  state.rewards = state.rewards.filter(r=>r.id!==id);
  save();
}
function claimReward(id){
  const r = state.rewards.find(x=>x.id===id);
  if(!r) return false;
  if(state.points < r.points) return false;
  if(r.claimed.indexOf(todayStr()) >= 0) return false;
  r.claimed.push(todayStr());
  save();
  return true;
}
function isClaimedToday(id){
  const r = state.rewards.find(x=>x.id===id);
  return r ? r.claimed.indexOf(todayStr()) >= 0 : false;
}

/* ---------- 每日内容轮换 ---------- */
function dailyOf(list, dateStr, salt){
  if(!list || !list.length) return null;
  const base = dayIndex(dateStr || todayStr());
  const idx = ((base + (salt||0)) % list.length + list.length) % list.length;
  return list[idx];
}
// 古诗：每天一首
function todayPoem(dateStr){
  const p = dailyOf(window.YXJ_DATA.poems, dateStr);
  if(p) state.progress.poems.last = p.id; save();
  return p;
}
// 成语：两天一个
function todayIdiom(dateStr){
  const d = dateStr || todayStr();
  const idx = Math.floor(dayIndex(d) / 2);
  const list = window.YXJ_DATA.idioms;
  const it = list[((idx % list.length)+list.length)%list.length];
  if(it) state.progress.idioms.last = it.id; save();
  return it;
}
// 识字：每天 3 个新字 + 复习
function hanziPlan(dateStr){
  const d = dateStr || todayStr();
  const lib = window.YXJ_DATA.hanzi;
  const prog = state.progress.hanzi;
  if(prog.today && prog.today.date === d) return prog.today;
  const plan = { date:d, newChars:[], review:[], done:false };
  // 新字：从游标开始取 3 个
  for(let i=0;i<3 && prog.cursor < lib.length;i++){
    plan.newChars.push(lib[prog.cursor]); prog.cursor++;
  }
  // 复习：最近学过的 3 个（从已学列表尾部取）
  const recent = prog.learned.slice(-6).reverse();
  const reviewSet = [];
  for(const ch of recent){
    if(reviewSet.length>=3) break;
    const item = lib.find(x=>x.c===ch);
    if(item) reviewSet.push(item);
  }
  plan.review = reviewSet;
  prog.today = plan;
  save();
  return plan;
}
function completeHanzi(dateStr){
  const d = dateStr || todayStr();
  const plan = hanziPlan(d);
  if(!plan.done){
    plan.done = true;
    for(const it of plan.newChars){
      if(state.progress.hanzi.learned.indexOf(it.c) < 0) state.progress.hanzi.learned.push(it.c);
    }
    bumpDaily("chars", plan.newChars.length, d);
    save();
  }
}
// 英语：每天 5 句 + 5 词（顺序轮换）
function englishDaily(dateStr){
  const d = dateStr || todayStr();
  const prog = state.progress.english;
  const s = window.YXJ_DATA.english.sentences;
  const w = window.YXJ_DATA.english.words;
  if(prog.last !== d){
    prog.sIndex = dayIndex(d) * 5 % s.length;
    prog.wIndex = dayIndex(d) * 5 % w.length;
    prog.last = d;
    save();
  }
  const sentences = [];
  for(let i=0;i<5;i++) sentences.push(s[(prog.sIndex+i)%s.length]);
  const words = [];
  for(let i=0;i<5;i++) words.push(w[(prog.wIndex+i)%w.length]);
  return {sentences, words};
}
// 思维题：每天 2 道
function todayThinking(dateStr){
  const d = dateStr || todayStr();
  const done = state.progress.thinking.done[d] || [];
  const all = window.YXJ_DATA.thinking;
  const todo = all.filter(x=>done.indexOf(x.q)<0);
  const pool = todo.length>=2 ? todo : all;
  const start = dayIndex(d) % pool.length;
  const two = [pool[start % pool.length], pool[(start+1) % pool.length]];
  return two;
}
function markThinkingDone(q){
  const d = todayStr();
  if(!state.progress.thinking.done[d]) state.progress.thinking.done[d] = [];
  if(state.progress.thinking.done[d].indexOf(q) < 0) state.progress.thinking.done[d].push(q);
  save();
}

/* ---------- 错题本 ---------- */
function addMistake(m){
  m.id = uid("m");
  m.date = todayStr();
  m.solved = false;
  state.mistakes.unshift(m);
  save();
  return m;
}
function markMistakeSolved(id){
  const m = state.mistakes.find(x=>x.id===id);
  if(m){ m.solved = true; save(); }
}
function deleteMistake(id){
  state.mistakes = state.mistakes.filter(m=>m.id!==id);
  save();
}
function getMistakes(){ return state.mistakes; }

/* ---------- 阅读 ---------- */
function addReading(title){
  state.reading.unshift({title, date: todayStr()});
  bumpDaily("read", 1);
  save();
}
function removeReading(idx){
  state.reading.splice(idx,1);
  save();
}
function getReading(){ return state.reading; }


/* ---------- 学习统计 ---------- */
function bumpDaily(key, n, date){
  const d = date || todayStr();
  if(!state.stats.history[d]){
    state.stats.history[d] = { points:0, mathRight:0, mathWrong:0, chars:0, poems:0, listen:0, games:0, gameStars:0, read:0 };
  }
  state.stats.history[d][key] = (state.stats.history[d][key] || 0) + (n || 1);
  if(key==="mathRight") state.stats.math.right += (n||1);
  if(key==="mathWrong") state.stats.math.wrong += (n||1);
  if(key==="listen") state.stats.listen += (n||1);
  if(key==="games") state.stats.games += (n||1);
  if(key==="gameStars") state.stats.gameStars += (n||1);
  const keys = Object.keys(state.stats.history).sort();
  while(keys.length > 120){
    delete state.stats.history[keys.shift()];
  }
  save();
}
function getHistory(n){
  const out = [];
  const t = new Date();
  for(let i=n-1;i>=0;i--){
    const d = new Date(t.getTime() - i*86400000);
    const ds = fmtDate(d);
    out.push({ date: ds, rec: state.stats.history[ds] || null });
  }
  return out;
}
function statsTotals(){
  const h = state.stats.history;
  const days = Object.keys(h);
  return {
    days: days.filter(d=>Object.values(h[d]).some(v=>v>0)).length,
    points: days.reduce((a,d)=>a+(h[d].points||0),0),
    mathRight: state.stats.math.right,
    mathWrong: state.stats.math.wrong,
    chars: state.progress.hanzi.learned.length,
    poems: state.progress.poems.learned.length,
    listen: state.stats.listen,
    games: state.stats.games,
    gameStars: state.stats.gameStars,
    read: state.reading.length,
    mistakesSolved: state.mistakes.filter(m=>m.solved).length,
    mistakesTotal: state.mistakes.length
  };
}

/* ---------- 备份 ---------- */
function exportData(){
  return JSON.stringify(state, null, 2);
}
function importData(json){
  const d = JSON.parse(json);
  if(!d || typeof d !== "object" || !d.tasks) throw new Error("备份文件格式不对");
  state = Object.assign(defaultState(), d);
  state.progress = Object.assign(defaultState().progress, d.progress||{});
  state.settings = Object.assign(defaultState().settings, d.settings||{});
  save();
  return state;
}

/* ---------- 音效 ---------- */
let audioCtx = null;
function beep(freq, dur, type, vol){
  if(!state.settings.sound) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(vol||0.12, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur||0.15));
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + (dur||0.15));
  }catch(e){}
}
function soundRight(){ beep(880,0.12,"sine",0.15); setTimeout(()=>beep(1175,0.15,"sine",0.15),90); }
function soundWrong(){ beep(220,0.2,"sawtooth",0.08); }
function soundWin(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.18,"triangle",0.15), i*120)); }

/* ---------- 朗读 ---------- */
function speak(text, lang){
  try{
    bumpDaily("listen", 1);
    if(!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || "zh-CN";
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x=>x.lang && x.lang.indexOf(lang ? lang.split("-")[0] : "zh") === 0);
    if(v) u.voice = v;
    window.speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- 导出 ---------- */
window.YXJ = {
  load, save, resetAll,
  todayStr, fmtDate, dayIndex, uid, shuffle,
  getCheckin, isTaskDone, setTaskDone, requiredTasks, allRequiredDone,
  todayDoneCount, awardIfNeeded,
  getTasks, addTask, updateTask, deleteTask,
  getRewards, addReward, updateReward, deleteReward, claimReward, isClaimedToday,
  todayPoem, todayIdiom, hanziPlan, completeHanzi, englishDaily, todayThinking, markThinkingDone,
  addMistake, markMistakeSolved, deleteMistake, getMistakes,
  bumpDaily, getHistory, statsTotals,
  addReading, removeReading, getReading,
  exportData, importData,
  soundRight, soundWrong, soundWin, speak,
  get state(){ return state; }
};

})();