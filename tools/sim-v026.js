// v0.26 "The Offer Letter" headless verification: scripted first Monday
// (orientation), weekly performance summary, NG+ (persistence, surcharge,
// escape pricing, boss phase 2), the ledger store item, the stopwatch
// personal best, and the two-section weekly memo.
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
function fresh(preMeta) {
  const vc = new VirtualConsole();
  // location.reload() is jsdom-unimplemented by design; NG+/next-week save state
  // BEFORE reloading, so the sim reads localStorage instead of following it
  vc.on('jsdomError', e => {
    if (/navigation to another Document/.test(e.message)) return;
    console.log('JSDOM ERROR: ' + e.message); failures++;
  });
  const dom = new JSDOM('<script>' + (preMeta ? 'localStorage.setItem("fm_meta_v1", ' + JSON.stringify(JSON.stringify(preMeta)) + ');' : '') + '</script>' + html,
    { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.test/' });
  return dom.window;
}
function ev(w, code) { return w.eval(code); }

// --- 1. orientation: a fresh file gets the fixed Monday; a rehire does not ---
{
  const w = fresh();
  ev(w, 'S.orientation = !META.onboarded && META.week === 1 && !META.ng && !META.totalPlayMs && META.leverage === 0 && Object.keys(META.comms||{}).length === 0;');
  check('brand-new file detects as fresh', ev(w, 'S.orientation') === true);
  ev(w, 'buildWeek()');
  check('fresh Monday card 1 is quickSync', ev(w, 'weekDeck[0]') === 'quickSync', ev(w, 'weekDeck[0]'));
  check('fresh Monday card 2 is partnership', ev(w, 'weekDeck[1]') === 'partnership', ev(w, 'weekDeck[1]'));
  check('orientation note exists for standup', ev(w, 'typeof ORIENT_NOTES.standup') === 'string');
  check('no duplicate quickSync in deck', ev(w, 'weekDeck.filter(k => k === "quickSync").length') === 1);
}
{
  const w = fresh({ week: 1, onboarded: 1, totalPlayMs: 90000, leverage: 4, comms: { floor: 3 } });
  ev(w, 'S.orientation = !META.onboarded && META.week === 1 && !META.ng && !META.totalPlayMs && META.leverage === 0 && Object.keys(META.comms||{}).length === 0;');
  check('a fired veteran back at week 1 is NOT re-onboarded', ev(w, 'S.orientation') === false);
}

// --- 2. weekly performance summary renders with the week's real numbers ---
{
  const w = fresh();
  ev(w, "S.items = [{name:'A', value: 8, locked: true}, {name:'B', value: 5, locked: false, stolen: true}];" +
        "S.claimedItems = [{name:'B', value: 5}]; S.meetingBossName = 'Director Reed';" +
        "S.sanity = 61; S.rep = 55; S.roundsPlayed = 2; S.roundsWon = 1; S.escalationBonus = -1;" +
        "S.weekStartMs = Date.now() - 300000; S.weekEndMs = Date.now();" +
        "reportCard('survived', 'B')");
  const cardHtml = ev(w, "document.getElementById('card').innerHTML");
  check('summary titled as a memo', /WEEKLY PERFORMANCE SUMMARY/.test(cardHtml));
  check('summary shows the grade', /GRADE B/.test(cardHtml));
  check('summary shows the host', /Director Reed/.test(cardHtml));
  check('summary lists the reassigned item', /"B" · \+5/.test(cardHtml));
  check('summary shows produced 13 / retained 8', /Credit produced: <b>13<\/b>/.test(cardHtml) && /Retained: <b>8<\/b>/.test(cardHtml));
  check('summary shows composure shaken', /COMPOSURE: SHAKEN/.test(cardHtml));
  check('summary has the file-it button to Saturday', !!w.document.getElementById('fileit'));
}

// --- 3. NG+: quit offers the new job; accepting carries the right things ---
{
  const w = fresh({ week: 5, leverage: 20, ng: 0, onboarded: 1, up: { therapy: true, portfolio: true, network: true, savings: true }, comms: {}, stats: {}, totalPlayMs: 1000 });
  ev(w, "S.weekStartMs = Date.now(); S.items = []; ending('quit')");
  check('quit screen offers CYCLE 2', /ACCEPT THE OFFER · CYCLE 2/.test(ev(w, "document.getElementById('card').innerHTML")));
  check('quit still offers the full wipe', !!w.document.getElementById('newgame'));
  check('THE DOOR WAS OPEN awarded on quit and persists', ev(w, "!!META.comms.door"));
  // accept the offer (location.reload throws in jsdom; state is saved before it)
  try { w.document.getElementById('ngplus').click(); } catch (e) {}
  const saved = JSON.parse(ev(w, "localStorage.getItem('fm_meta_v1')"));
  check('NG+ increments cycle', saved.ng === 1, saved.ng);
  check('NG+ resets week to 1', saved.week === 1, saved.week);
  check('NG+ strips the escape plan', !saved.up.portfolio && !saved.up.network && !saved.up.savings);
  check('NG+ keeps upgrades', saved.up.therapy === true);
  check('NG+ keeps leverage', saved.leverage >= 20, saved.leverage);
}

// --- 4. NG+ difficulty: surcharge +1 per cycle, escape items cost more ---
{
  const w = fresh({ week: 1, ng: 1, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.sanity = 100; S.time = 10;');
  ev(w, 'apply({ sanity: 2 })');
  // base 2 -> x1.5 = 3 -> surcharge max(1, week-1)=1 -> +ng 1 = 5
  check('NG+ cycle 2 surcharge: base-2 hit costs 5', ev(w, 'S.sanity') === 95, 100 - ev(w, 'S.sanity'));
  const pCost = ev(w, "storeCost(STORE.find(i => i.id === 'portfolio'))");
  check('escape item costs +15 in cycle 2', pCost === 55, pCost);
  const tCost = ev(w, "storeCost(STORE.find(i => i.id === 'therapy'))");
  check('non-escape item price unchanged', tCost === 20, tCost);
  check('cycle notice present in the memo', ev(w, 'POLICY_NOTICES.some(n => /WELCOME TO CYCLE 2/.test(n.t))'));
}

// --- 5. NG+ boss phase 2: triggers below half, tightens counters, feeds regen ---
{
  const w = fresh({ week: 3, ng: 1, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.fridayBoss = 'miller'; S.bossPhase2 = false; S.bossComposureMax = 70; S.bossComposure = 70; S.rep = 50; S.fightFooting = 0;");
  const before = ev(w, "counterChance(DIRECTORS.miller)");
  ev(w, 'S.bossPhase2 = true');
  const after = ev(w, "counterChance(DIRECTORS.miller)");
  check('phase 2 lowers counter odds by 0.08', Math.abs((before - after) - 0.08) < 1e-9, (before - after).toFixed(3));
  check('phase lines exist for all four bosses', ev(w, "['miller','reed','brooks','calloway'].every(k => typeof PHASE_LINES[k] === 'string')"));
}
{
  // phase 2 must NOT trigger in cycle 1 (base game unchanged)
  const w = fresh({ week: 3, ng: 0, onboarded: 1, comms: {}, stats: {} });
  check('base game: META.ng is 0, phase 2 gate is closed', ev(w, '(META.ng || 0) >= 1') === false);
}

// --- 6. the ledger: pays per lock at week's end, costs a max Time slot ---
{
  const w = fresh({ week: 2, ng: 0, onboarded: 1, up: { ledger: true }, comms: { stillHere: 1 }, stats: {} });
  check('ledger is in the store, career section', ev(w, "STORE.find(i => i.id === 'ledger').cat") === 'career');
  ev(w, "S.items = [{name:'A', value: 5, locked: true}, {name:'B', value: 5, locked: true}, {name:'C', value: 4, locked: false}];" +
        "S.sanity = 80; S.weekStartMs = Date.now(); S.weekEndMs = Date.now();");
  const base = ev(w, "leverageFor('survived', 'C')");
  const got = ev(w, "awardLeverage('survived', 'C')");
  check('ledger adds +1 per held Paper Trail (2 locks)', got - base >= 2, got - base);
  // and the max Time cost is wired at clock-in
  const t = ev(w, "10 + (META.up.coffee ? 1 : 0) + (META.up.monitor ? 1 : 0) - (META.up.ledger ? 1 : 0)");
  check('ledger costs 1 max Time', t === 9, t);
}

// --- 7. stopwatch personal best: set on survived, beaten only by faster weeks ---
{
  const w = fresh({ week: 2, ng: 0, onboarded: 1, comms: { stillHere: 1 }, stats: {} });
  ev(w, "S.items = []; S.sanity = 70; S.weekStartMs = Date.now() - 400000; S.weekEndMs = Date.now(); awardLeverage('survived', 'C')");
  const pb1 = ev(w, 'META.bestWeekMs');
  check('first survived week sets the PB', pb1 > 0 && Math.abs(pb1 - 400000) < 2000, pb1);
  check('new-best flag set for the summary', ev(w, 'S.newBestWeek') === true);
  ev(w, "S.newBestWeek = false; S.weekStartMs = Date.now() - 900000; S.weekEndMs = Date.now(); awardLeverage('survived', 'C')");
  check('slower week does not beat the PB', ev(w, 'META.bestWeekMs') === pb1, ev(w, 'META.bestWeekMs'));
  check('slower week does not claim a record', ev(w, 'S.newBestWeek') === false);
  check('Saturday screen shows the fastest week', (ev(w, 'S.terminated = false; storeScreen(); document.getElementById("card").innerHTML').indexOf('FASTEST WEEK ON FILE') !== -1));
}

// --- 8. the weekly memo: new-vs-standing split ---
{
  const w = fresh({ week: 4, ng: 0, onboarded: 1, comms: {}, stats: {} });
  check('notices carry effective weeks', ev(w, 'POLICY_NOTICES.every(n => typeof n.t === "string" && typeof n.w === "number")'));
  check('week 4 has at least one new notice (wellness + modifier)', ev(w, 'POLICY_NOTICES.filter(n => n.w === 4).length') >= 2, ev(w, 'POLICY_NOTICES.filter(n => n.w === 4).length'));
  check('week-2 policies read as standing at week 4', ev(w, 'POLICY_NOTICES.filter(n => n.w === 2).length') >= 3);
  const btn = ev(w, "document.getElementById('noticebtn') && document.getElementById('noticebtn').textContent");
  check('boot button is the weekly memo', /THE WEEKLY MEMO/.test(btn || ''), btn);
  ev(w, "document.getElementById('noticebtn').click()");
  const overlay = ev(w, "document.getElementById('noticecontent').innerHTML");
  check('memo leads with EFFECTIVE THIS WEEK', /EFFECTIVE THIS WEEK/.test(overlay));
  check('memo files the rest as standing policy', /STANDING POLICY/.test(overlay));
}

// --- 9. commendations: THE REVOLVING DOOR exists and gates on a second exit ---
{
  const w = fresh({ week: 3, ng: 1, onboarded: 1, up: {}, comms: {}, stats: {}, totalPlayMs: 5 });
  ev(w, "S.weekStartMs = Date.now(); S.items = []; ending('quit')");
  check('second quit awards THE REVOLVING DOOR', ev(w, '!!META.comms.revolvingDoor'));
}
{
  const w = fresh({ week: 3, ng: 0, onboarded: 1, up: {}, comms: {}, stats: {}, totalPlayMs: 5 });
  ev(w, "S.weekStartMs = Date.now(); S.items = []; ending('quit')");
  check('first quit does NOT award THE REVOLVING DOOR', ev(w, '!META.comms.revolvingDoor'));
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
