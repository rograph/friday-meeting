// v0.29 "The 4:15" headless verification: the commute tier routing (golden /
// voluntold / late / ordinary), the Early Exit offer and its skip semantics,
// the silent caught roll and its Friday reveal, and the career clock's full
// speedrun frame (endings, FASTEST ESCAPE, cycle baseline, import).
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
  vc.on('jsdomError', e => {
    if (/navigation to another Document/.test(e.message)) return;
    console.log('JSDOM ERROR: ' + e.message); failures++;
  });
  const dom = new JSDOM('<script>' + (preMeta ? 'localStorage.setItem("fm_meta_v1", ' + JSON.stringify(JSON.stringify(preMeta)) + ');' : '') + '</script>' + html,
    { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.test/' });
  return dom.window;
}
function ev(w, code) { return w.eval(code); }
function clickChoice(w, idx) {
  const btns = w.document.querySelectorAll('#card button.choice:not([disabled])');
  if (!btns[idx]) throw new Error('no choice at ' + idx + ' (found ' + btns.length + ')');
  btns[idx].click();
}
function cardTitle(w) { return ev(w, "(document.querySelector('#card h2')||{}).textContent || ''"); }

// --- 1. the evening router: the commute is the day's receipt ---
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.day = 1; S.snuckOut = true; S.time = 5; eveningEvent();');
  check('sneaking routes tonight to The 4:15', /The 4:15/.test(cardTitle(w)), cardTitle(w));
}
{
  // the golden ride outranks the voluntold roll
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'Math.random = () => 0.01;'); // would trigger the 60% voluntold branch
  ev(w, 'S.day = 1; S.snuckOut = true; S.time = 5; eveningEvent();');
  check('the 5:58 email finds an empty desk (voluntold dodged)', /The 4:15/.test(cardTitle(w)), cardTitle(w));
}
{
  // crunch routes to the late train, but voluntold still outranks crunch
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'Math.random = () => 0.99;'); // no voluntold
  ev(w, 'S.day = 1; S.snuckOut = false; S.time = 0; eveningEvent();');
  check('ending the day in Crunch means The 7:40', /The 7:40/.test(cardTitle(w)), cardTitle(w));
}
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'Math.random = () => 0.01;'); // voluntold fires
  ev(w, 'S.day = 1; S.snuckOut = false; S.time = 0; eveningEvent();');
  check('voluntold outranks the crunch commute', /VOLUNTOLD/.test(cardTitle(w)), cardTitle(w));
}
{
  // Thursday is still the Appreciation, no matter what
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.day = 3; S.snuckOut = false; S.time = 5; eveningEvent();');
  check('Thursday remains mandatory joy', /Appreciation/.test(cardTitle(w)), cardTitle(w));
}
{
  // the voluntold picker still points at actual voluntolds after the append
  const w = fresh();
  check('EVENINGS[2] is still a voluntold', ev(w, 'EVENINGS[2].title.indexOf("VOLUNTOLD")') === 0);
  check('EVENINGS[3] is still a voluntold', ev(w, 'EVENINGS[3].title.indexOf("VOLUNTOLD")') === 0);
  check('the commute cards joined the ordinary pool', ev(w, 'EVENINGS.some(e => e.title === "The Platform") && EVENINGS.some(e => e.title === "The Parking Garage")'));
  check('earlyExit exists and is not in CARD_UNLOCKS', ev(w, 'typeof CARDS.earlyExit === "function" && !("earlyExit" in CARD_UNLOCKS)'));
}

// --- 2. the early exit: offer conditions and skip semantics ---
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.bossGoneToday = true; S.earlyExitOffered = false; S.queue = ['standup']; S.choicePool = null; nextEncounter();");
  check('one card left + light off = the offer', /The Early Exit/.test(cardTitle(w)), cardTitle(w));
  ev(w, 'Math.random = () => 0.99;'); // not caught
  clickChoice(w, 0); // sneak
  check('sneaking clears the day', ev(w, 'S.queue.length') === 0);
  check('sneaking marks the day snuck', ev(w, 'S.snuckOut') === true);
  check('lunch does not happen after you left', ev(w, 'S.lunchDone') === true);
  check('a lucky sneak is never caught', ev(w, 'S.sneakCaughtCount') === 0);
}
{
  // staying plays the pending card
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.bossGoneToday = true; S.earlyExitOffered = false; S.queue = ['standup']; S.choicePool = null; nextEncounter();");
  clickChoice(w, 1); // stay till five
  // the result screen shows; continuing resolves to the pending card
  const btn = w.document.querySelector('#card button.choice:not([disabled])');
  if (btn) btn.click();
  check('staying keeps the last card on the desk', /Daily Standup/.test(cardTitle(w)), cardTitle(w));
  check('the offer does not repeat', ev(w, 'S.earlyExitOffered') === true);
}
{
  // two cards left: no offer yet
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.bossGoneToday = true; S.earlyExitOffered = false; S.queue = ['standup', 'quickSync']; S.choicePool = null; nextEncounter();");
  check('the offer waits for the final card', !/The Early Exit/.test(cardTitle(w)), cardTitle(w));
}
{
  // Thursday never offers, even with the light off
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 3; S.bossGoneToday = true; S.earlyExitOffered = false; S.queue = ['standup']; S.choicePool = null; nextEncounter();");
  check('Thursday is exempt', !/The Early Exit/.test(cardTitle(w)), cardTitle(w));
}
{
  // the signal only ever arms Mon-Wed
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'buildWeek();');
  ev(w, 'Math.random = () => 0.01;'); // would arm if allowed
  ev(w, 'S.day = 3; startDay();');
  check('no signal on Thursday clock-in', ev(w, 'S.bossGoneToday') === false);
}
{
  // the caught roll worsens with the vendor and HR
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.vendor = true; S.hrFlagged = true; S.bossGoneToday = true; S.earlyExitOffered = false; S.queue = ['standup']; S.choicePool = null; nextEncounter();");
  ev(w, 'Math.random = () => 0.45;'); // above base 0.25, below 0.25+0.15+0.10
  clickChoice(w, 0);
  check('vendor + HR make 45% a caught afternoon', ev(w, 'S.sneakCaughtCount') === 1);
}

// --- 3. Friday remembers, or never says ---
{
  const w = fresh({ week: 3, onboarded: 1, phoneRang: true, comms: {}, stats: {} });
  ev(w, "S.sneakCaughtCount = 1; S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 55; runMeeting(DIRECTORS.miller);");
  check('the caught sneak surfaces in the preamble', /came by your desk/.test(ev(w, "document.getElementById('card').innerHTML")));
  check('it costs 4 Reputation per caught afternoon', ev(w, 'S.rep') === 51, ev(w, 'S.rep'));
}
{
  const w = fresh({ week: 3, onboarded: 1, phoneRang: true, comms: {}, stats: {} });
  ev(w, "S.sneakCaughtCount = 0; S.snuckOut = false; S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 55; runMeeting(DIRECTORS.miller);");
  check('an uncaught sneak is never mentioned', !/came by your desk/.test(ev(w, "document.getElementById('card').innerHTML")));
}

// --- 4. the commute cards pay what the receipt says ---
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.day = 1; S.snuckOut = true; S.sanity = 50; eveningEvent();');
  clickChoice(w, 0); // window seat
  // heal 9 lands as 8 at week 3: the wellness taper (x0.92 from week 2) applies
  // to the commute like everything else. Even the 4:15 is worth less over time.
  check('The 4:15 heals 9, taxed to 8 by wellness optimization', ev(w, 'S.sanity') === 58, ev(w, 'S.sanity'));
  check('and pays Life Outside', ev(w, 'S.lifeDelta') >= 1, ev(w, 'S.lifeDelta'));
}
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'Math.random = () => 0.99;');
  ev(w, 'S.day = 1; S.time = 0; S.sanity = 50; eveningEvent();');
  clickChoice(w, 0); // stand, hold the rail
  check('The 7:40 barely heals', ev(w, 'S.sanity') === 51, ev(w, 'S.sanity'));
}

// --- 5. the career clock: full speedrun frame ---
{
  check('burnout prints START TO FLOOR', /START TO FLOOR/.test(html));
  check('managed-out prints START TO LOBBY', /START TO LOBBY/.test(html));
  check('Saturday can show FASTEST ESCAPE', /FASTEST ESCAPE/.test(html));
}
{
  // quitting sets the escape record from the cycle baseline
  const w = fresh({ week: 2, onboarded: 1, totalPlayMs: 600000, cycleClockMs: 0, comms: {}, stats: {} });
  ev(w, "S.weekStartMs = Date.now() - 60000; S.items = []; ending('quit');");
  const best = ev(w, 'META.bestEscapeMs');
  check('quitting records the escape time', best >= 660000 && best < 700000, best);
  check('the ending shows HIRE TO DOOR', /HIRE TO DOOR/.test(ev(w, "document.getElementById('card').innerHTML")));
  check('a first record announces itself', /A PERSONAL RECORD/.test(ev(w, "document.getElementById('card').innerHTML")));
  ev(w, "document.getElementById('ngplus').onclick();");
  check('accepting the offer baselines the next stint\'s clock', ev(w, 'META.cycleClockMs') === ev(w, 'META.totalPlayMs') && ev(w, 'META.cycleClockMs') > 0);
}
{
  // a slower second escape does not beat the record
  const w = fresh({ week: 1, ng: 1, onboarded: 1, totalPlayMs: 700000, cycleClockMs: 660000, bestEscapeMs: 30000, comms: {}, stats: {} });
  ev(w, "S.weekStartMs = Date.now() - 120000; S.items = []; ending('quit');");
  check('a slower escape keeps the old record', ev(w, 'META.bestEscapeMs') === 30000, ev(w, 'META.bestEscapeMs'));
  check('the standing record is shown instead', /FASTEST ESCAPE ON FILE/.test(ev(w, "document.getElementById('card').innerHTML")));
}
{
  // import carries the clock
  const w = fresh();
  ev(w, "const m = { week: 3, leverage: 10, up: {}, totalPlayMs: 123456, bestWeekMs: 60000, bestEscapeMs: 90000, cycleClockMs: 111 }; " +
        "META.week = m.week; META.totalPlayMs = m.totalPlayMs || 0; META.bestWeekMs = m.bestWeekMs || 0; META.bestEscapeMs = m.bestEscapeMs || 0; META.cycleClockMs = m.cycleClockMs || 0;");
  check('the import path includes every clock field', /META\.totalPlayMs = m\.totalPlayMs \|\| 0; META\.bestWeekMs = m\.bestWeekMs \|\| 0; META\.bestEscapeMs = m\.bestEscapeMs \|\| 0; META\.cycleClockMs = m\.cycleClockMs \|\| 0;/.test(html));
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
