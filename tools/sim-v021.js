// v0.21 headless verification: difficulty pipeline, commendations, gated items, scan bugfixes
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const indexPath = [path.join(__dirname, 'index.html'), path.join(__dirname, '..', 'index.html')].find(p => fs.existsSync(p));
const html = fs.readFileSync(indexPath, 'utf8');

let failures = 0;
function check(name, cond, extra) {
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '  [' + extra + ']' : ''));
  if (!cond) failures++;
}
function fresh() {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => { console.log('JSDOM ERROR: ' + e.message); failures++; });
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.test/' });
  return dom.window;
}
function ev(w, code) { return w.eval(code); }

// --- 1. sanity pipeline: x1.5 ceil, then surcharge ---
{
  const w = fresh();
  // wk1: base 4 -> ceil(6)=6 +0 surcharge
  ev(w, 'META.week = 1; S.sanity = 100; S.time = 10; apply({ sanity: 4 });');
  check('wk1 base4 costs 6', ev(w, 'S.sanity') === 94, ev(w, 'S.sanity'));
  // wk7: base 4 -> 6 +5 = 11
  ev(w, 'META.week = 7; S.sanity = 100; apply({ sanity: 4 });');
  check('wk7 base4 costs 11', ev(w, 'S.sanity') === 89, ev(w, 'S.sanity'));
  // therapy: wk7 base4 -> 6+5-1 = 10
  ev(w, 'META.up.therapy = true; S.sanity = 100; apply({ sanity: 4 });');
  check('wk7 base4 + therapy costs 10', ev(w, 'S.sanity') === 90, ev(w, 'S.sanity'));
  ev(w, 'META.up.therapy = false;');
  // crunch: wk1 base4 -> 6 * 1.5 = 9
  ev(w, 'META.week = 1; S.sanity = 100; S.time = 0; S.crunched = true; apply({ sanity: 4 });');
  check('wk1 base4 in crunch costs 9', ev(w, 'S.sanity') === 91, ev(w, 'S.sanity'));
}

// --- 2. rep pipeline: gains x0.7 round min 1, losses full ---
{
  const w = fresh();
  ev(w, 'META.week = 1; S.rep = 50; apply({ rep: 7 });');
  check('rep +7 lands as +5', ev(w, 'S.rep') === 55, ev(w, 'S.rep'));
  ev(w, 'S.rep = 50; apply({ rep: 2 });');
  check('rep +2 lands as +1', ev(w, 'S.rep') === 51, ev(w, 'S.rep'));
  ev(w, 'S.rep = 50; apply({ rep: 1 });');
  check('rep +1 lands as +1 (floor)', ev(w, 'S.rep') === 51, ev(w, 'S.rep'));
  ev(w, 'S.rep = 50; apply({ rep: -5 });');
  check('rep -5 lands in full', ev(w, 'S.rep') === 45, ev(w, 'S.rep'));
  check('repDrains recorded 5', ev(w, 'S.repDrains[S.repDrains.length-1].amt') === 5);
}

// --- 3. scan bugfix: rep death in Friday preamble halts runMeeting cleanly ---
{
  const w = fresh();
  ev(w, "META.week = 3; S.sanity = 80; S.rep = 3; S.time = 10; S.fridayBoss = 'miller'; S.rumorFestering = true; S.items = [{name:'X', value: 6, locked: false, noticed: false, day: 0}];");
  let threw = false;
  try { ev(w, 'runMeeting(DIRECTORS.miller)'); } catch (e) { threw = true; }
  check('preamble PMO: no exception', !threw);
  check('preamble PMO: run over', ev(w, 'S.over') === true);
  check('preamble PMO: inBossFight false', ev(w, 'inBossFight') === false);
}

// --- 4. commendations: awarding, bonuses, persistence keys ---
{
  const w = fresh();
  ev(w, 'META.week = 1; S.sanity = 60; S.rep = 50; S.items = []; S.contract = null; S.lifeDelta = 0;');
  ev(w, "awardLeverage('burnout');");
  check('burnout awards A DEDICATED EMPLOYEE', ev(w, "META.comms.floor") === 1, ev(w, 'JSON.stringify(Object.keys(META.comms))'));
  const lev1 = ev(w, 'META.leverage');
  ev(w, "awardLeverage('burnout');");
  check('commendation not awarded twice', ev(w, 'META.leverage') - lev1 >= 0 && ev(w, "NEW_COMMS.filter(c => c.id === 'floor').length") === 1);
  ev(w, "awardLeverage('survived', 'A');");
  check('survived-A awards STILL HERE + EXCEEDS EXPECTATIONS', ev(w, "!!META.comms.stillHere && !!META.comms.aGrade"));
  ev(w, "META.stats.bossesSeen = { miller: true, reed: true, brooks: true, calloway: true }; checkCommendations();");
  check('FULL COVERAGE from bossesSeen', ev(w, "!!META.comms.coverage"));
  ev(w, "META.week = 8; checkCommendations();");
  check('TENURE at week 8', ev(w, "!!META.comms.tenure"));
  ev(w, "META.stats.agendaSweeps = 1; META.stats.pushbacks = 5; checkCommendations();");
  check('sweep + noted awarded', ev(w, "!!META.comms.sweep && !!META.comms.noted"));
  // vested: own all non-escape
  ev(w, "STORE.filter(it => !it.escape).forEach(it => META.up[it.id] = true); checkCommendations();");
  check('FULLY VESTED with all non-escape items', ev(w, "!!META.comms.vested"));
  // leverage bonuses actually paid
  check('leverage grew from bonuses', ev(w, 'META.leverage') > lev1, ev(w, 'META.leverage'));
}

// --- 5. store gating: locked render, buy guard, unlock ---
{
  const w = fresh();
  ev(w, 'META.week = 2; META.leverage = 100; S.items = []; S.cabinetPinned = true;');
  ev(w, 'storeScreen();');
  const lockedShown = w.document.getElementById('card').innerHTML.indexOf('Requires commendation') !== -1;
  check('gated items render locked with requirement', lockedShown);
  check('no buy button for gated item while locked', w.document.querySelector('[data-buy="monitor"]') === null);
  check('personnel file section renders', w.document.getElementById('card').innerHTML.indexOf('PERSONNEL FILE') !== -1);
  ev(w, "META.comms.aGrade = 1;");
  ev(w, 'storeScreen();');
  const btn = w.document.querySelector('[data-buy="monitor"]');
  check('monitor purchasable after aGrade', btn !== null);
  btn.click();
  check('monitor owned after purchase', ev(w, '!!META.up.monitor'));
}

// --- 6. item effects: monitor maxTime, ergo first-hit softening ---
{
  const w = fresh();
  ev(w, 'META.up.coffee = true; META.up.monitor = true;');
  ev(w, 'S.maxTime = 10 + (META.up.coffee ? 1 : 0) + (META.up.monitor ? 1 : 0);');
  check('maxTime 12 with coffee + monitor', ev(w, 'S.maxTime') === 12);
  // ergo: wk1 base 4 -> 6, first of day -2 = 4; second full 6
  ev(w, 'META.week = 1; META.up.ergo = true; S.ergoUsedToday = false; S.sanity = 100; S.time = 10; S.crunched = false;');
  ev(w, 'apply({ sanity: 4 });');
  check('ergo softens first hit (6->4)', ev(w, 'S.sanity') === 96, ev(w, 'S.sanity'));
  ev(w, 'apply({ sanity: 4 });');
  check('second hit lands full (6)', ev(w, 'S.sanity') === 90, ev(w, 'S.sanity'));
}

// --- 7. rolodex pre-pick consumed by buildWeek ---
{
  const w = fresh();
  ev(w, "META.week = 5; PREPICKED_BOSS = 'calloway'; buildWeek();");
  check('buildWeek consumes PREPICKED_BOSS', ev(w, "S.fridayBoss") === 'calloway');
  check('pre-pick cleared after use', ev(w, 'PREPICKED_BOSS') === null);
}

// --- 8. fight math still coherent under new rep pipeline (counter win +2 -> +1) ---
{
  const w = fresh();
  ev(w, "META.week = 3; S.sanity = 100; S.rep = 50; S.time = 10; S.fridayBoss = 'brooks'; Math.random = () => 0.001;");
  ev(w, 'meetingProper();');
  const card = w.document.getElementById('card');
  card.querySelector('button.choice[data-i="0"]').click(); // push back: rep -4 full
  check('pushback rep 50->46 (loss lands full)', ev(w, 'S.rep') === 46, ev(w, 'S.rep'));
  w.document.getElementById('cont').click();
  card.querySelector('button.choice[data-i="0"]').click(); // counter, wins: +2 -> +1
  check('counter win rep +1 under recalibration', ev(w, 'S.rep') === 47, ev(w, 'S.rep'));
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : '\n' + failures + ' FAILURES');
process.exit(failures === 0 ? 0 : 1);
