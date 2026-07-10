# Changelog

## v0.3.1 — 2026-07-10 "Common Names & Publication Prep"
- **Cast renamed to common names:** Director Fenn → **Director Miller**; Micah → **Chris**; Aldous → **Dave** (from Records); Priya/Sam → **Sarah/Tom**. Terry from Facilities and The President unchanged.
- **Two new cards (fictionalized):** *The Clarification* — the boss appears unprompted to explain that nothing happened with someone in Marketing, "and what did happen was entirely from her side"; holding silence makes him re-explain, each version incriminating him slightly more. *The Line Item* — you administer the program budget, so you can see every salary in it, including the raise he's currently explaining you didn't get; quiet documentation pays +2 Leverage ("the spreadsheet has radicalized you").
- Deck is now 16 cards, 10 dealt per run.
- **GitHub-ready:** README rewritten for the HTML/JS game (play instructions, rules summary, fiction disclaimer); `deploy.yml` replaced with a no-build static Pages workflow (Settings → Pages → Source: "GitHub Actions").

## v0.3 — 2026-07-10 "The Weekend"
- **The Saturday store + Leverage meta-progression (Decision 11):** weeks now persist via localStorage. Every ending pays Leverage (Burnout pays 3 — every run teaches the system's shape). Spent between weeks in a store framed as the outside world: 6 quality-of-life upgrades (home coffee +1 Time, out-of-pocket therapy -1 Sanity costs, boundaries book, templates folder, standing Micah lunch, +1 PTO) and a 3-item **Escape Plan** (Portfolio/Network/Savings, 80 Leverage total) that unlocks the **Two Weeks' Notice** true ending — handed to the boss mid-meeting, at 4:01 PM, where for the first time in institutional memory he looks up from his laptop.
- **Announced difficulty ramp (Decision 12):** in-fiction "policy updates" at boot. Wk2+: voluntold-heavy evenings. Wk3+: boss claims TWO items. Wk4+: Sanity costs +1. Wk5+: paper trails +1 Time. Cost-of-living line on the score screen also creeps 0.2%/week.
- **Two new lore cards (fictionalized):** *The Offboarding* — a termination meeting where the boss never once looks up from his laptop; walking the fired coworker out pays +3 Leverage, a currency the company has no field for. *The Rumor* — the boss invents an office romance for sport; kill it with specifics or watch the office get 4% worse forever.
- Deck is now 14 cards, 10 dealt per run. Save-wipe button on the boot screen.

## v0.2 — 2026-07-10 "The Full Week"
- **Engine pivot (Decision 9):** v1 is now vanilla HTML/JS. The game is `index.html` at repo root — GitHub Pages serves it with no build step. Godot skeleton shelved (safe to delete locally); the Godot-export GitHub Actions workflow is obsolete.
- **First fully playable run:** Monday–Friday, 10-card shuffled deck + fixed Standup (Mon) and 1:1 with the boss (Wed), evening events (free time / voluntold), At Risk tracker with paper-trail locks and Thursday-midnight lock-in, the Friday 4 PM Meeting boss encounter, and three endings: Burnout, Malicious Compliance, Week Survived (graded).
- **Severance-coded presentation:** dark terminal palette, CRT scanlines/flicker, typewriter boot sequence, day-title interstitials, animated stat deltas, REASSIGNED stamp animation at the Friday Meeting, burnout glitch effect. All CSS/JS, no assets, no dependencies.
- **New mechanics from playtest simulation (Decision 10):** week grade scores what the boss *took*, not what you earned — greedy max-credit play leaves no Time for paper trails and caps at grade C; protection-focused play reaches A. 1:1 "NOTICED" items cost +1 Time to lock. Crunch (Time = 0) raises Sanity costs 50%. Ally (Micah) grants one free lock per week. PTO skips a card for -3 Rep.

## v0.2.1 — 2026-07-10 "Lore Pass"
- Deck grown to 12 cards (10 dealt per run — two rest each week, adding run variety). Two new cards built from fictionalized systemic dynamics:
  - **A Dashboard for Upstairs** — your work travels to The President, an unseen executive nobody on the floor has met. Build it beautiful (+14 Credit, auto-NOTICED — it was built to travel) or watermark your name through it (+10, arrives pre-SECURED).
  - **The Realignment** — an entire second function is rerouted "through" your box with no comp. Absorb it (permanent -1 max Time/day, +Rep) or push back in writing (-Rep, -Sanity, keep your Time).
- **The Annual Appreciation Event** — fixed Thursday-evening beat: the year's entire appreciation, delivered in one evening at a driving-range complex with a fajita bar. The cruelest part is that it's fun.
- Friday Meeting verdict now names where the stolen Credit goes: Upstairs, to The President, who signs raises for whoever is standing nearest the work when it arrives.

## Unreleased (pre-v0.2)
- Repo scaffolded: Godot 4 project skeleton, folder structure, MIT license, asset-credit tracking, GitHub Actions HTML5-export workflow (draft).
- Design doc: vertical slice scope decided (5 Meeting Types + 5-6 task/fire cards for v1). Balance v0.1 numbers set (Sanity/Time/Credit/PTO/Reputation). See `Friday_Meeting_Design_Doc.md` Decisions Log items 6-7.
- No playable content yet — next milestone is a single playable day (Standup + Quick Sync + one task card) to sanity-check the card-encounter format before building out the full week.
