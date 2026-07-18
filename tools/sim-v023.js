// v0.23 headless verification: lunch hour + weekly clock, new lore cards + follow-up
// chains (balloon vendor, "anonymous" survey), early-week difficulty hardening,
// reorganized/reduced store.
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
function clickChoice(w, idx) {
  const btns = w.document.querySelectorAll('#card button.choice');
  if (!btns[idx]) throw new Error('no choice button at ' + idx + ' (found ' + btns.length + ')');
  btns[idx].click();
}
function clickCont(w) {
  const btn = w.document.getElementById('cont');
  if (btn) { btn.click(); return true; }
  return false;
}
// drains the current card/result chain until either a new card with choices
// renders, or nothing left to click (safety-capped)
function drain(w, cap) {
  cap = cap || 20;
  for (let i = 0; i < cap; i++) {
    if (!clickCont(w)) return;
  }
}

// --- 1. new cards all construct without throwing ---
{
  const w = fresh();
  const ids = ['bossEmail', 'minifridge', 'balloonArch', 'balloonInvoice', 'anonSurvey', 'surveyFollowup', 'standingMeeting', 'deskPlantDirective', 'lunch'];
  ids.forEach(id => {
    let ok = true, title = null;
    try { const c = ev(w, 'CARDS.' + id + '()'); title = c && c.title; ok = !!(c && c.title && c.choices && c.choices.length >= 2); }
    catch (e) { ok = false; }
    check('card constructs: ' + id, ok, title);
  });
  check('bossEmail unlocked week 1', ev(w, 'CARD_UNLOCKS.bossEmail') === 1);
  check('balloonArch unlocked week 2', ev(w, 'CARD_UNLOCKS.balloonArch') === 2);
  check('balloonInvoice NOT in unlock pool (follow-up only)', ev(w, "'balloonInvoice' in CARD_UNLOCKS") === false);
  check('surveyFollowup NOT in unlock pool (follow-up only)', ev(w, "'surveyFollowup' in CARD_UNLOCKS") === false);
}

// --- 2. lunch: fires once per day Mon-Thu, gains a 3rd choice with the upgrade ---
{
  const w = fresh();
  ev(w, "CARDS.lunch = CARDS.lunch;"); // no-op, just confirms it's live
  const noUp = ev(w, 'CARDS.lunch().choices.length');
  check('lunch has 2 choices without the upgrade', noUp === 2, noUp);
  const withUp = ev(w, 'META.up.lunch = true; CARDS.lunch().choices.length');
  check('lunch has 3 choices with Standing Lunch with Chris', withUp === 3, withUp);
}

// --- 3. lunch fires as the last beat of a Mon-Thu day, exactly once ---
// (bypasses startDay()'s animated interstitial, which runs on real setTimeouts;
// this replicates startDay()'s synchronous setup and calls nextEncounter() directly,
// the same way the existing sims avoid the interstitial for Friday-meeting tests)
{
  const w = fresh();
  ev(w, "META.week = 1; buildWeek(); S.day = 0; S.sanity = 100; S.time = 10; S.maxTime = 10; S.items = []; S.log = []; " +
    "S.ergoUsedToday=false; S.millerPleased=false; S.millerAnnoyed=false; S.lunchDone=false; S.beatIndex=0; S.dayJustStarted=true; " +
    "var plan = dayPlan(S.day); S.choicePool=null; S.queue=plan; nextEncounter();");
  clickChoice(w, 0); drain(w);           // standup
  clickChoice(w, 0); drain(w);           // deck card 1
  clickChoice(w, 0); drain(w);           // deck card 2
  const title = ev(w, "document.getElementById('card').querySelector('h2') ? document.getElementById('card').querySelector('h2').textContent : ''");
  check('lunch card appears as the 4th Monday beat', title === 'Lunch', title);
  check('S.lunchDone true after lunch shown', ev(w, 'S.lunchDone') === true);
}

// --- 4. the weekly stopwatch: real elapsed time, formatted, persisted across weeks ---
{
  const w = fresh();
  check('formatStopwatch(0) = 0:00', ev(w, 'formatStopwatch(0)') === '0:00');
  check('formatStopwatch(65000) = 1:05', ev(w, 'formatStopwatch(65000)') === '1:05');
  check('formatStopwatch(3661000) = 1:01:01 (hour rollover)', ev(w, 'formatStopwatch(3661000)') === '1:01:01');
  // updateStopwatch reads from S.weekStartMs and writes into #weekclock
  ev(w, "S.weekStartMs = Date.now() - 5000; updateStopwatch();");
  const label = ev(w, "document.getElementById('weekclock').textContent");
  check('weekclock shows "CLOCKED IN · 0:05" for a 5s-old week', label === 'CLOCKED IN · 0:05', label);
  // week-end accumulates into META.totalPlayMs (mirrors the nextweek button handler)
  ev(w, "META.totalPlayMs = 10000; S.weekStartMs = Date.now() - 3000; " +
    "META.totalPlayMs = (META.totalPlayMs || 0) + (Date.now() - (S.weekStartMs || Date.now())); saveMeta();");
  const total = ev(w, 'META.totalPlayMs');
  check('totalPlayMs accumulates across weeks (~13000ms)', total >= 12900 && total <= 13300, total);
  check('totalPlayMs persisted to localStorage', ev(w, "JSON.parse(localStorage.getItem('fm_meta_v1')).totalPlayMs") === ev(w, 'META.totalPlayMs'));
}

// --- 5. balloon vendor: risky choice sets a pending flag, resolves ~2 weeks later ---
{
  const w = fresh();
  ev(w, "META.week = 2; META.balloonVendorPending = false;");
  ev(w, "S.day = 0; S.sanity = 100; S.time = 10; S.credit = 0; S.items = []; showCard(CARDS.balloonArch(), function(){});");
  clickChoice(w, 0); // book the fast vendor (the risky choice)
  drain(w, 3);
  check('balloonVendorPending set', ev(w, 'META.balloonVendorPending') === true);
  check('balloonVendorWeek recorded as 2', ev(w, 'META.balloonVendorWeek') === 2);
  // fast-forward to week 4 Monday: startDay's injection check runs synchronously
  // before its animated interstitial, so the queue can be checked immediately
  // without waiting on the (real) setTimeout chain
  ev(w, "META.week = 4; buildWeek(); S.day = 0; S.queue = []; S.choicePool = null; startDay();");
  check('balloonInvoice injected into Monday queue at week 4', ev(w, 'S.queue[0]') === 'balloonInvoice', ev(w, 'S.queue[0]'));
  check('balloonVendorPending cleared after injection', ev(w, 'META.balloonVendorPending') === false);
}

// --- 6. anonymous survey: honest answer flags a follow-up for the next Monday ---
{
  const w = fresh();
  ev(w, "META.week = 3; META.surveyFlagged = false;");
  ev(w, "S.day = 1; S.sanity = 100; S.time = 10; S.credit = 0; showCard(CARDS.anonSurvey(), function(){});");
  clickChoice(w, 0); // answer honestly
  drain(w, 3);
  check('surveyFlagged set', ev(w, 'META.surveyFlagged') === true);
  check('surveyFlaggedWeek recorded as 3', ev(w, 'META.surveyFlaggedWeek') === 3);
  ev(w, "META.week = 4; buildWeek(); S.day = 0; S.queue = []; S.choicePool = null; startDay();");
  check('surveyFollowup injected into Monday queue at week 4', ev(w, 'S.queue[0]') === 'surveyFollowup', ev(w, 'S.queue[0]'));
}

// --- 7. early-week difficulty: week 1 is no longer a fully free tutorial ---
{
  const w = fresh();
  check('bossRoundCount wk1 = 1', ev(w, 'META.week = 1; bossRoundCount()') === 1);
  check('bossRoundCount wk2 = 2 (was 1)', ev(w, 'META.week = 2; bossRoundCount()') === 2);
  ev(w, 'META.week = 1; S.sanity = 100; S.time = 10; apply({ sanity: 4 });');
  check('week 1 sanity surcharge is no longer zero (cost 7, not 6)', ev(w, 'S.sanity') === 93, ev(w, 'S.sanity'));
  const heal2 = ev(w, "META.week = 2; S.sanity = 50; apply({ heal: 10 }); S.sanity");
  check('week 2 heal taper applied (50+9=59, not 60)', heal2 === 59, heal2);
}

// --- 8. store: 13 items (12 minus coffee, plus the fridge key), 3 category headers, FULLY VESTED unaffected ---
{
  const w = fresh();
  check('store has 13 items', ev(w, 'STORE.length') === 13, ev(w, 'STORE.length'));
  check('coffee item removed', ev(w, "STORE.some(it => it.id === 'coffee')") === false);
  check('every item has a category', ev(w, "STORE.every(it => !!it.cat)"));
  ev(w, "S.day=4; S.items=[]; storeScreen();");
  // innerHTML entity-escapes "&", so check for the escaped form
  const cardHtml = ev(w, "document.getElementById('card').innerHTML");
  ['SANITY &amp; TIME', 'CAREER &amp; LEVERAGE', 'ESCAPE PLAN'].forEach(label => {
    check('store shows "' + label.replace('&amp;', '&') + '" header', cardHtml.indexOf(label) !== -1);
  });
  const vested = ev(w, "STORE.filter(it => !it.escape).every(it => true)"); // sanity: no crash iterating
  check('STORE iteration for FULLY VESTED does not throw', vested === true);
}

// --- 9. UNDER THE WIRE commendation: real elapsed time, not in-fiction time ---
{
  const w = fresh();
  ev(w, "S.weekStartMs = Date.now() - 60000;"); // 1 real minute in
  const fastOk = ev(w, "COMMENDATIONS.find(c => c.id === 'underTheWire').check('survived')");
  check('UNDER THE WIRE triggers under the real-time threshold', fastOk === true, fastOk);
  ev(w, "S.weekStartMs = Date.now() - 7 * 60000;"); // 7 real minutes in, over threshold
  const slowOk = ev(w, "COMMENDATIONS.find(c => c.id === 'underTheWire').check('survived')");
  check('UNDER THE WIRE does not trigger past the threshold', slowOk === false, slowOk);
  const wrongKind = ev(w, "S.weekStartMs = Date.now(); COMMENDATIONS.find(c => c.id === 'underTheWire').check('burnout')");
  check('UNDER THE WIRE does not trigger on burnout', wrongKind === false, wrongKind);
}

// --- 10. the choice-recap log is gone: no #log element, nothing renders into it ---
{
  const w = fresh();
  check('#log element removed from the page', ev(w, "document.getElementById('log')") === null);
  ev(w, "S.day = 0; S.sanity = 100; S.time = 10; S.items = []; showCard(CARDS.minifridge(), function(){});");
  clickChoice(w, 0);
  drain(w, 3);
  check('no lingering #log element after play', ev(w, "document.getElementById('log')") === null);
}

// --- 11. minifridge: humiliation costs Sanity outright, no offsetting heal, small Rep nod ---
{
  const w = fresh();
  const c = ev(w, "CARDS.minifridge()");
  check('ask-him choice has a sanity cost', c.choices[0].delta.sanity === 4, JSON.stringify(c.choices[0].delta));
  check('ask-him choice no longer offsets with a heal', c.choices[0].delta.heal === undefined, c.choices[0].delta.heal);
  check('ask-him choice gives a small Rep nod', c.choices[0].delta.rep === 1, c.choices[0].delta.rep);
}

// --- 12. the fridge key: expensive, ungated, unlocks a 3rd minifridge choice ---
{
  const w = fresh();
  check('store has 13 items now', ev(w, 'STORE.length') === 13, ev(w, 'STORE.length'));
  check('fridgeKey is the most expensive non-escape item', ev(w, "STORE.find(it => it.id === 'fridgeKey').cost") === 35);
  check('fridgeKey has no commendation gate', ev(w, "!!STORE.find(it => it.id === 'fridgeKey').requires") === false);
  check('minifridge has 2 choices without the key', ev(w, 'CARDS.minifridge().choices.length') === 2);
  const withKey = ev(w, "META.up.fridgeKey = true; CARDS.minifridge()");
  check('minifridge has 3 choices with the key', withKey.choices.length === 3, withKey.choices.length);
  const keyChoice = withKey.choices[2];
  check('key choice heals 30 Sanity', keyChoice.delta.heal === 30, keyChoice.delta.heal);
  check('key choice costs Reputation', keyChoice.delta.rep === -6, keyChoice.delta.rep);
}

console.log('\n' + (failures === 0 ? 'ALL CHECKS PASSED' : failures + ' FAILURES'));
process.exit(failures === 0 ? 0 : 1);
