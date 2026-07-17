// v0.20 headless verification: multi-round Friday fight
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

function setup(w, { week, sanity = 100, rep = 50, boss = 'miller' }) {
  ev(w, `META.week = ${week}; S.sanity = ${sanity}; S.rep = ${rep}; S.time = 10; S.over = false; S.fridayBoss = '${boss}';`);
}

function clickChoice(w, i) {
  const btn = w.document.querySelector('#card button.choice[data-i="' + i + '"]');
  if (!btn) throw new Error('no choice button ' + i);
  btn.click();
}
function clickCont(w) {
  const btn = w.document.getElementById('cont');
  if (!btn) throw new Error('no continue button');
  btn.click();
}

// --- 1. round counts and formulas ---
{
  const w = fresh();
  const rc = wk => ev(w, `META.week = ${wk}; bossRoundCount()`);
  check('rounds wk1 = 1', rc(1) === 1, rc(1));
  check('rounds wk2 = 1', rc(2) === 1);
  check('rounds wk3 = 2', rc(3) === 2);
  check('rounds wk6 = 2', rc(6) === 2);
  check('rounds wk7 = 3', rc(7) === 3);
  check('rounds wk10 = 3', rc(10) === 3);
  const dc = wk => ev(w, `META.week = ${wk}; deflectCost()`);
  check('deflect base wk1 = 2', dc(1) === 2);
  check('deflect base wk6 = 4', dc(6) === 4);
  check('deflect base wk9 = 5', dc(9) === 5);
  // counterChance: wk1, rep 50, miller, no footing -> 0.5 - 0 - 0.15 = 0.35
  ev(w, 'META.week = 1; S.rep = 50; S.fightFooting = 0;');
  check('chance wk1 rep50 miller = 0.35', Math.abs(ev(w, "counterChance(DIRECTORS.miller)") - 0.35) < 1e-9);
  // wk9 (-0.16 cap), rep 50, reed, footing -0.08 -> 0.5 - 0.16 - 0.08 = 0.26
  ev(w, 'META.week = 9; S.fightFooting = -0.08;');
  check('chance wk9 rep50 reed quiet = 0.26', Math.abs(ev(w, "counterChance(DIRECTORS.reed)") - 0.26) < 1e-9);
  // clamps
  ev(w, 'META.week = 10; S.rep = 1; S.fightFooting = -0.08;');
  check('chance floor 0.15', ev(w, "counterChance(DIRECTORS.miller)") === 0.15);
  ev(w, 'META.week = 1; S.rep = 100; S.fightFooting = 0.08;');
  check('chance max reachable 0.83 (ceiling clamp never binds)', Math.abs(ev(w, "counterChance(DIRECTORS.reed)") - 0.83) < 1e-9);
  // move pools: 3 per boss, all fields present
  const pools = ev(w, "Object.keys(BOSS_MOVES).map(k => [k, BOSS_MOVES[k].length, BOSS_MOVES[k].every(m => m.title && m.flavor && m.counter && m.win && m.lose && m.deflect && m.deflectLine)])");
  check('all 4 pools have 3 complete moves', pools.length === 4 && pools.every(p => p[1] === 3 && p[2]), JSON.stringify(pools));
}

// --- 2. full meeting, forced counter wins, each boss, wk7 (3 rounds) ---
for (const boss of ['miller', 'reed', 'brooks', 'calloway']) {
  const w = fresh();
  setup(w, { week: 7, rep: 80, boss });
  ev(w, 'Math.random = () => 0.001;'); // every counter wins; boss pick irrelevant (forced)
  ev(w, 'meetingProper();');
  const repBefore = ev(w, 'S.rep');
  clickChoice(w, 0); clickCont(w); // push back (rep -4), footing +0.08
  check(boss + ': footing set after pushback', ev(w, 'S.fightFooting') === 0.08);
  const titles = [];
  for (let r = 0; r < 3; r++) {
    titles.push(w.document.querySelector('#card h2').textContent);
    clickChoice(w, 0); // counter
    clickCont(w);
  }
  check(boss + ': 3 distinct moves, no repeats', new Set(titles).size === 3, titles.join(' | '));
  check(boss + ': won all 3 rounds', ev(w, 'S.roundsWon') === 3);
  check(boss + ': majority win earns claims reduction', ev(w, 'S.escalationBonus') === -1);
  check(boss + ': rep = before -4 +3 (3 wins at recalibrated +1)', ev(w, 'S.rep') === repBefore - 4 + 3, ev(w, 'S.rep'));
  check(boss + ': meeting proper rendered', w.document.getElementById('meetitems') !== null);
  check(boss + ': held-the-room preamble shown', w.document.getElementById('card').innerHTML.indexOf('held the room') !== -1);
  check(boss + ': still in boss fight during meeting', ev(w, 'inBossFight') === true);
}

// --- 3. forced counter losses, wk7, quiet stance: exact deltas, no reduction ---
{
  const w = fresh();
  setup(w, { week: 7, sanity: 90, rep: 60, boss: 'brooks' });
  ev(w, 'Math.random = () => 0.999;'); // every counter loses; unreliable narrator (sanity>=30 anyway) off
  ev(w, 'meetingProper();');
  clickChoice(w, 1); clickCont(w); // quiet: base 4 -> ceil(6) + surcharge 5 = 11
  check('quiet stance sanity 90->79 (v0.21 pipeline)', ev(w, 'S.sanity') === 79, ev(w, 'S.sanity'));
  check('quiet stance footing -0.08', ev(w, 'S.fightFooting') === -0.08);
  // one counter loss: base 4+floor(7/3)=6 -> ceil(9) + 5 = 14; rep -5 in full
  clickChoice(w, 0); clickCont(w);
  check('counter loss sanity 79->65', ev(w, 'S.sanity') === 65, ev(w, 'S.sanity'));
  check('counter loss rep 60->55', ev(w, 'S.rep') === 55, ev(w, 'S.rep'));
  // deflect round: base 2+floor(7/3)=4 -> ceil(6) + 5 = 11
  clickChoice(w, 1); clickCont(w);
  check('deflect sanity 65->54', ev(w, 'S.sanity') === 54, ev(w, 'S.sanity'));
  clickChoice(w, 0); clickCont(w); // third round, lose again
  check('no reduction on 0-1 wins of 3', ev(w, 'S.escalationBonus') === 0, ev(w, 'S.escalationBonus'));
  check('run still alive', ev(w, 'S.over') === false);
}

// --- 4. wk1 single round, win 1 of 1 = majority ---
{
  const w = fresh();
  setup(w, { week: 1, boss: 'miller' });
  ev(w, 'Math.random = () => 0.001;');
  ev(w, 'meetingProper();');
  clickChoice(w, 0); clickCont(w);
  clickChoice(w, 0); clickCont(w); // the only round
  check('wk1: 1 win of 1 earns reduction', ev(w, 'S.escalationBonus') === -1);
}

// --- 5. mid-meeting Burnout on a counter loss: cleanup fires ---
{
  const w = fresh();
  setup(w, { week: 7, sanity: 22, rep: 60, boss: 'miller' });
  ev(w, 'Math.random = () => 0.999;');
  ev(w, 'meetingProper();');
  clickChoice(w, 1); clickCont(w); // quiet: 22 - 11 = 11 sanity left
  check('sanity at 11 before round', ev(w, 'S.sanity') === 11, ev(w, 'S.sanity'));
  clickChoice(w, 0); // counter loss: 14 sanity -> burnout mid-apply
  check('burnout: run over', ev(w, 'S.over') === true);
  check('burnout: inBossFight cleared', ev(w, 'inBossFight') === false);
  check('burnout: confrontation class removed', !w.document.body.classList.contains('confrontation'));
}

// --- 6. mid-meeting Performance Managed Out on rep hitting 0 ---
{
  const w = fresh();
  setup(w, { week: 7, sanity: 90, rep: 8, boss: 'reed' });
  ev(w, 'Math.random = () => 0.999;');
  ev(w, 'meetingProper();');
  clickChoice(w, 1); clickCont(w); // quiet, rep untouched at 8
  clickChoice(w, 0); // counter loss: rep -5 -> 3; not dead yet
  clickCont(w);
  clickChoice(w, 0); // second loss: rep -5 -> 0 -> fired
  check('PMO: run over at rep 0', ev(w, 'S.over') === true);
  check('PMO: inBossFight cleared', ev(w, 'inBossFight') === false);
  check('PMO: confrontation class removed', !w.document.body.classList.contains('confrontation'));
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : '\n' + failures + ' FAILURES');
process.exit(failures === 0 ? 0 : 1);
