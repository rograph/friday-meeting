// v0.30 "Test Pattern" headless verification: the title card. Shown on a cold
// open, dismissed with the CRT power-off, skipped on same-sitting reloads,
// wrong in NG+, and always UNDER the scanline overlays so it reads as the
// same monitor.
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
function fresh(preMeta, preSession) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    if (/navigation to another Document/.test(e.message)) return;
    console.log('JSDOM ERROR: ' + e.message); failures++;
  });
  const pre =
    (preMeta ? 'localStorage.setItem("fm_meta_v1", ' + JSON.stringify(JSON.stringify(preMeta)) + ');' : '') +
    (preSession ? 'sessionStorage.setItem("fm_title_seen", "1");' : '');
  const dom = new JSDOM('<script>' + pre + '</script>' + html,
    { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://example.test/' });
  return dom.window;
}
function ev(w, code) { return w.eval(code); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {

// --- 1. the cold open ---
{
  const w = fresh();
  check('the title card exists and says the two words', /FRIDAY MEETING/.test(ev(w, "document.getElementById('title-main').textContent")));
  check('a cold open shows the marquee', ev(w, "document.getElementById('titlescreen').style.display") !== 'none');
  check('the boot terminal waits behind it', ev(w, "document.getElementById('bootlines').textContent") === '');
  check('cycle 1 gets the honest subtitle', /OPERATIONS TERMINAL 4B/.test(ev(w, "document.getElementById('title-sub').textContent")));
  check('the chrome buttons wait behind the marquee', ev(w, "document.body.classList.contains('titling')"));
  check('the memo button already exists behind it', ev(w, "!!document.getElementById('noticebtn')"));
}

// --- 2. dismissal: power-off, then the memo ---
{
  const w = fresh();
  ev(w, "document.getElementById('titlescreen').click();");
  check('the click powers the set off', ev(w, "document.getElementById('titlescreen').classList.contains('off')"));
  check('the sitting is remembered', ev(w, "sessionStorage.getItem('fm_title_seen')") === '1');
  await sleep(700);
  check('the marquee is gone', ev(w, "document.getElementById('titlescreen').style.display") === 'none');
  check('the chrome clocks in with the terminal', ev(w, "!document.body.classList.contains('titling')"));
  await sleep(400);
  check('the boot terminal starts typing after dismissal', ev(w, "document.getElementById('bootlines').textContent.length") > 0);
}

// --- 3. any key also works, exactly once ---
{
  const w = fresh();
  ev(w, "document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));");
  check('a key press dismisses it too', ev(w, "document.getElementById('titlescreen').classList.contains('off')"));
  ev(w, "document.getElementById('titlescreen').click();");
  await sleep(700);
  check('double dismissal is harmless', ev(w, "document.getElementById('titlescreen').style.display") === 'none');
}

// --- 4. the weekly reload skips the marquee ---
{
  const w = fresh(null, true);
  check('a same-sitting reload goes straight to the memo', ev(w, "document.getElementById('titlescreen').style.display") === 'none');
  await sleep(400);
  check('typing starts immediately', ev(w, "document.getElementById('bootlines').textContent.length") > 0);
}

// --- 5. NG+ wrongness ---
{
  const w = fresh({ week: 1, ng: 1, onboarded: 1, comms: {}, stats: {} });
  check('cycle 2 knows where you are', /A DIFFERENT CAMPUS/.test(ev(w, "document.getElementById('title-sub').textContent")));
}

// --- 6. the marquee sits under the scanlines ---
{
  check('title z-index is below the CRT overlays', /#titlescreen \{[^}]*z-index: 45/.test(html));
  check('the overlays still start at 50', /pointer-events: none; z-index: 50;/.test(html));
  check('the week clock is untouched by the marquee', /S\.weekStartMs starts at BEGIN WEEK/.test(html));
}

console.log('');
console.log(failures ? failures + ' FAILURES' : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);

})();
