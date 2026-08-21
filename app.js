/* بيت الألغاز: ملف واحد منظم لتسهيل إضافة لعبة جديدة إلى سجل games أدناه. */
const STORAGE_KEY = 'puzzleParlor.v1';
const XP_PER_LEVEL = 120;
function todayKey() { 
  const d = new Date(); 
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); 
}

const games = {
  memory: { id: 'memory', title: 'بطاقات الذاكرة', icon: '🃏', skill: 'الذاكرة', color: '#dff4f8', description: 'اكشف البطاقات وطابق الرموز قبل أن تنسى مكانها.', metric: 'الأزواج المطابقة' },
  math: { id: 'math', title: 'برق الأرقام', icon: '➕', skill: 'سرعة التفكير', color: '#ffe0eb', description: 'حل عمليات صغيرة بسرعة وواصل سلسلة الإجابات الصحيحة.', metric: 'أفضل سلسلة' },
  word: { id: 'word', title: 'بعثرة الكلمات', icon: '🔤', skill: 'اللغة والمنطق', color: '#e7e1fb', description: 'رتب الحروف المبعثرة واكتشف الكلمات الخفية.', metric: 'كلمات صحيحة' },
  pattern: { id: 'pattern', title: 'سرّ النمط', icon: '◈', skill: 'الملاحظة', color: '#fff1bf', description: 'شاهد التسلسل واختر الشكل الذي يُكمله.', metric: 'أنماط صحيحة' },
  sudoku: { id: 'sudoku', title: 'سودوكو النجوم', icon: '🔢', skill: 'التركيز والمنطق', color: '#d8f0dc', description: 'حل شبكات متدرجة، وسجل ملاحظاتك واستعمل التلميحات بحكمة.', metric: 'أفضل وقت' },
  chess: { id: 'chess', title: 'نادي الشطرنج', icon: '♟', skill: 'التخطيط الاستراتيجي', color: '#d9d5fb', description: 'واجه الكمبيوتر أو لاعبًا بجانبك بقواعد الشطرنج الكاملة.', metric: 'الانتصارات' },
  animals: { id: 'animals', title: 'لعبة القط', icon: '🐱', skill: 'الاستنتاج المنطقي', color: '#ffe3ba', description: 'اكتشف مكان قط واحد في كل منطقة لونية، من دون تلامس.', metric: 'المراحل المكتملة' },
  logic: { id: 'logic', title: 'مختبر التفكير', icon: '🧠', skill: 'التفكير الحاسوبي', color: '#dcecff', description: 'مجموعة ألغاز منطقية احترافية تعتمد على الخوارزميات والاستنتاج.', metric: 'الألغاز المحلولة' },
};
const gameImageFiles = { memory: 'memory.png', math: 'math.png', word: 'word.png', pattern: 'pattern.png', sudoku: 'sudoku.png', chess: 'chess.png', animals: 'cat.png', logic: 'logic.png' };

const achievementDefs = [
  { id: 'first', icon: '✦', title: 'أول شرارة', description: 'أكمل أول تحدٍ لك.', check: s => s.total.completed >= 1 },
  { id: 'explorer', icon: '☁', title: 'مستكشفة الألعاب', description: 'جرّبي ثلاث ألعاب مختلفة.', check: s => Object.values(s.games).filter(g => g.played > 0).length >= 3 },
  { id: 'streak5', icon: '⚡', title: 'سلسلة لامعة', description: 'حققي سلسلة من 5 إجابات صحيحة.', check: s => s.total.bestStreak >= 5 },
  { id: 'points300', icon: '♛', title: 'جامِعة النجوم', description: 'اجمعي 300 نقطة.', check: s => s.total.points >= 300 },
  { id: 'focused', icon: '◷', title: 'عقل حاضر', description: 'العب لمدة 10 دقائق.', check: s => s.total.time >= 600 },
  { id: 'champion', icon: '♡', title: 'بطل اليوم', description: 'أكمل المهمات اليومية الثلاث.', check: s => dailyCompleted(s) >= 3 },
  { id: 'sudokuStar', icon: '🔢', title: 'سيد الأرقام', description: 'أكمل ثلاث مراحل من سودوكو النجوم.', check: s => completedLevels(s, 'sudoku') >= 3 },
  { id: 'chessWin', icon: '♟', title: 'كش ملك', description: 'اربح مباراة شطرنج ضد الكمبيوتر.', check: s => (s.games.chess?.chess?.wins || 0) >= 1 },
  { id: 'animalGuide', icon: '🐱', title: 'صديق القطط', description: 'أكمل خمس مراحل من لعبة القط.', check: s => completedLevels(s, 'animals') >= 5 },
  { id: 'logicMind', icon: '🧠', title: 'سيد الحدود', description: 'أكمل جميع مستويات المناطق والحدود.', check: s => completedFenceLevels(s) >= 4 },
  { id: 'steady', icon: '✦', title: 'صاحب النفس الطويل', description: 'العب خمسة أيام مختلفة.', xp: 110, progress: s => [s.days.length, 5], check: s => s.days.length >= 5 },
  { id: 'veteran', icon: '♛', title: 'مستوى متقدم', description: 'اجمع 1200 نقطة خبرة.', xp: 150, progress: s => [s.total.points, 1200], check: s => s.total.points >= 1200 },
];

function defaultGameData() { return { played: 0, completed: 0, bestScore: 0, totalScore: 0, attempts: 0, correct: 0, time: 0, bestStreak: 0, levels: {}, chess: { wins: 0, losses: 0, draws: 0, bestWinStreak: 0, currentWinStreak: 0 } }; }
function makeDefaultState() { return { profile: { name: 'يحيى', theme: 'sky', avatar: '✿', chessStyle: 'classic', quickChoices: ['memory', 'sudoku', 'chess', 'animals', 'logic', 'math'] }, total: { points: 0, time: 0, completed: 0, bestStreak: 0 }, games: Object.fromEntries(Object.keys(games).map(id => [id, defaultGameData()])), achievements: [], activities: [], days: [], dayDecor: {}, daily: { date: todayKey(), game: false, win: false, score: false, reward: false } }; }
function loadState() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (!saved) return makeDefaultState(); const base = makeDefaultState(); return { ...base, ...saved, profile: { ...base.profile, ...saved.profile }, total: { ...base.total, ...saved.total }, games: Object.fromEntries(Object.keys(games).map(id => [id, { ...base.games[id], ...(saved.games?.[id] || {}) }])) }; } catch { return makeDefaultState(); } }
let state = loadState();
let currentGame = null;
let session = null;
let toastTimer;
const animalMarkTimers = new Map();
let pendingAnimalTouchTap = null;
let suppressAnimalClickUntil = 0;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
const fmtTime = seconds => { const hours = Math.floor(seconds / 3600); const mins = Math.floor(seconds % 3600 / 60); const secs = seconds % 60; return hours ? `${hours} س${mins ? ` ${mins} د` : ''}${secs ? ` ${secs} ث` : ''}` : mins ? `${mins} د${secs ? ` ${secs} ث` : ''}` : `${secs} ث`; };
const formatGameTimer = seconds => { const hours = Math.floor(seconds / 3600); const mins = Math.floor(seconds % 3600 / 60); const secs = seconds % 60; return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`; };
function catAsset(source, className, alt) { return `<img class="${className}" src="${source}" alt="${alt}" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="cat-asset-fallback" hidden aria-hidden="true">🐱</span>`; }
function gameVisual(game, className) { const source = gameImageFiles[game.id]; return source ? `<img class="${className}" src="${source}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="game-icon-fallback" hidden aria-hidden="true">${game.icon}</span>` : game.icon; }
/* مؤثرات لعبة القط: تُحمّل مبكراً وتُشغّل عبر Web Audio بعد أول لمسة.
   هذا يمنع تأخر الشبكة وتقييد التشغيل التلقائي في متصفحات الجوال. */
const animalSoundSources = ['foundcat.mp3', 'cross.mp3', 'wrongcross.mp3'];
const animalSoundBank = new Map();
let animalAudioContext = null;
let animalSoundsPrepared = false;

function prepareAnimalSounds() {
  if (animalSoundsPrepared) return;
  animalSoundsPrepared = true;

  animalSoundSources.forEach(source => {
    const audio = new Audio(source);
    audio.preload = 'auto';
    audio.volume = .7;
    audio.load();
    animalSoundBank.set(source, { audio, buffer: null, activeNode: null });
  });

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    animalAudioContext = new AudioContextClass({ latencyHint: 'interactive' });
  } catch (_) {
    try { animalAudioContext = new AudioContextClass(); }
    catch (_) { animalAudioContext = null; return; }
  }

  animalSoundSources.forEach(source => {
    fetch(source, { cache: 'force-cache' })
      .then(response => response.ok ? response.arrayBuffer() : null)
      .then(encoded => encoded ? animalAudioContext.decodeAudioData(encoded) : null)
      .then(buffer => {
        const entry = animalSoundBank.get(source);
        if (entry && buffer) entry.buffer = buffer;
      })
      .catch(() => {});
  });
}

function primeAnimalAudio() {
  prepareAnimalSounds();
  if (animalAudioContext && animalAudioContext.state !== 'running') animalAudioContext.resume().catch(() => {});
}

function playAnimalSound(source) {
  prepareAnimalSounds();
  const entry = animalSoundBank.get(source);
  if (!entry) return;

  if (animalAudioContext) {
    /* لا نُحوّل إلى <audio> عند تعليق السياق أو أثناء التحميل: بعض متصفحات الجوال
       تجمع هذه الطلبات ثم تشغّلها كلها معاً. تجاهل المؤثر الواحد أفضل من تكديسه. */
    if (animalAudioContext.state !== 'running' || !entry.buffer) return;
    entry.activeNode?.stop();
    const node = animalAudioContext.createBufferSource();
    const gain = animalAudioContext.createGain();
    gain.gain.value = .7;
    node.buffer = entry.buffer;
    node.connect(gain).connect(animalAudioContext.destination);
    node.onended = () => { if (entry.activeNode === node) entry.activeNode = null; };
    entry.activeNode = node;
    node.start(0);
    return;
  }

  /* بديل حصري للمتصفحات القديمة التي لا تملك Web Audio. */
  const audio = entry.audio;
  audio.pause();
  try { audio.currentTime = 0; } catch (_) {}
  audio.play().catch(() => {});
}

prepareAnimalSounds();
document.addEventListener('pointerdown', primeAnimalAudio, { passive: true });
document.addEventListener('touchstart', primeAnimalAudio, { passive: true });
function completedLevels(s, gameId) { return Object.values(s.games?.[gameId]?.levels || {}).filter(level => level.completed).length; }
function completedFenceLevels(s) { return Object.entries(s.games?.logic?.levels || {}).filter(([level, data]) => /^\d+$/.test(level) && data.completed).length; }
function getLevelData(gameId, level) { const levels = state.games[gameId].levels || (state.games[gameId].levels = {}); return levels[level] || (levels[level] = { completed: false, attempts: 0, stars: 0, bestScore: 0, bestTime: 0 }); }
function highestCompleted(gameId) { return Math.max(0, ...Object.entries(state.games[gameId].levels || {}).filter(([, data]) => data.completed).map(([level]) => Number(level))); }

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function dailyCompleted(s = state) { const daily = ensureDaily(s); return [daily.game, daily.win, daily.score].filter(Boolean).length; }
function ensureDaily(s = state) { if (!s.daily || s.daily.date !== todayKey()) s.daily = { date: todayKey(), game: false, win: false, score: false, reward: false }; s.dayDecor ||= {}; if (!s.dayDecor[todayKey()]) { const decorations = ['✦', '♡', '☁', '✧', '◌']; s.dayDecor[todayKey()] = decorations[new Date().getDate() % decorations.length]; } return s.daily; }
function levelInfo() { const level = Math.floor(state.total.points / XP_PER_LEVEL) + 1; return { level, current: state.total.points % XP_PER_LEVEL, percent: (state.total.points % XP_PER_LEVEL) / XP_PER_LEVEL * 100 }; }
function showToast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }
function addActivity(text) { state.activities.unshift({ text, at: new Date().toISOString() }); state.activities = state.activities.slice(0, 8); }
function markPlayedToday() { const date = todayKey(); if (!state.days.includes(date)) state.days.push(date); state.days = state.days.slice(-100); }

function switchPage(page) { $$('.page').forEach(el => el.classList.toggle('active-page', el.id === page)); $$('.tab').forEach(el => el.classList.toggle('active', el.dataset.page === page || (page === 'play' && false))); if (page === 'stats') renderStats(); if (page === 'achievements') renderAchievements(); if (page === 'settings') renderSettings(); if (page === 'home') renderHome(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function getTopSkill() { const ranked = Object.entries(state.games).map(([id, data]) => ({ ...games[id], value: data.correct + data.completed * 2 })).sort((a, b) => b.value - a.value); return ranked[0]?.value ? ranked[0] : null; }

function gameMetricValue(game) { const data = state.games[game.id]; if (game.id === 'sudoku') { const best = Object.values(data.levels || {}).map(level => level.bestTime).filter(Boolean); return best.length ? fmtTime(Math.min(...best)) : '—'; } if (game.id === 'chess') return data.chess?.wins || 0; if (game.id === 'animals') return `${completedLevels(state, game.id)} / 50`; if (game.id === 'logic') return `${completedLevels(state, game.id)} / 8`; return data.bestScore || '—'; }
function gameProgressLabel(game) { if (game.id === 'animals') return `المراحل: ${completedLevels(state, game.id)} / 50`; if (game.id === 'sudoku') return `المراحل: ${completedLevels(state, game.id)} / 30`; if (game.id === 'logic') return `مراحل المختبر: ${completedLevels(state, game.id)} / 8`; if (game.id === 'chess') return `المباريات: ${(state.games.chess.chess?.wins || 0) + (state.games.chess.chess?.losses || 0) + (state.games.chess.chess?.draws || 0)}`; return `مكتمل: ${state.games[game.id].completed}`; }
function gameCard(game, directory = false) { return `<article class="game-card ${directory ? 'directory-card window-frame' : ''}" style="--game-color:${game.color}"><div class="game-icon">${gameVisual(game, 'game-card-image')}</div><h3>${game.title}</h3>${directory ? `<span class="skill-tag">يدرب: ${game.skill}</span>` : ''}<p>${game.description}</p>${directory ? `<div class="best-label">${game.metric}: <b>${gameMetricValue(game)}</b><small>${gameProgressLabel(game)}</small></div>` : `<footer><span>${game.skill}</span><span>+ نقاط ✦</span></footer>`}<button class="pixel-button play-game" data-game="${game.id}">ابدأ التحدي ${directory ? '✦' : '←'}</button></article>`; }

function formatLocalizedDate(date, calendar) {
  try { return new Intl.DateTimeFormat(`ar-SA-u-ca-${calendar}`, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
  catch { return date.toLocaleDateString('ar-SA'); }
}

function renderNowCard() {
  const now = new Date();
  const clock = $('#live-clock');
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
  $('#gregorian-date').textContent = formatLocalizedDate(now, 'gregory');
  $('#hijri-date').textContent = formatLocalizedDate(now, 'islamic-umalqura');
}

function renderHome() {
  ensureDaily(); saveState();
  const level = levelInfo();
  $('#player-name').textContent = state.profile.name;
  $('#player-name').dir = 'auto';
  $('#player-avatar').textContent = state.profile.avatar || '✿';
  $('#level-number').textContent = level.level;
  $('#level-next').textContent = `${level.current} / ${XP_PER_LEVEL} XP`;
  $('#xp-bar').style.width = `${level.percent}%`;
  $('#total-points').textContent = state.total.points.toLocaleString('ar');
  $('#total-time').textContent = state.total.time ? fmtTime(state.total.time) : '0 د';
  $('#completed-count').textContent = state.total.completed.toLocaleString('ar');
  $('#best-streak').textContent = state.total.bestStreak.toLocaleString('ar');
  const quickChoices = state.profile.quickChoices?.filter(id => games[id]) || makeDefaultState().profile.quickChoices;
  $('#quick-choice-games').innerHTML = quickChoices.slice(0, 6).map(id => gameCard(games[id])).join('');
  const daily = ensureDaily();
  const tasks = [{ done: daily.game, text: 'العب جولة واحدة' }, { done: daily.win, text: 'أكمل تحديًا بنجاح' }, { done: daily.score, text: 'اجمع 40 نقطة اليوم' }];
  $('#daily-tasks').innerHTML = tasks.map(task => `<div class="task ${task.done ? 'done' : ''}"><i class="task-mark">${task.done ? '✓' : ''}</i><span>${task.text}</span></div>`).join('');
  $('#daily-count').textContent = `${dailyCompleted()} / 3`;
  $('#activity-list').innerHTML = state.activities.length ? state.activities.slice(0, 4).map(activity => `<li>${activity.text}</li>`).join('') : '<li class="empty-activity">لا توجد نشاطات بعد… أول تحدٍ ينتظرك ✦</li>';
  const top = getTopSkill();
  $('#top-skill-icon').innerHTML = top ? gameVisual(top, 'top-skill-image') : '✦'; $('#top-skill').textContent = top ? top.skill : 'بانتظار أول لعبة'; $('#focus-tip').textContent = top ? `لديك نتائج جميلة في ${top.title}. استمر!` : 'ابدأ أي لعبة لمعرفة قوتك الذهنية.';
  const latest = state.achievements[state.achievements.length - 1];
  $('#latest-achievement').innerHTML = latest ? `<div class="latest-badge"><span>${achievementDefs.find(a => a.id === latest)?.icon || '★'}</span><div><b>${achievementDefs.find(a => a.id === latest)?.title}</b><small>فتحت هذه الشارة حديثًا</small></div></div>` : 'أكمل تحديًا لتفتح أول شارة!';
  renderNowCard();
  renderCalendar();
  renderDailyQuote();
}

const dailyQuotes = [
  ['"خطوة صغيرة اليوم تصنع فرقًا كبيرًا غدًا."', '— رسالة اليوم 💌'],
  ['"العقل الهادئ يرى الحل قبل الضجيج."', '— من دفتر الألغاز ✦'],
  ['"كل لغز جديد نافذة صغيرة لفكرة جديدة."', '— رسالة اليوم 💌'],
  ['"خذ وقتك؛ الذكاء لا يحتاج إلى عجلة."', '— تذكير لطيف ☁'],
  ['"حين ترتب الفكرة، يلين أصعب لغز."', '— من بيت الألغاز ♡'],
  ['"المثابرة هي النجمة التي لا تغيب."', '— رسالة اليوم 💌'],
  ['"لاحظ التفاصيل، فغالبًا يختبئ الحل بينها."', '— تذكير لطيف ✧'],
  ['"لديك اليوم فرصة أخرى لتتألق."', '— من دفتر الألغاز ✦'],
  ['"الهدوء نصف الحل، والمحاولة نصفه الآخر."', '— رسالة اليوم 💌'],
  ['"فكرة واحدة صحيحة قادرة على تغيير كل شيء."', '— تذكير لطيف ☁'],
  ['"درّب عقلك بلطف؛ فهو رفيقك في كل طريق."', '— من بيت الألغاز ♡'],
  ['"لا يوجد تقدم صغير حين تكرره كل يوم."', '— رسالة اليوم 💌'],
];
function renderDailyQuote() { const index = Math.floor(Date.now() / 3600000) % dailyQuotes.length; const [quote, source] = dailyQuotes[index]; $('#daily-quote').textContent = quote; $('#daily-quote-source').textContent = source; }

function renderCalendar() { const now = new Date(); const year = now.getFullYear(), month = now.getMonth(); const monthName = new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(now); $('#calendar-month').textContent = monthName; const last = new Date(year, month + 1, 0).getDate(); $('#calendar-grid').innerHTML = Array.from({ length: last }, (_, i) => { const date = new Date(year, month, i + 1); const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`; const marker = state.dayDecor?.[key] || ''; return `<span class="${state.days.includes(key) ? 'played' : ''} ${marker === '✿' ? 'goal-day' : ''}"><b>${i + 1}</b><i>${marker}</i></span>`; }).join(''); }

function renderDirectory() { $('#game-directory').innerHTML = Object.values(games).map(g => gameCard(g, true)).join(''); }
function renderStats() { const totalAttempts = Object.values(state.games).reduce((sum, g) => sum + g.attempts, 0); const totalCorrect = Object.values(state.games).reduce((sum, g) => sum + g.correct, 0); const successRate = totalAttempts ? Math.round(totalCorrect / totalAttempts * 100) : 0; const maxMetric = Math.max(1, ...Object.values(state.games).map(g => g.correct + g.completed * 2));
  $('#skills-chart').innerHTML = Object.entries(games).map(([id, game]) => { const data = state.games[id]; const value = data.correct + data.completed * 2; const percent = Math.round(value / maxMetric * 100); return `<div class="skill-row"><span>${game.skill}</span><div class="skill-meter"><i style="width:${value ? Math.max(10, percent) : 0}%"></i></div><b>${value || 0}</b></div>`; }).join('');
  $('#stats-overview').innerHTML = [['إجمالي وقت اللعب', fmtTime(state.total.time)], ['جلسات مكتملة', state.total.completed], ['نسبة النجاح', `${successRate}%`], ['عدد المحاولات', totalAttempts], ['أطول سلسلة', state.total.bestStreak]].map(([label, value]) => `<div class="overview-item"><span>${label}</span><b>${value}</b></div>`).join('');
  $('#records-list').innerHTML = Object.values(games).map(g => `<div class="record-item"><span><i class="record-icon">${gameVisual(g, 'record-game-image')}</i>${g.title}</span><b>${state.games[g.id].bestScore || '—'}</b></div>`).join('');
  const sorted = Object.values(games).map(g => ({ ...g, val: state.games[g.id].correct + state.games[g.id].completed * 2 })).sort((a,b) => a.val - b.val); const weak = sorted[0]; const strong = sorted.at(-1); $('#improvement-tip').innerHTML = strong.val ? `تألّقت في <b>${strong.skill}</b>. ولتحقيق توازن أجمل، جرّب <b>${weak.title}</b> أكثر قليلًا هذا الأسبوع.` : 'بياناتك ستظهر هنا بعد أول جولة. جرّب لعبة تحبها وابدأ رسم خريطة مهاراتك.';
}
function renderAchievements() { const unlocked = new Set(state.achievements); $('#achievement-progress').textContent = `${unlocked.size} من ${achievementDefs.length} شارات مفتوحة`; $('#achievements-grid').innerHTML = achievementDefs.map(a => { const open = unlocked.has(a.id), hidden = a.secret && !open, progress = a.progress?.(state); return `<article class="achievement-card window-frame ${open ? '' : 'locked'} ${hidden ? 'secret-achievement' : ''}"><div class="badge-icon">${open ? a.icon : hidden ? '؟' : '🔒'}</div><div><h2>${hidden ? 'إنجاز سري' : a.title}</h2><p>${hidden ? 'تتضح تفاصيله بعد فتح بقية الإنجازات.' : a.description}</p>${progress && !hidden ? `<div class="achievement-meter"><i style="width:${Math.min(100, progress[0] / progress[1] * 100)}%"></i><span>${progress[0]} من ${progress[1]}</span></div>` : ''}<div class="achievement-reward">المكافأة: ${a.xp || 50} نقطة خبرة</div><div class="${open ? 'unlocked-stamp' : 'locked-stamp'}">${open ? '✦ تم فتح الشارة' : hidden ? '◌ شرط غامض' : '◌ لم تُفتح بعد'}</div></div></article>`; }).join(''); }
const avatarOptions = [
  { symbol: '✿', label: 'زهرة' }, { symbol: '☀', label: 'شمس' }, { symbol: '☁', label: 'غيمة' }, { symbol: '✦', label: 'نجمة' },
  { symbol: '☾', label: 'هلال' }, { symbol: '♡', label: 'قلب' }, { symbol: '🦋', label: 'فراشة' }, { symbol: '🐱', label: 'قطة' },
  { symbol: '🐰', label: 'أرنب' }, { symbol: '🦫', label: 'قندس' }, { symbol: '🦊', label: 'ثعلب' }, { symbol: '🪼', label: 'قنديل' },
  { symbol: '🌷', label: 'زهرة توليب' }, { symbol: '🍓', label: 'فراولة' }, { symbol: '🫧', label: 'فقاعات' }, { symbol: '🐳', label: 'حوت' },
  { symbol: '🌙', label: 'قمر' }, { symbol: '🧸', label: 'دب' }, { symbol: '🌈', label: 'قوس قزح' }, { symbol: '🍀', label: 'برسيم' }
];
function renderSettings() {
  $('#settings-name').value = state.profile.name;
  $$('.theme-choice').forEach(button => button.classList.toggle('selected', button.dataset.theme === state.profile.theme));
  const currentAvatar = state.profile.avatar || '✿';
  $('#avatar-options').innerHTML = avatarOptions.map(({ symbol, label }) => `<button class="avatar-choice ${symbol === currentAvatar ? 'selected' : ''}" data-avatar="${symbol}" aria-label="${label}" title="${label}"><span>${symbol}</span><small>${label}</small></button>`).join('');
  $$('.avatar-choice').forEach(button => button.addEventListener('click', () => { state.profile.avatar = button.dataset.avatar; saveState(); renderHome(); renderSettings(); showToast(`تم اختيار رمز ${button.getAttribute('aria-label')} ✦`); }));

  const choices = state.profile.quickChoices || (state.profile.quickChoices = makeDefaultState().profile.quickChoices);
  const available = Object.values(games).filter(game => !choices.includes(game.id));
  $('#quick-choice-settings').innerHTML = `
    <div class="quick-choice-summary"><span>يظهر في الرئيسية <b>${choices.length}</b> من 6 ألعاب</span><small>استخدم السهمين لترتيب الظهور.</small></div>
    <ol class="chosen-quick-list">
      ${choices.map((id, index) => `<li class="quick-setting-row"><span class="quick-order">${index + 1}</span><span class="quick-game-label"><i>${gameVisual(games[id], 'quick-game-image')}</i><b>${games[id].title}</b></span><span class="quick-row-actions"><button class="quick-order-btn" data-quick-move="${index}" data-direction="up" ${index ? '' : 'disabled'} aria-label="تقديم ${games[id].title}" title="تقديم">↑</button><button class="quick-order-btn" data-quick-move="${index}" data-direction="down" ${index < choices.length - 1 ? '' : 'disabled'} aria-label="تأخير ${games[id].title}" title="تأخير">↓</button><button class="quick-remove-btn" data-quick-remove="${id}" aria-label="إزالة ${games[id].title}" title="إزالة">×</button></span></li>`).join('')}
    </ol>
    <div class="quick-add-section"><div class="quick-add-heading"><b>أضف لعبة</b><small>${available.length ? 'اختر من الألعاب المتاحة' : 'وصلت إلى الحد الأقصى'}</small></div><div class="add-quick-list">${available.map(game => `<button data-quick-add="${game.id}"><i>${gameVisual(game, 'quick-game-image')}</i><span>${game.title}</span><em>إضافة</em></button>`).join('') || '<p class="quick-list-complete">تم اختيار ست ألعاب.</p>'}</div></div>`;
  $$('[data-quick-remove]').forEach(button => button.addEventListener('click', () => { if (choices.length <= 1) return showToast('احتفظ باختيار واحد على الأقل'); state.profile.quickChoices = choices.filter(id => id !== button.dataset.quickRemove); saveState(); renderHome(); renderSettings(); }));
  $$('[data-quick-add]').forEach(button => button.addEventListener('click', () => { if (choices.length >= 6) return showToast('يمكنك اختيار ستة عناصر فقط'); choices.push(button.dataset.quickAdd); saveState(); renderHome(); renderSettings(); }));
  $$('[data-quick-move]').forEach(button => button.addEventListener('click', () => { const index = Number(button.dataset.quickMove), target = button.dataset.direction === 'up' ? index - 1 : index + 1; [choices[index], choices[target]] = [choices[target], choices[index]]; saveState(); renderHome(); renderSettings(); }));
}

function openGame(id) { currentGame = id; document.body.dataset.activeGame = id; session = { startedAt: Date.now(), score: 0, attempts: 0, correct: 0, streak: 0, completed: false, timer: null, config: {} }; $('#playing-label').textContent = games[id].title; $('#game-play-title').textContent = games[id].title; $('#session-score').textContent = '0'; $('#game-timer').textContent = formatGameTimer(0); switchPage('play'); renderGameIntro(); }
function beginTimer() { clearInterval(session.timer); session.timer = setInterval(() => { const seconds = Math.floor((Date.now() - session.startedAt) / 1000); $('#game-timer').textContent = formatGameTimer(seconds); }, 1000); }
function renderGameIntro() { const game = games[currentGame]; $('#game-area').innerHTML = `<div class="game-intro"><div class="big-icon">${gameVisual(game, 'intro-game-image')}</div><h2>${game.title}</h2><p>${game.description}</p><p><b>المهارة:</b> ${game.skill} · <b>المكافأة:</b> حتى 100 نقطة</p><button class="pixel-button primary" id="start-game">ابدأ الآن ✦</button></div>`; $('#start-game').addEventListener('click', () => { primeAnimalAudio(); session.startedAt = Date.now(); beginTimer(); ({ memory: startMemory, math: startMath, word: startWord, pattern: startPattern, sudoku: startSudoku, chess: startChess, animals: startAnimals, logic: startLogic })[currentGame](); }); }
function updateSessionScore(add) { session.score += add; $('#session-score').textContent = session.score; }
function gameMeta(content) { return `<div class="game-meta">${content}</div>`; }

function startMemory() { const icons = shuffle(['🍓', '🍓', '🌼', '🌼', '🧁', '🧁', '🌈', '🌈', '🍒', '🍒', '🫧', '🫧', '🦋', '🦋', '🎀', '🎀']); session.config = { opened: [], matched: 0, lock: false }; $('#game-area').innerHTML = `<div><div class="game-meta"><span>طابقي كل الأزواج</span><span>المحاولات: <b id="memory-attempts">0</b></span><span>المطابق: <b id="memory-matches">0 / 8</b></span></div><div class="memory-board">${icons.map((icon, i) => `<button class="memory-card" data-icon="${icon}" data-index="${i}" aria-label="بطاقة مخفية">${icon}</button>`).join('')}</div></div>`; $$('.memory-card').forEach(card => card.addEventListener('click', () => flipMemoryCard(card))); }
function flipMemoryCard(card) { const c = session.config; if (c.lock || card.classList.contains('flipped') || card.classList.contains('matched')) return; card.classList.add('flipped'); c.opened.push(card); if (c.opened.length !== 2) return; session.attempts++; $('#memory-attempts').textContent = session.attempts; const [a, b] = c.opened; if (a.dataset.icon === b.dataset.icon) { a.classList.add('matched'); b.classList.add('matched'); c.opened = []; c.matched++; session.correct++; session.streak++; updateSessionScore(12 + session.streak * 2); $('#memory-matches').textContent = `${c.matched} / 8`; if (c.matched === 8) setTimeout(() => finishGame(true), 400); } else { c.lock = true; session.streak = 0; setTimeout(() => { a.classList.remove('flipped'); b.classList.remove('flipped'); c.opened = []; c.lock = false; }, 640); } }

function makeMathProblem() { const first = Math.floor(Math.random() * 12) + 3; const second = Math.floor(Math.random() * 10) + 1; const subtract = Math.random() > .55; return subtract ? { text: `${first + second} − ${second}`, answer: first } : { text: `${first} + ${second}`, answer: first + second }; }
function startMath() { session.config = { round: 0, target: 8 }; nextMathRound(); }
function nextMathRound() { const c = session.config; if (c.round >= c.target) return finishGame(session.correct >= 5); c.problem = makeMathProblem(); $('#game-area').innerHTML = `<div class="math-panel">${gameMeta(`<span>السؤال ${c.round + 1} / ${c.target}</span><span>السلسلة: <b>${session.streak}</b></span>`)}<p class="prompt-label">ما الإجابة؟</p><div class="math-problem">${c.problem.text} = ؟</div><div class="answer-row"><input id="math-answer" class="answer-input" type="number" inputmode="numeric" autocomplete="off" aria-label="إجابتك" /><button id="submit-math" class="pixel-button primary">تأكيد</button></div><p id="math-feedback" class="math-feedback"></p><div class="round-dots">${Array.from({length:c.target},(_,i)=>`<i class="${i < c.round ? 'done' : ''}"></i>`).join('')}</div></div>`; const input = $('#math-answer'); input.focus(); $('#submit-math').addEventListener('click', checkMath); input.addEventListener('keydown', e => { if (e.key === 'Enter') checkMath(); }); }
function checkMath() { const input = $('#math-answer'); const answer = Number(input.value); if (input.value === '') return; const correct = answer === session.config.problem.answer; session.attempts++; session.config.round++; input.disabled = true; $('#submit-math').disabled = true; if (correct) { session.correct++; session.streak++; updateSessionScore(10 + session.streak * 2); $('#math-feedback').textContent = 'صحيح! ✦'; } else { session.streak = 0; $('#math-feedback').textContent = `الإجابة هي ${session.config.problem.answer}، المحاولة التالية لك!`; } setTimeout(nextMathRound, 620); }

const words = [{ word: 'ذاكرة', hint: 'نحتاجها لتذكر الأشياء' }, { word: 'تركيز', hint: 'يساعدك على الانتباه' }, { word: 'منطق', hint: 'أداة لحل المشكلات' }, { word: 'لغز', hint: 'تبحث عن حلّه هنا' }, { word: 'نمط', hint: 'تسلسل له قاعدة' }, { word: 'نجمة', hint: 'تكسبين واحدة عند النجاح' }];
function shuffle(value) { const list = [...value]; for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; }
function startWord() { session.config = { round: 0, target: 6, pool: shuffle(words) }; nextWordRound(); }
function nextWordRound() { const c = session.config; if (c.round >= c.target) return finishGame(session.correct >= 4); c.item = c.pool[c.round]; let mixed = shuffle([...c.item.word]).join(''); if (mixed === c.item.word) mixed = [...c.item.word].reverse().join(''); $('#game-area').innerHTML = `<div class="word-panel">${gameMeta(`<span>الكلمة ${c.round + 1} / ${c.target}</span><span>صحيح: <b>${session.correct}</b></span>`)}<p class="prompt-label">رتب الحروف لتكوين كلمة</p><div class="word-scramble">${mixed}</div><p class="word-hint">💡 تلميح: ${c.item.hint}</p><div class="answer-row"><input id="word-answer" class="answer-input" type="text" autocomplete="off" aria-label="الكلمة" /><button id="submit-word" class="pixel-button primary">تأكيد</button></div><p id="word-feedback" class="word-feedback"></p></div>`; const input = $('#word-answer'); input.focus(); $('#submit-word').addEventListener('click', checkWord); input.addEventListener('keydown', e => { if (e.key === 'Enter') checkWord(); }); }
function checkWord() { 
  const input = $('#word-answer'); 
  if (!input.value.trim()) return; 
  const normalizeAR = str => str.trim().replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const correct = normalizeAR(input.value) === normalizeAR(session.config.item.word);
  session.attempts++; session.config.round++; input.disabled = true; $('#submit-word').disabled = true; 
  if (correct) { session.correct++; session.streak++; updateSessionScore(15 + session.streak * 2); $('#word-feedback').textContent = 'كلمة صحيحة، أحسنتِ! ✦'; } 
  else { session.streak = 0; $('#word-feedback').textContent = `كانت الكلمة: ${session.config.item.word}`; } 
  setTimeout(nextWordRound, 700); 
}

const patterns = [
  { sequence: ['●', '■', '●', '■'], answer: '●', choices: ['●', '▲', '■', '◆'] }, { sequence: ['▲', '▲', '●', '▲', '▲', '●'], answer: '▲', choices: ['●', '■', '▲', '◆'] }, { sequence: ['◆', '●', '■', '◆', '●'], answer: '■', choices: ['▲', '■', '●', '◆'] }, { sequence: ['★', '●', '★', '●'], answer: '★', choices: ['■', '★', '◆', '●'] }, { sequence: ['■', '◆', '■', '◆', '■'], answer: '◆', choices: ['◆', '●', '▲', '■'] }, { sequence: ['●', '●', '▲', '●', '●', '▲'], answer: '●', choices: ['◆', '●', '■', '▲'] },
];
function startPattern() { session.config = { round: 0, target: 6, pool: shuffle(patterns) }; nextPatternRound(); }
function nextPatternRound() { const c = session.config; if (c.round >= c.target) return finishGame(session.correct >= 4); c.item = c.pool[c.round]; const display = [...c.item.sequence, '?']; $('#game-area').innerHTML = `<div class="pattern-panel">${gameMeta(`<span>النمط ${c.round + 1} / ${c.target}</span><span>سلسلة: <b>${session.streak}</b></span>`)}<p class="prompt-label">ما الشكل الذي يكمل النمط؟</p><div class="pattern-sequence">${display.map((shape, i) => `<span class="sequence-shape ${shape === '?' ? 'question' : ''}">${shape}</span>`).join('')}</div><div class="choice-row">${shuffle(c.item.choices).map(shape => `<button class="shape-choice" data-answer="${shape}" aria-label="اختيار ${shape}">${shape}</button>`).join('')}</div><p id="pattern-feedback" class="pattern-feedback"></p></div>`; $$('.shape-choice').forEach(button => button.addEventListener('click', () => checkPattern(button))); }
function checkPattern(button) { $$('.shape-choice').forEach(b => b.disabled = true); const correct = button.dataset.answer === session.config.item.answer; session.attempts++; session.config.round++; if (correct) { session.correct++; session.streak++; updateSessionScore(15 + session.streak * 2); button.style.outline = '3px solid #7bca98'; $('#pattern-feedback').textContent = 'اختيار ذكي! ✦'; } else { session.streak = 0; button.style.outline = '3px solid #ec8fa9'; $('#pattern-feedback').textContent = `الإجابة: ${session.config.item.answer}`; } setTimeout(nextPatternRound, 650); }

function finishGame(won, extra = {}) {
  clearInterval(session.timer); clearInterval(session.limitTimer); if (session.keyHandler) document.removeEventListener('keydown', session.keyHandler);
  const seconds = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000)); const game = games[currentGame]; const data = state.games[currentGame]; const completed = extra.completed ?? won;
  data.played++; data.attempts += session.attempts; data.correct += session.correct; data.time += seconds; data.totalScore += session.score; data.bestScore = Math.max(data.bestScore, session.score); data.bestStreak = Math.max(data.bestStreak, session.streak); state.total.time += seconds; state.total.points += session.score; state.total.bestStreak = Math.max(state.total.bestStreak, session.streak);
  const level = extra.level ?? session.config?.level; if (level) { const levelData = getLevelData(currentGame, level); levelData.attempts++; if (won) { levelData.completed = true; levelData.stars = Math.max(levelData.stars, extra.stars || 1); } levelData.bestScore = Math.max(levelData.bestScore, session.score); levelData.bestTime = !levelData.bestTime || seconds < levelData.bestTime ? seconds : levelData.bestTime; }
  if (completed) { data.completed++; state.total.completed++; }
  const daily = ensureDaily(); daily.game = true; if (won) daily.win = true; if (session.score >= 40) daily.score = true; const tasksNow = dailyCompleted(); if (tasksNow === 3 && !daily.reward) { daily.reward = true; state.dayDecor[todayKey()] = '✿'; state.total.points += 50; session.score += 50; showToast('أكملت مهمات اليوم! +50 نجمة ✦'); }
  markPlayedToday(); addActivity(extra.activity || `${won ? 'أكملت' : 'لعبت'} <b>${game.title}</b> وحصلت على <b>${session.score}</b> نقطة.`); checkAchievements(); saveState(); renderHome();
  const title = extra.title || (won ? 'تحدٍ مكتمل!' : 'بداية جميلة!'); const message = extra.message || (won ? 'أضفت تقدمًا جديدًا إلى ملفك.' : 'كل محاولة تدرب عقلك، جرّب مرة أخرى.'); const scoreLine = extra.scoreLine || `${session.correct} إجابات صحيحة · ${fmtTime(seconds)}`;
  const nextButton = extra.nextLevel ? `<button class="pixel-button primary" id="next-level">المرحلة التالية ←</button>` : ''; $('#game-area').innerHTML = `<div class="end-screen"><div class="end-icon">${won ? '★' : '♡'}</div><h2>${title}</h2><p>${message}</p><div class="end-score">+${session.score} نقطة ✦<br><small>${scoreLine}</small></div>${nextButton}<button class="pixel-button ${extra.nextLevel ? '' : 'primary'}" id="play-again">إعادة اللعب</button> <button class="tiny-button" data-page-link="games">كل الألعاب</button></div>`; $('#play-again').addEventListener('click', () => openGame(currentGame)); $('#next-level')?.addEventListener('click', () => extra.onNext ? extra.onNext() : launchAnimals(extra.nextLevel, session.config.timed)); }
function checkAchievements() { achievementDefs.forEach(a => { if (!state.achievements.includes(a.id) && a.check(state)) { state.achievements.push(a.id); state.total.points += a.xp || 50; showToast(`شارة جديدة: ${a.title} ${a.icon} +${a.xp || 50} خبرة`); } }); }

/* سودوكو النجوم */
function seeded(seed) { let value = (seed * 9301 + 49297) % 233280; return () => { value = (value * 9301 + 49297) % 233280; return value / 233280; }; }
function seededShuffle(list, random) { const copy = [...list]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function makeSudokuLevel(level) {
  const random = seeded(level * 41 + 7); const shifts = [0, 3, 6, 1, 4, 7, 2, 5, 8]; const rows = seededShuffle([0, 1, 2], random).flatMap(band => seededShuffle([0, 1, 2], random).map(row => band * 3 + row)); const cols = seededShuffle([0, 1, 2], random).flatMap(stack => seededShuffle([0, 1, 2], random).map(col => stack * 3 + col)); const digits = seededShuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
  const solution = rows.flatMap(row => cols.map(col => digits[(shifts[row] + col) % 9])); const puzzle = [...solution]; const blanks = Math.min(56, 32 + Math.floor((level - 1) * 1.15)); const positions = seededShuffle(Array.from({ length: 81 }, (_, i) => i), random); positions.slice(0, blanks).forEach(index => { puzzle[index] = 0; });
  return { level, puzzle, solution, difficulty: level <= 8 ? 'هادئ' : level <= 18 ? 'متوسط' : 'متقدم' };
}
function levelProgressCard(gameId, level, label = `مرحلة ${level}`, locked = false) { const data = getLevelData(gameId, level); return `<button class="level-card ${data.completed ? 'done' : ''} ${locked ? 'locked' : ''}" data-level="${level}" ${locked ? 'disabled' : ''}><b>${label}</b><span>${data.completed ? `${'★'.repeat(data.stars || 1)}${'☆'.repeat(3 - (data.stars || 1))}` : locked ? '🔒' : '○'}</span><small>${data.bestTime ? fmtTime(data.bestTime) : data.completed ? 'مكتملة' : 'ابدأ الآن'}</small></button>`; }
function startSudoku() { clearInterval(session.timer); const unlocked = Math.min(30, Math.max(1, highestCompleted('sudoku') + 1)); $('#game-area').innerHTML = `<div class="level-library"><div class="library-heading"><div><p class="prompt-label">30 شبكة متدرجة</p><h2>اختر مرحلة سودوكو</h2><p>تستطيع العودة لأي مرحلة فتحتها وتحسين نجومك ووقتك.</p></div><div class="library-badge library-game-badge">${gameVisual(games.sudoku, 'library-game-image')}<small>${completedLevels(state, 'sudoku')} / 30</small></div></div><div class="level-grid">${Array.from({ length: 30 }, (_, i) => levelProgressCard('sudoku', i + 1, `مرحلة ${i + 1}`, i + 1 > unlocked)).join('')}</div></div>`; $$('.level-card:not(.locked)').forEach(button => button.addEventListener('click', () => launchSudoku(Number(button.dataset.level)))); }
function launchSudoku(level) { const data = makeSudokuLevel(level); session.startedAt = Date.now(); session.score = 0; session.attempts = 0; session.correct = 0; session.streak = 0; session.config = { ...data, board: [...data.puzzle], notes: Array.from({ length: 81 }, () => []), selected: null, noteMode: false, history: [], hints: 3, checks: 0, wrong: new Set(), correctSet: new Set(), level }; beginTimer(); session.keyHandler = event => { if (!$('#game-area .sudoku-board')) return; if (/^[1-9]$/.test(event.key)) setSudokuValue(Number(event.key)); if (event.key === 'Backspace' || event.key === 'Delete') setSudokuValue(0); }; document.addEventListener('keydown', session.keyHandler); renderSudoku(); }
function renderSudoku() { const c = session.config; const filled = c.board.filter(Boolean).length; const progress = Math.round(filled / 81 * 100); const remaining = 81 - filled; const selectedValue = c.selected === null ? 0 : c.board[c.selected]; const selectedHint = c.selected === null ? 'اختر مربعًا من الشبكة' : c.noteMode ? 'أضف احتمالات صغيرة للمربع' : 'اختر رقمًا لوضعه'; $('#game-area').innerHTML = `<div class="sudoku-wrap"><div class="sudoku-hero"><div class="sudoku-title-lockup"><span>✦</span><div><p>مساحة التركيز</p><h2>سودوكو النجوم</h2><small>رقّب الأنماط، وخذ كل خطوة بهدوء.</small></div></div><div class="sudoku-goal"><b>${remaining}</b><span>مربعًا متبقيًا</span></div></div><div class="sudoku-progress" aria-label="تقدم الحل"><i style="width:${progress}%"></i><b>${progress}%</b></div><div class="sudoku-topline">${gameMeta(`<span>المرحلة <b>${c.level}</b> · ${c.difficulty}</span><span>مكتمل: <b>${filled}/81</b></span><span>تلميحات: <b>${'💡'.repeat(c.hints) || '—'}</b></span>`)}</div><div class="sudoku-board" dir="ltr">${c.board.map((value, index) => { const given = c.puzzle[index]; const notes = c.notes[index]; const sameNumber = selectedValue && value === selectedValue && c.selected !== index; return `<button class="sudoku-cell ${given ? 'given' : ''} ${c.selected === index ? 'selected' : ''} ${sameNumber ? 'same-number' : ''} ${c.wrong.has(index) ? 'wrong-cell' : ''} ${c.correctSet.has(index) ? 'correct-cell' : ''}" data-cell="${index}" ${given || c.correctSet.has(index) ? 'disabled' : ''}>${value || (notes.length ? `<i>${notes.join(' ')}</i>` : '')}</button>`; }).join('')}</div><div class="sudoku-controls"><div class="sudoku-keypad-heading"><span>لوحة الأرقام</span><small>${selectedHint}</small></div><div class="number-pad" dir="ltr">${[1,2,3,4,5,6,7,8,9].map(n => { const used = c.board.filter(value => value === n).length; return `<button data-number="${n}" class="${selectedValue === n ? 'selected-number' : ''}"><b>${n}</b><small>${9 - used}</small></button>`; }).join('')}<button data-number="0" class="erase" aria-label="مسح الخانة">⌫</button></div><div class="tool-row"><button id="toggle-notes" class="${c.noteMode ? 'active-tool' : ''}">✎ ملاحظات</button><button id="undo-sudoku">↶ تراجع</button><button id="hint-sudoku" ${c.hints ? '' : 'disabled'}>💡 تلميح</button></div><p class="sudoku-note">${c.noteMode ? 'وضع الملاحظات مفعّل: اختر أرقامًا صغيرة داخل الخانة.' : 'كل رقم صحيح يضيء بلون هادئ، والخطأ يوضح لك أين تعيد التفكير.'}</p></div></div>`;
  $$('.sudoku-cell:not([disabled])').forEach(cell => cell.addEventListener('click', () => { c.selected = Number(cell.dataset.cell); renderSudoku(); })); $$('.number-pad [data-number]').forEach(button => button.addEventListener('click', () => setSudokuValue(Number(button.dataset.number)))); $('#toggle-notes').addEventListener('click', () => { c.noteMode = !c.noteMode; renderSudoku(); }); $('#undo-sudoku').addEventListener('click', undoSudoku); $('#hint-sudoku').addEventListener('click', hintSudoku);
}
function setSudokuValue(number) { const c = session.config; const index = c.selected; if (index === null || c.puzzle[index] || c.correctSet.has(index)) return; c.history.push({ index, value: c.board[index], notes: [...c.notes[index]] }); c.wrong.delete(index); if (c.noteMode && number) { const notes = c.notes[index]; c.notes[index] = notes.includes(number) ? notes.filter(n => n !== number) : [...notes, number].sort(); } else { c.board[index] = number; c.notes[index] = []; session.attempts++; if (number) { if(number === c.solution[index]) { session.correct++; c.correctSet.add(index); c.selected = null; } else { c.wrong.add(index); } } } renderSudoku(); if (number && c.board.every(Boolean) && c.board.every((value, cell) => value === c.solution[cell])) finishSudoku(); }
function undoSudoku() { const c = session.config; const previous = c.history.pop(); if (!previous) return showToast('لا توجد حركة سابقة'); c.board[previous.index] = previous.value; c.notes[previous.index] = previous.notes; c.wrong.delete(previous.index); c.correctSet.delete(previous.index); renderSudoku(); }
function hintSudoku() { const c = session.config; if (!c.hints) return; const index = c.selected !== null && !c.puzzle[c.selected] && !c.correctSet.has(c.selected) ? c.selected : c.board.findIndex((value, i) => !c.puzzle[i] && !c.correctSet.has(i)); if (index < 0) return; c.history.push({ index, value: c.board[index], notes: [...c.notes[index]] }); c.board[index] = c.solution[index]; c.notes[index] = []; c.hints--; c.correctSet.add(index); c.wrong.delete(index); session.attempts++; session.correct++; showToast('تم وضع رقم صحيح ✦'); renderSudoku(); if (c.board.every(Boolean) && c.board.every((value, cell) => value === c.solution[cell])) finishSudoku(); }
function finishSudoku() { const c = session.config; const stars = c.hints === 3 && !c.wrong.size ? 3 : c.hints >= 1 ? 2 : 1; updateSessionScore(70 + c.level * 3 + stars * 10); finishGame(true, { level: c.level, stars, title: 'شبكة مكتملة!', message: `أكملت سودوكو المرحلة ${c.level} بتقييم ${'★'.repeat(stars)}.`, scoreLine: `${fmtTime(Math.max(1, Math.round((Date.now() - session.startedAt) / 1000)))} · ${c.hints} تلميحات متبقية` }); }

/* نادي الشطرنج */
const svgPawn = `<svg viewBox="0 0 45 45"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const svgKnight = `<svg viewBox="0 0 45 45"><path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/></svg>`;
const svgBishop = `<svg viewBox="0 0 45 45"><g fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g></svg>`;
const svgRook = `<svg viewBox="0 0 45 45"><g fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23"/></g></svg>`;
const svgQueen = `<svg viewBox="0 0 45 45"><g fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-21.5-1.5-27 0z"/></g></svg>`;
const svgKing = `<svg viewBox="0 0 45 45"><g fill="{fill}" stroke="{stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5z" fill="{fill}" stroke="{stroke}"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10.5 5 10.5v7z" fill="{fill}" stroke="{stroke}"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" stroke="{stroke}"/></g></svg>`;
function getChessSVG(piece) {
    if (!piece) return '';
    const isWhite = piece === piece.toUpperCase();
    const fill = isWhite ? '#ffffff' : '#222222';
    const stroke = isWhite ? '#000000' : '#ffffff';
    const lower = piece.toLowerCase();
    let svg = '';
    if (lower === 'p') svg = svgPawn; else if (lower === 'n') svg = svgKnight; else if (lower === 'b') svg = svgBishop;
    else if (lower === 'r') svg = svgRook; else if (lower === 'q') svg = svgQueen; else if (lower === 'k') svg = svgKing;
    return svg.replace(/\{fill\}/g, fill).replace(/\{stroke\}/g, stroke);
}
const chessColor = piece => piece && (piece === piece.toUpperCase() ? 'w' : 'b');
const chessOther = color => color === 'w' ? 'b' : 'w';

function startChess() { clearInterval(session.timer); const record = state.games.chess.chess || defaultGameData().chess; $('#game-area').innerHTML = `<div class="chess-lobby"><div class="library-heading"><div><p class="prompt-label">مباراة كاملة بقواعد صحيحة</p><h2>نادي الشطرنج</h2><p>اختر خصمك، ثم ابدأ المباراة. تُحفظ نتائجك وسلسلة انتصاراتك تلقائيًا.</p></div><div class="library-badge library-game-badge">${gameVisual(games.chess, 'library-game-image')}<small>${record.wins || 0} فوز</small></div></div><div class="chess-modes"><button class="chess-mode selected" data-chess-mode="computer"><b>🤖 ضد الكمبيوتر</b><small>تلعب بالأبيض</small></button><button class="chess-mode" data-chess-mode="local"><b>♟♙ لاعبان محليان</b><small>تناوب على الجهاز نفسه</small></button></div><div id="chess-difficulty" class="difficulty-row"><span>درجة الكمبيوتر:</span><button data-difficulty="easy" class="selected">هادئ</button><button data-difficulty="medium">متوسط</button><button data-difficulty="hard">متقدم</button></div><button id="start-chess-match" class="pixel-button primary">ابدأ المباراة ♟</button><div class="chess-record"><span>فوز <b>${record.wins || 0}</b></span><span>خسارة <b>${record.losses || 0}</b></span><span>تعادل <b>${record.draws || 0}</b></span><span>أفضل سلسلة <b>${record.bestWinStreak || 0}</b></span></div></div>`;
  const themePanel = document.createElement('div'); themePanel.className = 'chess-theme-picker window-frame'; 
  themePanel.innerHTML = `<div class="titlebar"><span>تخصيص الرقعة والقطع</span><span>🎨</span></div><div class="chess-preview-wrap"><div id="chess-preview-board" class="chess-board mini-preview chess-theme-${state.profile.chessStyle || 'classic'}" dir="ltr"></div><div class="theme-choices-col">${[['classic','كلاسيكي'],['candy','حلويات'],['ocean','بحري']].map(([id, label]) => `<button data-chess-style="${id}" class="${state.profile.chessStyle === id ? 'selected' : ''}">${label}</button>`).join('')}</div></div>`;
  $('#chess-difficulty').insertAdjacentElement('afterend', themePanel); 
  const renderPreview = () => { $('#chess-preview-board').className = `chess-board mini-preview chess-theme-${state.profile.chessStyle || 'classic'}`; let html = ''; [['r','n','b','q'],['p','p','p','p'],['.','.','.','.'],['P','P','P','P']].forEach((row, r) => row.forEach((piece, c) => { html += `<div class="chess-cell ${(r+c)%2 ? 'dark-square' : 'light-square'}">${getChessSVG(piece !== '.' ? piece : '')}</div>`; })); $('#chess-preview-board').innerHTML = html; }; renderPreview();
  $$('[data-chess-style]').forEach(button => button.addEventListener('click', () => { state.profile.chessStyle = button.dataset.chessStyle; saveState(); $$('[data-chess-style]').forEach(item => item.classList.toggle('selected', item === button)); renderPreview(); })); let mode = 'computer', difficulty = 'easy'; $$('.chess-mode').forEach(button => button.addEventListener('click', () => { mode = button.dataset.chessMode; $$('.chess-mode').forEach(item => item.classList.toggle('selected', item === button)); $('#chess-difficulty').classList.toggle('muted-choice', mode !== 'computer'); })); $$('#chess-difficulty button').forEach(button => button.addEventListener('click', () => { difficulty = button.dataset.difficulty; $$('#chess-difficulty button').forEach(item => item.classList.toggle('selected', item === button)); })); $('#start-chess-match').addEventListener('click', () => launchChess(mode, difficulty));
}
function chessInitialConfig(mode, difficulty) { const board = ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR'].map(row => [...row].map(piece => piece === '.' ? '' : piece)); const cfg = { board, turn: 'w', selected: null, legal: [], mode, difficulty, castling: { wk: true, wq: true, bk: true, bq: true }, enPassant: null, halfmove: 0, positions: {}, moves: [], moveLog: [], thinking: false, animatedMove: null }; cfg.positions[chessPositionKey(cfg)] = 1; return cfg; }
function launchChess(mode, difficulty) { session.startedAt = Date.now(); session.score = 0; session.attempts = 0; session.correct = 0; session.streak = 0; session.config = chessInitialConfig(mode, difficulty); beginTimer(); renderChess(); }
function chessPositionKey(c) { return `${c.board.map(row => row.map(piece => piece || '.').join('')).join('/')}:${c.turn}:${c.castling.wk ? 'K' : ''}${c.castling.wq ? 'Q' : ''}${c.castling.bk ? 'k' : ''}${c.castling.bq ? 'q' : ''}:${c.enPassant ? `${c.enPassant.r}${c.enPassant.c}` : '-'}`; }
function copyChessConfig(c) { return { ...c, board: c.board.map(row => [...row]), castling: { ...c.castling }, enPassant: c.enPassant ? { ...c.enPassant } : null, positions: { ...c.positions }, moves: [...c.moves], moveLog: [...c.moveLog] }; }
function inChessBoard(r, col) { return r >= 0 && r < 8 && col >= 0 && col < 8; }
function chessPseudoMoves(c, r, col, attacksOnly = false) { const piece = c.board[r][col]; if (!piece) return []; const color = chessColor(piece), lower = piece.toLowerCase(), moves = []; const add = (toR, toC, extra = {}) => { if (!inChessBoard(toR, toC)) return false; const target = c.board[toR][toC]; if (target && (chessColor(target) === color || (!attacksOnly && target.toLowerCase() === 'k'))) return false; moves.push({ from: { r, c: col }, to: { r: toR, c: toC }, piece, capture: target || null, ...extra }); return !target; };
  if (lower === 'p') { const direction = color === 'w' ? -1 : 1, start = color === 'w' ? 6 : 1, last = color === 'w' ? 0 : 7; [-1, 1].forEach(delta => { const toR = r + direction, toC = col + delta; if (!inChessBoard(toR, toC)) return; if (attacksOnly) { moves.push({ from: { r, c: col }, to: { r: toR, c: toC }, piece }); return; } if (c.board[toR][toC] && chessColor(c.board[toR][toC]) !== color) add(toR, toC, { promotion: toR === last ? 'q' : null }); if (c.enPassant && c.enPassant.r === toR && c.enPassant.c === toC) moves.push({ from: { r, c: col }, to: { r: toR, c: toC }, piece, enPassant: true }); }); if (!attacksOnly && inChessBoard(r + direction, col) && !c.board[r + direction][col]) { add(r + direction, col, { promotion: r + direction === last ? 'q' : null }); if (r === start && !c.board[r + direction * 2][col]) add(r + direction * 2, col, { doublePawn: true }); } return moves; }
  if (lower === 'n') { [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr, dc]) => add(r + dr, col + dc)); return moves; }
  if (lower === 'k') { [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr, dc]) => add(r + dr, col + dc)); if (!attacksOnly) { const enemy = chessOther(color), row = color === 'w' ? 7 : 0; if (!isChessCheck(c, color)) { if ((color === 'w' ? c.castling.wk : c.castling.bk) && !c.board[row][5] && !c.board[row][6] && c.board[row][7]?.toLowerCase() === 'r' && chessColor(c.board[row][7]) === color && !isChessSquareAttacked(c, row, 5, enemy) && !isChessSquareAttacked(c, row, 6, enemy)) moves.push({ from: { r, c: col }, to: { r: row, c: 6 }, piece, castle: 'king' }); if ((color === 'w' ? c.castling.wq : c.castling.bq) && !c.board[row][1] && !c.board[row][2] && !c.board[row][3] && c.board[row][0]?.toLowerCase() === 'r' && chessColor(c.board[row][0]) === color && !isChessSquareAttacked(c, row, 3, enemy) && !isChessSquareAttacked(c, row, 2, enemy)) moves.push({ from: { r, c: col }, to: { r: row, c: 2 }, piece, castle: 'queen' }); } } return moves; }
  const directions = lower === 'b' ? [[-1,-1],[-1,1],[1,-1],[1,1]] : lower === 'r' ? [[-1,0],[1,0],[0,-1],[0,1]] : [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]; directions.forEach(([dr, dc]) => { let toR = r + dr, toC = col + dc; while (inChessBoard(toR, toC)) { const target = c.board[toR][toC]; if (target && (chessColor(target) === color || (!attacksOnly && target.toLowerCase() === 'k'))) break; moves.push({ from: { r, c: col }, to: { r: toR, c: toC }, piece, capture: target || null }); if (target) break; toR += dr; toC += dc; } }); return moves; }
function isChessSquareAttacked(c, r, col, byColor) { for (let row = 0; row < 8; row++) for (let cell = 0; cell < 8; cell++) if (c.board[row][cell] && chessColor(c.board[row][cell]) === byColor && chessPseudoMoves(c, row, cell, true).some(move => move.to.r === r && move.to.c === col)) return true; return false; }
function isChessCheck(c, color) { for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) if (c.board[r][col] === (color === 'w' ? 'K' : 'k')) return isChessSquareAttacked(c, r, col, chessOther(color)); return true; }
function chessNotation(move) { const files = 'abcdefgh', ranks = '87654321'; let san = move.piece.toLowerCase() === 'p' ? '' : move.piece.toUpperCase(); if (move.capture) san += (san === '' ? files[move.from.c] : '') + 'x'; san += files[move.to.c] + ranks[move.to.r]; if (move.castle === 'king') return 'O-O'; if (move.castle === 'queen') return 'O-O-O'; if (move.promotion) san += '=' + move.promotion.toUpperCase(); return san; }
function applyChessMove(c, move) { 
  const piece = c.board[move.from.r][move.from.c]; const captured = c.board[move.to.r][move.to.c]; c.board[move.from.r][move.from.c] = ''; 
  if (move.enPassant) c.board[move.from.r][move.to.c] = ''; 
  if (move.castle === 'king') { c.board[move.to.r][5] = c.board[move.to.r][7]; c.board[move.to.r][7] = ''; } 
  if (move.castle === 'queen') { c.board[move.to.r][3] = c.board[move.to.r][0]; c.board[move.to.r][0] = ''; }
  let placed = piece; if (move.promotion) placed = chessColor(piece) === 'w' ? move.promotion.toUpperCase() : move.promotion.toLowerCase(); c.board[move.to.r][move.to.c] = placed;
  if (piece === 'K') { c.castling.wk = false; c.castling.wq = false; } if (piece === 'k') { c.castling.bk = false; c.castling.bq = false; } if (move.from.r === 7 && move.from.c === 0) c.castling.wq = false; if (move.from.r === 7 && move.from.c === 7) c.castling.wk = false; if (move.from.r === 0 && move.from.c === 0) c.castling.bq = false; if (move.from.r === 0 && move.from.c === 7) c.castling.bk = false; if (move.to.r === 7 && move.to.c === 0 && captured === 'R') c.castling.wq = false; if (move.to.r === 7 && move.to.c === 7 && captured === 'R') c.castling.wk = false; if (move.to.r === 0 && move.to.c === 0 && captured === 'r') c.castling.bq = false; if (move.to.r === 0 && move.to.c === 7 && captured === 'r') c.castling.bk = false;
  c.enPassant = piece.toLowerCase() === 'p' && Math.abs(move.from.r - move.to.r) === 2 ? { r: (move.from.r + move.to.r) / 2, c: move.from.c } : null; c.halfmove = piece.toLowerCase() === 'p' || captured || move.enPassant ? 0 : c.halfmove + 1; 
  c.moveLog.push(chessNotation(move)); c.moves.push(move); c.turn = chessOther(c.turn); const key = chessPositionKey(c); c.positions[key] = (c.positions[key] || 0) + 1; return c; 
}
function legalChessMoves(c, color = c.turn) { const moves = []; for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) if (c.board[r][col] && chessColor(c.board[r][col]) === color) chessPseudoMoves(c, r, col).forEach(move => { const next = copyChessConfig(c); applyChessMove(next, move); if (!isChessCheck(next, color)) moves.push(move); }); return moves; }
function chessDrawByMaterial(c) { const pieces = c.board.flat().filter(piece => piece && piece.toLowerCase() !== 'k'); return !pieces.length || (pieces.length === 1 && ['b', 'n'].includes(pieces[0].toLowerCase())); }
function chessResult(c) { const moves = legalChessMoves(c); if (!moves.length) return isChessCheck(c, c.turn) ? { type: 'mate', winner: chessOther(c.turn) } : { type: 'draw', reason: 'تعادل بالتعثر' }; if (c.halfmove >= 100) return { type: 'draw', reason: 'تعادل بخمسين نقلة' }; if ((c.positions[chessPositionKey(c)] || 0) >= 3) return { type: 'draw', reason: 'تعادل بتكرار الوضع' }; if (chessDrawByMaterial(c)) return { type: 'draw', reason: 'تعادل لعدم كفاية القطع' }; return null; }
function chessEvaluation(c) { 
  const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 }; 
  const centerBonus = [ 0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 10,10,10,10,0, 0,  0, 0, 10,25,25,10,0, 0,  0, 0, 10,25,25,10,0, 0,  0, 0, 10,10,10,10,0, 0,  0, 0, 0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0, 0, 0 ];
  return c.board.flat().reduce((score, piece, index) => piece ? score + (chessColor(piece) === 'b' ? 1 : -1) * (values[piece.toLowerCase()] + centerBonus[index]) : score, 0); 
}
function chessMinimax(c, depth, alpha = -Infinity, beta = Infinity) { const result = chessResult(c); if (result?.type === 'mate') return result.winner === 'b' ? 100000 : -100000; if (result || depth === 0) return chessEvaluation(c); const moves = legalChessMoves(c); if (c.turn === 'b') { let score = -Infinity; for (const move of moves) { score = Math.max(score, chessMinimax(applyChessMove(copyChessConfig(c), move), depth - 1, alpha, beta)); alpha = Math.max(alpha, score); if (beta <= alpha) break; } return score; } let score = Infinity; for (const move of moves) { score = Math.min(score, chessMinimax(applyChessMove(copyChessConfig(c), move), depth - 1, alpha, beta)); beta = Math.min(beta, score); if (beta <= alpha) break; } return score; }
function chooseChessMove(c) { const moves = legalChessMoves(c); if (c.difficulty === 'easy') return moves[Math.floor(Math.random() * moves.length)]; const depth = c.difficulty === 'hard' ? 2 : 1; let best = moves[0], value = -Infinity; moves.forEach(move => { const score = chessMinimax(applyChessMove(copyChessConfig(c), move), depth - 1); if (score > value || (score === value && Math.random() > .5)) { best = move; value = score; } }); return best; }
function renderChess() { 
  const c = session.config; const selected = c.selected; const turnLabel = c.thinking ? 'الكمبيوتر يفكر…' : `${c.turn === 'w' ? 'الأبيض' : 'الأسود'} عليه اللعب`; const check = isChessCheck(c, c.turn); const lastM = c.moves[c.moves.length - 1]; const animatedMove = c.animatedMove;
  $('#game-area').innerHTML = `<div class="chess-wrap-outer"><div class="chess-game"><div class="chess-status">${gameMeta(`<span>${turnLabel}${check ? ' · كش!' : ''}</span><span>${c.mode === 'computer' ? `ضد الكمبيوتر · ${c.difficulty === 'easy' ? 'هادئ' : c.difficulty === 'medium' ? 'متوسط' : 'متقدم'}` : 'لاعبان محليان'}</span>`)}<button id="resign-chess" class="tiny-button">إنهاء المباراة</button></div><div class="chess-board chess-theme-${state.profile.chessStyle || 'classic'}" dir="ltr">${c.board.map((row, r) => row.map((piece, col) => { const isSelected = selected?.r === r && selected?.c === col, available = c.legal?.some(move => move.to.r === r && move.to.c === col), isMovedPiece = animatedMove && (r === animatedMove.r && col === animatedMove.c), isLastMovePath = lastM && ((lastM.from.r === r && lastM.from.c === col) || (lastM.to.r === r && lastM.to.c === col)); return `<button class="chess-cell ${(r + col) % 2 ? 'dark-square' : 'light-square'} ${isSelected ? 'selected-piece' : ''} ${available ? 'legal-square' : ''} ${isLastMovePath ? 'last-move-highlight' : ''}" data-row="${r}" data-col="${col}" ${c.thinking ? 'disabled' : ''}>${piece ? `<span class="${isMovedPiece ? 'piece-anim' : ''}">${getChessSVG(piece)}</span>` : ''}</button>`; }).join('')).join('')}</div><p class="chess-help">${c.mode === 'computer' ? 'أنت تلعب بالأبيض. اختر القطعة ثم المربع المطلوب.' : 'يتناوب اللاعبان على الجهاز نفسه.'}</p></div><div class="chess-history-panel window-frame"><div class="titlebar"><span>سجل الحركات</span><span>📝</span></div><div class="history-list">${c.moveLog.reduce((acc, move, i) => { if(i%2===0) acc.push(`<b>${Math.floor(i/2)+1}.</b> <span>${move}</span>`); else acc[acc.length-1] += `<span>${move}</span>`; return acc; }, []).map(line => `<div class="history-row" dir="ltr">${line}</div>`).join('')}</div></div></div>`; 
  $$('.chess-cell').forEach(cell => cell.addEventListener('click', () => handleChessCell(Number(cell.dataset.row), Number(cell.dataset.col)))); $('#resign-chess').addEventListener('click', () => finishChess(c.mode === 'computer' ? 'b' : 'draw', c.mode === 'computer' ? 'أنهيت المباراة' : 'انتهت المباراة باتفاق اللاعبين')); const historyList = $('.history-list'); if(historyList) historyList.scrollTop = historyList.scrollHeight; if (animatedMove) requestAnimationFrame(() => { if (currentGame === 'chess' && session?.config === c && c.animatedMove === animatedMove) c.animatedMove = null; });
}
function handleChessCell(r, col) { if (document.querySelector('.promotion-picker')) return; const c = session.config; if (c.thinking || (c.mode === 'computer' && c.turn === 'b')) return; c.animatedMove = null; const piece = c.board[r][col], color = chessColor(piece); if (!c.selected) { if (piece && color === c.turn) { c.selected = { r, c: col }; c.legal = legalChessMoves(c).filter(move => move.from.r === r && move.from.c === col); renderChess(); } return; } const move = c.legal.find(item => item.to.r === r && item.to.c === col); if (!move) { c.selected = piece && color === c.turn ? { r, c: col } : null; c.legal = c.selected ? legalChessMoves(c).filter(item => item.from.r === r && item.from.c === col) : []; renderChess(); return; } if (move.promotion) return showChessPromotion(move); performChessMove(move, true); }
function showChessPromotion(move) { const picker = document.createElement('div'); picker.className = 'promotion-picker'; picker.innerHTML = `<span>الترقية</span>${['q', 'r', 'b', 'n'].map(piece => `<button data-promote="${piece}">${getChessSVG(chessColor(move.piece) === 'w' ? piece.toUpperCase() : piece)}</button>`).join('')}`; $('.chess-game').append(picker); $$('[data-promote]').forEach(button => button.addEventListener('click', () => { move.promotion = button.dataset.promote; picker.remove(); performChessMove(move, true); })); }
function performChessMove(move, human) { const c = session.config; applyChessMove(c, move); c.animatedMove = { r: move.to.r, c: move.to.c, id: c.moves.length }; c.selected = null; c.legal = []; if (human) { session.attempts++; session.correct++; } if (c.mode === 'computer' && c.turn === 'b') c.thinking = true; renderChess(); if (resolveChessResult()) return; if (c.thinking) { setTimeout(() => { if (currentGame !== 'chess' || !session?.config?.thinking) return; const aiMove = chooseChessMove(c); c.thinking = false; applyChessMove(c, aiMove); c.animatedMove = { r: aiMove.to.r, c: aiMove.to.c, id: c.moves.length }; renderChess(); resolveChessResult(); }, 260); } }
function resolveChessResult() { const result = chessResult(session.config); if (!result) return false; finishChess(result.type === 'mate' ? result.winner : 'draw', result.type === 'mate' ? 'كش ملك (انتهت المباراة)' : result.reason); return true; }
function finishChess(result, reason) { const c = session.config; const record = state.games.chess.chess || (state.games.chess.chess = defaultGameData().chess); const computer = c.mode === 'computer'; const winner = result === 'white' ? 'w' : result === 'black' ? 'b' : result; const playerWon = computer && winner === 'w'; if (computer) { if (winner === 'draw') { record.draws++; record.currentWinStreak = 0; } else if (playerWon) { record.wins++; record.currentWinStreak++; record.bestWinStreak = Math.max(record.bestWinStreak, record.currentWinStreak); } else { record.losses++; record.currentWinStreak = 0; } } const score = winner === 'draw' ? 55 : playerWon ? 140 : computer ? 15 : 90; updateSessionScore(score); const outcome = winner === 'draw' ? 'تعادل' : winner === 'w' ? 'فوز الأبيض' : 'فوز الأسود'; setTimeout(() => finishGame(playerWon || !computer, { completed: true, title: outcome, message: reason, scoreLine: computer ? `فوز ${record.wins} · خسارة ${record.losses} · تعادل ${record.draws}` : 'تم تسجيل نتيجة مباراة محلية', activity: `${outcome} في <b>نادي الشطرنج</b> · ${reason}` }), 1000); }

/* مواضع الحيوانات (Star Battle) */
const animalPalette = ['#6bae8e', '#7d74b3', '#bb875f', '#9bcf87', '#6f90c4', '#c3ca64', '#da8c9a', '#d2995f', '#62b7ba'];
function catStageSpec(level) { if (level <= 15) return { size: 5, name: 'أساسيات الاستنتاج' }; if (level <= 35) return { size: 7, name: 'مناطق مترابطة' }; return { size: 9, name: 'استنتاج متقدم' }; }
function makeCatSolution(size, random) { let colsArray = Array.from({length: size}, (_, i) => i); let valid = []; function solve(row, current) { if (row === size) { valid.push([...current]); return; } let cols = [...colsArray]; for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; } for (let col of cols) { if (current.some(c => c.col === col)) continue; let touching = false; for (let p of current) if (Math.abs(p.row - row) <= 1 && Math.abs(p.col - col) <= 1) { touching = true; break; } if (touching) continue; current.push({row, col}); solve(row+1, current); if (valid.length > 0) return; current.pop(); } } solve(0, []); return valid.length ? valid[0].map(p => p.row * size + p.col) : null; }
function growCatRegions(size, solution, random, level) { const grid = Array(size * size).fill(-1); const fronts = solution.map(idx => [idx]); solution.forEach((idx, reg) => grid[idx] = reg); let unassigned = size * size - size; let maxSizes = Array(size).fill(999); if (level <= 5) maxSizes[0] = 1; else if (level <= 10) maxSizes[0] = 2; else if (level <= 20) maxSizes[0] = 3; while (unassigned > 0) { let moved = false; for (let r = 0; r < size; r++) { if (fronts[r].length === 0) continue; if (grid.filter(val => val === r).length >= maxSizes[r]) { fronts[r] = []; continue; } const frontIdx = Math.floor(random() * fronts[r].length); const cell = fronts[r][frontIdx]; const row = Math.floor(cell / size), col = cell % size; const neighbors = []; [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc]) => { const nr = row+dr, nc = col+dc; if (nr>=0 && nr<size && nc>=0 && nc<size && grid[nr*size+nc] === -1) neighbors.push(nr*size+nc); }); if (neighbors.length > 0) { const nextCell = neighbors[Math.floor(random() * neighbors.length)]; grid[nextCell] = r; fronts[r].push(nextCell); unassigned--; moved = true; } else { fronts[r].splice(frontIdx, 1); } } if (!moved && unassigned > 0) return null; } return grid; }
function countCatSolutions(size, grid) { let count = 0; const cols = new Set(), regions = new Set(), cats = []; function solve(row) { if (count > 1) return; if (row === size) { count++; return; } for (let col = 0; col < size; col++) { const idx = row * size + col; const reg = grid[idx]; if (cols.has(col) || regions.has(reg)) continue; let touching = false; for (const prev of cats) { const pr = Math.floor(prev / size), pc = prev % size; if (Math.abs(pr - row) <= 1 && Math.abs(pc - col) <= 1) { touching = true; break; } } if (touching) continue; cols.add(col); regions.add(reg); cats.push(idx); solve(row + 1); cols.delete(col); regions.delete(reg); cats.pop(); } } solve(0); return count; }
function makeAnimalLevel(level) { const spec = catStageSpec(level); let attempt = 0; while (attempt < 2000) { attempt++; const random = seeded(level * 10000 + attempt); const solution = makeCatSolution(spec.size, random); if (!solution) continue; const grid = growCatRegions(spec.size, solution, random, level); if (!grid) continue; if (countCatSolutions(spec.size, grid) === 1) { return { level, size: spec.size, cats: spec.size, name: spec.name, solution, grid, cells: Array(spec.size * spec.size).fill(''), invalid: new Set() }; } } return null; }
function clearAnimalMarkTimers() { animalMarkTimers.forEach(timer => clearTimeout(timer)); animalMarkTimers.clear(); if (pendingAnimalTouchTap) clearTimeout(pendingAnimalTouchTap.timer); pendingAnimalTouchTap = null; suppressAnimalClickUntil = 0; }
function startAnimals() { clearInterval(session.timer); clearAnimalMarkTimers(); const unlocked = Math.min(50, Math.max(1, highestCompleted('animals') + 1)); $('#game-area').innerHTML = `<div class="level-library animal-library"><div class="library-heading"><div><p class="prompt-label">التفكير بالتقاطع والاستبعاد</p><h2>اختر مرحلة لعبة القط</h2><p>كل مرحلة هنا مبنية رياضياً، ولها حل منطقي واحد يكتشف بالتدريج.</p></div><div class="library-badge cat-library-badge">${catAsset('cat.png', 'library-cat-image', 'لعبة القط')}<small>${completedLevels(state, 'animals')} / 50</small></div></div><label class="timed-toggle"><input id="animal-timed" type="checkbox" /> تحدي وقت اختياري</label><div class="level-grid cat-level-grid">${Array.from({ length: 50 }, (_, i) => levelProgressCard('animals', i + 1, `مرحلة ${i + 1}`, i + 1 > unlocked)).join('')}</div></div>`; $$('.level-card:not(.locked)').forEach(button => button.addEventListener('click', () => launchAnimals(Number(button.dataset.level), $('#animal-timed').checked))); }
function launchAnimals(level, timed) { const data = makeAnimalLevel(level); session.startedAt = Date.now(); session.score = 0; session.attempts = 0; session.correct = 0; session.streak = 0; session.config = { ...data, hints: level <= 10 ? 3 : level <= 24 ? 2 : 1, hearts: 3, timed, timeLimit: timed ? Math.max(70, 165 - level * 2) : 0 }; beginTimer(); if (timed) session.limitTimer = setInterval(() => { const seconds = Math.floor((Date.now() - session.startedAt) / 1000); if (seconds >= session.config.timeLimit) failAnimals('انتهى وقت التحدي'); }, 800); renderAnimals(); }
function renderAnimals() { const c = session.config; const placed = c.cells.filter(value => value === 'animal').length; const timeInfo = c.timed ? `<span>الوقت المتبقي: <b>${Math.max(0, c.timeLimit - Math.floor((Date.now() - session.startedAt) / 1000))} ث</b></span>` : '<span>وضع هادئ</span>'; const tutorial = c.level <= 3 ? `<div class="cat-tutorial"><b>تعلّم المنطق</b><span>1️⃣ قط واحد فقط في كل منطقة ملونة.</span><span>2️⃣ قط واحد فقط في كل صف وعمود.</span><span>3️⃣ القطط لا تتلامس أبداً (حتى بالزوايا).</span></div>` : ''; $('#game-area').innerHTML = `<div class="animals-wrap"><div class="animal-rules"><div><span>قط واحد لكل منطقة</span><span>↔ قط واحد للـ(صف/عمود)</span><span>╳ لا تلامس</span></div>${gameMeta(`<span>المرحلة ${c.level} · ${c.name}</span><span>القطط: <b>${placed}/${c.cats}</b></span>${timeInfo}`)}</div>${tutorial}<div class="animal-board cat-grid cat-grid-${c.size}" style="--animal-size:${c.size}">${c.cells.map((value, index) => { const row = Math.floor(index / c.size), col = index % c.size, region = c.grid[row * c.size + col], color = animalPalette[region % animalPalette.length]; const content = value === 'animal' ? catAsset('cat.png', 'found-cat-image', 'قط تم العثور عليه') : value === 'mark' ? '×' : value === 'bad' ? '<span class="bad-x">×</span>' : ''; return `<button class="animal-cell ${value === 'mark' ? 'marked' : ''} ${value === 'bad' ? 'bad-choice' : ''}" style="--cell-color:${color}" data-animal-cell="${index}">${content}</button>`; }).join('')}</div><div class="animal-controls"><div class="animal-gesture-guide"><span class="mouse-gesture">نقرة واحدة <b>×</b> للاستبعاد</span><i class="mouse-gesture">·</i><span class="mouse-gesture">نقرتان <b>ضع القط</b> في المربع</span><span class="touch-gesture">لمسة <b>×</b> للاستبعاد · لمستان <b>لوضع القط</b></span></div><div class="animal-bottom-strip"><span class="heart-count">${'❤️'.repeat(c.hearts)}${'🖤'.repeat(3 - c.hearts)}</span><div id="hint-animals" class="hint-orb ${c.hints ? '' : 'spent'}" role="button" tabindex="0">💡 <b>${c.hints}</b><small>تلميح</small></div><button id="restart-cats" class="restart-cats">↻ <small>إعادة المرحلة</small></button><span class="animal-count"><b>${placed}/${c.cats}</b><small>القطط</small></span></div></div></div>`; $$('.animal-cell').forEach(cell => { const index = Number(cell.dataset.animalCell); cell.addEventListener('pointerdown', event => handleAnimalTouchStart(event)); cell.addEventListener('pointerup', event => handleAnimalTouchEnd(event, index)); cell.addEventListener('click', () => { if (Date.now() >= suppressAnimalClickUntil) scheduleAnimalMark(index); }); cell.addEventListener('dblclick', event => { if (Date.now() < suppressAnimalClickUntil) return; event.preventDefault(); chooseAnimalCell(index); }); }); $('#hint-animals').addEventListener('click', hintAnimals); $('#restart-cats').addEventListener('click', () => launchAnimals(c.level, c.timed)); }
function scheduleAnimalMark(index, delay = 210) { clearTimeout(animalMarkTimers.get(index)); animalMarkTimers.set(index, setTimeout(() => { animalMarkTimers.delete(index); queueAnimalMark(index); }, delay)); }
function handleAnimalTouchStart(event) { if (event.pointerType !== 'mouse') primeAnimalAudio(); }
function handleAnimalTouchEnd(event, index) { if (event.pointerType === 'mouse') return; const now = Date.now(); suppressAnimalClickUntil = now + 700; if (pendingAnimalTouchTap && pendingAnimalTouchTap.index === index && now - pendingAnimalTouchTap.at <= 300) { clearTimeout(pendingAnimalTouchTap.timer); clearTimeout(animalMarkTimers.get(index)); animalMarkTimers.delete(index); pendingAnimalTouchTap = null; chooseAnimalCell(index); return; } if (pendingAnimalTouchTap) { clearTimeout(pendingAnimalTouchTap.timer); queueAnimalMark(pendingAnimalTouchTap.index); pendingAnimalTouchTap = null; } const timer = setTimeout(() => { animalMarkTimers.delete(index); if (pendingAnimalTouchTap?.timer === timer) pendingAnimalTouchTap = null; queueAnimalMark(index); }, 300); animalMarkTimers.set(index, timer); pendingAnimalTouchTap = { index, at: now, timer }; }
function queueAnimalMark(index) { const c = session.config; if (c.cells[index] === 'bad' || c.cells[index] === 'animal') return; const marked = c.cells[index] !== 'mark'; c.cells[index] = marked ? 'mark' : ''; c.invalid.delete(index); session.attempts++; const cell = document.querySelector(`[data-animal-cell="${index}"]`); if (cell) { cell.classList.toggle('marked', marked); cell.innerHTML = marked ? '×' : ''; if (marked) playAnimalSound('cross.mp3'); } }
function chooseAnimalCell(index) { clearTimeout(animalMarkTimers.get(index)); animalMarkTimers.delete(index); const c = session.config; session.attempts++; if (!c.solution.includes(index)) { c.cells[index] = 'bad'; c.invalid.add(index); c.hearts--; playAnimalSound('wrongcross.mp3'); renderAnimals(); animateBrokenHeart(index); if (c.hearts <= 0) setTimeout(() => failAnimals('استُهلكت القلوب في هذه المحاولة'), 520); return; } c.cells[index] = 'animal'; c.invalid.delete(index); session.correct++; playAnimalSound('foundcat.mp3'); renderAnimals(); if (c.cells.filter(value => value === 'animal').length === c.cats) setTimeout(finishAnimals, 380); }
function animateBrokenHeart(index) { const cell = document.querySelector(`[data-animal-cell="${index}"]`); if (!cell) return; const heart = document.createElement('span'); heart.className = 'broken-heart-pop'; heart.textContent = '💔'; cell.append(heart); }
function hintAnimals() { const c = session.config; if (!c.hints) return; const index = c.solution.find(cell => c.cells[cell] !== 'animal'); if (index === undefined) return; c.cells[index] = 'animal'; c.hints--; session.correct++; playAnimalSound('foundcat.mp3'); showToast('وُضع قط في موضع صحيح ✦'); renderAnimals(); if (c.cells.filter(value => value === 'animal').length === c.cats) setTimeout(finishAnimals, 380); }
function finishAnimals() { const c = session.config; clearInterval(c.limitTimer); const stars = c.hearts === 3 && c.hints === 3 ? 3 : c.hearts >= 2 ? 2 : 1; updateSessionScore(70 + c.level * 4 + stars * 12 + (c.timed ? 25 : 0)); finishGame(true, { level: c.level, stars, nextLevel: c.level < 50 ? c.level + 1 : null, title: 'حل منطقي رائع!', message: `أكملت المرحلة ${c.level} بتقييم ${'★'.repeat(stars)}.`, scoreLine: `${fmtTime(Math.max(1, Math.round((Date.now() - session.startedAt) / 1000)))} · ${c.hearts} قلوب متبقية` }); }
function failAnimals(reason) { clearInterval(session.limitTimer); updateSessionScore(8); finishGame(false, { level: session.config.level, title: 'جولة جديدة قريبًا', message: reason, scoreLine: 'المنطق هو مفتاح الحل، حاول مجدداً.' }); }

/* ==========================================================================
   مختبر التفكير (المركز الرئيسي + لعبة المناطق والحدود الجديدة المبرمجة بالكامل)
========================================================================== */
const fenceLevels = [
  {
    id: 1, stars: 1, points: 10, title: 'البداية', cols: 6, rows: 6, numFences: 1,
    targetAnimals: 5, targetBeaverRegions: 2, targetBeaversPerRegion: 3,
    grid: [
      ['B', 'F', '.', '.', '.', 'B'],
      ['.', '.', 'B', 'B', '.', '.'],
      ['.', 'B', '.', '.', '.', 'F'],
      ['.', '.', '.', 'F', '.', '.'],
      ['.', '.', '.', '.', 'F', '.'],
      ['.', '.', '.', 'B', '.', '.']
    ],
    initFences: [[0, 1, 0, 3, 2, 2]]
  },
  {
    id: 2, stars: 2, points: 20, title: 'توازن دقيق', cols: 8, rows: 6, numFences: 1,
    targetAnimals: 6, targetBeaverRegions: 2, targetBeaversPerRegion: 3,
    grid: [
      ['B', 'F', '.', '.', '.', '.', 'B', '.'],
      ['.', '.', 'B', '.', 'F', '.', '.', '.'],
      ['.', '.', '.', 'B', '.', 'B', '.', 'F'],
      ['F', '.', '.', '.', 'F', '.', '.', '.'],
      ['.', '.', '.', '.', '.', 'F', '.', '.'],
      ['.', '.', '.', '.', '.', 'B', '.', '.']
    ],
    initFences: [[1, 1, 2, 3, 3, 3]]
  },
  {
    id: 3, stars: 3, points: 30, title: 'ثلاث مناطق', cols: 10, rows: 6, numFences: 2,
    targetAnimals: 5, targetBeaverRegions: 3, targetBeaversPerRegion: 2,
    grid: [
      ['B', 'F', '.', '.', 'F', '.', '.', '.', 'B', '.'],
      ['.', '.', 'B', '.', '.', 'B', '.', 'B', '.', '.'],
      ['.', '.', '.', 'F', '.', 'F', '.', '.', '.', 'F'],
      ['.', '.', '.', '.', 'B', '.', '.', '.', 'F', '.'],
      ['.', '.', '.', '.', '.', '.', 'F', 'B', '.', '.'],
      ['.', '.', '.', '.', '.', '.', 'B', '.', '.', '.']
    ],
    initFences: [[3, 1, 2, 3, 3, 3], [6, 6, 6, 6, 6, 6]]
  },
  {
    id: 4, stars: 4, points: 45, title: 'الممرات الكبرى', cols: 12, rows: 6, numFences: 3,
    targetAnimals: 5, targetBeaverRegions: 4, targetBeaversPerRegion: 2,
    grid: [
      ['B', 'F', '.', 'F', 'B', '.', '.', 'B', '.', 'B', '.', '.'],
      ['.', '.', 'B', '.', '.', 'B', 'F', '.', '.', '.', 'F', '.'],
      ['.', 'F', '.', '.', 'F', '.', '.', '.', 'B', '.', '.', 'B'],
      ['.', '.', '.', 'B', '.', '.', '.', 'F', '.', 'F', '.', '.'],
      ['.', '.', '.', '.', '.', 'B', 'B', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.', 'B', '.']
    ],
    initFences: [[0, 1, 0, 2, 2, 2], [5, 5, 5, 5, 5, 5], [8, 8, 8, 8, 8, 8]]
  }
];

function startLogic() {
  clearInterval(session?.timer);
  $('#game-area').innerHTML = `
    <div class="logic-hub">
      <div class="library-heading">
        <div><p class="prompt-label">ألغاز منطقية</p><h2>مختبر التفكير</h2><p>اختر لعبة من المختبر. ستظهر هنا ألعاب استنتاج وتخطيط جديدة مع الوقت.</p></div>
        <div class="library-badge">🧠<small>قريبًا</small></div>
      </div>
      <div class="logic-games-grid">
        <button class="logic-game-card logic-game-available" data-logic-game="fences">
          <span class="logic-game-icon">🧩</span>
          <span class="logic-game-copy"><b>المناطق والحدود</b><small>حرّك الأسوار، ووازن الحيوانات والقنادس بين المناطق.</small><i>4 مراحل متدرجة ←</i></span>
        </button>
        <button class="logic-game-card logic-game-available nut-hub-card" data-logic-game="nuts">
          <span class="logic-game-icon">🌰</span>
          <span class="logic-game-copy"><b>البندق</b><small>اكتشف قطعة الشوكولاتة التي تخبئ حبة بندق إضافية.</small><i>4 مراحل استنتاجية ←</i></span>
        </button>
      </div>
    </div>
  `;
  $('[data-logic-game="fences"]').addEventListener('click', showFenceLevelSelection);
  $('[data-logic-game="nuts"]').addEventListener('click', () => launchNutGame(1));
}

function showFenceLevelSelection() {
  clearInterval(session?.timer);
  $('#game-area').innerHTML = `
    <div class="logic-hub">
      <div class="library-heading fence-library-heading">
        <div><button class="logic-back" id="logic-hub-back">← مختبر التفكير</button><p class="prompt-label">لعبة منطقية</p><h2>المناطق والحدود</h2><p>حرّك أجزاء السياج عبر الضغط على الحيوانات المجاورة له، حتى تصبح كل منطقة متوازنة.</p></div>
        <div class="library-badge">🧩<small>4 مراحل</small></div>
      </div>
      <div class="fence-level-selection">
        <p class="fence-selection-title">اختر مستوى التحدي</p>
        <div class="fence-levels-grid">
          ${fenceLevels.map(level => {
            const saved = getLevelData('logic', level.id);
            return `<button class="fence-level-btn" data-fence-level="${level.id}"><span class="stars">${'★'.repeat(level.stars)}${'☆'.repeat(4 - level.stars)}</span><h3>المستوى ${level.id}: ${level.title}</h3><p>${level.numFences + 1} مناطق · ${level.targetAnimals} حيوانات في كل منطقة ${saved.completed ? '· مكتمل ✓' : ''}</p></button>`;
          }).join('')}
        </div>
      </div>
    </div>`;
  $('#logic-hub-back').addEventListener('click', startLogic);
  $$('[data-fence-level]').forEach(button => button.addEventListener('click', () => launchFenceGame(Number(button.dataset.fenceLevel))));
}

function cloneFences(fences) { return fences.map(fence => [...fence]); }

function launchFenceGame(levelId) {
  const levelData = fenceLevels.find(level => level.id === levelId);
  if (!levelData) return;
  clearInterval(session?.timer);
  session.startedAt = Date.now(); session.score = 0; session.attempts = 0; session.correct = 0; session.streak = 0;
  session.config = { level: levelId, data: levelData, fences: cloneFences(levelData.initFences), history: [] };
  beginTimer();
  renderFenceGame();
}

function fenceRegionForCell(row, col) {
  const c = session.config;
  return c.fences.reduce((region, fence) => region + (col > fence[row] ? 1 : 0), 0);
}

function calculateFenceStats() {
  const { data: level } = session.config;
  const stats = Array.from({ length: level.numFences + 1 }, () => ({ total: 0, beavers: 0 }));
  level.grid.forEach((row, rowIndex) => row.forEach((animal, colIndex) => {
    if (animal === '.') return;
    const region = fenceRegionForCell(rowIndex, colIndex);
    stats[region].total++;
    if (animal === 'B') stats[region].beavers++;
  }));
  return stats;
}

function fenceMoveAt(row, col) {
  const c = session.config; const level = c.data;
  if (!['B', 'F'].includes(level.grid[row][col])) return null;
  for (let fenceIndex = 0; fenceIndex < level.numFences; fenceIndex++) {
    const current = c.fences[fenceIndex][row];
    const min = fenceIndex ? c.fences[fenceIndex - 1][row] + 1 : 0;
    const max = fenceIndex < level.numFences - 1 ? c.fences[fenceIndex + 1][row] - 1 : level.cols - 2;
    if (current === col && current - 1 >= min) return { fenceIndex, next: current - 1 };
    if (current === col - 1 && current + 1 <= max) return { fenceIndex, next: current + 1 };
  }
  return null;
}

function fencePath(fence, level) {
  const cellWidth = 100 / level.cols; const cellHeight = 100 / level.rows;
  let path = `M ${(fence[0] + 1) * cellWidth} 0`;
  fence.forEach((position, row) => {
    const x = (position + 1) * cellWidth;
    const bottom = (row + 1) * cellHeight;
    if (row && fence[row - 1] !== position) path += ` L ${x} ${row * cellHeight}`;
    path += ` L ${x} ${bottom}`;
  });
  return path;
}

function fenceStatCard(stat, level, index) {
  const animalsOk = stat.total === level.targetAnimals;
  const beaversOk = stat.beavers >= level.targetBeaversPerRegion;
  return `<article class="fence-stat-card ${animalsOk && beaversOk ? 'is-good' : ''}"><small>المنطقة ${index + 1}</small><div><span>حيوانات</span><b>${stat.total}</b><i class="${animalsOk ? 'ok' : 'bad'}">${animalsOk ? '✓' : '×'}</i></div><div><span>قنادس</span><b>${stat.beavers}</b><i class="${beaversOk ? 'ok' : 'bad'}">${beaversOk ? '✓' : '×'}</i></div></article>`;
}

function renderFenceGame() {
  const c = session.config; const level = c.data; const stats = calculateFenceStats();
  const boardCells = level.grid.map((row, rowIndex) => row.map((animal, colIndex) => {
    const region = fenceRegionForCell(rowIndex, colIndex); const move = fenceMoveAt(rowIndex, colIndex);
    const animalClass = animal === 'B' ? 'beaver' : animal === 'F' ? 'fox' : 'empty';
    const icon = animal === 'B' ? '🦫' : animal === 'F' ? '🦊' : '';
    const label = animal === 'B' ? 'قندس' : animal === 'F' ? 'ثعلب' : 'خلية فارغة';
    return `<button class="fence-cell region-${region} ${animalClass} ${move ? 'can-move' : ''}" data-r="${rowIndex}" data-c="${colIndex}" ${move ? '' : 'disabled'} aria-label="${label}${move ? '، حرّك السياج' : ''}">${icon}</button>`;
  }).join('')).join('');
  const fenceLines = c.fences.map(fence => `<path d="${fencePath(fence, level)}" class="fence-line" />`).join('');
  const tabButtons = fenceLevels.map(item => {
    const progress = getLevelData('logic', item.id);
    return `<button class="fence-star-tab ${item.id === level.id ? 'active' : ''}" data-fence-tab="${item.id}" aria-label="المستوى ${item.id}">${'★'.repeat(item.stars)}${'☆'.repeat(4 - item.stars)}${progress.completed ? '<em>✓</em>' : ''}</button>`;
  }).join('');
  const beaverGoalText = `${level.targetBeaverRegions} من المناطق فيها ${level.targetBeaversPerRegion}+ قنادس`;

  $('#game-area').innerHTML = `
    <section class="fence-game-container" aria-label="لعبة المناطق والحدود">
      <header class="fence-top-nav"><div><p class="fence-kicker">لغز المنطق</p><h2>المناطق والحدود</h2></div><div class="fence-star-tabs" aria-label="مستويات اللعبة">${tabButtons}</div></header>
      <div class="fence-main-area">
        <aside class="fence-instructions"><div class="fence-inst-header">المهمة المطلوبة</div><div class="fence-inst-body"><p>اضغط على <b>قندس</b> أو <b>ثعلب</b> ملاصق للسياج لتحريك الجزء القريب منه.</p><p class="fence-rule-label">المناطق المستهدفة</p><ul><li>كل منطقة تضم بالضبط <b>${level.targetAnimals}</b> حيوانات.</li><li><b>${beaverGoalText}</b>.</li></ul><div class="fence-legend"><span>🦫 قندس</span><span>🦊 ثعلب</span></div></div></aside>
        <div class="fence-board-col">
          <div class="fence-stats-row">${stats.map((stat, index) => fenceStatCard(stat, level, index)).join('')}</div>
          <div class="fence-board-wrapper" style="--cols:${level.cols}; --rows:${level.rows};"><div class="fence-grid">${boardCells}</div><svg class="fence-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${fenceLines}</svg></div>
          <button class="fence-btn undo" id="btn-fence-undo" ${c.history.length ? '' : 'disabled'}>↶ تراجع</button>
        </div>
      </div>
      <div class="fence-actions-row"><button class="fence-btn verify" id="btn-fence-verify">تحقق</button><button class="fence-btn restart" id="btn-fence-restart">ابدأ من جديد</button></div>
    </section>`;

  $$('[data-fence-tab]').forEach(button => button.addEventListener('click', () => launchFenceGame(Number(button.dataset.fenceTab))));
  $$('.fence-cell.can-move').forEach(cell => cell.addEventListener('click', () => handleFenceClick(Number(cell.dataset.r), Number(cell.dataset.c))));
  $('#btn-fence-undo').addEventListener('click', () => { if (!c.history.length) return; c.fences = c.history.pop(); renderFenceGame(); });
  $('#btn-fence-restart').addEventListener('click', () => { c.history.push(cloneFences(c.fences)); c.fences = cloneFences(level.initFences); renderFenceGame(); });
  $('#btn-fence-verify').addEventListener('click', verifyFenceSolution);
}

function handleFenceClick(row, col) {
  const move = fenceMoveAt(row, col); const c = session.config;
  if (!move) return;
  c.history.push(cloneFences(c.fences)); c.fences[move.fenceIndex][row] = move.next;
  session.attempts++; session.correct++; renderFenceGame();
}

function verifyFenceSolution() {
  const c = session.config; const level = c.data; const stats = calculateFenceStats();
  const animalsBalanced = stats.every(stat => stat.total === level.targetAnimals);
  const beaverRegions = stats.filter(stat => stat.beavers >= level.targetBeaversPerRegion).length;
  if (!animalsBalanced || beaverRegions < level.targetBeaverRegions) {
    showToast('الحل غير مطابق للشروط بعد؛ راجع البطاقات أو حرّك السياج مرة أخرى.');
    return;
  }
  updateSessionScore(level.points + Math.max(0, 8 - c.history.length) * 2);
  const next = fenceLevels.find(item => item.id === level.id + 1);
  finishGame(true, {
    level: level.id, stars: level.stars, completed: true, nextLevel: next?.id,
    onNext: next ? () => launchFenceGame(next.id) : null,
    title: 'تقسيم ممتاز!', message: `أنشأت ${stats.length} مناطق متوازنة وحققت شرط القنادس.`,
    scoreLine: `المستوى ${level.id} · ${fmtTime(Math.max(1, Math.round((Date.now() - session.startedAt) / 1000)))}`
  });
}

/* ===========================================================================
   البندق — استنتج مكان حبة البندق الإضافية داخل قالب الشوكولاتة
=========================================================================== */
const nutLevels = [
  {
    id: 1, stars: 1, points: 12, rows: 2, cols: 4, queryLimit: 0, queryMode: 'none', perfectQuestions: 0,
    referenceNuts: [[0, 2], [1, 1], [1, 3]], targetNuts: [[0, 2], [1, 0], [1, 1], [1, 3]]
  },
  {
    id: 2, stars: 2, points: 22, rows: 2, cols: 4, queryLimit: 3, queryMode: 'target', perfectQuestions: 2,
    referenceNuts: [[0, 0], [1, 2]], targetNuts: [[0, 0], [1, 2], [1, 3]]
  },
  {
    id: 3, stars: 3, points: 34, rows: 8, cols: 8, queryLimit: 6, queryMode: 'both', perfectQuestions: 4,
    referenceNuts: [[0,0], [0,5], [1,2], [1,7], [2,4], [3,1], [3,6], [4,3], [5,0], [5,5], [6,2], [7,6]],
    targetNuts: [[0,0], [0,5], [1,2], [1,7], [2,4], [3,1], [3,6], [4,3], [4,6], [5,0], [5,5], [6,2], [7,6]]
  },
  {
    id: 4, stars: 4, points: 48, rows: 8, cols: 8, queryLimit: 3, queryMode: 'both', perfectQuestions: 3,
    referenceNuts: [[0,1], [0,6], [1,3], [2,0], [2,5], [3,2], [3,7], [4,4], [5,1], [5,6], [6,3], [6,7], [7,0], [7,5]],
    targetNuts: [[0,1], [0,6], [1,3], [2,0], [2,5], [3,2], [3,7], [4,4], [5,1], [5,6], [6,3], [6,7], [7,0], [7,4], [7,5]]
  }
];

function nutLevelProgress(level) { return getLevelData('logic', `nuts-${level.id}`); }
function nutCellKey(row, col) { return `${row}-${col}`; }
function nutContains(level, board, row, col) { return (board === 'reference' ? level.referenceNuts : level.targetNuts).some(([nutRow, nutCol]) => nutRow === row && nutCol === col); }
function nutRegionIncludes(region, row, col) { if (!region) return false; const minRow = Math.min(region.start.row, region.end.row), maxRow = Math.max(region.start.row, region.end.row), minCol = Math.min(region.start.col, region.end.col), maxCol = Math.max(region.start.col, region.end.col); return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol; }
function nutRegionCount(level, board, region) { if (!region) return 0; return (board === 'reference' ? level.referenceNuts : level.targetNuts).filter(([row, col]) => nutRegionIncludes(region, row, col)).length; }
function nutRegionLabel(region) { if (!region) return ''; const rows = Math.abs(region.end.row - region.start.row) + 1, cols = Math.abs(region.end.col - region.start.col) + 1; return `${rows} × ${cols}`; }

function launchNutGame(levelId) {
  const level = nutLevels.find(item => item.id === levelId);
  if (!level) return;
  clearInterval(session?.timer);
  session.startedAt = Date.now(); session.score = 0; session.attempts = 0; session.correct = 0; session.streak = 0;
  session.config = { nutGame: true, nutLevel: level, level: `nuts-${level.id}`, queries: 0, selections: { reference: null, target: null }, anchors: { reference: null, target: null }, flag: null, placingFlag: false, mistakes: 0, lastAnswer: '' };
  beginTimer();
  renderNutGame();
}

function nutBoardHTML(level, board) {
  const c = session.config; const visible = level.queryMode === 'none' || (level.queryMode === 'target' && board === 'reference');
  const cells = [];
  for (let row = 0; row < level.rows; row++) for (let col = 0; col < level.cols; col++) {
    const hasNut = nutContains(level, board, row, col); const selected = nutRegionIncludes(c.selections[board], row, col);
    const flagged = c.flag?.board === board && c.flag.row === row && c.flag.col === col;
    cells.push(`<button class="nut-cell ${visible ? 'chocolate' : 'covered'} ${selected ? 'selected-region' : ''} ${flagged ? 'flagged' : ''}" data-nut-board="${board}" data-nut-row="${row}" data-nut-col="${col}" aria-label="${board === 'target' ? 'قطعة الشوكولاتة المجهولة' : 'قطعة الشوكولاتة المرجعية'}">${visible && hasNut ? '<span class="nut-kernel">🌰</span>' : ''}${flagged ? '<span class="nut-flag-mark">⚑</span>' : ''}</button>`);
  }
  const count = board === 'reference' ? level.referenceNuts.length : level.targetNuts.length;
  return `<article class="nut-board-card ${board}"><h3>${count} حبة من البندق</h3><div class="nut-board" style="--nut-cols:${level.cols}; --nut-rows:${level.rows};">${cells.join('')}</div>${c.selections[board] ? `<small class="nut-selection-note">المنطقة: ${nutRegionLabel(c.selections[board])}</small>` : ''}</article>`;
}

function renderNutGame() {
  const c = session.config; const level = c.nutLevel; const needsBoth = level.queryMode === 'both';
  const canAsk = level.queryMode === 'target' ? Boolean(c.selections.target) : needsBoth ? Boolean(c.selections.reference && c.selections.target) : false;
  const tabs = nutLevels.map(item => { const progress = nutLevelProgress(item); return `<button class="nut-level-tab ${item.id === level.id ? 'active' : ''}" data-nut-level="${item.id}">${'★'.repeat(item.stars)}${'☆'.repeat(4 - item.stars)}${progress.completed ? '<em>✓</em>' : ''}</button>`; }).join('');
  const queryText = level.queryMode === 'target' ? 'اختر زاويتين لتحديد منطقة في القالب الفضي، ثم اسأل عن عدد حبات البندق فيها.' : level.queryMode === 'both' ? 'اختر زاويتين في كل قالب لتحديد منطقتين، ثم قارن عدد حبات البندق فيهما.' : 'قارن القالبين المرئيين وحدد المربع الذي يحتوي على حبة البندق الإضافية.';
  const answer = c.lastAnswer ? `<p class="nut-answer" aria-live="polite">${c.lastAnswer}</p>` : '';
  $('#game-area').innerHTML = `
    <section class="nut-game" aria-label="لعبة البندق">
      <header class="nut-top-nav"><div><button class="logic-back" id="nut-back-hub">← مختبر التفكير</button><p>لعبة استنتاج</p><h2>🌰 البندق</h2></div><div class="nut-level-tabs">${tabs}</div></header>
      <div class="nut-main-area">
        <aside class="nut-instructions"><div class="nut-inst-header">المهمة المطلوبة</div><div class="nut-inst-body"><p>قم بإيجاد الفرق بين قالبي الشوكولاتة.</p><p>${queryText}</p><div class="nut-demo"><span class="demo-square">🌰</span><i>+</i><span class="demo-square">⚑</span></div><p class="nut-final-rule">ضع العلم على قطعة الشوكولاتة التي تحتوي على حبة البندق الإضافية.</p></div></aside>
        <div class="nut-play-area">
          <div class="nut-boards-row">${nutBoardHTML(level, 'target')}<span class="nut-divider" aria-hidden="true"></span>${nutBoardHTML(level, 'reference')}</div>
          <div class="nut-tools">
            <button class="nut-flag-tool ${c.placingFlag ? 'active' : ''}" id="nut-flag-tool" draggable="true">⚑ <span>${c.placingFlag ? 'اختر مربعًا في القالب الفضي' : 'ضع العلم'}</span></button>
            ${level.queryMode !== 'none' ? `<button class="nut-query-btn" id="nut-query" ${canAsk && c.queries < level.queryLimit ? '' : 'disabled'}>▦ كم عدد حبات البندق؟</button><span class="nut-query-count">عدد الأسئلة المطروحة <b>${c.queries}</b> / ${level.queryLimit}</span><button class="nut-clear-selection" id="nut-clear-selection">مسح التحديد</button>` : '<span class="nut-query-count">لا تحتاج هذه المرحلة إلى طرح أسئلة.</span>'}
          </div>
          ${answer}
        </div>
      </div>
    </section>`;
  $('#nut-back-hub').addEventListener('click', startLogic);
  $$('[data-nut-level]').forEach(button => button.addEventListener('click', () => launchNutGame(Number(button.dataset.nutLevel))));
  $$('.nut-cell').forEach(cell => {
    cell.addEventListener('click', () => chooseNutCell(cell.dataset.nutBoard, Number(cell.dataset.nutRow), Number(cell.dataset.nutCol)));
    cell.addEventListener('dragover', event => { if (cell.dataset.nutBoard === 'target') event.preventDefault(); });
    cell.addEventListener('drop', event => { event.preventDefault(); if (cell.dataset.nutBoard === 'target') placeNutFlag(Number(cell.dataset.nutRow), Number(cell.dataset.nutCol)); });
  });
  $('#nut-flag-tool').addEventListener('click', () => { c.placingFlag = !c.placingFlag; renderNutGame(); });
  $('#nut-flag-tool').addEventListener('dragstart', event => { event.dataTransfer.setData('text/plain', 'nut-flag'); c.placingFlag = true; });
  $('#nut-query')?.addEventListener('click', askNutQuestion);
  $('#nut-clear-selection')?.addEventListener('click', () => { c.selections = { reference: null, target: null }; c.anchors = { reference: null, target: null }; c.lastAnswer = ''; renderNutGame(); });
}

function chooseNutCell(board, row, col) {
  const c = session.config;
  if (c.placingFlag) { if (board !== 'target') return showToast('ضع العلم في القالب الفضي فقط'); placeNutFlag(row, col); return; }
  const anchor = c.anchors[board];
  if (!anchor) { c.anchors[board] = { row, col }; c.selections[board] = { start: { row, col }, end: { row, col } }; }
  else { c.selections[board] = { start: anchor, end: { row, col } }; c.anchors[board] = null; }
  c.lastAnswer = '';
  renderNutGame();
}

function askNutQuestion() {
  const c = session.config; const level = c.nutLevel;
  if (c.queries >= level.queryLimit) return;
  if (level.queryMode === 'target' && !c.selections.target) return;
  if (level.queryMode === 'both' && (!c.selections.reference || !c.selections.target)) return;
  c.queries++; session.attempts++;
  c.lastAnswer = level.queryMode === 'target'
    ? `${nutRegionCount(level, 'target', c.selections.target)} حبة من البندق في المنطقة الزرقاء.`
    : `القالب الفضي: ${nutRegionCount(level, 'target', c.selections.target)} · القالب المرجعي: ${nutRegionCount(level, 'reference', c.selections.reference)} حبة من البندق.`;
  renderNutGame();
}

function placeNutFlag(row, col) {
  const c = session.config; const level = c.nutLevel;
  c.flag = { board: 'target', row, col }; c.placingFlag = false; session.attempts++;
  renderNutGame();
  if (nutContains(level, 'target', row, col) && !nutContains(level, 'reference', row, col)) {
    session.correct++; const stars = c.queries <= level.perfectQuestions ? 3 : c.queries < level.queryLimit ? 2 : 1;
    updateSessionScore(level.points + stars * 4 + Math.max(0, level.queryLimit - c.queries));
    const next = nutLevels.find(item => item.id === level.id + 1);
    setTimeout(() => finishGame(true, { level: `nuts-${level.id}`, stars, completed: true, nextLevel: next?.id, onNext: next ? () => launchNutGame(next.id) : null, title: 'اكتشاف رائع!', message: `حددت حبة البندق الإضافية بتقييم ${'★'.repeat(stars)}.`, scoreLine: `المستوى ${level.id} · ${c.queries} أسئلة مطروحة` }), 220);
    return;
  }
  c.mistakes++;
  setTimeout(() => showNutFeedback('هذه ليست الحبة الإضافية', 'ارجع إلى المقارنة أو اطرح سؤالًا جديدًا عن منطقة أخرى.'), 80);
}

function showNutFeedback(title, message) {
  const dialog = document.createElement('div'); dialog.className = 'nut-feedback-modal';
  dialog.innerHTML = `<div class="nut-feedback-box"><span class="nut-feedback-icon">🦫</span><div><h3>${title}</h3><p>${message}</p><button class="pixel-button primary">حسنًا</button></div></div>`;
  $('#game-area').append(dialog);
  dialog.querySelector('button').addEventListener('click', () => dialog.remove());
}

function openNameModal() { $('#modal-title').textContent = 'تعديل الاسم'; $('#modal-content').innerHTML = `<p>كيف تحب أن يناديك بيت الألغاز؟</p><input id="name-input" maxlength="18" value="${escapeHtml(state.profile.name)}" /><div class="modal-actions"><button class="tiny-button close-modal">إلغاء</button><button id="confirm-name" class="pixel-button primary">حفظ</button></div>`; $('#modal').classList.remove('hidden'); $('#name-input').focus(); $('#confirm-name').addEventListener('click', saveNameFromModal); $$('.close-modal').forEach(button => button.addEventListener('click', closeModal)); }
function saveNameFromModal() { const value = $('#name-input').value.trim(); if (value) { state.profile.name = value; saveState(); renderHome(); showToast('تم حفظ الاسم ✦'); } closeModal(); }
function closeModal() { $('#modal').classList.add('hidden'); }
function setTheme(theme) { state.profile.theme = theme; document.body.dataset.theme = theme; saveState(); renderSettings(); showToast('تم تغيير ألوان السماء ✦'); }
function exportData() { const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `puzzle-parlor-backup-${todayKey()}.json`; link.click(); URL.revokeObjectURL(link.href); showToast('تم تنزيل نسخة احتياطية'); }
function confirmReset() { $('#modal-title').textContent = 'إعادة ضبط التقدم'; $('#modal-content').innerHTML = `<p>سيتم حذف كل النقاط والإحصاءات المحفوظة على هذا المتصفح. لا يمكن التراجع عن ذلك.</p><div class="modal-actions"><button class="tiny-button close-modal">إلغاء</button><button id="confirm-reset" class="danger-button">حذف البيانات</button></div>`; $('#modal').classList.remove('hidden'); $$('.close-modal').forEach(button => button.addEventListener('click', closeModal)); $('#confirm-reset').addEventListener('click', () => { state = makeDefaultState(); saveState(); document.body.dataset.theme = 'sky'; closeModal(); renderAll(); switchPage('home'); showToast('بدأنا صفحة جديدة ♡'); }); }

document.addEventListener('click', event => { const tab = event.target.closest('[data-page]'); const pageLink = event.target.closest('[data-page-link]'); const gameButton = event.target.closest('[data-game]'); const quickGame = event.target.closest('[data-go-game]'); if (tab) switchPage(tab.dataset.page); if (pageLink) switchPage(pageLink.dataset.pageLink); if (gameButton) openGame(gameButton.dataset.game); if (quickGame) openGame(quickGame.dataset.goGame); });
$('.edit-name').addEventListener('click', openNameModal); $('.close-modal').addEventListener('click', closeModal); $('#modal').addEventListener('click', event => { if (event.target.id === 'modal') closeModal(); }); $('#save-name').addEventListener('click', () => { const name = $('#settings-name').value.trim(); if (name) { state.profile.name = name; saveState(); renderHome(); showToast('تم حفظ الاسم ✦'); } }); $$('.theme-choice').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme))); $('#export-data').addEventListener('click', exportData); $('#reset-data').addEventListener('click', confirmReset);
function renderAll() { document.body.dataset.theme = state.profile.theme; renderHome(); renderDirectory(); renderSettings(); }
renderAll();
renderNowCard();
setInterval(renderNowCard, 1000);
setInterval(renderDailyQuote, 60000);
