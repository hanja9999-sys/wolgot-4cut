// ── 행사 때 바꾸는 곳 ─────────────────────────────
const CONFIG = {
  title: '월곶중 네 컷',           // 문구 칸을 비워 두면 들어가는 글자
  date: '',                        // 비우면 오늘 날짜
  uploadUrl: 'https://script.google.com/macros/s/AKfycbwNdYctywTB3NdRVieg4nT9f08fWFm7xWJphVVSegjTjBPxMuqGWvoG9vQmyTbNcDU-/exec',   // Code.gs 배포 주소
  uploadCode: 'wolgot-4cut',       // Code.gs의 CODE와 같게
  countdown: 5,                    // 컷마다 초
  idleResetSec: 180                // 완성 화면에서 손대지 않으면 처음으로(다음 학생에게 사진이 안 보이게)
};

// ── 인쇄 규격: 세로 4컷 한 줄을 두 번 찍어 가운데를 자르면 친구와 한 장씩 ──
// 카드 54×86mm(PCC-CP400 카세트). 엽서 {w:100, h:148}로 바꾸면 지금 틀은 좌우가 조금 잘린다
const PAPER = {w: 54, h: 86};
const px = mm => Math.round(mm * 600 / 25.4);   // 300dpi의 2배로 만들어 내려받은 사진도 선명하게
const W = px(PAPER.w), H = px(PAPER.h), FONT = '"Poor Story",system-ui';

// ── 틀: 좌표는 틀 그림의 픽셀 그대로 ──
// slots = 왼쪽 줄 4칸(테두리 안쪽 흰 부분), dx = 오른쪽 줄까지 거리
// msg·date = 글자 자리(x, y는 가운데. align:'left'면 x가 왼쪽 끝), w = 최대 폭. 두 줄에 똑같이 찍힌다
// 사진관 네 컷 기본형(make_frames.py로 그림): 칸은 왼쪽 줄 기준, 오른쪽 줄은 +638
const STRIP = {
  slots: [360, 712, 1064, 1416].map(y => [44, y, 550, 330]), r: 22, dx: 638,
  msg: {x: 319, y: 200, w: 420, size: 60}, date: {x: 319, y: 1890, w: 420, size: 52},
};
const FRAMES = [
  {id: 'ai', name: '월곶중 AI', art: 'frames/ai_wolgot.png', ink: '#1d3f8f',
    slots: [466, 746, 1024, 1302].map(y => [105, y, 488, 250]), r: 12, dx: 595,
    date: {x: 106, y: 1634, w: 325, size: 41, align: 'left'},
    msg: {x: 106, y: 1687, w: 325, size: 38, align: 'left'}, msgWhere: '아래', msgDefault: '월곶중학교와 함께해요!'},
  {id: 'black', name: '블랙 클래식', art: 'frames/black.jpg', ink: '#ffffff', ...STRIP},
  {id: 'checker', name: '레트로 체커', art: 'frames/checker.jpg', ink: '#3b2477', ...STRIP},
  {id: 'heart', name: '하트 반짝', art: 'frames/heart.jpg', ink: '#c2185b', ...STRIP},
  // ChatGPT 콜라주(2026-11-11)에서 잘라 비율 그대로 넣은 틀. 문구는 위 여백, 날짜는 아래 여백
  {id: 'comic', name: '베스트 프렌즈', art: 'frames/comic.jpg', ink: '#222222',
    slots: [564, 810, 1054, 1295].map(y => [146, y, 406, 216]), r: 14, dx: 589,
    msg: {x: 344, y: 180, w: 528, size: 64}, date: {x: 344, y: 1851, w: 528, size: 54}},
  {id: 'happy', name: '해피 데이', art: 'frames/happy.jpg', ink: '#c2386e',
    slots: [580, 816, 1047, 1281].map(y => [168, y, 373, 209]), r: 14, dx: 560,
    msg: {x: 344, y: 190, w: 528, size: 64}, date: {x: 344, y: 1841, w: 528, size: 54}},
  {id: 'memories', name: '굿 메모리즈', art: 'frames/memories.jpg', ink: '#5e4628',
    slots: [565, 809, 1049, 1287].map(y => [152, y, 387, 215]), r: 14, dx: 587,
    msg: {x: 344, y: 180, w: 528, size: 64}, date: {x: 344, y: 1851, w: 528, size: 54}},
  {id: 'together', name: '베러 투게더', art: 'frames/together.jpg', ink: '#23356f',
    slots: [588, 809, 1025, 1239].map(y => [171, y, 389, 192]), r: 14, dx: 584,
    msg: {x: 344, y: 217, w: 528, size: 64}, date: {x: 344, y: 1815, w: 528, size: 54}},
  {id: 'vibes', name: '굿 바이브', art: 'frames/vibes.jpg', ink: '#3b2477',
    slots: [591, 809, 1025, 1238].map(y => [176, y, 365, 192]), r: 14, dx: 589,
    msg: {x: 344, y: 218, w: 528, size: 64}, date: {x: 344, y: 1813, w: 528, size: 54}},
];

const today = (() => {
  if (CONFIG.date) return CONFIG.date;
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}.(${'일월화수목금토'[d.getDay()]})`;
})();

function cover(c, img, x, y, w, h) {   // 칸 비율에 맞춰 가운데를 잘라 채운다
  const k = Math.max(w / img.width, h / img.height), sw = w / k, sh = h / k;
  c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}
function write(c, s, t, dx, ink) {   // 길면 칸 폭에 맞을 때까지 줄인다
  let size = t.size;
  do c.font = `400 ${size}px ${FONT}`; while (c.measureText(s).width > t.w && --size > 8);
  c.fillStyle = ink; c.textAlign = t.align || 'center'; c.textBaseline = 'middle';
  c.fillText(s, t.x + dx, t.y);
}

function drawSheet(c, f, shots, msg = '') {
  const k = Math.max(W / f.img.width, H / f.img.height);
  c.save();
  c.translate((W - f.img.width * k) / 2, (H - f.img.height * k) / 2); c.scale(k, k);
  c.imageSmoothingQuality = 'high';
  c.drawImage(f.img, 0, 0);
  for (const dx of [0, f.dx]) {   // 같은 줄을 왼쪽·오른쪽에 두 번
    f.slots.forEach(([x, y, w, h], n) => {
      c.save(); c.beginPath(); c.roundRect(x + dx, y, w, h, f.r); c.clip();
      cover(c, shots[n], x + dx, y, w, h); c.restore();
    });
    write(c, msg.trim() || f.msgDefault || CONFIG.title, f.msg, dx, f.ink);
    write(c, today, f.date, dx, f.ink);
  }
  c.restore();
}

function canvas(w, h) { return Object.assign(document.createElement('canvas'), {width: w, height: h}); }
function renderSheet(f, shots, msg) { const cv = canvas(W, H); drawSheet(cv.getContext('2d'), f, shots, msg); return cv; }
function thumb(f, shots) { const k = 508 / H, cv = canvas(Math.round(W * k), 508), c = cv.getContext('2d'); c.scale(k, k); drawSheet(c, f, shots); return cv; }

// 틀 고르기 화면에 쓰는 자리표시 사진(카메라와 같은 16:9)
const placeholders = ['#ffdddd', '#ffe8c4', '#ffced8', '#fff4de'].map(col => {
  const cv = canvas(1280, 720), c = cv.getContext('2d');
  c.fillStyle = col; c.fillRect(0, 0, 1280, 720); c.fillStyle = 'rgba(74,42,51,.22)';
  for (const x of [520, 760]) {
    c.beginPath(); c.arc(x, 300, 100, 0, 7); c.fill();
    c.beginPath(); c.ellipse(x, 720, 170, 230, 0, 0, 7); c.fill();
  }
  return cv;
});

// ── 화면 흐름 ───────────────────────────────────
const $ = id => document.getElementById(id);
let frame, shots = [], stream = null, sheetUrl = '', uploaded = {}, idle = 0, audio = null;

function show(id) { for (const s of ['choose', 'shoot', 'done']) $(s).hidden = s !== id; }

function frameButton(f, cls, label) {
  const b = document.createElement('button');
  b.className = cls; b.dataset.id = f.id; b.setAttribute('aria-label', f.name + ' 틀');
  b.append(thumb(f, shots.length ? shots : placeholders));
  if (label) { const s = document.createElement('span'); s.textContent = f.name; b.append(s); }
  b.onclick = () => pick(f);
  return b;
}
function pick(f) {
  frame = f;
  document.querySelectorAll('[data-id]').forEach(b => b.classList.toggle('on', b.dataset.id === f.id));
  $('msgWhere').textContent = `${f.msgWhere || '위'}쪽 문구`;
  $('msgIn').placeholder = f.msgDefault || CONFIG.title;
  if (!$('done').hidden) { buildSheet(); $('msg').textContent = ''; }
}
function buildChoose() {
  const line = $('line');
  line.querySelectorAll('.strip').forEach(b => b.remove());
  FRAMES.forEach(f => line.append(frameButton(f, 'strip', true)));
  $('rope').style.width = line.scrollWidth + 'px';
  pick(frame);
}

function beep(freq, ms) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = freq; g.gain.value = .12; o.connect(g).connect(audio.destination);
    o.start(); o.stop(audio.currentTime + ms / 1000);
  } catch (e) { /* 소리가 없어도 촬영은 된다 */ }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function grab() {   // 화면 전체를 좌우 반전해 저장. 틀마다 칸 비율이 달라 자르기는 그릴 때 한다
  const v = $('cam'), cv = canvas(v.videoWidth, v.videoHeight), c = cv.getContext('2d');
  c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(v, 0, 0);
  return cv;
}

async function shootAll() {
  if ($('go').disabled) return;   // 연타로 촬영이 겹치지 않게
  clearTimeout(idle);
  $('go').disabled = true;
  try {
    stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user', width: {ideal: 1920}, height: {ideal: 1080}}, audio: false});
  } catch (e) {
    $('go').disabled = false;
    alert('카메라를 켤 수 없습니다. 주소창 왼쪽 아이콘에서 카메라를 허용한 뒤 다시 눌러 주세요.');
    return;
  }
  shots = []; uploaded = {}; $('msgIn').value = '';
  const [, , sw, sh] = frame.slots[0];   // 미리보기를 고른 틀의 칸 비율로
  document.documentElement.style.setProperty('--cell', sw / sh);
  $('taken').innerHTML = '<div>1</div><div>2</div><div>3</div><div>4</div>';
  show('shoot');
  const v = $('cam'); v.srcObject = stream; await v.play();
  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}
  for (let n = 0; n < 4; n++) {
    $('hint').textContent = `${n + 1}번째 컷. 포즈!`;
    for (let s = CONFIG.countdown; s > 0; s--) {
      $('count').textContent = s; beep(660, 90); await wait(1000);
      if (!stream) return;   // 촬영 중에 화면을 떠나 카메라가 꺼졌다
    }
    $('count').textContent = ''; beep(1320, 140);
    const f = $('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    const cut = grab(); shots.push(cut);
    const box = $('taken').children[n], mini = canvas(300, Math.round(300 / (sw / sh)));
    cover(mini.getContext('2d'), cut, 0, 0, mini.width, mini.height);
    box.textContent = ''; box.append(mini);
    await wait(900);
    if (!stream) return;
  }
  stopCamera();
  $('hint').textContent = ''; $('go').disabled = false;
  const chips = $('chips'); chips.innerHTML = '';
  FRAMES.forEach(f => chips.append(frameButton(f, '', false)));
  show('done'); pick(frame); bumpIdle();
}

function stopCamera() {   // 카메라는 4컷을 찍는 동안에만 켠다
  if (stream) stream.getTracks().forEach(t => t.stop());
  stream = null; $('cam').srcObject = null;
}
document.addEventListener('visibilitychange', () => {   // 다른 앱·탭으로 가거나 화면이 꺼지면 바로 끄고 처음으로
  if (document.hidden && stream) { stopCamera(); $('count').textContent = ''; $('hint').textContent = ''; $('go').disabled = false; reset(); }
});

function buildSheet() {
  sheetUrl = renderSheet(frame, shots, $('msgIn').value).toDataURL('image/jpeg', .92);
  $('sheet').src = sheetUrl;
  $('print').src = sheetUrl;
}

function reset() {
  clearTimeout(idle); shots = []; uploaded = {}; sheetUrl = ''; $('msgIn').value = '';
  $('sheet').removeAttribute('src'); $('print').removeAttribute('src'); $('chips').innerHTML = ''; $('msg').textContent = '';
  if ($('qrBox').open) $('qrBox').close();
  show('choose'); buildChoose();
}
function bumpIdle() {
  clearTimeout(idle);
  if (!$('done').hidden) idle = setTimeout(reset, CONFIG.idleResetSec * 1000);
}

async function showQr() {
  if (!CONFIG.uploadUrl) { $('msg').textContent = 'QR 서버가 아직 연결되지 않았습니다. 선생님께 알려 주세요.'; return; }
  const btn = $('qrBtn'); btn.disabled = true; $('msg').textContent = '사진을 올리는 중입니다.';
  const key = frame.id + '|' + $('msgIn').value.trim();   // 틀이나 문구가 바뀌면 다시 올린다
  try {
    if (!uploaded[key]) {
      // Content-Type을 지정하지 않아야 Apps Script가 CORS로 막지 않는다
      const r = await fetch(CONFIG.uploadUrl, {method: 'POST', body: JSON.stringify({code: CONFIG.uploadCode, image: sheetUrl.split(',')[1]})});
      const d = await r.json();
      if (!d.url) throw new Error(d.error || 'no url');   // busy = 1분 업로드 한도 초과
      uploaded[key] = d.url;
    }
    const q = qrcode(0, 'M'); q.addData(uploaded[key]); q.make();
    $('qr').innerHTML = q.createSvgTag({cellSize: 6, margin: 2, scalable: true});
    $('msg').textContent = ''; $('qrBox').showModal();
  } catch (e) {
    $('msg').textContent = e.message === 'busy' ? '사진이 한꺼번에 몰렸습니다. 1분 뒤 다시 눌러 주세요.'
      : 'QR을 만들지 못했습니다. 인터넷 연결을 확인한 뒤 다시 눌러 주세요.';
  }
  btn.disabled = false;
}

$('go').onclick = shootAll;
$('again').onclick = shootAll;
$('home').onclick = reset;
$('qrBtn').onclick = showQr;
$('qrClose').onclick = () => $('qrBox').close();
$('msgIn').oninput = () => { buildSheet(); $('msg').textContent = ''; };
$('printBtn').onclick = async () => { await $('print').decode(); window.print(); };
$('saveBtn').onclick = () => Object.assign(document.createElement('a'), {href: sheetUrl, download: `네컷_${Date.now()}.jpg`}).click();
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, bumpIdle);

// ── 시작: 글꼴과 틀 그림을 먼저 불러야 캔버스에 제대로 나온다 ──
(async () => {
  document.documentElement.style.setProperty('--paper', W / H);
  document.head.insertAdjacentHTML('beforeend',   // @page에는 CSS 변수를 못 써서 용지 크기를 여기서 넣는다
    `<style>@page{size:${PAPER.w}mm ${PAPER.h}mm;margin:0}@media print{#print{width:${PAPER.w}mm;height:${PAPER.h - .2}mm}}</style>`);
  await Promise.race([document.fonts.load(`400 40px "Poor Story"`, CONFIG.title + today + FRAMES.map(f => f.msgDefault || '').join('')).catch(() => {}), wait(4000)]);
  // decode()는 화면이 가려지면 끝나지 않을 때가 있어 onload로 기다린다
  await Promise.all(FRAMES.map(f => new Promise(ok => {
    f.img = new Image(); f.img.onload = ok; f.img.onerror = () => { f.img = null; ok(); }; f.img.src = f.art;
  })));
  FRAMES.splice(0, FRAMES.length, ...FRAMES.filter(f => f.img));   // 그림 하나가 없어도 나머지로 부스는 돌아간다
  frame = FRAMES[0];
  buildChoose();
})();
