// Dominated-choice audit for Friday Meeting.
//
// Loads the live index.html in a headless DOM, pulls out CARDS / EVENINGS /
// APPRECIATION, and flags any choice pair where one option is equal-or-better
// than its sibling on every axis the player can actually see on the button
// (Time, Sanity cost, Sanity heal, Credit, Reputation, Life Outside), with no
// other differentiator (decline/voluntold legal-state, lockItem/noticeItem
// exposure, or a custom `after` callback we can't statically compare).
//
// Run after adding or editing any card or store item:
//   npm install jsdom   (one-time, dev-only, not shipped with the game)
//   node tools/audit-dominated-choices.js
//
// A clean run prints only "Audit complete." with no DOMINATED lines above it.
// See Design Doc Decisions Log #29 for the incident that led to this script:
// a rebalanced choice looked fine in the code but was invisible in the UI, so
// it still read as a dead option to the player. That specific display bug
// (costLabel() not rendering `life`) is fixed, but the audit stays as a
// standing check against the next version of the same mistake.

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const vc = new VirtualConsole();
vc.forwardTo(console);
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: undefined,
  pretendToBeVisual: true,
  url: 'http://localhost/',
  virtualConsole: vc
});
const w = dom.window;
w.onerror = () => {}; // audio-stub noise only, harmless in this headless context
w.eval('window.CARDS = CARDS; window.EVENINGS = EVENINGS; window.APPRECIATION = APPRECIATION; window.META = META; window.S = S;');

function extractChoiceProfile(ch) {
  const d = ch.delta || {};
  return {
    label: ch.label,
    time: d.time || 0,
    sanityCost: d.sanity || 0,
    heal: d.heal || 0,
    credit: d.credit || 0,
    rep: d.rep || 0,
    life: ch.life || 0,
    lockItem: !!d.lockItem,
    noticeItem: !!d.noticeItem,
    decline: !!ch.decline,
    voluntold: !!ch.voluntold,
    hasAfter: !!ch.after
  };
}

function dominates(a, b) {
  if (a.hasAfter || b.hasAfter) return false;
  if (a.decline !== b.decline || a.voluntold !== b.voluntold) return false;
  if (a.lockItem !== b.lockItem || a.noticeItem !== b.noticeItem) return false;
  const goodAeqB = a.heal >= b.heal && a.credit >= b.credit && a.rep >= b.rep && a.life >= b.life;
  const costAeqB = a.time <= b.time && a.sanityCost <= b.sanityCost;
  const strictlyBetter = a.heal > b.heal || a.credit > b.credit || a.rep > b.rep || a.life > b.life || a.time < b.time || a.sanityCost < b.sanityCost;
  return goodAeqB && costAeqB && strictlyBetter;
}

let foundAny = false;
function auditCardChoices(key, card) {
  if (!card || !card.choices || card.choices.length < 2) return;
  const profiles = card.choices.map(extractChoiceProfile);
  for (let i = 0; i < profiles.length; i++) {
    for (let j = 0; j < profiles.length; j++) {
      if (i === j) continue;
      if (dominates(profiles[i], profiles[j])) {
        foundAny = true;
        console.log('DOMINATED - card "' + key + '":');
        console.log('   better: "' + profiles[i].label + '"', JSON.stringify(profiles[i]));
        console.log('   worse:  "' + profiles[j].label + '"', JSON.stringify(profiles[j]));
      }
    }
  }
}

// call each generator a few times to catch randomized variants (oneOnOne, etc.)
Object.keys(w.CARDS).forEach(key => {
  for (let n = 0; n < 6; n++) {
    try {
      const card = w.CARDS[key]();
      auditCardChoices(key + (n > 0 ? ' (variant ' + n + ')' : ''), card);
    } catch (e) {
      console.log('ERROR building card', key, e.message);
    }
  }
});

w.EVENINGS.forEach((ev, i) => auditCardChoices('EVENING[' + i + '] ' + ev.title, ev));
auditCardChoices('APPRECIATION', w.APPRECIATION);

console.log(foundAny ? 'Audit complete - see DOMINATED lines above.' : 'Audit complete. Clean.');
process.exit(foundAny ? 1 : 0);
