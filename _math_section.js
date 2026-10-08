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
    const pool = [`${h} 时`, `${h} 时 30 分`, `${h===12?1:h+1} 时${m===0?" 30 分":""}`, `${h===1?12:h-1} 时`];
    const uniq = [];
    pool.forEach(v=>{ if(uniq.indexOf(v)<0) uniq.push(v); });
    return {h, m, ans, opts: YXJ.shuffle(uniq).slice(0,3), type: m===0 ? "整时" : "半时"};
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
      return {q:`${k} 元 =（ ）角`, ans:"" + k*10, opts3:[k*10, k*100, k*5], type:"元换角"};
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

