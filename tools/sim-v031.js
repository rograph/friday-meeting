// v0.31 "Clock Discipline" headless verification: the playtest-response pass.
// Lunch precedes the day's final card, the boss email reads as last night's,
// the sneak absorbed the ride, the raise line left the weekly summary and
// became The Adjustment, the memo surfaces (modifier on boot, urgent glow,
// OPS notes), and crunch explains itself at the moment it starts.
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
function resolveResult(w) {
  const btn = w.document.querySelector('#card button.choice:not([disabled])');
  if (btn) btn.click();
}

// --- 1. the clock runs in one direction: lunch before the final card ---
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.queue = ['standup', 'quickSync']; S.choicePool = null; nextEncounter();");
  check('two cards left: no lunch yet', !/Lunch/.test(cardTitle(w)), cardTitle(w));
  clickChoice(w, 0); resolveResult(w);
  check('one card left: lunch arrives before it', /Lunch/.test(cardTitle(w)), cardTitle(w));
  clickChoice(w, 0); resolveResult(w);
  check('the final card follows lunch', /Quick Sync/.test(cardTitle(w)), cardTitle(w));
}
{
  // full afternoon order: lunch, THEN the 3:47 offer, THEN the last card
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.bossGoneToday = true; S.earlyExitOffered = false; S.queue = ['standup']; S.choicePool = null; nextEncounter();");
  check('lunch outranks the early exit offer', /Lunch/.test(cardTitle(w)), cardTitle(w));
  clickChoice(w, 0); resolveResult(w);
  check('the 3:47 offer follows the 12-to-2', /The Early Exit/.test(cardTitle(w)), cardTitle(w));
}

// --- 2. the email was sent last night, read this morning ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  const c = ev(w, 'CARDS.bossEmail()');
  check('the tag says SENT 11:58 PM, LAST NIGHT', /SENT 11:58 PM, LAST NIGHT/.test(c.tag), c.tag);
  check('the flavor reads it on the clock, not at midnight', /last night/.test(c.flavor));
}

// --- 3. the raise line left the weekly summary ---
{
  check('scoreBlock no longer projects the annual raise', !/Projected annual raise/.test(html));
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  check('the score block still reports the week', /Credit kept/.test(ev(w, 'scoreBlock()')));
}

// --- 4. The Adjustment: annual, once, in the ledger if you dare ---
{
  const w = fresh({ week: 6, onboarded: 1, comms: {}, stats: {} });
  check('unlocked at week 6', ev(w, 'CARD_UNLOCKS.costOfLiving') === 6);
  const lev = ev(w, 'META.leverage');
  ev(w, 'showCard(CARDS.costOfLiving(), () => {})');
  clickChoice(w, 0); // do the math
  check('the math pays +1 Leverage', ev(w, 'META.leverage') === lev + 1);
  check('the gap enters the cabinet', ev(w, 'META.fileCabinet.some(f => f.title === "The Adjustment")'));
  check('the year is stamped', ev(w, 'META.adjustmentWeek') === 6);
}
{
  // annual means annual: out of the pool for six weeks after it lands
  const w = fresh({ week: 8, adjustmentWeek: 6, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'buildWeek();');
  check('week 8: the memo does not come twice', ev(w, "weekDeck.indexOf('costOfLiving')") === -1);
  const w2 = fresh({ week: 12, adjustmentWeek: 6, onboarded: 1, comms: {}, stats: {} });
  ev(w2, 'buildWeek();');
  check('week 12: the next fiscal year exists', ev(w2, "weekDeck.indexOf('costOfLiving')") >= 0);
}

// --- 5. the memo surfaces ---
{
  const w = fresh({ week: 5, onboarded: 1, comms: {}, stats: {} });
  check('the weekly modifier is typed on the boot screen itself', ev(w, 'BOOTLINES.some(l => l === MOD.boot)'));
  check('the OPS notes exist by week 5', ev(w, "POLICY_NOTICES.filter(n => /OPERATIONS NOTE/.test(n.t)).length") === 3);
  check('one of them teaches the Thursday freeze', ev(w, "POLICY_NOTICES.some(n => /TARGETS FREEZE AT MIDNIGHT THURSDAY/.test(n.t))"));
  check('one of them hints at the empty afternoons', ev(w, "POLICY_NOTICES.some(n => /EMPTIES EARLY/.test(n.t))"));
}
{
  // the rolodex tip makes the memo glow
  const w = fresh({ week: 3, onboarded: 1, up: { rolodex: true }, comms: {}, stats: {} });
  check('an actionable memo wears the urgent class', ev(w, "document.getElementById('noticebtn').classList.contains('urgent')"));
  check('and says so out loud', /ACTION REQUIRED/.test(ev(w, "document.getElementById('noticebtn').textContent")));
}
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  const urgent = ev(w, "document.getElementById('noticebtn').classList.contains('urgent')");
  const freshActionable = ev(w, "POLICY_NOTICES.filter(n => n.w === META.week).some(n => /ROLODEX|CHECKPOINT|DEVELOPMENT OPPORTUNITY|ADDITIONAL WIN/.test(n.t))");
  check('the glow matches the contents', urgent === freshActionable, urgent + '/' + freshActionable);
}

// --- 6. crunch explains itself, once per day ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "S.day = 1; S.crunchNotedToday = false; S.time = 2; document.getElementById('card').innerHTML = '<h2>x</h2>'; apply({ time: 2 });");
  check('hitting zero Time explains crunch on the card', /CRUNCH\./.test(ev(w, "document.getElementById('card').innerHTML")));
  check('and in the record', ev(w, "S.log.some(l => /50% higher/.test(l))"));
  ev(w, "document.getElementById('card').innerHTML = '<h2>x</h2>'; apply({ time: 1 });");
  check('it does not repeat the same day', !/CRUNCH\./.test(ev(w, "document.getElementById('card').innerHTML")));
  ev(w, 'buildWeek(); S.day = 2; startDay();');
  check('a new day resets the explainer', ev(w, 'S.crunchNotedToday') === false);
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
