// v0.32 "Under Review" headless verification: the AI-playtest-response pass.
// Three native dialogs became one in-fiction modal, two silent gambles now say
// so, a compliance-sweep modifier re-tensions credit security, the Early Exit
// tells you when it's riskier than usual, and two more beats learned the
// building remembers (META.ng-gated, same pattern CARDS.standup already used).
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

// --- 1. the three native dialogs are gone ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  // if any boot button still called a native dialog, poisoning window.prompt/
  // confirm/alert would throw the moment it's clicked
  ev(w, "window.prompt = () => { throw new Error('prompt() called'); }; window.confirm = () => { throw new Error('confirm() called'); }; window.alert = () => { throw new Error('alert() called'); };");
  ev(w, "document.getElementById('exportbtn').click();");
  check('export opens the modal, not prompt()', ev(w, "document.getElementById('recordoverlay').style.display") === 'block');
  check('export renders the employee record', /YOUR EMPLOYEE RECORD/.test(ev(w, "document.getElementById('recordcontent').innerHTML")));
  ev(w, "document.getElementById('recordoverlay').style.display = 'none';");
  ev(w, "document.getElementById('importbtn').click();");
  check('import opens the modal, not prompt()', ev(w, "document.getElementById('recordoverlay').style.display") === 'block');
  check('import renders a paste field', /PASTE AN EMPLOYEE RECORD/.test(ev(w, "document.getElementById('recordcontent').innerHTML")));
  ev(w, "document.getElementById('recordoverlay').style.display = 'none';");
  const hasWipe = ev(w, "!!document.getElementById('wipebtn')");
  if (hasWipe) {
    ev(w, "document.getElementById('wipebtn').click();");
    check('erase opens the modal, not confirm()', ev(w, "document.getElementById('recordoverlay').style.display") === 'block');
    check('erase renders a real confirmation', /ERASE RECORD/.test(ev(w, "document.getElementById('recordcontent').innerHTML")));
  } else {
    check('erase opens the modal, not confirm() (wipebtn not present this boot state, skipped)', true);
  }
}
{
  // loadSaveCode still round-trips a real export code, now driven by button clicks
  const w = fresh({ week: 3, leverage: 7, onboarded: 1, comms: {}, stats: {} });
  ev(w, "document.getElementById('exportbtn').click();");
  const code = ev(w, "document.getElementById('recordfield').value");
  check('export produces a non-empty code', typeof code === 'string' && code.length > 10);
  check('loadSaveCode accepts its own export', ev(w, 'loadSaveCode(' + JSON.stringify(code) + ')') === true);
  check('a garbage code is rejected, not thrown', ev(w, "loadSaveCode('not a real code')") === false);
}

// --- 2. gambles that cost nothing say so ---
{
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  check('costLabel flags a risky no-delta choice', ev(w, "costLabel({}, 0, true)") === 'RISK: SANITY / REP, WIN OR LOSE');
  check('costLabel leaves a genuine no-cost choice alone', ev(w, "costLabel({}, 0, false)") === 'no cost');
  ev(w, "S.bossComposure = 100; S.bossComposureMax = 100; S.bossPhase2 = false; runBossRounds(DIRECTORS.miller, () => {});");
  const roundHtml = ev(w, "document.getElementById('card').innerHTML");
  check('a boss counter move renders with the risk-labeled cost span', /RISK: SANITY \/ REP, WIN OR LOSE/.test(roundHtml), roundHtml.slice(0, 120));
}
{
  // presentationScene renders straight to the DOM (no return value), so read
  // the actual button markup the way a player would see it
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  ev(w, "presentationScene(DIRECTORS.miller);");
  const cardHtml = ev(w, "document.getElementById('card').innerHTML");
  check('Deviate renders with the risk-labeled cost span', /Deviate[\s\S]*?RISK: SANITY \/ REP, WIN OR LOSE/.test(cardHtml));
  check('the risk cost span carries the warn-colored class', /class="cost risk"[\s\S]*?RISK: SANITY \/ REP, WIN OR LOSE/.test(cardHtml));
}

// --- 3. compliance sweep re-tensions credit security ---
{
  check('the sweep modifier exists', /id: 'sweep'/.test(html));
  const w = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  const base = ev(w, "MOD.id = 'calm'; lockCost({ credit: 10 })");
  const swept = ev(w, "MOD.id = 'sweep'; lockCost({ credit: 10 })");
  check('a sweep week costs 1 more to lock than a calm week', swept === base + 1, base + ' -> ' + swept);
  const audited = ev(w, "MOD.id = 'audit'; lockCost({ credit: 10 })");
  check('sweep matches the existing audit surcharge, not a new number', swept === audited, audited + '/' + swept);
}

// --- 4. the Early Exit tells you when it's riskier than usual ---
{
  const w = fresh({ week: 3, onboarded: 1, comms: {}, stats: {} });
  const baseline = ev(w, "S.vendor = false; S.hrFlagged = false; CARDS.earlyExit()");
  check('baseline odds get no tell', !/riskier than usual/.test(baseline.choices[0].label));
  const flagged = ev(w, "S.vendor = true; CARDS.earlyExit()");
  check('worse odds this week get the tell', /riskier than usual/.test(flagged.choices[0].label));
}

// --- 5. the building remembers (META.ng-gated), two more beats ---
{
  const w1 = fresh({ week: 2, onboarded: 1, comms: {}, stats: {} });
  const w2 = fresh({ week: 2, ng: 1, onboarded: 1, comms: {}, stats: {} });
  const flavor1 = ev(w1, "BOSS_MOVES.miller[0].flavor()");
  const flavor2 = ev(w2, "BOSS_MOVES.miller[0].flavor()");
  check('cycle 1 gets the ordinary "The We" flavor', !/done this before/.test(flavor1));
  check('cycle 2+ gets the variant', /done this before/.test(flavor2));
  check('the two are actually different strings', flavor1 !== flavor2);

  ev(w1, "META.fileCabinet = []; META.week = 3; CARDS.offboarding().choices[0].after(() => {});");
  ev(w2, "META.fileCabinet = []; META.week = 3; CARDS.offboarding().choices[0].after(() => {});");
  const note1 = ev(w1, "META.fileCabinet[0].note");
  const note2 = ev(w2, "META.fileCabinet[0].note");
  check('cycle 1 Dave note is the original', note1 === 'Fourteen years. The box was light. You carried it anyway.', note1);
  check('cycle 2+ Dave note knows it\'s happened before', /done this before/.test(note2), note2);
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
