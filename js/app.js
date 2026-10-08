/* =========================================================
 * app.js — 主应用：导航、路由、页面渲染
 * ========================================================= */
(function(){
"use strict";

const $ = s => document.querySelector(s);
function el(tag, cls, html){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(html !== undefined) e.innerHTML = html;
  return e;
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

const NAV = [
  {id:"home",     icon:"🏠", label:"今日任务"},
  {id:"yuwen",    icon:"📖", label:"语文"},
  {id:"shuxue",   icon:"🔢", label:"数学"},
  {id:"yingyu",   icon:"🔤", label:"英语"},
  {id:"yundong",  icon:"🏃", label:"运动"},
  {id:"games",    icon:"🎮", label:"游戏乐园"},
  {id:"jifen",    icon:"⭐", label:"打卡积分"},
  {id:"report",   icon:"📊", label:"成长报告"},
  {id:"settings", icon:"⚙️", label:"设置"}
];

let current = "home";

/* ================= 导航 ================= */
function renderNav(){
  const side = $("#side-nav"), bottom = $("#bottom-nav");
  side.innerHTML = ""; bottom.innerHTML = "";
  NAV.forEach(n => {
    const a = el("button","nav-item" + (current===n.id ? " active" : ""),
      `<span class="nav-ico">${n.icon}</span><span>${n.label}</span>`);
    a.addEventListener("click", ()=>go(n.id));
    side.appendChild(a);
    const b = el("button","nav-item" + (current===n.id ? " active" : ""),
      `<span class="nav-ico">${n.icon}</span><span>${n.label}</span>`);
    b.addEventListener("click", ()=>go(n.id));
    bottom.appendChild(b);
  });
  renderSidePoints();
}
function renderSidePoints(){
  const box = $("#side-points");
  box.innerHTML = `<div class="sp-label">🌈 当前积分</div><div class="sp-num">${YXJ.state.points} 分</div><div style="font-size:12px;margin-top:4px">🔥 连续打卡 ${YXJ.state.settings.streak} 天</div>`;
}

function go(page){
  if(!NAV.find(n=>n.id===page)) page = "home";
  current = page;
  renderNav();
  renderPage();
  window.scrollTo(0,0);
  $("#sidebar").classList.remove("open");
  $("#backdrop").classList.remove("show");
}
window.YXJ.go = go;

/* ================= 通用 UI ================= */
function toast(msg){
  let t = $("#toast");
  if(!t){ t = el("div",""); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove("show"), 1800);
}
function celebrate(){
  const emojis = ["⭐","🎉","🌈","🦄","🎈","🌟","🎊"];
  for(let i=0;i<18;i++){
    const s = el("div","celebrate-emoji", emojis[Math.floor(Math.random()*emojis.length)]);
    s.style.left = (Math.random()*96) + "vw";
    s.style.top = (30 + Math.random()*50) + "%";
    s.style.fontSize = (22 + Math.random()*26) + "px";
    document.body.appendChild(s);
    setTimeout(()=>s.remove(), 1400);
  }
}
function modal(title, bodyEl, actions){
  const root = $("#modal-root");
  root.innerHTML = "";
  const mask = el("div","modal-mask");
  const box = el("div","modal");
  box.innerHTML = `<h3>${esc(title)}</h3>`;
  if(bodyEl) box.appendChild(bodyEl);
  if(actions && actions.length){
    const row = el("div","row",""); row.style.justifyContent = "flex-end"; row.style.marginTop = "6px";
    actions.forEach(([label, cls, fn]) => {
      const b = el("button","btn sm " + (cls||""), label);
      b.addEventListener("click", ()=>{ fn && fn(); });
      row.appendChild(b);
    });
    box.appendChild(row);
  }
  mask.addEventListener("click", e=>{ if(e.target===mask) mask.remove(); });
  mask.appendChild(box);
  root.appendChild(mask);
  return { close: ()=>mask.remove(), el: box };
}
function speakBtn(text, lang, cls){
  const b = el("button","btn sm ghost " + (cls||""), "🔊 朗读");
  b.addEventListener("click", ()=>YXJ.speak(text, lang));
  return b;
}
function pageHead(icon, title, sub){
  const head = el("div","page-head");
  const hb = el("button","",""); hb.id = "hamburger"; hb.innerHTML = "☰";
  hb.addEventListener("click", ()=>{ $("#sidebar").classList.add("open"); $("#backdrop").classList.add("show"); });
  head.appendChild(hb);
  head.appendChild(el("div","", `<div class="page-title">${icon} ${esc(title)}</div><div class="page-sub">${esc(sub||"")}</div>`));
  return head;
}

/* ================= 首页：今日任务中心 ================= */
function viewHome(){
  const page = el("div","page");
  const d = new Date();
  const week = ["日","一","二","三","四","五","六"][d.getDay()];
  const hour = d.getHours();
  const greet = hour<6 ? "夜深了，早点睡哦" : hour<9 ? "早上好呀！" : hour<12 ? "上午好，开始今天的学习吧！" : hour<14 ? "中午好！" : hour<18 ? "下午好！" : "晚上好！今天也要加油哦";
  page.appendChild(pageHead("🏠","今日任务","今天也要加油哦！"));

  // 积分条
  const next = YXJ.state.rewards.filter(r=>r.points > YXJ.state.points).sort((a,b)=>a.points-b.points)[0];
  const pct = next ? Math.min(100, Math.round(YXJ.state.points/next.points*100)) : 100;
  const hero = el("div","points-hero");
  hero.innerHTML = `<div class="ph-star">⭐</div>
    <div style="flex:1">
      <div style="font-size:15px;font-weight:800">今天的小任务都完成了吗？</div>
      <div class="ph-num">${YXJ.state.points} <span style="font-size:16px">积分</span></div>
      <div class="ph-bar"><i style="width:${pct}%"></i></div>
      <div style="font-size:12px;margin-top:6px">${next ? `再攒 ${next.points - YXJ.state.points} 分，就能兑换「${next.icon} ${esc(next.name)}」啦！` : "所有奖励都拿到啦，真棒！"}</div>
    </div>`;
  page.appendChild(hero);

  // 今日任务列表
  const card = el("div","card");
  card.innerHTML = `<h3>📋 今日打卡（${d.getMonth()+1}月${d.getDate()}日 周${week}）</h3>`;
  const list = el("div","","");
  const tasks = YXJ.getTasks();
  tasks.forEach(t => {
    const done = YXJ.isTaskDone(t.id);
    const tc = el("div","task-card" + (done ? " done" : ""));
    const check = el("div","t-check", done ? "✔" : "");
    check.addEventListener("click", ()=>{
      YXJ.setTaskDone(t.id, !YXJ.isTaskDone(t.id));
      renderNav(); renderPage();
      if(YXJ.allRequiredDone() && YXJ.getCheckin().awarded){
        toast("🎉 全部完成！+1 积分"); celebrate(); YXJ.soundWin();
      }
    });
    const body = el("div","t-body", `<div class="t-name">${t.icon} ${esc(t.name)}</div><div class="t-desc">${esc(t.desc)}${t.required ? "" : "（选做）"}</div>`);
    const goBtn = t.link ? el("button","t-go", "去学习 ➜") : null;
    if(goBtn) goBtn.addEventListener("click", ()=>go(t.link));
    tc.appendChild(el("div","t-ico", t.icon));
    tc.appendChild(body);
    if(goBtn) tc.appendChild(goBtn);
    tc.appendChild(check);
    list.appendChild(tc);
  });
  card.appendChild(list);

  const doneAll = YXJ.allRequiredDone();
  const doneCount = YXJ.todayDoneCount();
  card.appendChild(el("div","", `
    <div class="progress" style="margin:10px 0 8px"><i style="width:${tasks.length? Math.round(doneCount/tasks.length*100):0}%"></i></div>
    <div style="font-size:13px;color:var(--muted)">已完成 ${doneCount} / ${tasks.length} 项 ${doneAll ? "· 今天的积分已到手！" : "· 全部完成可得 1 积分"}</div>`));
  page.appendChild(card);

  // 每日一句鼓励
  const tips = ["每天进步一点点，坚持就是胜利！","上课认真听讲，作业自己完成！","做完任务就能攒积分换奖励哦！","多喝水，多运动，眼睛也要休息哦！"];
  const tip = tips[Math.floor(Math.random()*tips.length)];
  page.appendChild(el("div","card", `<div class="mascot">🐣</div><div style="text-align:center;font-weight:800">${greet} ${tip}</div>`));
  return page;
}

/* ================= 语文 ================= */
function viewYuwen(){
  const page = el("div","page");
  page.appendChild(pageHead("📖","语文乐园","每天 20 分钟：古诗 · 成语 · 识字 · 拼音 · 笔顺 · 阅读"));

  const doneBtn = doneBar("yuwen", "语文打卡");
  page.appendChild(doneBtn);

  // 古诗
  const poem = YXJ.todayPoem();
  if(poem){
    const c = el("div","card poem-card");
    c.innerHTML = `<h3>📜 今日古诗</h3>
      <div class="poem-title">《${esc(poem.title)}》</div>
      <div class="poem-meta">${esc(poem.dynasty)} · ${esc(poem.author)}</div>
      <div class="poem-text">${poem.lines.map(l=>esc(l)).join("<br>")}</div>
      <div class="poem-pinyin">${poem.py.map(l=>esc(l)).join("<br>")}</div>
      <div class="poem-mean">💡 意思：${esc(poem.mean)}</div>`;
    const row = el("div","row",""); row.style.justifyContent = "center"; row.style.marginTop = "12px";
    row.appendChild(speakBtn(poem.lines.join(""), "zh-CN"));
    row.appendChild(el("button","btn ok sm", "我会背啦！ ✅"));
    row.lastChild.addEventListener("click", ()=>{
      if(YXJ.state.progress.poems.learned.indexOf(poem.id)<0){
        YXJ.state.progress.poems.learned.push(poem.id); YXJ.save();
      }
      toast("真棒！这首诗记下来啦 📜"); YXJ.soundRight();
    });
    c.appendChild(row);
    page.appendChild(c);
  }

  // 成语
  const idiom = YXJ.todayIdiom();
  if(idiom){
    const c = el("div","card");
    c.innerHTML = `<h3>🦊 成语小故事</h3>
      <div style="font-size:20px;font-weight:900;color:var(--primary-dark)">${esc(idiom.name)} <span style="font-size:13px;color:var(--muted)">${esc(idiom.py)}</span></div>
      <div class="hint" style="margin-top:8px">📖 ${esc(idiom.story)}</div>
      <div style="margin-top:10px;background:var(--card2);border-radius:12px;padding:10px 12px;font-size:14px">🎯 意思：${esc(idiom.mean)}</div>`;
    c.appendChild(speakBtn(idiom.name + "。" + idiom.story, "zh-CN"));
    page.appendChild(c);
  }

  // 识字
  const plan = YXJ.hanziPlan();
  const c = el("div","card");
  c.innerHTML = `<h3>✍️ 今日识字（${plan.newChars.length} 个新字 + ${plan.review.length} 个复习）</h3>`;
  const grid = el("div","",""); grid.style.display = "flex"; grid.style.flexWrap = "wrap"; grid.style.justifyContent = "center";
  const allChars = plan.newChars.concat(plan.review);
  allChars.forEach(it => {
    const t = el("div","tianzi", `<span class="c">${esc(it.c)}</span>`);
    const wrap = el("div","","");
    wrap.style.textAlign = "center"; wrap.style.margin = "4px";
    wrap.appendChild(t);
    wrap.appendChild(el("div","", `<div style="font-weight:800">${esc(it.py)}</div><div style="font-size:12px;color:var(--muted)">${esc(it.word)}</div>`));
    const sb = el("button","btn sm ghost","?? ???");
    sb.style.marginTop = "4px"; sb.style.fontSize = "12px"; sb.style.padding = "4px 10px";
    sb.addEventListener("click", ()=>strokeDemo(it));
    wrap.appendChild(sb);
    grid.appendChild(wrap);
  });
  c.appendChild(grid);
  const row = el("div","row",""); row.style.justifyContent = "center"; row.style.marginTop = "10px";
  const learnBtn = el("button","btn ok sm", plan.done ? "已学会 ✅" : "这些字我都认识啦！");
  learnBtn.disabled = !!plan.done;
  learnBtn.addEventListener("click", ()=>{
    YXJ.completeHanzi();
    toast("太棒了！认识新字 +3 ✍️"); YXJ.soundRight();
    renderPage();
  });
  row.appendChild(learnBtn);
  const printBtn = el("button","btn ghost sm", "🖨️ 打印描红练习页");
  printBtn.addEventListener("click", ()=>{
    buildPrintSheet(plan.newChars.concat(plan.review));
    window.print();
  });
  row.appendChild(printBtn);
  c.appendChild(row);
  page.appendChild(c);


  // 笔顺写字练习
  const sc = el("div","card");
  sc.innerHTML = "<h3>✍️ 笔顺写字练习</h3><div class='hint'>点下面的字看笔顺动画，也可以输入任意汉字查笔顺，然后在本子上写一写。</div>";
  const scRow = el("div","row",""); scRow.style.marginTop = "8px";
  const scInp = el("input","",""); scInp.placeholder = "输入汉字，如：天"; scInp.maxLength = 1; scInp.style.width = "130px";
  const scBtn = el("button","btn ok sm","🔍 查笔顺");
  scBtn.addEventListener("click", ()=>{
    const ch = scInp.value.trim();
    if(!ch) return;
    const item = YXJ_DATA.hanzi.find(x=>x.c===ch) || {c:ch, py:"", mean:"", word:""};
    strokeDemo(item);
  });
  scRow.appendChild(scInp); scRow.appendChild(scBtn);
  sc.appendChild(scRow);
  const scChars = el("div","row",""); scChars.style.marginTop = "10px";
  const uniqueCh = {};
  plan.newChars.concat(plan.review).forEach(it=>{ uniqueCh[it.c] = it; });
  Object.values(uniqueCh).forEach(it => {
    const b = el("button","btn sm ghost", it.c);
    b.addEventListener("click", ()=>strokeDemo(it));
    scChars.appendChild(b);
  });
  sc.appendChild(scChars);
  page.appendChild(sc);

  // 拼音
  const pc = el("div","card");
  pc.innerHTML = `<h3>🔤 拼音小课堂</h3>`;
  const tabs = el("div","row","");
  [["s","声母"],["y","韵母"],["z","整体认读"]].forEach(([k,label])=>{
    const b = el("button","btn sm ghost", label);
    b.addEventListener("click", ()=>{
      pc.querySelector("#pinyin-box").innerHTML = YXJ_DATA.pinyin[k].map(x=>`<span class="pinyin-tag">${esc(x)}</span>`).join("");
    });
    tabs.appendChild(b);
  });
  pc.appendChild(tabs);
  const pbox = el("div","",""); pbox.id = "pinyin-box";
  pbox.innerHTML = YXJ_DATA.pinyin.shengmu.map(x=>`<span class="pinyin-tag">${esc(x)}</span>`).join("");
  pc.appendChild(pbox);
  pc.appendChild(el("div","",""));
  // 拼读练习
  const gameBox = el("div","","");
  const startP = el("button","btn sm","🎯 看图拼拼音（练 5 题）");
  startP.addEventListener("click", ()=>{ pinyinPractice(gameBox); startP.remove(); });
  gameBox.appendChild(startP);
  pc.appendChild(gameBox);
  page.appendChild(pc);

  // 阅读打卡
  const rc = el("div","card");
  rc.innerHTML = `<h3>📚 阅读打卡（睡前或周末读一本）</h3>`;
  const bookList = el("div","","");
  renderReading(bookList, rc);
  rc.appendChild(bookList);
  const addRow = el("div","row","");
  const inp = el("input","",""); inp.placeholder = "输入书名，如：猜猜我有多爱你"; inp.style.flex = "1";
  const add = el("button","btn sm ok","➕ 添加");
  add.addEventListener("click", ()=>{
    if(!inp.value.trim()) return;
    YXJ.addReading(inp.value.trim());
    renderReading(bookList, rc);
  });
  addRow.appendChild(inp); addRow.appendChild(add);
  rc.appendChild(addRow);
  page.appendChild(rc);

  return page;
}
/* ================= 语文辅助 ================= */
function doneBar(taskId, label){
  const done = YXJ.isTaskDone(taskId);
  const bar = el("div","card","");
  bar.style.padding = "14px 18px";
  bar.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center">
    <div style="font-weight:800">${done ? "🎉 今天的" + label + "已完成！" : "完成下面的内容后，点这里打卡："}</div>
    <button class="btn ${done ? "ok" : ""}" ${done ? "disabled" : ""}>${done ? "✅ 已打卡" : "✔ " + label}</button>
  </div>`;
  bar.querySelector("button").addEventListener("click", ()=>{
    YXJ.setTaskDone(taskId, true);
    renderPage();
    if(YXJ.allRequiredDone()){
      toast("🎉 全部任务完成！+1 积分"); celebrate(); YXJ.soundWin();
    }else{
      toast("打卡成功！继续加油 💪"); YXJ.soundRight();
    }
  });
  return bar;
}
function renderReading(listEl, parentCard){
  const rs = YXJ.getReading();
  listEl.innerHTML = "";
  if(!rs.length){
    listEl.appendChild(el("div","empty","<span class='e-ico'>📖</span>还没有阅读记录，读完一本书就添加进来吧！"));
    return;
  }
  rs.forEach((r, i) => {
    const row = el("div","mistake-row", `<span style="font-size:18px">📚</span><div class="mq">${esc(r.title)}</div><span class="chip green">${esc(r.date)}</span>`);
    const del = el("button","btn warn sm","删");
    del.addEventListener("click", ()=>{ YXJ.removeReading(i); renderReading(listEl, parentCard); });
    row.appendChild(del);
    listEl.appendChild(row);
  });
}
function buildPrintSheet(chars){
  let old = document.querySelector(".print-sheet");
  if(old) old.remove();
  const sheet = el("div","print-sheet");
  sheet.innerHTML = `<h2 style="text-align:center">✍️ 描红练习页 ${YXJ.todayStr()}</h2><p style="text-align:center;color:#888">描一描，写一写，注意笔顺哦</p>`;
  chars.forEach(it => {
    const box = el("div","",""); box.style.display = "inline-block"; box.style.margin = "10px"; box.style.textAlign = "center";
    let tz = "";
    for(let i=0;i<6;i++){
      tz += `<span class="tianzi">${i===0 ? `<span class="c">${esc(it.c)}</span>` : ""}</span>`;
    }
    box.innerHTML = `<div style="font-size:18px;font-weight:800">${esc(it.c)} ${esc(it.py)} ${esc(it.word)}</div><div>${tz}</div>`;
    sheet.appendChild(box);
  });
  document.body.appendChild(sheet);
}
function pinyinPractice(container){
  const words = YXJ_DATA.pinyin.words;
  let idx = 0, right = 0, total = 5;
  function renderQ(){
    container.innerHTML = "";
    const q = words[Math.floor(Math.random()*words.length)];
    const others = YXJ.shuffle(words.filter(w=>w.py!==q.py)).slice(0,3);
    const opts = YXJ.shuffle([q].concat(others));
    const head = el("div","game-header", `<div class="game-level">第 ${idx+1} / ${total} 题 · 答对 ${right}</div>`);
    container.appendChild(head);
    const card = el("div","card word-card");
    card.innerHTML = `<div class="word-emoji">${q.e}</div><div style="margin:8px 0;font-size:14px;color:var(--muted)">这个图片的拼音是？</div>`;
    opts.forEach(o => {
      const b = el("button","opt-btn", esc(o.py));
      b.addEventListener("click", ()=>{
        if(b.classList.contains("right") || b.classList.contains("wrong")) return;
        if(o.py === q.py){
          b.classList.add("right"); YXJ.soundRight(); right++;
          b.innerHTML += " ✅";
          setTimeout(()=>{ idx++; idx>=total ? end() : renderQ(); }, 700);
        }else{
          b.classList.add("wrong"); YXJ.soundWrong(); b.innerHTML += " ❌";
          const good = opts.find(x=>x.py===q.py);
          const gb = Array.from(card.querySelectorAll(".opt-btn")).find(x=>x.textContent.trim().startsWith(good.py));
          if(gb) gb.classList.add("right");
          setTimeout(()=>{ idx++; idx>=total ? end() : renderQ(); }, 1200);
        }
      });
      card.appendChild(b);
    });
    container.appendChild(card);
  }
  function end(){
    container.innerHTML = "";
    const stars = right>=5?3: right>=3?2:1;
    container.appendChild(el("div","card", `<div style="text-align:center"><div style="font-size:40px">🏆</div><h3>拼读练习完成！答对 ${right} / ${total}</h3><div style="margin-top:10px">${"⭐".repeat(stars)}</div></div>`));
    const again = el("button","btn ok sm","再练一次");
    again.style.margin = "12px auto 0"; again.style.display = "block";
    again.addEventListener("click", ()=>{ container.innerHTML=""; idx=0; right=0; renderQ(); });
    container.appendChild(again);
  }
  renderQ();
}

/* ================= 数学 ================= */
function viewShuxue(){
  const page = el("div","page");
  page.appendChild(pageHead("🔢","数学乐园","口算 · 100以内加减 · 钟表 · 人民币 · 思维 · 错题本"));
  page.appendChild(doneBar("shuxue", "数学打卡"));

  // 计算练习
  const c = el("div","card");
  c.innerHTML = `<h3>🧮 口算练习（一年级）</h3><div class="hint">选难度开始做题；也可以挑战「60 秒限时口算」，看能答对几题。做错的题会自动收进错题本。</div>`;
  const modes = [
    {id:"add10",   name:"10以内加减",    desc:"复习热身"},
    {id:"addsub20",name:"20以内进退位",  desc:"一上重点"},
    {id:"add100",  name:"100以内加减",   desc:"一下重点"},
    {id:"lianjia", name:"连加连减",      desc:"8+5−3"},
    {id:"mix",     name:"混合挑战",      desc:"全部都会"}
  ];
  const modeRow = el("div","grid grid-3",""); modeRow.style.marginTop = "10px";
  modes.forEach(m => {
    const b = el("button","btn ghost sm", `${m.name}<div style="font-size:11px;font-weight:400;opacity:.7">${m.desc}</div>`);
    b.addEventListener("click", ()=>{ calcPractice(c, m.id, false); });
    modeRow.appendChild(b);
  });
  c.appendChild(modeRow);
  const timedRow = el("div","row",""); timedRow.style.marginTop = "10px"; timedRow.style.justifyContent = "center";
  const timedBtn = el("button","btn ok sm","⏱️ 60 秒限时口算挑战");
  timedBtn.addEventListener("click", ()=>{ calcPractice(c, "addsub20", true); });
  timedRow.appendChild(timedBtn);
  c.appendChild(timedRow);
  const calcBox = el("div","","");
  c.appendChild(calcBox);
  page.appendChild(c);

  // 数感
  const nc = el("div","card");
  nc.innerHTML = `<h3>🌈 数感小游戏</h3><div class="hint">数一数、比大小、数的组成、找规律，动动小脑筋。</div>`;
  const nBox = el("div","","");
  const startN = el("button","btn","🎲 开始数感游戏（5 题）");
  startN.addEventListener("click", ()=>{ numberSense(nBox, startN); });
  nc.appendChild(startN); nc.appendChild(nBox);
  page.appendChild(nc);

  // 认识钟表
  const kc = el("div","card");
  kc.innerHTML = `<h3>🕐 认识钟表（整时 · 半时）</h3><div class="hint">看看钟面，说出现在是几时几分。</div>`;
  const kBox = el("div","","");
  const startK = el("button","btn","⏰ 开始认钟表（5 题）");
  startK.addEventListener("click", ()=>{ clockQuiz(kBox, startK); });
  kc.appendChild(startK); kc.appendChild(kBox);
  page.appendChild(kc);

  // 认识人民币
  const mc2 = el("div","card");
  mc2.innerHTML = `<h3>💰 认识人民币（元 · 角 · 分）</h3><div class="hint">1 元 = 10 角，1 角 = 10 分。算一算、换一换。</div>`;
  const moBox = el("div","","");
  const startM = el("button","btn","💴 开始人民币练习（5 题）");
  startM.addEventListener("click", ()=>{ moneyQuiz(moBox, startM); });
  mc2.appendChild(startM); mc2.appendChild(moBox);
  page.appendChild(mc2);

  // 思维题
  const tc = el("div","card");
  tc.innerHTML = `<h3>🧠 思维小挑战（每日 2 题）</h3>`;
  const tBox = el("div","","");
  thinkingQuiz(tBox);
  tc.appendChild(tBox);
  page.appendChild(tc);

  // 错题本
  const mc = el("div","card");
  mc.innerHTML = `<h3>📒 错题复习本</h3>`;
  const mBox = el("div","","");
  renderMistakes(mBox);
  mc.appendChild(mBox);
  page.appendChild(mc);

  return page;
}

/* ---------- 出题 ---------- */
function genQ(mode){
  const r = (a,b)=>a+Math.floor(Math.random()*(b-a+1));
  if(mode==="add10"){
    const add = Math.random() < 0.5;
    if(add){ const a = r(1,9), b = r(1,10-a); return {expr:`${a} + ${b}`, ans:a+b, hint:""}; }
    const a = r(2,10), b = r(1,a-1); return {expr:`${a} − ${b}`, ans:a-b, hint:""};
  }
  if(mode==="addsub20"){
    // 20 以内进位加 / 退位减
    if(Math.random() < 0.5){
      let a = r(2,9), b = r(2,9);
      while(a+b<=10) b = r(2,9);
      const p2 = b-(10-a);
      return {expr:`${a} + ${b}`, ans:a+b, hint:`凑十法：${a} 和 ${10-a} 凑成 10，10 + ${p2} = ${a+b}`};
    }else{
      const a = r(11,18), b = r(a%10+1, 9);
      return {expr:`${a} − ${b}`, ans:a-b, hint:`破十法：10 − ${b} = ${10-b}，${a-10} + ${10-b} = ${a-b}`};
    }
  }
  if(mode==="add100"){
    const t = r(0,3);
    if(t===0){ // 整十数相加
      const a = 10*r(1,8), b = 10*r(1,9-a/10);
      return {expr:`${a} + ${b}`, ans:a+b, hint:`${a/10} 个十 加 ${b/10} 个十 = ${(a+b)/10} 个十 = ${a+b}`};
    }
    if(t===1){ // 两位数 + 一位数（不进位）
      const tens = r(1,8), ones = r(1,8), b = r(1,9-ones);
      const a = tens*10+ones;
      return {expr:`${a} + ${b}`, ans:a+b, hint:""};
    }
    if(t===2){ // 两位数 − 整十数
      const tens = r(3,9), a = tens*10 + r(0,9), b = 10*r(1,tens-1);
      return {expr:`${a} − ${b}`, ans:a-b, hint:`${a} 减 ${b}：十位相减，个位不变`};
    }
    // 两位数 − 一位数（不退位）
    const tens = r(2,9), ones = r(2,9), a = tens*10+ones, b = r(1,ones-1);
    return {expr:`${a} − ${b}`, ans:a-b, hint:""};
  }
  if(mode==="lianjia"){
    if(Math.random() < 0.5){
      const a = r(3,12), b = r(1,5), c = r(1,5);
      return {expr:`${a} + ${b} + ${c}`, ans:a+b+c, hint:`先算 ${a} + ${b} = ${a+b}，再算 ${a+b} + ${c}`};
    }
    const a = r(12,20), b = r(1,5), c = r(1,4);
    if(a-b-c < 0) return genQ("lianjia");
    return {expr:`${a} − ${b} − ${c}`, ans:a-b-c, hint:`先算 ${a} − ${b} = ${a-b}，再算 ${a-b} − ${c}`};
  }
  if(mode==="mix"){
    const ms = ["add10","addsub20","add100","lianjia"];
    return genQ(ms[r(0,ms.length-1)]);
  }
  return genQ("add10");
}
function modeName(m){
  const map = {add10:"10以内加减", addsub20:"20以内进退位", add100:"100以内加减", lianjia:"连加连减", mix:"混合挑战"};
  return map[m]||m;
}
function calcPractice(container, mode, timed){
  container.innerHTML = "";
  const total = timed ? 100 : 10;
  let idx = 0, right = 0, left = 60;
  let q = null, input = "", timerId = null, over = false;
  const title = el("div","game-header", "");
  container.appendChild(title);
  const qBox = el("div","card","");
  qBox.style.textAlign = "center";
  container.appendChild(qBox);

  function nextQ(){
    q = genQ(mode);
    input = "";
    render();
  }
  function render(){
    if(over) return;
    title.innerHTML = `<div class="game-level">${modeName(mode)} · ${timed ? "⏱ 剩余 " + left + " 秒" : "第 " + (idx+1) + " / " + total + " 题"} · 答对 ${right}</div>`;
    qBox.innerHTML = "";
    const expr = el("div","","");
    expr.style.fontSize = "42px"; expr.style.fontWeight = "900"; expr.style.margin = "10px 0";
    expr.textContent = `${q.expr} = ${input||"_"}`;
    qBox.appendChild(expr);
    if(q.hint){
      const h = el("button","btn ghost sm","💡 看提示");
      h.style.margin = "0 auto 6px";
      h.addEventListener("click", ()=>{ toast("提示：" + q.hint); });
      qBox.appendChild(h);
    }
    const pad = el("div","grid grid-3",""); pad.style.maxWidth = "300px"; pad.style.margin = "0 auto";
    ["1","2","3","4","5","6","7","8","9"].forEach(n=>{
      const b = el("button","btn ghost",""); b.textContent = n;
      b.addEventListener("click", ()=>{ if(input.length<3) input += n; render(); });
      pad.appendChild(b);
    });
    const c0 = el("button","btn ghost",""); c0.textContent = "0";
    c0.addEventListener("click", ()=>{ if(input.length<3) input += "0"; render(); });
    pad.appendChild(c0);
    const cl = el("button","btn warn","⌫");
    cl.addEventListener("click", ()=>{ input = input.slice(0,-1); render(); });
    pad.appendChild(cl);
    const ok = el("button","btn ok","✅");
    ok.addEventListener("click", submit);
    pad.appendChild(ok);
    qBox.appendChild(pad);
  }
  function submit(){
    if(over || !input) return;
    const n = parseInt(input, 10);
    if(n === q.ans){
      YXJ.soundRight(); right++; idx++;
      YXJ.bumpDaily("mathRight", 1);
      if(!timed && idx>=total){ end(); return; }
      nextQ();
    }else{
      YXJ.soundWrong();
      YXJ.addMistake({type:"数学", q:`${q.expr} = ?`, answer: q.ans, wrong: n});
      if(timed){
        YXJ.bumpDaily("mathWrong", 1);
        toast("再想想哦，这道题收进错题本啦");
        input = ""; render();
      }else{
        YXJ.bumpDaily("mathWrong", 1);
        toast("再想想哦，这道题收进错题本啦");
        input = ""; render();
      }
    }
  }
  function end(){
    if(over) return;
    over = true;
    if(timerId) clearInterval(timerId);
    title.innerHTML = "";
    qBox.innerHTML = `<div style="font-size:40px">🏆</div><h3 style="margin:8px 0">${timed ? "60 秒挑战结束！" : "完成！"}答对 ${right} 题</h3>
      <div style="font-size:20px">${right>=15?"🎉 口算达人！":right>=10?"🌟 很棒！":"💪 继续加油！"}</div>`;
    const again = el("button","btn ok","再练一组");
    again.style.margin = "12px auto 0"; again.style.display = "block";
    again.addEventListener("click", ()=>{ idx=0; right=0; left=60; over=false; startTimer(); nextQ(); });
    qBox.appendChild(again);
    if(right>=10) YXJ.soundWin();
  }
  function startTimer(){
    if(!timed) return;
    if(timerId) clearInterval(timerId);
    timerId = setInterval(()=>{
      left--;
      if(left<=0){ end(); return; }
      if(!over) render();
    }, 1000);
  }
  startTimer();
  nextQ();
}

/* ---------- 数感小游戏（一年级） ---------- */
function numberSense(container, startBtn){
  if(startBtn) startBtn.remove();
  const COUNT_EMOJI = ["🍎","⭐","🌸","🐤","🦋","⚽","🎈","🍓","🐟","🌈"];
  let idx = 0, right = 0, total = 5;
  function opts3(ans){
    const arr = [ans, ans+1, ans-1].filter(v=>v>0);
    const uniq = [];
    arr.forEach(v=>{ if(uniq.indexOf(v)<0) uniq.push(v); });
    while(uniq.length<3){ uniq.push(uniq[uniq.length-1]+2); }
    return YXJ.shuffle(uniq).slice(0,3);
  }
  function makeQ(){
    const type = Math.floor(Math.random()*5);
    if(type===0){ // 数一数
      const n = 5 + Math.floor(Math.random()*16);
      const em = COUNT_EMOJI[Math.floor(Math.random()*COUNT_EMOJI.length)];
      return {show: em.repeat(n), q:`数一数，一共有几个「${em}」？`, opts: opts3(n), a:n, type:"数一数"};
    }
    if(type===1){ // 比大小
      let a = 10+Math.floor(Math.random()*90), b = 10+Math.floor(Math.random()*90);
      if(a===b) b = a+7;
      return {q:`${a} 和 ${b}，哪一个大？`, opts:YXJ.shuffle([a,b]), a:Math.max(a,b), type:"比大小"};
    }
    if(type===2){ // 数的组成
      const tens = 1+Math.floor(Math.random()*9), ones = 1+Math.floor(Math.random()*9);
      const n = tens*10+ones;
      if(Math.random()<0.5){
        return {q:`${tens} 个十和 ${ones} 个一组成的数是几？`, opts: opts3(n), a:n, type:"数的组成"};
      }
      return {q:`${n} 里面有几个十？`, opts: YXJ.shuffle([tens, tens+1, tens-1].filter(v=>v>0)), a:tens, type:"数的组成"};
    }
    if(type===3){ // 找规律
      const step = [2,3,5,10][Math.floor(Math.random()*4)];
      const start = 1+Math.floor(Math.random()*5);
      const seq = [start, start+step, start+step*2, start+step*3];
      const ans = start+step*4;
      return {q:`${seq.join("、")}、__，下一个是几？`, opts: opts3(ans), a:ans, type:"找规律"};
    }
    // 前后数
    const n = 5+Math.floor(Math.random()*90);
    const before = Math.random()<0.5;
    const ans = before ? n-1 : n+1;
    return {q:`比 ${n} ${before?"小 1":"大 1"} 的数是几？`, opts: opts3(ans), a:ans, type:"相邻数"};
  }
  function render(){
    container.innerHTML = "";
    const q = makeQ();
    const head = el("div","game-header", `<div class="game-level">${q.type} · 第 ${idx+1} / ${total} 题 · 答对 ${right}</div>`);
    container.appendChild(head);
    const card = el("div","card","");
    card.style.textAlign = "center";
    if(q.show) card.appendChild(el("div","","<div style='font-size:26px;line-height:1.8;letter-spacing:2px'>"+esc(q.show)+"</div>"));
    card.appendChild(el("div","","<div style='font-size:20px;font-weight:900;margin:8px 0 12px'>"+esc(q.q)+"</div>"));
    q.opts.forEach(o=>{
      const b = el("button","opt-btn", String(o));
      b.style.display = "inline-block"; b.style.width = "auto"; b.style.margin = "0 8px 10px"; b.style.padding = "14px 26px";
      b.addEventListener("click", ()=>{
        if(b.classList.contains("right")||b.classList.contains("wrong")) return;
        if(o===q.a){
          b.classList.add("right"); YXJ.soundRight(); right++;
          setTimeout(()=>{ idx++; idx>=total?end():render(); }, 700);
        }else{
          b.classList.add("wrong"); YXJ.soundWrong(); b.innerHTML = String(o)+" ❌";
          Array.from(card.querySelectorAll(".opt-btn")).forEach(x=>{ if(+x.textContent===q.a) x.classList.add("right"); });
          setTimeout(()=>{ idx++; idx>=total?end():render(); }, 1100);
        }
      });
      card.appendChild(b);
    });
    container.appendChild(card);
  }
  function end(){
    container.innerHTML = "";
    const stars = right>=5?3: right>=3?2:1;
    container.appendChild(el("div","card", `<div style="text-align:center"><div style="font-size:40px">🏆</div><h3>数感游戏完成！答对 ${right} / ${total}</h3><div style="font-size:22px">${"⭐".repeat(stars)}</div></div>`));
    const again = el("button","btn ok","再玩一次");
    again.style.margin = "12px auto 0"; again.style.display = "block";
    again.addEventListener("click", ()=>{ idx=0; right=0; render(); });
    container.appendChild(again);
  }
  render();
}

/* ---------- 认识钟表 ---------- */
function clockSVG(h, m){
  const num = [];
  for(let i=1;i<=12;i++){
    const a = i*30 * Math.PI/180;
    const x = 100 + 70*Math.sin(a), y = 100 - 70*Math.cos(a);
    num.push(`<text x="${x}" y="${y+6}" font-size="17" font-weight="700" text-anchor="middle" fill="#4a6b8a">${i}</text>`);
  }
  const hAng = ((h%12) + m/60) * 30 * Math.PI/180;
  const mAng = m * 6 * Math.PI/180;
  const hx = 100 + 38*Math.sin(hAng), hy = 100 - 38*Math.cos(hAng);
  const mx = 100 + 58*Math.sin(mAng), my = 100 - 58*Math.cos(mAng);
  return `<svg viewBox="0 0 200 200" width="180" height="180" style="display:block;margin:0 auto">
    <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#ff9f43" stroke-width="6"/>
    <circle cx="100" cy="100" r="4" fill="#ff9f43"/>
    ${num.join("")}
    <line x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#3d5a73" stroke-width="9" stroke-linecap="round"/>
    <line x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#ff9f43" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}
function clockQuiz(container, startBtn){
  if(startBtn) startBtn.remove();
  let idx = 0, right = 0, total = 5;
  function makeQ(){
    const h = 1 + Math.floor(Math.random()*12);
    const m = Math.random() < 0.5 ? 0 : 30;
    const ans = m === 0 ? `${h} 时` : `${h} 时 30 分`;
    const pool = [`${h===12?1:h+1} 时`, `${h} 时 30 分`, `${h===1?12:h-1} 时`, `${h===12?1:h+1} 时 30 分`]
      .filter(v => v !== ans);
    const opts = YXJ.shuffle([ans].concat(YXJ.shuffle(pool).slice(0,2)));
    return {h, m, ans, opts, type: m===0 ? "整时" : "半时"};
  }
  function render(){
    container.innerHTML = "";
    const q = makeQ();
    const head = el("div","game-header", `<div class="game-level">认钟表 · 第 ${idx+1} / ${total} 题 · 答对 ${right}</div>`);
    container.appendChild(head);
    const card = el("div","card","");
    card.style.textAlign = "center";
    card.appendChild(el("div","","<div style='font-size:15px;color:var(--muted);margin-bottom:6px'>钟面上是几时？</div>"));
    card.appendChild(el("div","","" + clockSVG(q.h, q.m)));
    const row = el("div","row",""); row.style.justifyContent = "center"; row.style.marginTop = "14px";
    q.opts.forEach(o=>{
      const b = el("button","btn ghost", o);
      b.style.margin = "0 6px";
      b.addEventListener("click", ()=>{
        if(b.disabled) return;
        if(o===q.ans){
          b.classList.add("right"); b.style.background = "#d9f7e0"; YXJ.soundRight(); right++;
          setTimeout(()=>{ idx++; idx>=total?end():render(); }, 700);
        }else{
          b.style.background = "#ffe0e0"; YXJ.soundWrong();
          Array.from(row.querySelectorAll(".btn")).forEach(x=>{ if(x.textContent===q.ans){ x.classList.add("right"); x.style.background = "#d9f7e0"; } });
          setTimeout(()=>{ idx++; idx>=total?end():render(); }, 1200);
        }
      });
      row.appendChild(b);
    });
    card.appendChild(row);
    container.appendChild(card);
  }
  function end(){
    container.innerHTML = "";
    const stars = right>=5?3: right>=3?2:1;
    container.appendChild(el("div","card", `<div style="text-align:center"><div style="font-size:40px">🕐</div><h3>认钟表完成！答对 ${right} / ${total}</h3><div style="font-size:22px">${"⭐".repeat(stars)}</div><div class="hint" style="margin-top:8px">小口诀：分针指 12 是整时，分针指 6 是半点。</div></div>`));
    const again = el("button","btn ok","再玩一次");
    again.style.margin = "12px auto 0"; again.style.display = "block";
    again.addEventListener("click", ()=>{ idx=0; right=0; render(); });
    container.appendChild(again);
  }
  render();
}

/* ---------- 认识人民币 ---------- */
function moneyQuiz(container, startBtn){
  if(startBtn) startBtn.remove();
  let idx = 0, right = 0, total = 5;
  function makeQ(){
    const t = Math.floor(Math.random()*5);
    if(t===0){
      const k = [1,2,5,10][Math.floor(Math.random()*4)];
      return {q:`${k} 元 =（ ）角`, ans:"" + k*10, opts3:[k*10, k*100, k*10+10], type:"元换角"};
    }
    if(t===1){
      const k = [1,2,3,4][Math.floor(Math.random()*4)];
      return {q:`${k*10} 角 =（ ）元`, ans:"" + k, opts3:[k, k*10, k*2], type:"角换元"};
    }
    if(t===2){
      const j1 = [1,2,3,5][Math.floor(Math.random()*4)];
      const j2 = [1,2,3,4][Math.floor(Math.random()*4)];
      const totalJ = j1*10 + j2*10;
      const ans = `${totalJ/10} 元`;
      return {q:`🪙 ${j1} 元 + 🪙 ${j2} 元 =（ ）`, ans, opts3:[`${totalJ/10} 元`, `${totalJ} 元`, `${totalJ/10+1} 元`], type:"元相加"};
    }
    if(t===3){
      const price = [1,2,3,4,5][Math.floor(Math.random()*5)];
      const pay = price + [1,2,3][Math.floor(Math.random()*3)];
      const back = pay - price;
      return {q:`买一支笔要 ${price} 元，付出 ${pay} 元，找回（ ）元`, ans:"" + back, opts3:[back, back+1, Math.max(1,back-1)], type:"找零"};
    }
    const jiao = [1,2,3,4][Math.floor(Math.random()*4)];
    return {q:`🪙 1 元 + 🪙 ${jiao} 角 =（ ）角`, ans:"" + (10+jiao), opts3:[10+jiao, jiao, 10+jiao*10], type:"元角混合"};
  }
  function render(){
    container.innerHTML = "";
    const q = makeQ();
    const head = el("div","game-header", `<div class="game-level">认识人民币 · 第 ${idx+1} / ${total} 题 · 答对 ${right}</div>`);
    container.appendChild(head);
    const card = el("div","card","");
    card.style.textAlign = "center";
    card.appendChild(el("div","","<div style='font-size:20px;font-weight:900;margin:6px 0 14px'>"+esc(q.q)+"</div>"));
    const row = el("div","row",""); row.style.justifyContent = "center";
    const uniq = [];
    q.opts3.forEach(v=>{ if(uniq.indexOf(v)<0) uniq.push(v); });
    YXJ.shuffle(uniq).slice(0,3).forEach(o=>{
      const b = el("button","btn ghost", String(o));
      b.style.margin = "0 6px";
      b.addEventListener("click", ()=>{
        if(b.disabled) return;
        if(String(o)===String(q.ans)){
          b.style.background = "#d9f7e0"; YXJ.soundRight(); right++;
          setTimeout(()=>{ idx++; idx>=total?end():render(); }, 700);
        }else{
          b.style.background = "#ffe0e0"; YXJ.soundWrong();
          Array.from(row.querySelectorAll(".btn")).forEach(x=>{ if(x.textContent===String(q.ans)) x.style.background = "#d9f7e0"; });
          setTimeout(()=>{ idx++; idx>=total?end():render(); }, 1200);
        }
      });
      row.appendChild(b);
    });
    card.appendChild(row);
    container.appendChild(card);
  }
  function end(){
    container.innerHTML = "";
    const stars = right>=5?3: right>=3?2:1;
    container.appendChild(el("div","card", `<div style="text-align:center"><div style="font-size:40px">💰</div><h3>人民币练习完成！答对 ${right} / ${total}</h3><div style="font-size:22px">${"⭐".repeat(stars)}</div><div class="hint" style="margin-top:8px">记住：1 元 = 10 角，1 角 = 10 分。</div></div>`));
    const again = el("button","btn ok","再练一组");
    again.style.margin = "12px auto 0"; again.style.display = "block";
    again.addEventListener("click", ()=>{ idx=0; right=0; render(); });
    container.appendChild(again);
  }
  render();
}

/* ---------- 思维题 ---------- */
function thinkingQuiz(container){
  const two = YXJ.todayThinking();
  container.innerHTML = "";
  two.forEach((q, qi) => {
    const card = el("div","card","");
    card.style.padding = "16px";
    card.appendChild(el("div","","<div style='font-size:16px;font-weight:900'>题目 "+(qi+1)+"： "+esc(q.q)+"</div>"));
    q.opts.forEach((o, oi) => {
      const b = el("button","opt-btn", esc(o));
      b.addEventListener("click", ()=>{
        if(card.dataset.done) return;
        card.dataset.done = "1";
        if(oi === q.a){
          b.classList.add("right"); YXJ.soundRight();
        }else{
          b.classList.add("wrong"); YXJ.soundWrong();
          Array.from(card.querySelectorAll(".opt-btn"))[q.a].classList.add("right");
        }
        YXJ.markThinkingDone(q.q);
        card.appendChild(el("div","", "<div style='margin-top:10px;background:var(--card2);border-radius:12px;padding:10px;font-size:13px'>💡 " + esc(q.why) + "</div>"));
      });
      card.appendChild(b);
    });
    container.appendChild(card);
  });
}

/* ---------- 错题本 ---------- */
function renderMistakes(box){
  box.innerHTML = "";
  const ms = YXJ.getMistakes().filter(m=>!m.solved);
  if(!ms.length){
    box.appendChild(el("div","empty","<span class='e-ico'>😊</span>还没有错题，继续加油！"));
    return;
  }
  ms.forEach(m => {
    const row = el("div","mistake-row");
    row.innerHTML = `<span style="font-size:18px">📝</span><div class="mq"><div>${esc(m.q)}</div><div style="font-size:12px;color:var(--muted)">正确答案：${esc(m.answer)} · 你答了：${esc(m.wrong)} · ${esc(m.date)}</div></div>`;
    const solved = el("button","btn ok sm","会了");
    solved.addEventListener("click", ()=>{ YXJ.markMistakeSolved(m.id); renderMistakes(box); toast("太棒了，这道题学会啦！"); YXJ.soundRight(); });
    const del = el("button","btn warn sm","删");
    del.addEventListener("click", ()=>{ YXJ.deleteMistake(m.id); renderMistakes(box); });
    row.appendChild(solved); row.appendChild(del);
    box.appendChild(row);
  });
}

/* ================= 英语 ================= */
function viewYingyu(){
  const page = el("div","page");
  page.appendChild(pageHead("🔤","英语小课堂","每天 5 句 + 5 词：先听、再跟读，磨耳朵最重要"));
  page.appendChild(doneBar("yingyu", "英语打卡"));

  const daily = YXJ.englishDaily();
  const c = el("div","card");
  c.innerHTML = `<h3>💬 每日 5 句（和爸爸妈妈说一说）</h3>`;
  daily.sentences.forEach(s => {
    const row = el("div","mistake-row");
    row.innerHTML = `<span style="font-size:18px">🗣️</span><div class="mq"><div style="font-size:17px;font-weight:800">${esc(s.en)}</div><div style="font-size:13px;color:var(--muted)">${esc(s.zh)} · ${esc(s.theme)}</div></div>`;
    row.appendChild(speakBtn(s.en, "en-US", "sm"));
    c.appendChild(row);
  });
  page.appendChild(c);

  const wc = el("div","card");
  wc.innerHTML = `<h3>🔡 每日 5 词（点喇叭听发音）</h3>`;
  const grid = el("div","grid grid-2","");
  daily.words.forEach(w => {
    const card = el("div","card word-card");
    card.style.marginBottom = "0";
    card.innerHTML = `<div class="word-emoji">${w.e}</div><div class="word-en">${esc(w.en)}</div><div class="word-zh">${esc(w.zh)} · ${esc(w.theme)}</div>`;
    const sp = speakBtn(w.en, "en-US", "sm");
    sp.style.margin = "8px auto 0"; sp.style.display = "block";
    card.appendChild(sp);
    grid.appendChild(card);
  });
  wc.appendChild(grid);
  page.appendChild(wc);

  return page;
}

/* ================= 运动 ================= */
function viewYundong(){
  const page = el("div","page");
  page.appendChild(pageHead("🏃","运动小达人","每天 1 小时：上午 + 下午 + 晚上 各 20 分钟"));
  page.appendChild(doneBar("yundong", "运动打卡"));

  const d = new Date().getDay(); // 0=周日
  const todayIdx = d === 0 ? 6 : d - 1;
  const week = YXJ_DATA.exercise;
  const c = el("div","card");
  c.innerHTML = `<h3>📅 一周运动计划</h3>`;
  week.forEach((w, i) => {
    const row = el("div","mistake-row");
    row.style.flexWrap = "wrap";
    const isToday = i === todayIdx;
    row.innerHTML = `<span style="font-size:22px">${w.icon}</span>
      <div class="mq"><div style="font-weight:800">${w.day} · ${esc(w.name)} ${isToday?"<span class='chip gold'>今天</span>":""}</div>
      <div style="font-size:12px;color:var(--muted)">${esc(w.desc)}</div>
      <div style="font-size:12px;color:#c98a00">⚠️ ${esc(w.tips)}</div></div>`;
    c.appendChild(row);
  });
  page.appendChild(c);

  // 计时器
  const tc = el("div","card");
  tc.innerHTML = `<h3>⏱️ 分段计时器（每段 20 分钟）</h3>`;
  const timerBox = el("div","","");
  timer(timerBox);
  tc.appendChild(timerBox);
  page.appendChild(tc);

  // 三段时间打卡
  const sc = el("div","card");
  sc.innerHTML = `<h3>✅ 今天的三段运动都做了吗？</h3>`;
  const segs = ["🌅 上午 20 分钟","☀️ 下午 20 分钟","🌙 晚上 20 分钟"];
  const ci = YXJ.getCheckin();
  segs.forEach((s, i) => {
    const key = "yd" + i;
    const b = el("button","btn " + (ci.tasks[key]?"ok":"ghost"), (ci.tasks[key]?"✅ ":"☐ ") + s);
    b.style.margin = "0 8px 8px 0";
    b.addEventListener("click", ()=>{
      YXJ.setTaskDone(key, !YXJ.isTaskDone(key));
      renderPage();
    });
    sc.appendChild(b);
  });
  page.appendChild(sc);

  return page;
}

/* ---------- 计时器 ---------- */
function timer(container){
  const DURATION = 20*60;
  let remain = DURATION, timerId = null, running = false;
  const num = el("div","timer-num", fmt(remain));
  const btnRow = el("div","row",""); btnRow.style.justifyContent = "center"; btnRow.style.marginTop = "10px";
  const start = el("button","btn ok","▶ 开始");
  const reset = el("button","btn ghost","↺ 重来");
  function fmt(s){
    const m = Math.floor(s/60), ss = s%60;
    return String(m).padStart(2,"0") + ":" + String(ss).padStart(2,"0");
  }
  function tick(){
    remain--;
    num.textContent = fmt(Math.max(0, remain));
    if(remain<=0){
      clearInterval(timerId); timerId = null; running = false;
      start.textContent = "▶ 开始";
      YXJ.soundWin(); toast("⏰ 20 分钟到啦！休息一下，喝口水吧");
    }
  }
  start.addEventListener("click", ()=>{
    if(running){ clearInterval(timerId); timerId=null; running=false; start.textContent="▶ 继续"; }
    else{ running=true; start.textContent="⏸ 暂停"; timerId=setInterval(tick, 1000); }
  });
  reset.addEventListener("click", ()=>{
    clearInterval(timerId); timerId=null; running=false; remain=DURATION;
    num.textContent = fmt(remain); start.textContent = "▶ 开始";
  });
  btnRow.appendChild(start); btnRow.appendChild(reset);
  container.appendChild(num); container.appendChild(btnRow);
  container.appendChild(el("div","hint","* 计时器响铃后记得休息、补充水分哦",));
}
/* ================= 游戏乐园 ================= */
function viewGames(){
  const page = el("div","page");
  page.appendChild(pageHead("🎮","游戏乐园","边玩边学，每天玩一关就够啦"));

  const g = YXJ.state.games;
  const games = [
    {id:"pinyin", icon:"🀄", name:"拼音对对碰", desc:"翻开卡片，把汉字和拼音配成一对！", progress:`最高 ${g.pinyin.best||0} 星`},
    {id:"english", icon:"🖼️", name:"单词找朋友", desc:"看看图，选出正确的英文单词！", progress:`最高 ${g.english.best||0} 星`},
    {id:"goose", icon:"🦢", name:"抓大鹅", desc:"找到 3 个一样的小动物，把它们送回家！", progress:`第 ${g.goose.level||1} 关`},
    {id:"diff", icon:"🕵️", name:"找不同", desc:"左右两图比一比，点出不一样的地方！", progress:`第 ${(g.diff&&g.diff.level)||1} 关`},
    {id:"num", icon:"🔢", name:"数字排队", desc:"按 1、2、3… 的顺序把数字排好！", progress:`第 ${(g.num&&g.num.level)||1} 关`}
  ];
  games.forEach(gg => {
    const card = el("div","card");
    card.style.cursor = "pointer";
    card.innerHTML = `<div class="row" style="justify-content:space-between">
      <div><span style="font-size:42px">${gg.icon}</span></div>
      <span class="chip gold">${esc(gg.progress)}</span></div>
      <h3 style="margin:10px 0 4px">${esc(gg.name)}</h3>
      <div class="hint">${esc(gg.desc)}</div>
      <button class="btn ok" style="margin-top:12px">开始玩 ➜</button>`;
    card.addEventListener("click", ()=>{
      const play = el("div","","");
      const back = el("button","btn ghost sm","← 返回游戏乐园");
      back.style.marginBottom = "10px";
      back.addEventListener("click", ()=>go("games"));
      play.appendChild(back);
      page.innerHTML = "";
      page.appendChild(pageHead("🎮","游戏乐园",""));
      page.appendChild(play);
      if(gg.id==="pinyin") YXJ_GAMES.pinyinGame(play);
      if(gg.id==="english") YXJ_GAMES.englishGame(play);
      if(gg.id==="goose") YXJ_GAMES.gooseGame(play);
      if(gg.id==="diff") YXJ_GAMES.findDiffGame(play);
      if(gg.id==="num") YXJ_GAMES.numberOrderGame(play);
    });
    page.appendChild(card);
  });

  page.appendChild(el("div","card", "<div class='hint'>⏰ 小贴士：每次游戏控制在 10~15 分钟，保护小眼睛哦！</div>"));
  return page;
}

/* ================= 打卡与积分 ================= */
function viewJifen(){
  const page = el("div","page");
  page.appendChild(pageHead("⭐","打卡与积分","每天完成任务得积分，攒够就能换奖励！"));

  const points = YXJ.state.points;
  const rewards = YXJ.getRewards();
  const next = rewards.filter(r=>r.points>points).sort((a,b)=>a.points-b.points)[0];
  const pct = next ? Math.min(100, Math.round(points/next.points*100)) : 100;
  const hero = el("div","points-hero");
  hero.innerHTML = `<div class="ph-star">⭐</div><div style="flex:1">
    <div class="ph-num">${points} <span style="font-size:16px">积分</span></div>
    <div class="ph-bar"><i style="width:${pct}%"></i></div>
    <div style="font-size:12px;margin-top:6px">${next ? `离「${next.icon} ${esc(next.name)}」还差 ${next.points-points} 分` : "所有奖励都到手啦，太棒了！"}</div>
  </div>`;
  page.appendChild(hero);

  // 奖励
  const rc = el("div","card");
  rc.innerHTML = `<h3>🎁 奖励兑换</h3>`;
  const rList = el("div","grid grid-3","");
  rewards.forEach(r => {
    const claimed = r.claimed.length > 0;
    const card = el("div","card word-card");
    card.style.marginBottom = "0";
    card.innerHTML = `<div class="word-emoji">${r.icon}</div><div style="font-size:18px;font-weight:900">${esc(r.name)}</div><div class="chip gold">需要 ${r.points} 分</div>`;
    const btn = el("button","btn sm " + (claimed?"":"ok"), claimed ? "已领取 ✅" : (points>=r.points ? "领取奖励 🎉" : "还没到哦"));
    btn.disabled = claimed || points < r.points;
    btn.style.margin = "10px auto 0"; btn.style.display = "block";
    btn.addEventListener("click", ()=>{
      if(YXJ.claimReward(r.id)){
        toast("🎉 兑换成功！找爸爸妈妈领奖励吧！"); YXJ.soundWin(); celebrate(); renderPage();
      }
    });
    card.appendChild(btn);
    rList.appendChild(card);
  });
  rc.appendChild(rList);
  rc.appendChild(el("div","hint","* 奖励内容和分值可以在「设置」里自由修改、增加、删除。"));
  page.appendChild(rc);

  // 打卡日历
  const cc = el("div","card");
  cc.innerHTML = `<h3>📆 打卡日历</h3>`;
  const calBox = el("div","","");
  calendar(calBox);
  cc.appendChild(calBox);
  page.appendChild(cc);

  // 规则
  const rule = el("div","card");
  rule.innerHTML = `<h3>📏 积分规则</h3><div class="hint">
    1️⃣ 每天把所有必做任务都完成，可得 <b>1 积分</b>。<br>
    2️⃣ 积分会一直累积，10 分、20 分、30 分… 到达就能兑换奖励。<br>
    3️⃣ 连续打卡会有 🔥 记录，坚持就是胜利！</div>`;
  page.appendChild(rule);

  return page;
}

/* ---------- 日历 ---------- */
function calendar(box){
  let view = new Date();
  view.setDate(1);
  function render(){
    box.innerHTML = "";
    const head = el("div","row",""); head.style.justifyContent = "space-between"; head.style.marginBottom = "10px";
    const prev = el("button","btn ghost sm","◀");
    prev.addEventListener("click", ()=>{ view = new Date(view.getFullYear(), view.getMonth()-1, 1); render(); });
    const next = el("button","btn ghost sm","▶");
    next.addEventListener("click", ()=>{ view = new Date(view.getFullYear(), view.getMonth()+1, 1); render(); });
    const label = el("div","","<div style='font-weight:900;font-size:17px'>" + view.getFullYear() + " 年 " + (view.getMonth()+1) + " 月</div>");
    const lr = el("div","row",""); lr.appendChild(prev); lr.appendChild(label); lr.appendChild(next);
    head.appendChild(lr);
    box.appendChild(head);
    const wk = el("div","cal-grid");
    ["日","一","二","三","四","五","六"].forEach(w=>wk.appendChild(el("div","cal-day empty","<div style='font-size:12px;color:var(--muted)'>"+w+"</div>")));
    box.appendChild(wk);
    const grid = el("div","cal-grid");
    const firstDow = view.getDay();
    for(let i=0;i<firstDow;i++) grid.appendChild(el("div","cal-day empty"));
    const days = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
    const today = YXJ.todayStr();
    for(let d=1; d<=days; d++){
      const ds = view.getFullYear() + "-" + String(view.getMonth()+1).padStart(2,"0") + "-" + String(d).padStart(2,"0");
      const all = YXJ.allRequiredDone(ds);
      const some = YXJ.todayDoneCount(ds) > 0;
      const cell = el("div","cal-day" + (all?" done":"") + (some&&!all?" partial":"") + (ds===today?" today":""));
      cell.innerHTML = `${d}<span class="dot"></span>`;
      grid.appendChild(cell);
    }
    box.appendChild(grid);
  }
  render();
}

/* ================= 设置 ================= */
function viewSettings(){
  const page = el("div","page");
  page.appendChild(pageHead("⚙️","设置","家长可以在这里调整任务、奖励和备份"));

  // 外观
  const themeCard = el("div","card");
  themeCard.innerHTML = `<h3>🎨 界面主题</h3>`;
  const themes = [["default","☀️ 蓝天草地"],["sunset","🍑 粉橙日落"],["space","🌌 梦幻星空"]];
  const tRow = el("div","row","");
  themes.forEach(([id,label])=>{
    const b = el("button","btn sm " + (YXJ.state.settings.theme===id?"ok":"ghost"), label);
    b.addEventListener("click", ()=>{ YXJ.state.settings.theme = id; YXJ.save(); document.body.dataset.theme = id; renderPage(); });
    tRow.appendChild(b);
  });
  themeCard.appendChild(tRow);
  const soundRow = el("div","row",""); soundRow.style.marginTop = "12px";
  soundRow.appendChild(el("div","","<b>🔊 音效</b>"));
  const snd = el("button","btn sm " + (YXJ.state.settings.sound?"ok":"ghost"), YXJ.state.settings.sound?"开":"关");
  snd.addEventListener("click", ()=>{ YXJ.state.settings.sound = !YXJ.state.settings.sound; YXJ.save(); renderPage(); });
  soundRow.appendChild(snd);
  themeCard.appendChild(soundRow);
  page.appendChild(themeCard);

  // 任务管理
  const tc = el("div","card");
  tc.innerHTML = `<h3>📋 任务管理（可新增 / 编辑 / 删除）</h3>`;
  const tList = el("div","","");
  YXJ.getTasks().forEach(t => {
    const row = el("div","mistake-row");
    row.innerHTML = `<span style="font-size:20px">${t.icon}</span>
      <div class="mq"><div style="font-weight:800">${esc(t.name)} <span class="chip">${t.required?"必做":"选做"}</span></div>
      <div style="font-size:12px;color:var(--muted)">${esc(t.desc)}</div></div>`;
    const req = el("button","btn sm " + (t.required?"ok":"ghost"), t.required?"必做":"选做");
    req.addEventListener("click", ()=>{
      YXJ.updateTask(t.id, {required: !t.required});
      renderPage();
    });
    const del = el("button","btn warn sm","删除");
    del.addEventListener("click", ()=>{
      modal("删除任务", el("div","", `<div class="hint">确定要删除「${esc(t.name)}」吗？</div>`), [
        ["取消","ghost",()=>{ document.querySelector(".modal-mask").remove(); }],
        ["删除","warn",()=>{ YXJ.deleteTask(t.id); document.querySelector(".modal-mask").remove(); renderPage(); }]
      ]);
    });
    row.appendChild(req); row.appendChild(del);
    tList.appendChild(row);
  });
  tc.appendChild(tList);
  const addBtn = el("button","btn ok","➕ 新增任务");
  addBtn.addEventListener("click", ()=>taskForm());
  tc.appendChild(addBtn);
  page.appendChild(tc);

  // 奖励管理
  const rc = el("div","card");
  rc.innerHTML = `<h3>🎁 奖励管理（可新增 / 编辑 / 删除）</h3>`;
  const rList = el("div","","");
  YXJ.getRewards().forEach(r => {
    const row = el("div","mistake-row");
    row.innerHTML = `<span style="font-size:20px">${r.icon}</span>
      <div class="mq"><div style="font-weight:800">${esc(r.name)}</div><div style="font-size:12px;color:var(--muted)">需要 ${r.points} 分</div></div>`;
    const edit = el("button","btn sm ghost","编辑");
    edit.addEventListener("click", ()=>rewardForm(r));
    const del = el("button","btn warn sm","删除");
    del.addEventListener("click", ()=>{
      YXJ.deleteReward(r.id); renderPage();
    });
    row.appendChild(edit); row.appendChild(del);
    rList.appendChild(row);
  });
  rc.appendChild(rList);
  const addR = el("button","btn ok","➕ 新增奖励");
  addR.addEventListener("click", ()=>rewardForm());
  rc.appendChild(addR);
  page.appendChild(rc);

  // 备份
  const bc = el("div","card");
  bc.innerHTML = `<h3>💾 数据备份</h3><div class="hint">换电脑或手机时，先在这里导出备份文件，再到新设备上导入，进度就搬家啦。</div>`;
  const bRow = el("div","row",""); bRow.style.marginTop = "10px";
  const exp = el("button","btn","⬇️ 导出备份");
  exp.addEventListener("click", ()=>{
    const blob = new Blob([YXJ.exportData()], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "一年级学习工作台备份-" + YXJ.todayStr() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("备份已导出");
  });
  const imp = el("button","btn ghost","⬆️ 导入备份");
  imp.addEventListener("click", ()=>{
    const fi = document.createElement("input");
    fi.type = "file"; fi.accept = ".json,application/json";
    fi.addEventListener("change", ()=>{
      const f = fi.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        try{
          YXJ.importData(reader.result);
          document.body.dataset.theme = YXJ.state.settings.theme;
          toast("导入成功！");
          renderPage();
        }catch(e){ toast("导入失败：文件格式不对"); }
      };
      reader.readAsText(f);
    });
    fi.click();
  });
  const reset = el("button","btn warn","🗑️ 清空所有数据");
  reset.addEventListener("click", ()=>{
    modal("清空数据", el("div","", `<div class="hint">确定要清空所有进度、积分和记录吗？此操作无法恢复！</div>`), [
      ["取消","ghost",()=>{ document.querySelector(".modal-mask").remove(); }],
      ["清空","warn",()=>{ YXJ.resetAll(); document.body.dataset.theme = "default"; renderPage(); document.querySelector(".modal-mask").remove(); toast("数据已清空"); }]
    ]);
  });
  bRow.appendChild(exp); bRow.appendChild(imp); bRow.appendChild(reset);
  bc.appendChild(bRow);
  page.appendChild(bc);

  // 关于
  page.appendChild(el("div","card", `<h3>ℹ️ 关于</h3><div class="hint">
    一年级学习工作台 V1.0<br>按一年级课程编排：语文 20 分钟（古诗 · 成语 · 识字 · 拼音 · 笔顺 · 阅读）+ 数学 15 分钟（口算 · 100 以内加减 · 钟表 · 人民币）+ 英语 10 分钟 + 运动 1 小时 + 游戏 10 分钟。<br>
    生字库 140 字（部编版一上写字表 + 一下核心），古诗 21 首，英语词汇 100+；每日内容自动轮换，进度保存在本机浏览器中。</div>`));

  return page;
}

/* ---------- 任务表单 ---------- */
function taskForm(t){
  const body = el("div","");
  body.innerHTML = `
    <div class="field"><label>任务图标（选一个 emoji）</label><select id="tf-ico">
      <option>📖</option><option>🔢</option><option>🔤</option><option>🏃</option><option>🎮</option>
      <option>🎨</option><option>🎵</option><option>🧩</option><option>🌱</option><option>⭐</option>
    </select></div>
    <div class="field"><label>任务名称</label><input id="tf-name" placeholder="如：练钢琴" value="${t?esc(t.name):""}"></div>
    <div class="field"><label>说明</label><input id="tf-desc" placeholder="如：每天 15 分钟" value="${t?esc(t.desc):""}"></div>
    <div class="field"><label>是否必做（必做任务全部完成才得积分）</label><select id="tf-req"><option value="1">必做</option><option value="0">选做</option></select></div>`;
  if(t) body.querySelector("#tf-req").value = t.required ? "1" : "0";
  modal(t?"编辑任务":"新增任务", body, [
    ["取消","ghost",()=>{ document.querySelector(".modal-mask").remove(); }],
    ["保存","ok",()=>{
      const name = body.querySelector("#tf-name").value.trim();
      if(!name){ toast("请填写任务名称"); return; }
      const data = { name, icon: body.querySelector("#tf-ico").value, desc: body.querySelector("#tf-desc").value.trim(), required: body.querySelector("#tf-req").value==="1" };
      if(t) YXJ.updateTask(t.id, data); else YXJ.addTask(data);
      document.querySelector(".modal-mask").remove();
      renderPage(); toast("任务已保存");
    }]
  ]);
}

/* ---------- 奖励表单 ---------- */
function rewardForm(r){
  const body = el("div","");
  body.innerHTML = `
    <div class="field"><label>奖励图标</label><select id="rf-ico">
      <option>🍬</option><option>🧸</option><option>🎡</option><option>🍭</option><option>🎮</option>
      <option>📚</option><option>🎨</option><option>🍦</option><option>🎫</option><option>🌈</option>
    </select></div>
    <div class="field"><label>奖励名称</label><input id="rf-name" placeholder="如：去公园玩" value="${r?esc(r.name):""}"></div>
    <div class="field"><label>需要积分</label><input id="rf-pts" type="number" min="1" value="${r?r.points:10}"></div>`;
  modal(r?"编辑奖励":"新增奖励", body, [
    ["取消","ghost",()=>{ document.querySelector(".modal-mask").remove(); }],
    ["保存","ok",()=>{
      const name = body.querySelector("#rf-name").value.trim();
      const pts = parseInt(body.querySelector("#rf-pts").value, 10);
      if(!name || !pts){ toast("请填写名称和积分"); return; }
      const data = { name, icon: body.querySelector("#rf-ico").value, points: pts };
      if(r) YXJ.updateReward(r.id, data); else YXJ.addReward(data);
      document.querySelector(".modal-mask").remove();
      renderPage(); toast("奖励已保存");
    }]
  ]);
}


/* ================= 笔顺演示 ================= */
function strokeDemo(charInfo){
  const body = el("div","");
  body.style.textAlign = "center";
  const box = el("div","",""); box.style.width = "220px"; box.style.height = "220px"; box.style.margin = "0 auto";
  body.appendChild(box);
  body.appendChild(el("div","", "<div style='font-size:20px;font-weight:900;margin-top:8px'>" + esc(charInfo.c) + " <span style='font-size:14px;color:var(--muted)'>" + esc(charInfo.py) + " · " + esc(charInfo.word) + "</span></div>"));
  body.appendChild(el("div","hint","<div style='margin-top:6px'>看动画记笔顺，然后在纸上写一写吧！</div>"));
  const btns = el("div","row",""); btns.style.justifyContent = "center"; btns.style.marginTop = "12px";
  const play = el("button","btn ok sm","⏸ 暂停");
  const again = el("button","btn ghost sm","↺ 重播");
  const slow = el("button","btn ghost sm","🐢 慢速");
  const fast = el("button","btn ghost sm","🐇 快速");
  btns.appendChild(play); btns.appendChild(again); btns.appendChild(slow); btns.appendChild(fast);
  body.appendChild(btns);
  modal("✍️ 笔顺演示：" + charInfo.c, body, [["关闭","ghost",()=>{ document.querySelector(".modal-mask").remove(); }]]);

  if(!window.HanziWriter || !window.STROKES_DATA || !window.STROKES_DATA[charInfo.c]){
    box.innerHTML = "<div style='color:var(--muted);padding-top:84px'>这个字暂时没有笔顺动画 😅</div>";
    return;
  }
  let playing = true;
  const writer = HanziWriter.create(box, charInfo.c, {
    width: 210, height: 210, padding: 8,
    showOutline: true, showCharacter: false,
    strokeColor: "#ff9f43", radicalColor: "#ff9f43",
    charDataLoader: (ch, onComplete, onError) => {
      const d = window.STROKES_DATA[ch];
      if(d) onComplete(d); else onError(new Error("no data"));
    }
  });
  writer.animateCharacter();
  play.addEventListener("click", ()=>{
    if(playing){ writer.pauseAnimation(); play.textContent = "▶ 播放"; }
    else { writer.resumeAnimation(); play.textContent = "⏸ 暂停"; }
    playing = !playing;
  });
  again.addEventListener("click", ()=>{ writer.cancelAnimation(); writer.animateCharacter(); playing = true; play.textContent = "⏸ 暂停"; });
  slow.addEventListener("click", ()=>{ writer.cancelAnimation(); writer.animateCharacter({duration: 2200}); playing = true; play.textContent = "⏸ 暂停"; });
  fast.addEventListener("click", ()=>{ writer.cancelAnimation(); writer.animateCharacter({duration: 600}); playing = true; play.textContent = "⏸ 暂停"; });
}

/* ================= 成长报告 ================= */
function viewReport(){
  const page = el("div","page");
  page.appendChild(pageHead("📊","成长报告","看看这段时间的进步吧！"));
  const totals = YXJ.statsTotals();
  const streak = YXJ.state.settings.streak || 0;
  const hist7 = YXJ.getHistory(7);

  const hero = el("div","card");
  hero.innerHTML = "<h3>🏅 累计成就</h3>";
  const g1 = el("div","grid grid-4","");
  const items = [
    ["⭐","积分", totals.points],
    ["🔥","连续打卡", streak + " 天"],
    ["📅","打卡天数", totals.days + " 天"],
    ["📜","学会古诗", totals.poems + " 首"],
    ["✍️","认识汉字", totals.chars + " 个"],
    ["🔊","朗读次数", totals.listen + " 次"],
    ["🎮","游戏星星", totals.gameStars + " 颗"],
    ["📚","读完绘本", totals.read + " 本"]
  ];
  items.forEach(([ico, label, val]) => {
    const c = el("div","card word-card");
    c.style.marginBottom = "0"; c.style.padding = "14px 8px";
    c.innerHTML = "<div style='font-size:30px'>" + ico + "</div><div style='font-size:22px;font-weight:900;color:var(--primary-dark)'>" + val + "</div><div style='font-size:12px;color:var(--muted)'>" + label + "</div>";
    g1.appendChild(c);
  });
  hero.appendChild(g1);
  const mRight = totals.mathRight, mWrong = totals.mathWrong, mTotal = mRight + mWrong;
  const acc = mTotal ? Math.round(mRight/mTotal*100) : 0;
  hero.appendChild(el("div","", "<div style='margin-top:14px;font-size:14px'><b>🧮 数学答题</b>：共 " + mTotal + " 题，答对 " + mRight + "，正确率 " + acc + "%</div>"));
  const mbar = el("div","progress"); mbar.style.marginTop = "6px";
  mbar.innerHTML = "<i style='width:" + acc + "%'></i>";
  hero.appendChild(mbar);
  page.appendChild(hero);

  const weekCard = el("div","card");
  weekCard.innerHTML = "<h3>🗓️ 近 7 天打卡</h3>";
  const weekRow = el("div","row",""); weekRow.style.justifyContent = "space-around";
  hist7.forEach(h => {
    const all = YXJ.allRequiredDone(h.date);
    const some = YXJ.todayDoneCount(h.date) > 0;
    const cell = el("div","","");
    cell.style.textAlign = "center";
    const d = new Date(h.date);
    const wd = ["日","一","二","三","四","五","六"][d.getDay()];
    cell.innerHTML = "<div style='font-size:28px'>" + (all ? "✅" : some ? "🟡" : "⚪") + "</div><div style='font-size:12px;color:var(--muted)'>" + (d.getMonth()+1) + "/" + d.getDate() + " 周" + wd + "</div>";
    weekRow.appendChild(cell);
  });
  weekCard.appendChild(weekRow);
  weekCard.appendChild(el("div","hint","✅ 全部完成 · 🟡 完成一部分 · ⚪ 未开始"));
  page.appendChild(weekCard);

  const subCard = el("div","card");
  subCard.innerHTML = "<h3>📖 学科完成度（近 7 天）</h3>";
  const subs = [["📖","语文","yuwen"],["🔢","数学","shuxue"],["🔤","英语","yingyu"],["🏃","运动","yundong"],["🎮","游戏","youxi"]];
  subs.forEach(([ico, name, id]) => {
    let cnt = 0;
    hist7.forEach(h => { if(YXJ.isTaskDone(id, h.date)) cnt++; });
    const row = el("div","","");
    row.style.marginBottom = "12px";
    row.innerHTML = "<div style='display:flex;justify-content:space-between;font-size:14px;font-weight:700'><span>" + ico + " " + name + "</span><span>" + cnt + "/7 天</span></div>";
    const bar = el("div","progress"); bar.style.marginTop = "4px";
    bar.innerHTML = "<i style='width:" + Math.round(cnt/7*100) + "%'></i>";
    row.appendChild(bar);
    subCard.appendChild(row);
  });
  page.appendChild(subCard);

  const lineCard = el("div","card");
  lineCard.innerHTML = "<h3>📈 积分趋势（近 14 天）</h3>";
  lineCard.appendChild(pointsChart(YXJ.getHistory(14)));
  page.appendChild(lineCard);

  const mCard = el("div","card");
  mCard.innerHTML = "<h3>📒 错题掌握</h3><div class='hint'>共收录 <b>" + totals.mistakesTotal + "</b> 道错题，已掌握 <b>" + totals.mistakesSolved + "</b> 道。在数学页的错题本里点「会了」就能巩固复习。</div>";
  page.appendChild(mCard);

  return page;
}

function pointsChart(hist){
  const W = 640, H = 170, pad = 26;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.style.width = "100%"; svg.style.maxWidth = "680px"; svg.style.display = "block"; svg.style.margin = "0 auto";
  const pts = hist.map(h => h.rec ? (h.rec.points||0) : 0);
  const max = Math.max(1, Math.max.apply(null, pts));
  const n = pts.length;
  const coords = pts.map((v,i) => {
    const x = pad + i * (W - pad*2) / Math.max(1, n-1);
    const y = H - pad - (v / max) * (H - pad*2);
    return [x, y];
  });
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("points", coords.map(c=>c.join(",")).join(" "));
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#ff9f43");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  svg.appendChild(line);
  coords.forEach((c,i) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", c[0]); circle.setAttribute("cy", c[1]); circle.setAttribute("r", "4");
    circle.setAttribute("fill", pts[i] ? "#ff9f43" : "#d9d9d9");
    svg.appendChild(circle);
    const tx = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tx.setAttribute("x", c[0]); tx.setAttribute("y", H - 5); tx.setAttribute("text-anchor", "middle");
    tx.setAttribute("font-size", "9"); tx.setAttribute("fill", "#999");
    const d = new Date(hist[i].date);
    tx.textContent = (d.getMonth()+1) + "/" + d.getDate();
    svg.appendChild(tx);
    if(pts[i]){
      const tv = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tv.setAttribute("x", c[0]); tv.setAttribute("y", c[1] - 8); tv.setAttribute("text-anchor", "middle");
      tv.setAttribute("font-size", "10"); tv.setAttribute("fill", "#f57c00"); tv.setAttribute("font-weight", "bold");
      tv.textContent = pts[i];
      svg.appendChild(tv);
    }
  });
  return svg;
}

/* ================= 初始化 ================= */
function renderPage(){
  const main = $("#main");
  main.innerHTML = "";
  const views = { home:viewHome, yuwen:viewYuwen, shuxue:viewShuxue, yingyu:viewYingyu, yundong:viewYundong, games:viewGames, jifen:viewJifen, report:viewReport, settings:viewSettings };
  main.appendChild((views[current]||viewHome)());
  window.scrollTo(0,0);
}

function init(){
  YXJ.load();
  document.body.dataset.theme = YXJ.state.settings.theme || "default";
  $("#backdrop").addEventListener("click", ()=>{
    $("#sidebar").classList.remove("open");
    $("#backdrop").classList.remove("show");
  });
  renderNav();
  renderPage();
  // PWA：仅在 http(s) 环境下注册（file:// 会静默跳过）
  if("serviceWorker" in navigator && location.protocol.indexOf("http") === 0){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
  // 预热语音
  if("speechSynthesis" in window) window.speechSynthesis.getVoices();
}
document.addEventListener("DOMContentLoaded", init);
})();
