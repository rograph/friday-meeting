// v0.28 "Per My Email Below" headless verification: the four Tier 1 chain
// payoffs (A Favor From IT, The Deadline Surfaced, The Fourth Cake, Dave
// Landed), the one-per-Monday injection cap, the Network's stacking
// discounts, the partnership cross-link, the Friday preamble beats, and the
// tagline change. Promises made in card copy are debts (Decision 54); these
// checks confirm the first four payments cleared.
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

// --- 1. the tagline: universal hook first, Operations Manager kept ---
{
  check('description leads with the building-runner hook', /the one person who actually keeps the building running/.test(html));
  check('Operations Manager survives in the description', /<meta name="description"[^>]*Operations Manager/.test(html));
  check('og:description matches', /<meta property="og:description"[^>]*keeps the building running/.test(html));
}

// --- 2. injected cards are consequences, not deals ---
{
  const w = fresh();
  const injected = ['favorFromIT', 'deadlineSurfaced', 'fourthCake', 'daveLanded'];
  check('all four payoff cards exist', ev(w, JSON.stringify(injected) + '.every(k => typeof CARDS[k] === "function")'));
  check('none of them are in CARD_UNLOCKS', ev(w, JSON.stringify(injected) + '.every(k => !(k in CARD_UNLOCKS))'));
}

// --- 3. the handoff plants the intern's debt ---
{
  const w = fresh({ week: 4, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.theHandoff(), () => {})');
  clickChoice(w, 0); // report the table, minus the boy
  check('reporting minus the boy covers the intern', ev(w, 'META.internCovered') === true);
  check('the week is stamped', ev(w, 'META.internCoveredWeek') === 4);
}
{
  const w = fresh({ week: 4, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.theHandoff(), () => {})');
  clickChoice(w, 1); // say nothing
  check('saying nothing also covers the intern', ev(w, 'META.internCovered') === true);
}

// --- 4. a favor from IT: due two weeks later, choices pay differently ---
{
  const w = fresh({ week: 6, internCovered: true, internCoveredWeek: 4, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.queue = []; S.day = 0;');
  const k = ev(w, 'injectMondayChain()');
  check('the favor comes due two weeks later', k === 'favorFromIT', k);
  check('the flag is consumed', ev(w, 'META.internCovered') === false);
  ev(w, 'showCard(CARDS.favorFromIT(), () => {})');
  clickChoice(w, 1); // ask about the badge logs
  check('asking about the logs plants badgeCurious', ev(w, 'META.badgeCurious') === true);
}
{
  const w = fresh({ week: 6, internCovered: true, internCoveredWeek: 4, onboarded: 1, comms: {}, stats: {} });
  const lev = ev(w, 'META.leverage');
  ev(w, 'showCard(CARDS.favorFromIT(), () => {})');
  clickChoice(w, 2); // bank it
  check('banking the favor pays +1 Leverage', ev(w, 'META.leverage') === lev + 1);
  check('the debt enters the cabinet', ev(w, 'META.fileCabinet.some(f => /Intern/.test(f.title))'));
}
{
  const w = fresh({ week: 5, internCovered: true, internCoveredWeek: 4, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.queue = [];');
  check('one week early, the favor is not yet due', ev(w, 'injectMondayChain()') === null);
  check('the flag survives the early Monday', ev(w, 'META.internCovered') === true);
}

// --- 5. the buried deadline: set by two choices, spared by one, due Thursday ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.bossEmail(), () => {})');
  clickChoice(w, 0); // "Sounds good!"
  check('"Sounds good!" buries the ask', ev(w, 'S.buriedAsk') === true);
}
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.bossEmail(), () => {})');
  clickChoice(w, 1); // actually parse it
  check('parsing defuses it and marks the foresight', ev(w, '!S.buriedAsk && S.parsedAsk === true'));
}
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.bossEmail(), () => {})');
  clickChoice(w, 2); // forward to Chris
  check('forwarding to Chris also buries the ask', ev(w, 'S.buriedAsk') === true);
}
{
  // the Thursday appointment, via the real startDay
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'buildWeek(); S.day = 3; S.buriedAsk = true; startDay();');
  check('Thursday surfaces the deadline first', ev(w, 'S.queue[0]') === 'deadlineSurfaced');
  check('it fires once', ev(w, 'S.deadlineFired === true && S.buriedAsk === false'));
  ev(w, 'S.queue = []; startDay();');
  check('it does not fire twice', ev(w, 'S.queue.length') === 0);
}
{
  // letting it burn costs Rep and arms the Friday line
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.deadlineSurfaced(), () => {})');
  const rep = ev(w, 'S.rep');
  clickChoice(w, 1);
  check('the burn costs 6 Reputation', ev(w, 'S.rep') === rep - 6, ev(w, 'S.rep'));
  check('the burn is remembered for Friday', ev(w, 'S.askBurned') === true);
}

// --- 6. Friday preamble beats ---
{
  const w = fresh({ week: 3, onboarded: 1, phoneRang: true, comms: {}, stats: {} });
  ev(w, "S.parsedAsk = true; S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 55; runMeeting(DIRECTORS.miller);");
  check('the met deadline becomes his foresight', /foresight/.test(ev(w, "document.getElementById('card').innerHTML")));
}
{
  const w = fresh({ week: 3, onboarded: 1, phoneRang: true, comms: {}, stats: {} });
  ev(w, "S.askBurned = true; S.fridayBoss = 'miller'; S.items = [{name:'A', value: 6, locked: true}]; S.sanity = 80; S.rep = 55; runMeeting(DIRECTORS.miller);");
  check('the burned deadline becomes "ownership culture"', /Ownership culture/.test(ev(w, "document.getElementById('card').innerHTML")));
}

// --- 7. the fourth cake: four weeks, two versions ---
{
  const w = fresh({ week: 9, priyaPending: true, priyaWeek: 5, priyaSpokeUp: true, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.queue = [];');
  check('the cake arrives four weeks later', ev(w, 'injectMondayChain()') === 'fourthCake');
  const c = ev(w, 'CARDS.fourthCake()');
  check('speaking up earns the goodbye', /Say goodbye/.test(c.choices[0].label), c.choices[0].label);
  ev(w, 'showCard(CARDS.fourthCake(), () => {})');
  clickChoice(w, 0);
  check('her email joins the Network', ev(w, 'META.priyaEmail') === true);
  check('the Network costs 5 less', ev(w, "storeCost(STORE.find(i => i.id === 'network'))") === 35);
}
{
  const w = fresh({ week: 9, priyaPending: true, priyaWeek: 5, priyaSpokeUp: false, onboarded: 1, comms: {}, stats: {} });
  const c = ev(w, 'CARDS.fourthCake()');
  check('the ledger-only path closes the entry instead', /Close the entry/.test(c.choices[0].label), c.choices[0].label);
  const lev = ev(w, 'META.leverage');
  ev(w, 'showCard(CARDS.fourthCake(), () => {})');
  clickChoice(w, 0);
  check('closing the entry pays +1 Leverage', ev(w, 'META.leverage') === lev + 1);
  check('the closing entry is filed', ev(w, 'META.fileCabinet.some(f => /Fourth Departure/.test(f.title))'));
}
{
  const w = fresh({ week: 8, priyaPending: true, priyaWeek: 5, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.queue = [];');
  check('three weeks in, the cake is not yet due', ev(w, 'injectMondayChain()') === null);
}

// --- 8. dave, landed ---
{
  const w = fresh({ week: 5, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.offboarding(), () => {})');
  clickChoice(w, 0); // walk Dave out
  check('walking Dave out starts his clock', ev(w, 'META.davePending === true && META.daveWeek === 5'));
}
{
  const w = fresh({ week: 8, davePending: true, daveWeek: 5, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.queue = [];');
  check('Dave lands three weeks later', ev(w, 'injectMondayChain()') === 'daveLanded');
  ev(w, 'showCard(CARDS.daveLanded(), () => {})');
  check('the card itself records the landing', ev(w, 'META.daveLanded') === true);
  clickChoice(w, 0); // give the reference
  check('the reference makes Dave the Network', ev(w, 'META.daveNetwork') === true);
  check('the Network costs 10 less', ev(w, "storeCost(STORE.find(i => i.id === 'network'))") === 30);
}
{
  // the discounts stack, floored: 40 - 10 - 10 - 5 = 15
  const w = fresh({ week: 9, ninaTrust: true, daveNetwork: true, priyaEmail: true, onboarded: 1, comms: {}, stats: {} });
  check('Nina + Dave + Priya stack to 15', ev(w, "storeCost(STORE.find(i => i.id === 'network'))") === 15);
}

// --- 9. the partnership cross-link ---
{
  const w = fresh({ week: 2, daveLanded: true, onboarded: 1, comms: {}, stats: {} });
  check('the contact got the name from Dave', /Dave gave them the name/.test(ev(w, 'CARDS.partnership().flavor')));
}
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  check('without Dave, the emails explain it', /answered their emails/.test(ev(w, 'CARDS.partnership().flavor')));
}

// --- 10. the Monday cap: one debt per coffee ---
{
  const w = fresh({ week: 9, trainingPending: true, davePending: true, daveWeek: 5, priyaPending: true, priyaWeek: 5, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'S.queue = [];');
  const first = ev(w, 'injectMondayChain()');
  check('three debts due, one collected', first === 'trainingNotCompleted', first);
  check('the others keep their flags', ev(w, 'META.davePending === true && META.priyaPending === true'));
  const second = ev(w, 'injectMondayChain()');
  check('next Monday collects the next in line', second === 'fourthCake', second);
  const third = ev(w, 'injectMondayChain()');
  check('then the one after', third === 'daveLanded', third);
  check('then the ledger is clear', ev(w, 'injectMondayChain()') === null);
}
{
  // the brooksPattern setter, both branches
  const w = fresh({ week: 5, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.brooksPattern(), () => {})');
  clickChoice(w, 0); // say something in the room
  check('speaking up is remembered', ev(w, 'META.priyaPending === true && META.priyaSpokeUp === true'));
}
{
  const w = fresh({ week: 5, onboarded: 1, comms: {}, stats: {} });
  ev(w, 'showCard(CARDS.brooksPattern(), () => {})');
  clickChoice(w, 1); // ledger it
  check('the ledger path is remembered too, differently', ev(w, 'META.priyaPending === true && META.priyaSpokeUp === false'));
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
