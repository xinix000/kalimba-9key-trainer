/* ---------------------------------------------------------------------------
 * Kalimba 9-key trainer
 * โน้ตร่วงลงมาตรงคอลัมน์ของลิ้นจริง แล้วดีดคาลิมบาตาม
 * ------------------------------------------------------------------------ */
(() => {
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const TINES = KALIMBA.tines;
const N = TINES.length;
const LEAD_SECONDS = 3.2;      // โน้ตร่วงจากบนจอถึงลิ้นใช้เวลากี่วินาที
const SPEEDS = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5];

/* ---- สีตามช่วงเสียง ------------------------------------------------------ */
function registerOf(midi) {
  if (midi < 60) return 'low';        // 5· 6· 7·
  if (midi <= 65) return 'mid';       // 1 2 3 4
  return 'high';                      // 5 6
}
const COLORS = {
  low:  { fill: '#5cc8b8', dark: '#2f7a70', glow: '#5cc8b8' },
  mid:  { fill: '#f2b45c', dark: '#9a6a26', glow: '#f2b45c' },
  high: { fill: '#e88a8a', dark: '#8f4646', glow: '#e88a8a' },
};
const colorOf = (midi) => COLORS[registerOf(midi)];

/* ---- state --------------------------------------------------------------- */
let SONG_LIST = allSongs();

const S = {
  song: SONG_LIST[0],
  mode: 'listen',
  speedIdx: 5,
  playing: false,
  loop: true,
  metro: false,
  startCtx: 0,
  startBeat: 0,
  pausedBeat: 0,
  schedIdx: 0,
  fireIdx: 0,
  metroBeat: 0,
  stepIdx: 0,
  stepBeat: 0,
  stepTarget: 0,
};

const speed = () => SPEEDS[S.speedIdx];
const secPerBeat = () => 60 / (S.song.bpm * speed());
const bpb = () => S.song.beatsPerBar;
const beat0 = () => S.song.startBeat - bpb();          // เผื่อ 1 ห้องนับเข้า
const beatEnd = () => S.song.endBeat + 1;

function beatNow() {
  if (S.mode === 'step') return S.stepBeat;
  if (!S.playing) return S.pausedBeat;
  return S.startBeat + (audio.now() - S.startCtx) / secPerBeat();
}
const ctxTimeOf = (beat) => S.startCtx + (beat - S.startBeat) * secPerBeat();
/** ห้องที่เท่าไหร่ (ห้องแรก = 0, ห้องยกก่อนเพลง = -1) */
const barIndex = (beat) => Math.floor(beat / bpb());

/* ---- ลิ้นบนจอ ------------------------------------------------------------ */
const tinesEl = $('#tines');
const tineEls = [];

function buildTines() {
  const sorted = TINES.map(t => t.midi).slice().sort((a, b) => a - b);
  tinesEl.innerHTML = '';
  TINES.forEach((t, i) => {
    const rank = sorted.indexOf(t.midi);          // 0 = ต่ำสุด = ลิ้นยาวสุด
    const lenPct = 100 - rank * 6.5;
    const c = colorOf(t.midi);

    const el = document.createElement('div');
    el.className = 'tine';
    el.style.setProperty('--glow', c.glow);
    el.innerHTML =
      `<div class="bar" style="height:${lenPct}%"></div>` +
      `<div class="num" style="top:calc(${lenPct}% - 22px)">${t.label}</div>`;

    const hit = (ev) => { ev.preventDefault(); tapTine(i); };
    el.addEventListener('pointerdown', hit);
    tinesEl.appendChild(el);
    tineEls.push(el);
  });
}

function flashTine(i) {
  const el = tineEls[i];
  el.classList.remove('hit');
  void el.offsetWidth;
  el.classList.add('hit');
}

function tapTine(i) {
  audio.pluck(TINES[i].midi);
  flashTine(i);
  if (S.mode === 'step') {
    const notes = S.song.notes;
    if (S.stepIdx < notes.length && notes[S.stepIdx].tine === i) advanceStep();
  }
}

function advanceStep() {
  const notes = S.song.notes;
  S.stepIdx++;
  if (S.stepIdx >= notes.length) {
    if (S.loop) { S.stepIdx = 0; S.stepBeat = beat0(); }
    else { setPlaying(false); }
  }
  S.stepTarget = S.stepIdx < notes.length ? notes[S.stepIdx].beat : beatEnd();
  markNextTine();
}

function markNextTine() {
  tineEls.forEach(el => el.classList.remove('next'));
  if (S.mode !== 'step') return;
  const n = S.song.notes[S.stepIdx];
  if (n) tineEls[n.tine].classList.add('next');
}

/* ---- canvas -------------------------------------------------------------- */
const canvas = $('#fall');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const r = canvas.getBoundingClientRect();
  W = r.width; H = r.height;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function draw(beat) {
  const laneW = W / N;
  const pxPerBeat = H * secPerBeat() / LEAD_SECONDS;
  const yOf = (b) => H - (b - beat) * pxPerBeat;

  ctx.clearRect(0, 0, W, H);

  // ช่องของแต่ละลิ้น
  for (let i = 0; i < N; i++) {
    const reg = registerOf(TINES[i].midi);
    ctx.fillStyle = reg === 'low' ? 'rgba(92,200,184,.045)'
                  : reg === 'high' ? 'rgba(232,138,138,.045)'
                  : 'rgba(242,180,92,.03)';
    ctx.fillRect(i * laneW, 0, laneW, H);
    if (i > 0) {
      ctx.fillStyle = 'rgba(255,255,255,.045)';
      ctx.fillRect(i * laneW - 0.5, 0, 1, H);
    }
  }

  // เส้นจังหวะ / เส้นกั้นห้อง (ห้องแรกเริ่มที่ beat 0 เสมอ ห้องยกจึงอยู่ก่อนหน้านั้น)
  const topBeat = beat + H / pxPerBeat;
  for (let b = Math.ceil(beat); b <= topBeat; b++) {
    const y = Math.round(yOf(b)) + 0.5;
    const isBar = barIndex(b) * bpb() === b;
    ctx.fillStyle = isBar ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.055)';
    ctx.fillRect(0, y, W, isBar ? 1.5 : 1);
  }

  // โน้ต
  const notes = S.song.notes;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const n of notes) {
    const yBottom = yOf(n.beat);
    const h = Math.max(n.dur * pxPerBeat - 5, 16);
    const yTop = yBottom - h;
    if (yTop > H || yBottom < -20) continue;

    const c = colorOf(n.midi);
    const x = n.tine * laneW + laneW * 0.14;
    const w = laneW * 0.72;
    const passed = beat > n.beat + 0.05;

    ctx.globalAlpha = passed ? 0.28 : 1;
    const g = ctx.createLinearGradient(x, yTop, x, yBottom);
    g.addColorStop(0, c.dark);
    g.addColorStop(1, c.fill);
    ctx.fillStyle = g;
    roundRect(x, yTop, w, h, 7);
    ctx.fill();

    // ขอบล่างเรืองแสง = จุดที่ต้องดีด
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    roundRect(x, yBottom - 3, w, 3, 1.5);
    ctx.fill();

    if (h > 20 && w > 20) {
      ctx.globalAlpha = passed ? 0.3 : 0.95;
      ctx.fillStyle = '#1b120c';
      ctx.font = `700 ${Math.min(14, laneW * 0.42)}px ui-monospace, monospace`;
      ctx.fillText(TINES[n.tine].label, x + w / 2, yBottom - Math.min(h / 2, 13));
    }
    ctx.globalAlpha = 1;
  }

  // เส้นดีด
  const gl = ctx.createLinearGradient(0, H - 26, 0, H);
  gl.addColorStop(0, 'rgba(242,180,92,0)');
  gl.addColorStop(1, 'rgba(242,180,92,.20)');
  ctx.fillStyle = gl;
  ctx.fillRect(0, H - 26, W, 26);
  ctx.fillStyle = 'rgba(242,180,92,.85)';
  ctx.fillRect(0, H - 2, W, 2);
}

/* ---- ตัวจัดคิวเสียง ------------------------------------------------------ */
function scheduleAhead() {
  if (!S.playing || S.mode === 'step') return;
  const spb = secPerBeat();
  const ahead = beatNow() + 0.18 / spb;
  const notes = S.song.notes;

  while (S.schedIdx < notes.length && notes[S.schedIdx].beat < ahead) {
    const n = notes[S.schedIdx];
    if (S.mode === 'listen') audio.pluck(n.midi, Math.max(ctxTimeOf(n.beat), audio.now()));
    S.schedIdx++;
  }

  while (S.metroBeat < ahead) {
    if (S.metro) {
      audio.click(Math.max(ctxTimeOf(S.metroBeat), audio.now()),
                  barIndex(S.metroBeat) * bpb() === S.metroBeat);
    }
    S.metroBeat++;
  }
}
setInterval(scheduleAhead, 25);

/* ---- loop หลัก ----------------------------------------------------------- */
let lastTs = 0;
function frame(ts) {
  const dt = Math.min((ts - lastTs) / 1000 || 0, 0.05);
  lastTs = ts;

  if (S.mode === 'step' && S.playing) {
    // ค่อยๆ เลื่อนเข้าหาโน้ตตัวถัดไป
    S.stepBeat += (S.stepTarget - S.stepBeat) * Math.min(1, dt * 9);
  }

  const beat = beatNow();

  if (S.mode !== 'step' && S.playing) {
    const notes = S.song.notes;
    while (S.fireIdx < notes.length && notes[S.fireIdx].beat <= beat) {
      flashTine(notes[S.fireIdx].tine);
      S.fireIdx++;
    }
    if (beat >= beatEnd()) {
      if (S.loop) restart(true);
      else { setPlaying(false); S.pausedBeat = beat0(); }
    }
  }

  draw(beat);
  updateProgress(beat);
  requestAnimationFrame(frame);
}

/* ---- transport ----------------------------------------------------------- */
function restart(keepPlaying) {
  S.pausedBeat = beat0();
  S.stepIdx = 0;
  S.stepBeat = beat0();
  S.stepTarget = S.song.notes.length ? S.song.notes[0].beat : beat0();
  if (keepPlaying) startClock(beat0());
  else { S.fireIdx = 0; S.schedIdx = 0; }
  markNextTine();
}

function startClock(fromBeat) {
  const notes = S.song.notes;
  S.startBeat = fromBeat;
  S.startCtx = audio.now() + 0.08;
  S.schedIdx = notes.findIndex(n => n.beat >= fromBeat - 0.001);
  if (S.schedIdx < 0) S.schedIdx = notes.length;
  S.fireIdx = S.schedIdx;
  S.metroBeat = Math.ceil(fromBeat - 0.001);
}

function setPlaying(on) {
  if (on === S.playing) return;
  if (on) {
    audio.init();
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    if (S.mode === 'step') {
      if (S.stepIdx >= S.song.notes.length) { S.stepIdx = 0; S.stepBeat = beat0(); }
      S.stepTarget = S.song.notes[S.stepIdx] ? S.song.notes[S.stepIdx].beat : beat0();
    } else {
      let from = S.pausedBeat;
      if (from >= beatEnd() - 0.01) from = beat0();
      startClock(from);
    }
  } else {
    if (S.mode !== 'step') S.pausedBeat = beatNow();
  }
  S.playing = on;
  $('#btnPlay').textContent = on ? '❚❚' : '▶';
  markNextTine();
}

/* ---- UI ------------------------------------------------------------------ */
const MODE_HINTS = {
  listen: 'เว็บเล่นให้ฟัง ลิ้นสว่างตามโน้ต ดูให้จำตำแหน่งก่อน แล้วค่อยลดความเร็วลงแล้วเล่นตาม',
  play:   'เว็บเงียบแล้ว ถือคาลิมบาจริงไว้ ดีดตามโน้ตที่ร่วงลงถึงเส้นล่าง เปิดเมโทรนอมช่วยจับจังหวะได้',
  step:   'ไม่มีจำกัดเวลา แตะลิ้นที่กะพริบบนจอให้ถูก แล้วโน้ตถัดไปจะเลื่อนมาเอง',
};

function buildSongSelect(selectId) {
  const sel = $('#songSelect');
  sel.innerHTML = SONG_LIST
    .map((s, i) => `<option value="${i}">${s.custom ? '✎ ' : ''}${s.title}${s.subtitle ? ' · ' + s.subtitle : ''}</option>`)
    .join('');
  const idx = Math.max(0, SONG_LIST.findIndex(s => s.id === (selectId ?? S.song.id)));
  sel.value = String(idx);
  return SONG_LIST[idx];
}

function loadSong(song) {
  const wasPlaying = S.playing;
  setPlaying(false);
  S.song = song;
  restart(false);
  buildTab();
  $('#songTitleNow').textContent = `${song.title} · ${song.bpm} BPM · ${song.beatsPerBar}/4`;
  if (wasPlaying) setPlaying(true);
}

/* โน้ตตัวเลขด้านล่าง */
let tabSpans = [];
function buildTab() {
  const flow = $('#tabFlow');
  flow.innerHTML = '';
  tabSpans = [];
  let curBar = null;
  S.song.notes.forEach((n) => {
    const bar = barIndex(n.beat);
    if (curBar !== null && bar !== curBar) {
      const sep = document.createElement('span');
      sep.className = 'bar';
      sep.textContent = '|';
      flow.appendChild(sep);
    }
    curBar = bar;
    const el = document.createElement('span');
    el.textContent = TINES[n.tine].label;
    flow.appendChild(el);
    tabSpans.push(el);
  });
}

let lastTabIdx = -1;
function updateProgress(beat) {
  const p = (beat - beat0()) / (beatEnd() - beat0());
  $('#seekFill').style.transform = `scaleX(${Math.max(0, Math.min(1, p))})`;

  const barNo = barIndex(beat) + 1;
  $('#barNow').textContent = barNo < 1 ? 'นับเข้า…' : `ห้องที่ ${barNo}`;

  const idx = S.mode === 'step' ? S.stepIdx : S.fireIdx - 1;
  if (idx !== lastTabIdx) {
    tabSpans.forEach((el, i) => {
      el.classList.toggle('cur', i === idx);
      el.classList.toggle('done', i < idx);
    });
    // แนวตั้งแถบโน้ตเลื่อนแนวนอน แนวนอนมันตัดขึ้นบรรทัดใหม่ เลยปล่อยให้เบราว์เซอร์
    // เลือกแกนที่ต้องเลื่อนเอง
    const cur = tabSpans[idx];
    if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    lastTabIdx = idx;
  }
}

function setMode(mode) {
  const wasPlaying = S.playing;
  setPlaying(false);
  S.mode = mode;
  $$('#modeSeg button').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  $('#modeHint').textContent = MODE_HINTS[mode];
  restart(false);
  if (wasPlaying || mode === 'step') setPlaying(true);
}

/* ---- ตัวแก้ไขเพลง: พิมพ์โน้ตจากหนังสือลงไปได้เลย ------------------------- */
let editingId = null;      // null = เพลงใหม่

function openEditor(song) {
  const custom = song && song.custom;
  editingId = custom ? song.id : null;
  $('#edTitle').textContent = custom ? 'แก้เพลง' : 'เพิ่มเพลงจากหนังสือ';
  $('#edName').value = custom ? song.title : '';
  $('#edBpm').value  = custom ? song.bpm : 90;
  $('#edBar').value  = custom ? song.beatsPerBar : 4;
  $('#edPick').value = custom ? song.startBeat : 0;
  $('#edSeq').value  = custom ? song.seq.trim().replace(/\n\s+/g, '\n') : '';
  $('#edDelete').hidden = !custom;
  validateEditor();
  $('#editor').hidden = false;
  if (!custom) $('#edName').focus();
}

/** อ่านค่าจากฟอร์มเป็นก้อนเพลง (ยังไม่ผ่าน parse) */
function editorDraft() {
  return {
    id: editingId || 'my-' + (SONG_LIST.length + 1) + '-' + $('#edName').value.trim().slice(0, 12),
    title: $('#edName').value.trim() || 'เพลงไม่มีชื่อ',
    subtitle: 'พิมพ์เอง',
    bpm: Math.min(240, Math.max(30, +$('#edBpm').value || 90)),
    beatsPerBar: Math.min(12, Math.max(1, +$('#edBar').value || 4)),
    startBeat: Math.min(0, +$('#edPick').value || 0),
    seq: $('#edSeq').value,
  };
}

function validateEditor() {
  const draft = editorDraft();
  const box = $('#edStatus');
  const { notes, problems } = parseSeq(draft.seq, draft.startBeat);

  if (!draft.seq.trim()) {
    box.className = 'ed-status';
    box.textContent = '';
    return { draft, notes, problems, ok: false };
  }

  const bars = notes.length
    ? Math.ceil((notes[notes.length - 1].beat + notes[notes.length - 1].dur) / draft.beatsPerBar)
    : 0;

  if (problems.length) {
    box.className = 'ed-status warn';
    box.textContent = `เล่นไม่ได้ ${problems.length} จุด: ` + [...new Set(problems)].join(' · ');
  } else {
    box.className = 'ed-status ok';
    box.textContent = `อ่านได้ ${notes.length} ตัว ${bars} ห้อง อยู่ในช่วง 9 คีย์ทั้งหมด`;
  }
  return { draft, notes, problems, ok: notes.length > 0 };
}

function saveEditor() {
  const { draft, ok } = validateEditor();
  if (!ok) { $('#edStatus').className = 'ed-status warn'; $('#edStatus').textContent = 'ยังไม่มีโน้ตที่เล่นได้'; return; }

  const list = loadUserSongs();
  const at = list.findIndex(s => s.id === editingId);
  if (at >= 0) list[at] = draft; else list.push(draft);

  if (!saveUserSongs(list)) {
    $('#edStatus').className = 'ed-status warn';
    $('#edStatus').textContent = 'บันทึกลงเครื่องไม่ได้ (เบราว์เซอร์อาจปิด storage อยู่)';
    return;
  }
  SONG_LIST = allSongs();
  $('#editor').hidden = true;
  loadSong(buildSongSelect(draft.id));
}

function deleteEditingSong() {
  saveUserSongs(loadUserSongs().filter(s => s.id !== editingId));
  SONG_LIST = allSongs();
  $('#editor').hidden = true;
  loadSong(buildSongSelect(SONG_LIST[0].id));
}

function bindEditor() {
  $('#btnEdit').addEventListener('click', () => { setPlaying(false); openEditor(S.song); });
  $('#edClose').addEventListener('click', () => { $('#editor').hidden = true; });
  $('#editor').addEventListener('click', (e) => {
    if (e.target.id === 'editor') $('#editor').hidden = true;
  });
  ['#edSeq', '#edBar', '#edPick', '#edBpm'].forEach(sel =>
    $(sel).addEventListener('input', validateEditor));
  $('#edSave').addEventListener('click', saveEditor);
  $('#edDelete').addEventListener('click', deleteEditingSong);

  // ลองฟังโดยไม่ต้องบันทึก
  $('#edPlay').addEventListener('click', () => {
    const { draft, notes, ok } = validateEditor();
    if (!ok) return;
    const spb = 60 / draft.bpm;
    const t0 = audio.now() + 0.1;
    notes.forEach(n => audio.pluck(n.midi, t0 + (n.beat - draft.startBeat) * spb));
  });
}

function bindUI() {
  $('#btnPlay').addEventListener('click', () => setPlaying(!S.playing));
  $('#songSelect').addEventListener('change', (e) => loadSong(SONG_LIST[+e.currentTarget.value]));

  $$('#modeSeg button').forEach(b =>
    b.addEventListener('click', () => setMode(b.dataset.mode)));

  $$('#octSeg button').forEach(b =>
    b.addEventListener('click', () => {
      audio.octave = +b.dataset.oct;
      $$('#octSeg button').forEach(x => x.classList.toggle('on', x === b));
      audio.pluck(TINES[4].midi);
    }));

  const showSpeed = () => { $('#spVal').textContent = speed().toFixed(2).replace(/0$/, '') + '×'; };
  const changeSpeed = (d) => {
    const beat = beatNow();
    S.speedIdx = Math.max(0, Math.min(SPEEDS.length - 1, S.speedIdx + d));
    showSpeed();
    if (S.playing && S.mode !== 'step') startClock(beat);
  };
  $('#spDown').addEventListener('click', () => changeSpeed(-1));
  $('#spUp').addEventListener('click', () => changeSpeed(1));
  $('#spReset').addEventListener('click', () => changeSpeed(5 - S.speedIdx));
  showSpeed();

  $('#btnMetro').addEventListener('click', (e) => {
    S.metro = !S.metro;
    e.currentTarget.classList.toggle('on', S.metro);
  });
  $('#btnLoop').addEventListener('click', (e) => {
    S.loop = !S.loop;
    e.currentTarget.classList.toggle('on', S.loop);
  });
  $('#btnLoop').classList.toggle('on', S.loop);

  $('#btnHelp').addEventListener('click', () => { $('#help').hidden = false; });
  $('#helpClose').addEventListener('click', () => { $('#help').hidden = true; });
  $('#help').addEventListener('click', (e) => {
    if (e.target.id === 'help') $('#help').hidden = true;
  });

  // คีย์บอร์ด (ตอนเปิดบนคอม): 1-9 = ลิ้นซ้ายไปขวา, space = เล่น/หยุด
  window.addEventListener('keydown', (e) => {
    // อย่าไปแย่งคีย์ตอนกำลังพิมพ์โน้ตในตัวแก้ไขเพลง
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!S.playing); return; }
    const k = +e.key;
    if (k >= 1 && k <= N) tapTine(k - 1);
  });

  window.addEventListener('resize', resizeCanvas);
  // บางเบราว์เซอร์บนมือถือรายงานขนาดใหม่ช้ากว่าอีเวนต์หมุนจอ เลยวัดซ้ำอีกรอบ
  window.addEventListener('orientationchange', () => {
    resizeCanvas();
    setTimeout(resizeCanvas, 300);
  });
  if (window.ResizeObserver) new ResizeObserver(resizeCanvas).observe(canvas);
}

function buildHelpMap() {
  $('#helpMap').innerHTML = TINES.map((t, i) =>
    `<div class="${i === 4 ? 'mid' : ''}"><b>${t.label}</b><i>${t.note}</i></div>`).join('');

  // ถามเซิร์ฟเวอร์ว่ามือถือควรเข้า URL ไหน เฉพาะตอนเปิดจากคอมที่รัน server.py อยู่
  // (เปิดจากมือถือผ่าน IP หรือเปิดจากเว็บที่ deploy ไว้ ไม่มี endpoint นี้)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    fetch('/api/info').then(r => r.json()).then(info => {
      if (!info.urls || !info.urls.length) return;
      $('#lanUrls').textContent = info.urls.join('\n');
      $('#lanHead').hidden = false;
      $('#lanUrls').hidden = false;
    }).catch(() => {});
  }
}

/* ---- start --------------------------------------------------------------- */
$('#gateBtn').addEventListener('click', async () => {
  await audio.unlock();
  $('#gate').remove();
  $('#app').hidden = false;
  resizeCanvas();
  loadSong(SONG_LIST[0]);
  requestAnimationFrame(frame);
  // กันจอดับระหว่างซ้อม ทำงานเฉพาะบน https กับ localhost
  navigator.wakeLock?.request('screen').catch(() => {});
});

buildTines();
buildSongSelect();
buildHelpMap();
bindUI();
bindEditor();
$('#modeHint').textContent = MODE_HINTS.listen;

})();
