/* =========================================================
 * games.js — 三大游戏：拼音对对碰 / 英语实物对应 / 抓大鹅
 * ========================================================= */
(function(){
"use strict";

/* ---------- 通用小工具 ---------- */
function el(tag, cls, html){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(html !== undefined) e.innerHTML = html;
  return e;
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* =========================================================
 * 游戏一：拼音文字对对碰（翻牌配对）
 * ========================================================= */
const PY_LEVELS = [{pairs:6, cols:4}, {pairs:8, cols:4}, {pairs:10, cols:5}];

function pinyinGame(container){
  const st = YXJ.state.games.pinyin;
  let level = Math.min(st.level || 1, PY_LEVELS.length);
  let moves = 0, matches = 0, first = null, lock = false;

  const wrap = el("div","game-wrap");
  const header = el("div","game-header");
  header.innerHTML = `<div class="game-level">第 ${level} 关 · 配对 ${PY_LEVELS[level-1].pairs} 组 · 翻 ${moves} 次</div>`;
  const grid = el("div","mem-grid");
  grid.style.gridTemplateColumns = `repeat(${PY_LEVELS[level-1].cols},1fr)`;
  wrap.appendChild(header); wrap.appendChild(grid);
  container.appendChild(wrap);

  // 选牌：汉字 ↔ 拼音（去重）
  const pool = [];
  const seen = {};
  for(const it of YXJ_DATA.pinyin.words){
    if(seen[it.zi]) continue;
    seen[it.zi] = true;
    pool.push({key: it.zi, zi: it.zi, py: it.py, e: it.e});
    if(pool.length >= 15) break;
  }
  const pick = YXJ.shuffle(pool).slice(0, PY_LEVELS[level-1].pairs);
  const cards = [];
  for(const it of pick){
    cards.push({kind:"zi", key:it.key, show:it.zi, py:it.py});
    cards.push({kind:"py", key:it.key, show:it.py, py:it.py});
  }
  const deck = YXJ.shuffle(cards);

  function renderStats(){
    header.innerHTML = `<div class="game-level">第 ${level} 关 · 配对 ${PY_LEVELS[level-1].pairs} 组 · 翻 ${moves} 次</div>`;
  }

  deck.forEach((c, i) => {
    const card = el("div","mem-card");
    card.innerHTML = `<span class="big">${c.kind==="zi" ? esc(c.show) : "🔤"}</span>`;
    card.dataset.key = c.key; card.dataset.kind = c.kind; card.dataset.idx = i;
    card.addEventListener("click", () => {
      if(lock || card.classList.contains("flipped") || card.classList.contains("matched")) return;
      card.classList.add("flipped");
      card.innerHTML = c.kind==="zi" ? `<span class="big">${esc(c.show)}</span>` : `<span class="py">${esc(c.show)}</span>`;
      moves++;
      renderStats();
      if(!first){
        first = card;
      }else{
        lock = true;
        const a = first, b = card;
        setTimeout(() => {
          if(a.dataset.key === b.dataset.key && a.dataset.kind !== b.dataset.kind){
            a.classList.add("matched"); b.classList.add("matched");
            YXJ.soundRight();
            matches++;
            if(matches === PY_LEVELS[level-1].pairs){
              // 通关
              setTimeout(() => {
                YXJ.soundWin();
                const stars = moves <= PY_LEVELS[level-1].pairs*2 ? 3 : moves <= PY_LEVELS[level-1].pairs*3 ? 2 : 1;
                const prevBest = st.best || 0;
                if(stars > prevBest) st.best = stars;
                YXJ.bumpDaily("games", 1); YXJ.bumpDaily("gameStars", stars);
                if(level >= PY_LEVELS.length){
                  winBox(wrap, `拼音对对碰通关啦！⭐${st.best}`, [["再玩一次", ()=>{ wrap.remove(); pinyinGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
                }else{
                  st.level = level + 1;
                  winBox(wrap, `太棒了！获得 ${stars} 颗星 ⭐`, [["下一关", ()=>{ wrap.remove(); pinyinGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
                }
                YXJ.save();
              }, 500);
            }
          }else{
            YXJ.soundWrong();
            a.classList.remove("flipped"); b.classList.remove("flipped");
            a.innerHTML = a.dataset.kind==="zi" ? `<span class="big">${esc(deck[+a.dataset.idx].show)}</span>` : `<span class="big">🔤</span>`;
            b.innerHTML = b.dataset.kind==="zi" ? `<span class="big">${esc(deck[+b.dataset.idx].show)}</span>` : `<span class="big">🔤</span>`;
          }
          first = null; lock = false;
        }, 600);
      }
    });
    grid.appendChild(card);
  });
}

/* =========================================================
 * 游戏二：英语单词实物对应（看图选词）
 * ========================================================= */
function englishGame(container){
  const words = YXJ_DATA.english.words;
  const themes = ["全部"].concat(Array.from(new Set(words.map(w=>w.theme))));
  let theme = "全部";
  let qIdx = 0, right = 0, total = 10;
  let cur = null;

  const wrap = el("div","game-wrap");
  const chipRow = el("div","row","");
  chipRow.style.justifyContent = "center";
  chipRow.style.marginBottom = "12px";
  themes.forEach(t => {
    const c = el("button","chip" + (t===theme?" gold":""), t);
    c.addEventListener("click", () => { theme = t; qIdx = 0; right = 0; renderQ(); chips(); });
    chipRow.appendChild(c);
    c.dataset.t = t;
  });
  wrap.appendChild(chipRow);

  const qBox = el("div","","");
  wrap.appendChild(qBox);
  container.appendChild(wrap);

  function chips(){
    chipRow.querySelectorAll("button").forEach(b => {
      b.className = "chip" + (b.dataset.t === theme ? " gold" : "");
    });
  }

  function pickQ(){
    const pool = theme==="全部" ? words : words.filter(w=>w.theme===theme);
    if(!pool.length){ qBox.innerHTML = `<div class="empty"><span class="e-ico">😊</span>这个主题还没有单词哦</div>`; return; }
    const target = pool[Math.floor(Math.random()*pool.length)];
    const others = YXJ.shuffle(words.filter(w=>w.en!==target.en)).slice(0,3);
    const opts = YXJ.shuffle([target].concat(others)).slice(0,4);
    cur = {target, opts};
  }

  function renderQ(){
    pickQ();
    if(!cur){ return; }
    qBox.innerHTML = "";
    const head = el("div","game-header");
    head.innerHTML = `<div class="game-level">第 ${qIdx+1} / ${total} 题 · 答对 ${right} 题</div>`;
    qBox.appendChild(head);
    const card = el("div","card word-card");
    card.style.textAlign = "center";
    card.innerHTML = `<div class="word-emoji">${cur.target.e}</div><div style="margin:6px 0 14px;font-size:14px;color:var(--muted)">它是谁？选一选吧！</div>`;
    cur.opts.forEach(o => {
      const b = el("button","opt-btn", `${esc(o.en)}`);
      b.addEventListener("click", () => {
        if(b.classList.contains("right") || b.classList.contains("wrong")) return;
        if(o.en === cur.target.en){
          b.classList.add("right"); YXJ.soundRight(); right++;
          b.innerHTML += ` ✅`;
          const speakBtn = el("button","btn sm ghost", "🔊 听发音");
          speakBtn.style.margin = "0 auto 4px"; speakBtn.style.display = "block";
          speakBtn.addEventListener("click", ()=>{ YXJ.speak(o.en, "en-US"); });
          card.appendChild(speakBtn);
          setTimeout(next, 900);
        }else{
          b.classList.add("wrong"); YXJ.soundWrong();
          b.innerHTML += ` ❌`;
          const good = cur.opts.find(x=>x.en===cur.target.en);
          const goodBtn = Array.from(card.querySelectorAll(".opt-btn")).find(x=>x.textContent.trim().startsWith(good.en));
          if(goodBtn && !goodBtn.classList.contains("right")){
            goodBtn.classList.add("right");
            YXJ.addMistake({type:"英语", q: `${cur.target.e} 的英文`, answer: cur.target.en, wrong: o.en});
          }
          setTimeout(next, 1000);
        }
      });
      card.appendChild(b);
    });
    qBox.appendChild(card);
    if(cur.target.e){
      const hint = el("div","","");
      card.insertBefore(hint, card.firstChild);
    }
  }

  function next(){
    qIdx++;
    if(qIdx >= total){
      const stars = right===total?3: right>=7?2: right>=4?1:0;
      YXJ.bumpDaily("games", 1); YXJ.bumpDaily("gameStars", stars);
      const best = YXJ.state.games.english.best || 0;
      if(stars > best){ YXJ.state.games.english.best = stars; YXJ.save(); }
      YXJ.soundWin();
      winBox(wrap, `答对 ${right} 题！获得 ${stars} 颗星 ⭐`, [["再玩一次", ()=>{ wrap.remove(); englishGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
    }else{
      renderQ();
    }
  }
  renderQ();
}

/* =========================================================
 * 游戏三：抓大鹅（简化消除版）
 * ========================================================= */
const GOOSE_LEVELS = [
  {cols:3, rows:3, name:"鹅村小草坪"},
  {cols:6, rows:3, name:"鹅村大草坪"},
  {cols:6, rows:4, name:"鹅村果园"},
  {cols:9, rows:4, name:"鹅村大冒险"},
  {cols:9, rows:5, name:"鹅村小河"},
  {cols:12, rows:4, name:"鹅村雪山"}
];
const GOOSE_EMOJIS = ["🐔","🐤","🦆","🐰","🐿️","🦔","🐸","🦋","🐝","🐢","🦢","🐥","🐷","🐮","🦜","🐭","🐹","🦊","🐨","🦉"];

function gooseGame(container){
  const st = YXJ.state.games.goose;
  let level = Math.min(st.level || 1, GOOSE_LEVELS.length);
  const cfg = GOOSE_LEVELS[level-1];
  const groups = (cfg.cols * cfg.rows) / 3;
  const cells = [];
  const selected = [];

  const wrap = el("div","game-wrap");
  const header = el("div","game-header");
  header.innerHTML = `<div class="game-level">${cfg.name} · 找到 3 个一样的小动物点一点，把它们送回家！</div>`;
  const grid = el("div","goose-grid");
  grid.style.gridTemplateColumns = `repeat(${cfg.cols},1fr)`;
  wrap.appendChild(header); wrap.appendChild(grid);
  container.appendChild(wrap);

  // 生成棋盘：每个组横排 3 格
  const emojis = YXJ.shuffle(GOOSE_EMOJIS).slice(0, groups);
  let gi = 0;
  for(let r=0; r<cfg.rows; r++){
    for(let c=0; c<cfg.cols; c++){
      const gid = Math.floor((r*cfg.cols + c) / 3);
      const e = emojis[gid];
      cells.push({r, c, gid, e, cleared:false});
    }
  }

  function isStraightTriple(sel){
    if(sel.length !== 3) return false;
    const [a,b,c] = sel;
    if(!(a.gid===b.gid && b.gid===c.gid)) return false;
    const sameRow = a.r===b.r && b.r===c.r;
    const sameCol = a.c===b.c && b.c===c.c;
    if(!sameRow && !sameCol) return false;
    const keys = sel.map(x=>x.r+"-"+x.c).sort();
    const nums = sameRow ? keys.map(k=>+k.split("-")[1]) : keys.map(k=>+k.split("-")[0]);
    return nums[1]-nums[0]===1 && nums[2]-nums[1]===1;
  }

  function render(){
    grid.innerHTML = "";
    cells.forEach((cell, i) => {
      const d = el("div","goose-cell" + (cell.cleared ? " cleared" : "") + (selected.indexOf(cell)>=0 ? " selected" : ""));
      d.textContent = cell.cleared ? "" : cell.e;
      d.addEventListener("click", () => {
        if(cell.cleared) return;
        const si = selected.indexOf(cell);
        if(si >= 0){ selected.splice(si,1); }
        else {
          selected.push(cell);
          if(selected.length > 3) selected.shift();
        }
        if(selected.length === 3){
          if(isStraightTriple(selected)){
            YXJ.soundRight();
            selected.forEach(x => { x.cleared = true; });
            selected.length = 0;
            setTimeout(() => {
              render();
              const left = cells.filter(x=>!x.cleared).length;
              if(left === 0){
                YXJ.soundWin();
                const stars = 3;
                YXJ.bumpDaily("games", 1); YXJ.bumpDaily("gameStars", 3);
                if(level >= GOOSE_LEVELS.length){
                  winBox(wrap, "鹅村所有小动物都回家啦！🎉", [["再玩一次", ()=>{ wrap.remove(); gooseGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
                }else{
                  st.level = level + 1; YXJ.save();
                  winBox(wrap, "小动物都回家啦！🎉", [["下一关", ()=>{ wrap.remove(); gooseGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
                }
              }
            }, 250);
          }else{
            YXJ.soundWrong();
            selected.length = 0;
            setTimeout(render, 300);
          }
        }
        render();
      });
      grid.appendChild(d);
    });
  }
  render();
}


/* =========================================================
 * 游戏四：找不同（观察力）
 * ========================================================= */
const DIFF_LEVELS = [
  {cols:4, rows:4, diffs:1, name:"小侦探"},
  {cols:4, rows:4, diffs:2, name:"小侦探进阶"},
  {cols:5, rows:5, diffs:3, name:"大侦探"},
  {cols:6, rows:6, diffs:4, name:"名侦探"}
];
const DIFF_EMOJI = ["🍎","🍊","🍋","🍇","🍓","🍑","🍉","🥕","🍆","🌽","🐱","🐶","🐰","🦆","🐸","🦋","⚽","🎈","🚗","⭐","🌻","🍄"];

function findDiffGame(container){
  const st = YXJ.state.games;
  if(!st.diff) st.diff = {level:1};
  let level = Math.min(st.diff.level || 1, DIFF_LEVELS.length);
  const cfg = DIFF_LEVELS[level-1];
  const total = cfg.cols * cfg.rows;

  const wrap = el("div","game-wrap");
  const header = el("div","game-header");
  const gridRow = el("div","row","");
  gridRow.style.justifyContent = "center";
  gridRow.style.gap = "18px";
  const boardA = el("div","goose-grid"); boardA.style.maxWidth = "300px";
  boardA.style.gridTemplateColumns = "repeat(" + cfg.cols + ",1fr)";
  const boardB = el("div","goose-grid"); boardB.style.maxWidth = "300px";
  boardB.style.gridTemplateColumns = "repeat(" + cfg.cols + ",1fr)";
  const labelA = el("div","game-header","<b>🔍 左图</b>");
  const labelB = el("div","game-header","<b>🔍 右图（点出不同处）</b>");
  const boxA = el("div","",""); boxA.appendChild(labelA); boxA.appendChild(boardA);
  const boxB = el("div","",""); boxB.appendChild(labelB); boxB.appendChild(boardB);
  gridRow.appendChild(boxA); gridRow.appendChild(boxB);
  wrap.appendChild(header); wrap.appendChild(gridRow);
  container.appendChild(wrap);

  const base = [];
  for(let i=0;i<total;i++) base.push(DIFF_EMOJI[Math.floor(Math.random()*DIFF_EMOJI.length)]);
  const diffIdx = new Set();
  while(diffIdx.size < cfg.diffs){
    diffIdx.add(Math.floor(Math.random()*total));
  }
  const changed = base.slice();
  diffIdx.forEach(i => {
    let e2 = DIFF_EMOJI[Math.floor(Math.random()*DIFF_EMOJI.length)];
    while(e2 === base[i]) e2 = DIFF_EMOJI[Math.floor(Math.random()*DIFF_EMOJI.length)];
    changed[i] = e2;
  });
  const found = new Set();

  function renderHeader(){
    header.innerHTML = "<div class='game-level'>" + cfg.name + " · 找出 " + cfg.diffs + " 处不同 · 找到 " + found.size + " / " + cfg.diffs + "</div>";
  }
  function renderBoard(){
    boardA.innerHTML = ""; boardB.innerHTML = "";
    for(let i=0;i<total;i++){
      const a = el("div","goose-cell", base[i]);
      a.style.fontSize = "26px";
      boardA.appendChild(a);
      const b = el("div","goose-cell" + (found.has(i) ? " selected" : ""), changed[i]);
      b.style.fontSize = "26px";
      b.style.cursor = "pointer";
      b.addEventListener("click", () => {
        if(found.has(i)) return;
        if(diffIdx.has(i)){
          found.add(i);
          YXJ.soundRight();
          renderBoard(); renderHeader();
          if(found.size === cfg.diffs){
            YXJ.soundWin();
            YXJ.bumpDaily("games", 1); YXJ.bumpDaily("gameStars", 3);
            if(level >= DIFF_LEVELS.length){
              winBox(wrap, "你真是火眼金睛！全部找出来啦！🕵️", [["再玩一次", ()=>{ wrap.remove(); findDiffGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
            }else{
              st.diff.level = level + 1; YXJ.save();
              winBox(wrap, "太厉害了！找不同通关！🕵️", [["下一关", ()=>{ wrap.remove(); findDiffGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
            }
          }
        }else{
          YXJ.soundWrong();
          b.classList.add("wrong");
          setTimeout(()=>{ b.classList.remove("wrong"); }, 400);
        }
      });
      boardB.appendChild(b);
    }
  }
  renderHeader(); renderBoard();
}

/* =========================================================
 * 游戏五：数字排队（顺序 1~N）
 * ========================================================= */
const NUM_LEVELS = [
  {max:5, name:"数字 1~5 排队"},
  {max:7, name:"数字 1~7 排队"},
  {max:9, name:"数字 1~9 排队"}
];

function numberOrderGame(container){
  const st = YXJ.state.games;
  if(!st.num) st.num = {level:1};
  let level = Math.min(st.num.level || 1, NUM_LEVELS.length);
  const cfg = NUM_LEVELS[level-1];
  let expected = 1, wrongCount = 0;

  const wrap = el("div","game-wrap");
  const header = el("div","game-header");
  const line = el("div","card","");
  line.innerHTML = "<div style='text-align:center;color:var(--muted);font-size:14px'>排好队：</div>";
  const queue = el("div","row",""); queue.style.justifyContent = "center"; queue.style.minHeight = "60px";
  line.appendChild(queue);
  const pool = el("div","row",""); pool.style.justifyContent = "center"; pool.style.flexWrap = "wrap"; pool.style.marginTop = "10px";
  wrap.appendChild(header); wrap.appendChild(line); wrap.appendChild(pool);
  container.appendChild(wrap);

  const nums = YXJ.shuffle(Array.from({length: cfg.max}, (_,i)=>i+1));
  const doneSet = new Set();

  function render(){
    header.innerHTML = "<div class='game-level'>" + cfg.name + " · 按顺序点数字：从 1 开始</div>";
    queue.innerHTML = "";
    for(let i=1;i<=cfg.max;i++){
      const c = el("div","goose-cell", doneSet.has(i) ? String(i) : "?");
      c.style.width = "46px"; c.style.fontWeight = "900";
      if(doneSet.has(i)) c.classList.add("cleared"); else { c.style.visibility = "hidden"; }
      queue.appendChild(c);
    }
    pool.innerHTML = "";
    nums.forEach(n => {
      const b = el("button","btn ghost", String(n));
      b.style.minWidth = "56px"; b.style.fontSize = "20px"; b.style.padding = "12px 18px";
      if(doneSet.has(n)){ b.disabled = true; b.style.opacity = ".35"; }
      b.addEventListener("click", () => {
        if(doneSet.has(n)) return;
        if(n === expected){
          doneSet.add(n);
          YXJ.soundRight();
          expected++;
          render();
          if(expected > cfg.max){
            YXJ.soundWin();
            const stars = wrongCount===0 ? 3 : wrongCount<=2 ? 2 : 1;
            YXJ.bumpDaily("games", 1); YXJ.bumpDaily("gameStars", stars);
            if(level >= NUM_LEVELS.length){
              winBox(wrap, "数字都排好队啦！🎉", [["再玩一次", ()=>{ wrap.remove(); numberOrderGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
            }else{
              st.num.level = level + 1; YXJ.save();
              winBox(wrap, "数字都排好队啦！🎉", [["下一关", ()=>{ wrap.remove(); numberOrderGame(container); }], ["回游戏乐园", ()=>YXJ.go("games")]]);
            }
          }
        }else{
          wrongCount++;
          YXJ.soundWrong();
          b.classList.add("wrong");
          setTimeout(()=>b.classList.remove("wrong"), 400);
        }
      });
      pool.appendChild(b);
    });
  }
  render();
}

/* ---------- 通关弹窗 ---------- */
function winBox(parent, msg, actions){
  const box = el("div","card","");
  box.style.textAlign = "center";
  box.innerHTML = `<div style="font-size:46px">🎉</div><h3 style="margin:8px 0 14px">${esc(msg)}</h3>`;
  const row = el("div","row","");
  row.style.justifyContent = "center";
  actions.forEach(([label, fn]) => {
    const b = el("button","btn" + (label.indexOf("回")===0 ? " ghost":" ok"), label);
    b.addEventListener("click", fn);
    row.appendChild(b);
  });
  box.appendChild(row);
  parent.innerHTML = "";
  parent.appendChild(box);
}

window.YXJ_GAMES = { pinyinGame, englishGame, gooseGame, findDiffGame, numberOrderGame };

})();