// v0.22 headless verification: termination protocol
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

// --- 1. burnout at week 5: reset, strip, persist ---
{
  const w = fresh();
  ev(w, "META.week = 5; META.leverage = 50; META.up = { coffee: true, therapy: true, portfolio: true, network: true }; META.comms = { stillHere: 2 }; S.sanity = 0; S.items = []; S.contract = null; S.lifeDelta = 0;");
  ev(w, "awardLeverage('burnout');");
  check('week reset to 1', ev(w, 'META.week') === 1, ev(w, 'META.week'));
  check('portfolio stripped', ev(w, '!META.up.portfolio'));
  check('network stripped', ev(w, '!META.up.network'));
  check('savings untouched (was not owned)', ev(w, "S.escapeLost.join(',')") === 'portfolio,network', ev(w, "S.escapeLost.join(',')"));
  check('coffee upgrade kept', ev(w, '!!META.up.coffee'));
  check('therapy upgrade kept', ev(w, '!!META.up.therapy'));
  check('commendations kept', ev(w, 'META.comms.stillHere') === 2);
  check('terminated flag set for this page-life', ev(w, 'S.terminated') === true);
  check('reset persisted to localStorage', ev(w, "JSON.parse(localStorage.getItem('fm_meta_v1')).week") === 1);
  check('strip persisted to localStorage', ev(w, "!JSON.parse(localStorage.getItem('fm_meta_v1')).up.portfolio"));
  // the store after the firing
  ev(w, 'S.cabinetPinned = true; storeScreen();');
  const cardHtml = w.document.getElementById('card').innerHTML;
  check('exit paperwork shown', cardHtml.indexOf('EXIT PAPERWORK PROCESSED') !== -1);
  check('portfolio loss narrated', cardHtml.indexOf('portfolio went stale') !== -1);
  check('savings loss NOT narrated (not owned)', cardHtml.indexOf('Runway got spent') === -1);
  check('new badge button shown', cardHtml.indexOf('A NEW BADGE') !== -1);
  check('escape plan shows 0/3', cardHtml.indexOf('ESCAPE PLAN: <b>0/3</b>') !== -1);
  // clock in: week must stay 1
  w.document.getElementById('nextweek').onclick = null; // block the reload jsdom can't do
  ev(w, "(function(){ if (!S.terminated) META.week += 1; saveMeta(); })();"); // the handler minus reload
  check('clock-in after termination lands on week 1', ev(w, 'META.week') === 1, ev(w, 'META.week'));
}

// --- 2. PMO also resets ---
{
  const w = fresh();
  ev(w, "META.week = 4; META.up = { savings: true }; S.rep = 0; S.items = []; S.contract = null; S.lifeDelta = 0;");
  ev(w, "awardLeverage('firedForCause');");
  check('PMO: week reset to 1', ev(w, 'META.week') === 1);
  check('PMO: savings stripped', ev(w, '!META.up.savings'));
}

// --- 3. survived path unchanged ---
{
  const w = fresh();
  ev(w, "META.week = 4; META.up = { portfolio: true }; S.sanity = 60; S.rep = 50; S.items = []; S.contract = null; S.lifeDelta = 0;");
  ev(w, "awardLeverage('survived', 'B');");
  check('survived: week untouched by award', ev(w, 'META.week') === 4);
  check('survived: escape items kept', ev(w, '!!META.up.portfolio'));
  check('survived: not terminated', ev(w, '!S.terminated'));
  ev(w, 'S.cabinetPinned = true; storeScreen();');
  const cardHtml = w.document.getElementById('card').innerHTML;
  check('survived: normal clock-in to week 5', cardHtml.indexOf('CLOCK IN · WEEK 5') !== -1);
  check('survived: no exit paperwork', cardHtml.indexOf('EXIT PAPERWORK') === -1);
  ev(w, "(function(){ if (!S.terminated) META.week += 1; saveMeta(); })();");
  check('survived: clock-in increments to 5', ev(w, 'META.week') === 5);
}

// --- 4. full flow: real burnout via apply() during a fight still routes through the reset ---
{
  const w = fresh();
  ev(w, "META.week = 3; META.up = { network: true }; S.sanity = 5; S.rep = 50; S.time = 10; S.fridayBoss = 'miller'; S.items = []; S.contract = null; S.lifeDelta = 0; Math.random = () => 0.999;");
  ev(w, 'meetingProper();');
  w.document.querySelector('#card button.choice[data-i="1"]').click(); // quiet stance costs 4 -> 6+2=8 > 5 sanity -> burnout
  check('mid-fight burnout: run over', ev(w, 'S.over') === true);
  check('mid-fight burnout: week reset to 1', ev(w, 'META.week') === 1, ev(w, 'META.week'));
  check('mid-fight burnout: network stripped', ev(w, '!META.up.network'));
  check('mid-fight burnout: confrontation cleared', !w.document.body.classList.contains('confrontation'));
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : '\n' + failures + ' FAILURES');
process.exit(failures === 0 ? 0 : 1);
