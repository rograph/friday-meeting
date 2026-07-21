// v0.27 "Development Opportunity" headless verification: the Presentation
// (anti-compliance adaptation), Notes Between Selves, NG+ wrongness copy,
// A Restorative Conversation, the phone, the sixty-second sync, memory doubt
// below 30 Sanity, the composure prose line, and the career-fair scrub.
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

// --- 1. career fair is gone; the card is a vague event ---
{
  check('no "career fair" anywhere in the file', !/career.fair/i.test(html));
  const w = fresh();
  const c = ev(w, 'CARDS.balloonArch()');
  check('the card is The Arch', c.title === 'The Arch', c.title);
  check('its tag is a vague event', /THE EVENT/.test(c.tag), c.tag);
}

// --- 2. the presentation: trigger, streak reset, meek tax, extra claim ---
{
  const w = fresh({ week: 5, cleanStreak: 2, onboarded: 1, comms: {}, stats: {} });
  check('presentation announced in the memo', ev(w, 'POLICY_NOTICES.some(n => /DEVELOPMENT OPPORTUNITY/.test(n.t))'));
  ev(w, "S.presentationWeek = (META.cleanStreak||0) >= 2; if (S.presentationWeek) META.cleanStreak = 0; saveMeta();");
  check('presentation week set from streak', ev(w, 'S.presentationWeek') === true);
  check('streak resets when it fires', ev(w, 'META.cleanStreak') === 0);
  // run the scene, read as written
  ev(w, "S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 60; meetingProper();");
  check('the presentation replaces the stance card', /The Presentation/.test(ev(w, "document.querySelector('#card h2').textContent")));
  check('no agenda rounds this week (no composure line)', ev(w, "document.getElementById('composurelabel')") === null);
  clickChoice(w, 0); // read as written
  check('meek flag set', ev(w, 'S.presentationMeek') === true);
  check('next week arrives hungrier', ev(w, 'META.nextWeekExtraClaim') === true);
  ev(w, 'S.sanity = 80;'); // hold sanity constant so only the bonus differs
  const bonus = ev(w, "leverageFor('compliance')");
  const bonusClean = ev(w, "S.presentationMeek = false; const b = leverageFor('compliance'); S.presentationMeek = true; b");
  check('meek compliance pays 4 less than clean compliance', bonusClean - bonus === 4, bonusClean - bonus);
}
{
  // the extra claim is consumed the following week
  const w = fresh({ week: 6, nextWeekExtraClaim: true, onboarded: 1, comms: {}, stats: {} });
  check('extra-claim policy announced', ev(w, 'POLICY_NOTICES.some(n => /ONE \\(1\\) ADDITIONAL WIN/.test(n.t))'));
  ev(w, 'if (META.nextWeekExtraClaim) { S.extraClaim = 1; META.nextWeekExtraClaim = false; } saveMeta();');
  check('flag consumed', ev(w, 'META.nextWeekExtraClaim') === false);
  check('S.extraClaim armed for the claims formula', ev(w, 'S.extraClaim') === 1);
}
{
  // streak accounting in awardLeverage
  const w = fresh({ week: 3, cleanStreak: 1, onboarded: 1, comms: { stillHere: 1, cleanDesk: 1, filing: 1, underTheWire: 1 }, stats: {} });
  ev(w, "S.items = []; S.sanity = 70; S.weekStartMs = Date.now(); S.weekEndMs = Date.now(); awardLeverage('compliance')");
  check('compliance increments the streak', ev(w, 'META.cleanStreak') === 2);
  ev(w, "awardLeverage('survived', 'B')");
  check('a survived week resets the streak', ev(w, 'META.cleanStreak') === 0);
}

// --- 3. notes between selves ---
{
  const w = fresh();
  check('three note texts exist', ev(w, "['warning','encouragement','instruction'].every(k => typeof NOTE_TEXTS[k] === 'string')"));
  ev(w, 'Math.random = () => 0.99;'); // review passes clean
  const clean = ev(w, "reviewNote(NOTE_TEXTS.warning)");
  check('a clean review returns the text intact', clean.text === ev(w, 'NOTE_TEXTS.warning') && clean.mangled === false);
  ev(w, 'Math.random = () => 0.05;'); // redaction branch
  const red = ev(w, "reviewNote(NOTE_TEXTS.warning)");
  check('a redacted note carries the mark', /█████/.test(red.text) && red.mangled === true, red.text);
  ev(w, 'Math.random = () => 0.25;'); // swap branch
  const swp = ev(w, "reviewNote(NOTE_TEXTS.warning)");
  check('a swapped note is changed but unmarked', swp.mangled === true && !/█████/.test(swp.text) && swp.text !== ev(w, 'NOTE_TEXTS.warning'), swp.text);
}
{
  // the Saturday store offers the note; choosing files it
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.terminated = false; S.weekStartMs = Date.now(); storeScreen();");
  check('store shows the note section', /A NOTE TO MONDAY/.test(ev(w, "document.getElementById('card').innerHTML")));
  ev(w, "document.querySelector('[data-note=\\\"warning\\\"]').click();");
  const noted = ev(w, 'META.note && META.note.type');
  check('choosing a note files it', noted === 'warning', noted);
  check('section flips to filed', /FILED FOR REVIEW/.test(ev(w, "document.getElementById('card').innerHTML")));
  // warning wires the Monday lock discount
  ev(w, "S.day = 0; S.millerGone = false; S.millerPleased = false; S.millerAnnoyed = false;");
  const withNote = ev(w, "S.noteLockDiscount = true; lockCost({ noticed: false })");
  const without = ev(w, "S.noteLockDiscount = false; lockCost({ noticed: false })");
  check('warning shaves 1 off a Monday lock', without - withNote === 1, without - withNote);
}

// --- 4. NG+ wrongness copy ---
{
  const w = fresh({ week: 1, ng: 1, onboarded: 1, comms: {}, stats: {} });
  check('cycle-2 week-1 greeting denies the interruption', /NO INTERRUPTION/.test(ev(w, "document.getElementById('bootlines').textContent || BOOTLINES.join(' ')")) || ev(w, "BOOTLINES.some(l => /NO INTERRUPTION/.test(l))"));
  const chair = ev(w, 'CARDS.standup().flavor');
  check('cycle-2 week-1 chairs deny the other building', /no other building/.test(chair), chair.slice(0, 60));
}
{
  const w = fresh({ week: 1, ng: 0, onboarded: 1, comms: {}, stats: {} });
  check('cycle 1 chairs are normal', !/no other building/.test(ev(w, 'CARDS.standup().flavor')));
}

// --- 5. a restorative conversation ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.rep = 25; S.sanity = 60; restorativeScene(() => { window.__restDone = true; });");
  check('the scene renders', /A Restorative Conversation/.test(ev(w, "document.querySelector('#card h2').textContent")));
  check('the full statement shows first', /best self/.test(ev(w, "document.getElementById('card').innerHTML")));
  for (let i = 0; i < 4; i++) {
    const btn = w.document.getElementById('restread');
    if (btn) btn.click();
  }
  check('four reads reach sincerity 100', /SINCERITY: <b>100%/.test(ev(w, "document.getElementById('card').innerHTML")));
  check('the statement degraded to its bones', /I am grateful. I recognize. I am./.test(ev(w, "document.getElementById('card').textContent")));
  ev(w, "document.getElementById('restdone').click();");
  check('completion counts a restorative', ev(w, 'META.stats.restoratives') === 1);
  check('reputation partially restored (+8 at 70% = +6)', ev(w, 'S.rep') === 31, ev(w, 'S.rep'));
  check('the exit continued the day', ev(w, 'window.__restDone') === true);
  ev(w, "checkCommendations()");
  check('SINCERITY DETECTED awarded', ev(w, '!!META.comms.sincerity'));
}
{
  // trigger wiring: injected once, days 1-3 only
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.rep = 20; S.day = 1; S.queue = []; S.choicePool = null;");
  ev(w, "if (S.rep < 30 && !S.restorativeDone && S.day >= 1 && S.day <= 3) { S.restorativeDone = true; S.queue.unshift('restorative'); }");
  check('low rep queues the conversation', ev(w, "S.queue[0]") === 'restorative');
  ev(w, "S.queue = []; if (S.rep < 30 && !S.restorativeDone && S.day >= 1 && S.day <= 3) { S.queue.unshift('restorative'); }");
  check('it never queues twice', ev(w, 'S.queue.length') === 0);
}

// --- 6. the phone rings once per save ---
{
  const w = fresh({ week: 3, onboarded: 1, phoneRang: false, comms: {}, stats: {} });
  ev(w, "S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 55; S.escalationBonus = -2; S.roundsPlayed = 2; S.roundsWon = 2; runMeeting(DIRECTORS.miller);");
  check('the phone rings on the first break', /phone on the wall rings/.test(ev(w, "document.getElementById('card').innerHTML")));
  check('the ring is recorded', ev(w, 'META.phoneRang') === true);
}
{
  const w = fresh({ week: 3, onboarded: 1, phoneRang: true, comms: {}, stats: {} });
  ev(w, "S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 55; S.escalationBonus = -2; S.roundsPlayed = 2; S.roundsWon = 2; runMeeting(DIRECTORS.miller);");
  check('the phone never rings twice', !/phone on the wall rings/.test(ev(w, "document.getElementById('card').innerHTML")));
}

// --- 7. the sixty-second sync ---
{
  const w = fresh({ week: 4, onboarded: 1, comms: {}, stats: {} });
  check('unlocked at week 4', ev(w, 'CARD_UNLOCKS.minuteMeeting') === 4);
  ev(w, 'const c = CARDS.minuteMeeting(); window.__c = c;');
  check('building the card does NOT start the warp (chooser safety)', !ev(w, 'S.clockWarp'));
  ev(w, "S.weekStartMs = Date.now(); showCard(window.__c, () => {});");
  check('showing the card starts the warp', ev(w, 'S.clockWarp') === true);
  const before = ev(w, 'S.weekStartMs');
  ev(w, 'updateStopwatch()');
  check('each tick costs an extra second', ev(w, 'S.weekStartMs') === before - 1000);
  clickChoice(w, 0);
  check('resolving the card ends the warp', ev(w, 'S.clockWarp') === false);
}

// --- 8. memory doubt below 30 sanity ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.sanity = 25; S.day = 1; S.items = [{name:'A', value: 5, locked: false}, {name:'B', value: 3, locked: true}]; atRiskScreen(() => {});");
  check('an exposed item carries the doubt line', /you do not remember writing this/.test(ev(w, "document.getElementById('card').innerHTML")));
}
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.sanity = 80; S.day = 1; S.items = [{name:'A', value: 5, locked: false}]; atRiskScreen(() => {});");
  check('sane evenings remember everything', !/you do not remember writing this/.test(ev(w, "document.getElementById('card').innerHTML")));
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
