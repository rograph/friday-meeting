# Friday Meeting · Game Design Document (Living Draft v0.1)

## Logline
You're an Operations Manager grinding through an endless workweek. Every run is one week: Monday through Friday, 9-to-whenever. Your boss steals your best work every Friday at 4 PM and gets the raise. You're trying to survive with your sanity, your time, and eventually your career intact, before this job is all you are.

## Is "Friday Meeting" the right name?
Keep it. It's specific, it's ironic (nobody schedules a good meeting for 4 PM Friday), and it signals the whole thesis of the game in two words: leadership takes your weekend before it even starts. That specificity is stronger than a generic corporate-satire title.

Backup names, if it ever needs a change: *Voluntold*, *Per My Last Email*, *Mandatory Fun*, *Other Duties As Assigned*. Worth keeping in a notes file in case "Friday Meeting" collides with something on GitHub/itch.io search, but no reason to switch preemptively.

## Core question: what's the goal?
Two layers, a session goal (why you play one run) and a meta goal (why you keep playing across runs). Roguelikes live or die on the meta goal, so it needs to mean something.

**Session goal:** Survive Monday–Friday without your Sanity (see Resources) hitting zero, and make it to the Friday 4 PM Meeting, the recurring boss encounter, with enough Credit and composure to come out ahead, or at least intact.

**Meta goal (the real point of the game):** You are not trying to win at this job. You're trying to leave it on your terms. Across runs, permanent meta-progress (skills learned, connections made, a portfolio built, savings banked) advances you toward one of several endings (see Endings below). The job itself never gets better, the system is the antagonist, but you can get better at navigating it, and eventually get out. This mirrors the real emotional arc: the win condition is escape and self-respect, not "become good at the miserable job."

## Design Pillars
1. **The grind is the enemy, not a person.** Individual NPCs (including the boss) are symptoms of a broken system, not cartoon villains to simply defeat. The satisfying win is out-maneuvering the system, not just beating a boss fight.
2. **Small, replayable days.** Roguelike structure means short runs (aim: 15-25 min per week/run) built from procedurally shuffled encounters, so failure is cheap and retrying is fast.
3. **Credit theft is the core tension.** The mechanic that makes the boss dynamic hostile without being a cartoon villain: you generate Credit all week; the boss skims it every Friday. Play should offer ways to protect, hide, or route around that.
4. **Time is the scarcest resource.** PTO, weekends, and evenings are constantly under siege ("voluntold" events). Spending time defending your time should be a real, felt trade-off.
5. **Catharsis over nihilism.** Humor absorbs the bite. The player should laugh at the absurdity, not just relive the misery.

## Format & Presentation (Decided)
**Core encounters are choice/card-driven (Slay the Spire-lite), not real-time action.** A lightweight top-down office map is used only for *navigation between encounters* (pick which desk/room/meeting to walk into next, closer to Slay the Spire's node map or Inscryption's tabletop framing than to an action crawl).

Why this over a full top-down action crawl, for fun *and* clarity:
- **The jokes land better in text.** The Office/Office Space/Severance humor is dialogue- and situation-driven. A card that reads "Reply-All Storm: 12 people 'just to add', spend 2 Time or let Sanity take the hit" is instantly funny and instantly clear. The same joke buried in an action-combat animation isn't.
- **Lower art burden, free-resource-friendly.** Card/text encounters need a handful of icons and portraits (very achievable with Kenney/CC0 art). A real-time crawl needs tilesets, sprite animation sets, and combat feel-tuning, a much bigger ask for a free/solo-friendly project.
- **Faster to balance and iterate.** Numeric costs/rewards on a card are easy to tune in a spreadsheet before touching code. Action-combat balance (hitboxes, timing, difficulty curves) takes far longer to feel right.
- **Easier for a new player to understand the whole system in one sitting**: which matters here because the satire only lands if people *get* the mechanic (see Credit-theft visibility below). Clear cause/effect text beats spatial inference.

## Core Loop
**Run = one work week.** Each day is a short "floor":
- 3-5 procedurally drawn encounters (tasks, fires to put out, meetings, coworker interactions, "quick questions" that eat your day).
- Each encounter costs Time and/or Sanity and rewards Credit, Skill XP, or Allies (coworkers who help later).
- End of day: a random Evening Event roll, sometimes free time (recover Sanity), sometimes an unpaid "opportunity" (leadership asks for a weekend/night volunteer; declining costs Reputation, accepting costs Sanity and Time).

**Friday, 4 PM: The Meeting (weekly boss encounter).** The boss reviews the week. Mechanically: the boss claims your single highest-Credit accomplishment of the week (converted to their "Raise Points," tracked as an ongoing meta-narrative you can't stop directly) unless you spent resources earlier in the week to protect/document it (paper trail, cc'ing an ally, etc.). You're scored on remaining Sanity, Credit kept, and Allies retained. This determines the week's outcome and what meta-progress you bank.

### Credit-theft visibility (Decided)
Go mostly **transparent, with a lock-in window**: this maximizes both fun (real agency) and understanding (the satire needs to register, not surprise-then-confuse):
- From the moment you earn a Credit-generating result, it appears in a running **"At Risk" tracker** with a visible target marker on your current highest-Credit item, always the thing the boss would take if the week ended right now.
- You can spend actions during the week (paper trail, cc an ally, go public in a meeting) to **visibly lock** an item, a padlock icon appears on it, and the target marker jumps to your next-highest unprotected item.
- The final target locks at end-of-day Thursday, so the last day (Friday) is about damage control, not last-second flailing.
- The Friday Meeting scene itself still plays as a reveal beat narratively (the boss "announces" it), but the player already knows what's coming, the drama is "will my protection hold," not "what will I lose."

**Worked example:** Monday you land a big contract (+15 Credit), the tracker immediately flags it as "At Risk." Tuesday you fix a scheduling fire (+5 Credit), tracker stays on Monday's item since it's bigger. Wednesday you mentor an intern (+3 Credit, +1 Ally) and also spend a Paper Trail action (costs 1 Time) on Monday's contract, it locks, padlock appears, and the tracker's target marker jumps to Tuesday's fire (+5). Thursday you do nothing about it. Friday at 4 PM, the boss takes the scheduling-fire Credit instead of the contract, because you protected the bigger item in time. First run, this teaches the whole mechanic in one week without the player ever feeling blindsided.

## Annual Structure: The Raise (meta-mechanic)
Weekly runs nest inside a longer year-clock, and the year-clock is rigged in a very specific, very real way:

- **The cap:** No matter how much Credit you protect or how well a run goes, the Raise is hard-capped at 3% per year. This should be an explicit, visible number in the UI, not a hidden stat. Part of the joke/tragedy is that the player can play a flawless run and still watch the number top out at 3%.
- **The Annual Review (August):** Once per in-game year, a bigger set-piece encounter, a scaled-up version of the Friday Meeting, tallies the year's banked Credit and assigns a Raise Grade (which then gets converted to a percentage, capped at 3%).
- **The Lag (July):** The Raise Grade earned in August doesn't actually hit your paycheck until the following July, roughly 11 in-game months later, i.e., most of another year-clock. Mechanically: the player can see the number they earned (a "Pending Raise" stat) but can't spend it until it finally lands, and by the time it lands it's often been eaten by a cost-of-living tick or another system event. This is the game's clearest thesis statement: even when you win by the system's own rules, the system still makes you wait almost a year to feel it, and it's capped before you start.
- **Design implication:** This makes the internal "grind harder for a bigger raise" strategy a visibly weak path compared to banking external Leverage (see Endings). The 3%-cap/11-month-lag combo should be taught to the player early and bluntly, it's satire, not a hidden gotcha.

### Compressed calendar (Decided)
A literal 52-week year is too long for a roguelike meta-loop, so the in-game year is compressed to **8 weekly runs = 1 year** (roughly 2-3 hours to see a full cycle once):
- Run 7 of the year narratively plays as "the August Annual Review" (still labeled August in the UI/flavor text, the compression is a backend timescale, not something exposed to the player as "run 7").
- The Raise Grade earned there doesn't land until **run 3 of the following year**: narratively labeled "July", preserving the lag as roughly 8/12ths of a year-cycle, close enough to the real 11-month gap to keep the joke, without making players wait dozens of sessions to feel the payoff.
- This keeps the calendar flavor (August review, July payout) fully intact while making the meta-loop actually playable in a reasonable number of sessions.

## Resources
- **Sanity (HP):** Hits zero → burnout ending for this run (not permanent game over, feeds meta-progress as a cautionary/dark-comedy beat).
- **Time:** Spent on encounters and events; running out early-shifts you into "crunch," raising Sanity costs.
- **Credit:** What you earn from good work; what the boss skims. Feeds the capped, delayed Raise (see Annual Structure above) rather than a clean risk/reward payout. Some builds focus on protecting it (paper trails, allies, visibility) rather than maximizing it.
- **PTO (limited-use resource, like potions):** Skip/mitigate a bad encounter. Leadership passively guilts its use (a soft Reputation cost), reinforcing the systemic pressure without making PTO "wrong" to use.
- **Reputation/Allies:** Coworkers you've helped become recurring support (an ally can absorb an encounter, warn you of a bad event, or corroborate your Credit at the Friday Meeting).

## Encounter & NPC Flavor (fictionalized, satirical)
Draw archetypes from the genre without copying named characters: the boss who "has an idea" that's actually your idea from last week; the chronically over-committing coworker; the all-hands meeting that could've been an email; the "quick sync" that's 45 minutes; the mandatory "culture" event on a Saturday; the vague performance review; the reorg that changes nothing but your title; the August Annual Review that praises you glowingly and then hands you a Raise Grade you can't cash until next July. Keep it archetypal, not a roman à clef.

**Severance-coded flavor (Decided, see Tone Balance below):** reach for these textures first when writing new cards , 
- Cryptic "core values" or a mission statement recited by leadership with total sincerity and zero explanation of what they actually mean.
- Founder/company mythology treated with unsettling reverence, a portrait, a plaque, an origin story nobody questions.
- Departments and job functions that are never quite explained; nobody, including the player, fully knows what the company does.
- "Wellness" initiatives and milestone rewards that read as faintly sinister or infantilizing rather than caring, a reward that's oddly small, oddly ritualized, or oddly proud of itself.
- Ambient surveillance played completely deadpan, badge readers, "for your safety" reminders, a sense of being watched that nobody comments on because it's just how things are.

## Meeting Types (Encounter Category · Decided, expanded for vertical slice)
Since the whole game is named for a meeting, meetings should be a first-class encounter category, not just the single Friday boss fight. Recommended set for the first playable slice (mix of quick low-stakes ones and a few painful ones, so pacing has rhythm):
- **Daily Standup**: short, cheap (low Time cost), usually harmless; occasionally someone rambles and it eats extra Time as a small event.
- **The "Quick Sync"**: framed as 15 minutes, actually costs more Time than stated; classic "could've been an email" beat.
- **1:1 with the Boss**: a preview/tension beat: the boss fishes for what you're working on. Choices here can bait you into revealing your highest-Credit item early (raising theft risk) or let you deflect (costs a little Reputation).
- **All-Hands / Town Hall**: big Time + Sanity cost, occasionally drops a surprise event (reorg announcement, hiring freeze, a "very exciting update" that changes nothing).
- **Committee / Working Group Meeting**: recurring low-grade drain; joining builds a specific Ally or Skill over time but nibbles Time every week it recurs.
- **Emergency / Fire-Drill Meeting**: unscheduled, shoves itself into your day, forces a Time/Sanity trade-off on short notice.
- **Retro / Post-Mortem**: reflective, usually a small Sanity recovery or Skill XP if the week went reasonably well; can sting if it didn't.
- **The Friday 4 PM Meeting**: the weekly boss encounter (see Core Loop).
- **The Annual Review (August)**: the yearly boss encounter (see Annual Structure).

This list also directly answers the vertical-slice question: the first playable build should include most of these meeting types alongside a small pool of task/fire encounters, so the "everything is a meeting that drags" feeling is present from the very first build, not added later.

## Vertical Slice Scope (v1) · Decided
Ships in the first playable build:
- **Meeting Types (5 of 9):** Daily Standup, Quick Sync, 1:1 with the Boss, Emergency/Fire-Drill Meeting, The Friday 4 PM Meeting (boss). Together these cover the full cost/tension range, cheap filler, stated-vs-actual-cost trap, Credit-reveal bait/deflect, unscheduled trade-off, the boss fight, without requiring any new subsystems.
- **Task/fire encounter pool (non-meeting):** 5-6 cards that are the primary Credit generators, e.g. land a partnership, fix a scheduling fire, cover a colleague's shift, fix a portal outage, handle an escalated complaint. Combined with the meetings above this gives a draw pool of ~13-15 cards for 3-5 draws/day over 5 days, enough that a single run doesn't visibly repeat.
- **Evening Events:** the free-time/voluntold roll already specified under Core Loop, not a new system, just needs its event table populated (2-3 free-time variants, 2-3 voluntold variants).

Deferred to v2 (each needs a subsystem the vertical slice doesn't require):
- **All-Hands/Town Hall**: needs a surprise-event table (reorg, hiring freeze, etc.) layered on the base cost.
- **Committee/Working Group**: inherently recurring across weeks; needs multi-run state the single-run slice doesn't have yet.
- **Retro/Post-Mortem**: a nice pacing beat, but its job (Sanity recovery) is already covered by the free-time Evening Event in v1.
- **The Annual Review (August)**: already correctly scoped out; it's an 8-run meta beat, not a single-run concern.

This resolves Open Design Question 2 (below).

## Balance v0.1 (First Playable Numbers) · Decided, pending playtest
First-pass numbers for a single 5-day run. Treat these as a tuning starting point, not a final spec, expect them to move once the vertical slice is actually played.

- **Sanity:** starts at 100; Burnout ending at 0. Typical costs: small (5-10) for filler encounters, medium (10-15) for fire-drills and accepted voluntold events. Free-time Evening Event recovers ~10-15.
- **Time:** 10 units/day. Encounters cost 2-4 each, so 3-5 draws/day roughly exhausts the budget by design, running out early pushes the day into "crunch" (already specified: raises Sanity costs on remaining actions) rather than hard-stopping.
- **Credit:** three tiers, small (2-5, daily filler), medium (8-12, a fire-drill or quick sync handled well), large (15-25, the week's one big accomplishment). Consistent with the existing worked example in Credit-theft visibility (Monday's contract at +15 lands as a "large" item).
- **Protection actions** (paper trail, cc an ally, go public): flat 2 Time cost regardless of the Credit value protected. Deliberately not scaled to Credit size, so the choice is about which item is worth your limited Time, not a cheap tax on your biggest win.
- **PTO:** 2 uses per run. Each skips or halves one encounter's Sanity/Time cost, with a small Reputation tick for using it (per the existing "leadership passively guilts its use" design).
- **Reputation:** starts at 50 on a 0-100 scale, moves in ±5 ticks per relevant choice. For v1, Allies are binary flags earned from specific encounters rather than a numeric pool, keeps the system legible before a fuller Reputation/Ally economy is warranted.

This resolves Open Design Question 1 (below).

## Endings (meta-progression payoff)
Multiple runs bank permanent meta-currency (call it **Leverage**: skills, a portfolio, savings, a network) spent to unlock these over time, not in a single run.

**First playable milestone, build these 3:**
- **Burnout Ending**: Sanity hit zero. Default/common early ending, played for dark comedy, always available, feeds the next run's Leverage slightly. (Easiest to hit, teaches the stakes.)
- **Malicious Compliance Ending**: A high-score/roguelike "best run" path: you beat the system at its own game for one glorious week without escaping it. Achievable within a single run's scoring, no long meta-track required, good for early replayability.
- **Two Weeks' Notice Ending**: Enough external Leverage (skills + network + savings) to walk into the Friday Meeting and quit on your own terms. Deliberately the *faster* path to a good outcome than grinding for the capped, delayed internal Raise, the game should make that math visible to the player. The intended "true" positive ending, and the one worth proving out first since it's the thesis of the whole game.

**Deferred to a later milestone (need a longer meta-track to feel earned):**
- **Whistleblower Ending**: Enough documented Credit-theft evidence banked across runs to expose the system.
- **Promoted-to-Boss Ending**: A deliberately dark/ironic ending if the player leans fully into the system: you become the new credit-stealer. Played straight for satire, not as an actually good outcome.

## Tone & Content Guardrails
- Fictionalize everything from Rodolfo's real job, no real names, no identifiable institution, no verbatim quotes from real people, in design docs, code, or the public repo.
- Humor first. The target is "would this land as a joke in The Office or Severance," not "is this literally what happened to me."
- Avoid punching down at coworker-tier NPCs; the satire's targets are structural (unpaid overtime, credit theft, understaffing), not individual coworkers.

### Tone Balance (Decided)
Weight the humor colder and more Severance-coded by default, dissociation, institutional reverence, sterile ritual, ambient surveillance, rather than defaulting to Office-style warm mockumentary. Office/Office Space still inform pacing and catharsis (quick, punchy beats; the release of a small win against a dumb system), but flavor writing should reach for Lumon-style corporate strangeness first, and warm workplace-family humor second. Gut check for new copy: "would this be funny in The Office, unsettling in Severance, or just sad in real life?", aim for funny or purposefully unsettling, never sad.

## Tech Stack (free-only)
- **Engine (revised 2026-07-10):** Vanilla HTML/JS/CSS, single-file (`index.html` at repo root). Better fit for a card/text game than Godot: zero build step, GitHub Pages serves it directly from the repo, and the fun-test prototype already proved the format in HTML. The Godot 4 scaffold is shelved, not deleted, revisit only if the game ever needs real scenes/audio mixing that vanilla JS makes painful. (Original plan: Godot 4 with HTML5 export.)
- **Art:** Kenney.nl asset packs (CC0) as placeholder/base art; Piskel (free, browser-based) or Krita (free, open source) for custom pixel art.
- **Audio:** OpenGameArt.org and Freesound.org (filter for CC0/CC-BY) for SFX; incompetech.com (Kevin MacLeod, free with attribution) for music.
- **Fonts:** Google Fonts or itch.io's free/CC0 pixel font packs.
- **Version control & publishing:** GitHub repo for all source; GitHub Actions (free tier) can auto-build/deploy the HTML5 export to GitHub Pages on push.

## Suggested Repo Structure
```
friday-meeting/
  project.godot
  /scenes        (Godot scenes: encounters, meeting boss, UI)
  /scripts       (GDScript: resources, run/day loop, encounter pool)
  /art           (sprites, tilesets, credit sources in art/CREDITS.md)
  /audio
  /docs          (design docs, this file, changelog)
  README.md      (concept, how to build/run, credits)
  LICENSE        (pick an OSS license, e.g. MIT, for your own code)
```

## Decisions Log (resolved)
1. **Format:** card/choice-driven encounters + a light navigation map, not action-combat. See Format & Presentation.
2. **Credit-theft visibility:** transparent "At Risk" tracker, locks Thursday EOD. See Credit-theft visibility under Core Loop.
3. **First-milestone endings:** Burnout, Malicious Compliance, Two Weeks' Notice. See Endings.
4. **Vertical slice:** one full compressed week (5 days) including several Meeting Types (standup, quick sync, 1:1, all-hands, etc.) plus a small task/fire-encounter pool and the Friday Meeting boss, meetings are core content from build one, not an add-on. See Meeting Types.
5. **Calendar compression:** 8 weekly runs = 1 in-game year; Annual Review at run 7 ("August"), Raise lands at run 3 of the next year ("July"). See Compressed calendar.
6. **Vertical slice content:** 5 Meeting Types (Standup, Quick Sync, 1:1 w/ Boss, Emergency Fire-Drill, Friday Meeting) + 5-6 task/fire cards ship in v1; All-Hands, Committee, Retro, Annual Review deferred to v2. See Vertical Slice Scope.
7. **Balance v0.1:** 100 Sanity, 10 Time/day, Credit tiers 2-5/8-12/15-25, flat 2-Time protection actions, 2 PTO/run, Reputation starts at 50 (±5 ticks). See Balance v0.1.
8. **Tone weighting:** lean colder/more Severance-coded by default (dissociation, institutional reverence, sterile ritual, surveillance); Office/Office Space still shape pacing and catharsis. Text/flavor only, no new mechanics from this decision. See Tone Balance and the Severance-coded flavor list under Encounter & NPC Flavor.
9. **Engine pivot (2026-07-10):** v1 is vanilla HTML/JS, single-file `friday-meeting/index.html`, deployed via GitHub Pages with no build step. Godot scaffold shelved (files left in place; safe to delete locally). The old `.github/workflows/deploy.yml` (Godot export) is obsolete, Pages can serve the repo directly. See Tech Stack.
10. **Week-grade rule (2026-07-10, playtest-driven):** the survived-week grade is scored on **what the boss took, not what you earned** (A: stolen ≤5 & Sanity ≥50 · B: stolen ≤10 & Sanity ≥35 · C: Sanity ≥25 · D otherwise). Simulation showed grading on Credit-kept made protection irrelevant (every strategy earned an A); grading on stolen value makes the paper-trail economy the actual game: greedy max-credit play caps at C because it leaves no Time to lock anything.
11. **Leverage = store currency (2026-07-10), resolves Open Design Question 1.** Leverage is a single number, earned at week's end (kept Credit / remaining Sanity / ending bonus; Burnout pays a flat 3) and spent in **the Saturday store** between weeks. The store is the *outside world*: everything in it is bought on the player's own time (therapy out of pocket, home coffee setup, boundaries book, templates folder, standing lunch with Micah, actually-used PTO), deliberately contrasting the capped, delayed internal Raise. Three **Escape Plan** items (Portfolio 25 / Network 25 / Savings 30) unlock the Two Weeks' Notice ending at the next Friday Meeting. Persistence via localStorage; save wipe offered at boot.
12. **Difficulty ramp, announced (2026-07-10):** the game escalates by in-fiction "policy updates" read aloud at terminal boot, never hidden modifiers. Week 2+: evenings weighted 60% voluntold. Week 3+: the boss claims the top TWO unlocked items ("he has a reputation to maintain now"). Week 4+: all Sanity costs +1 ("the building has settled"). Week 5+: paper trails +1 Time ("documentation now requires a second signature"). Economy sim: escape reachable in ~5-6 weeks rushing, ~9-10 buying comfort first, bracketing the 8-run compressed year.

13. **Reputation thresholds (2026-07-10):** Reputation now has consequences at the edges, fixing a dead stat. Below 30: evening voluntolds cannot be declined ("unavailable at your current standing"). At 70+: your single best unlocked item is shielded at the Friday Meeting (he cannot publicly claim the headline win of someone that visible; requires at least one other unlocked item so it never grants free Malicious Compliance). Between 30 and 69 nothing changes, so the stat stays low-pressure in the middle band.

14. **v0.6 systems (2026-07-11):** weekly contracts (+4 Leverage optional objectives), weekly modifiers (audit/quota/vendor/calm, announced at boot), card unlock schedule (12 files at week 1 growing to 29 by week 7), death recap on Burnout, Life Outside tableau (plant/friend/hobby fed by evenings), narrator inversion below 30 Sanity, Expense Report form growing one field per week, elevator cameo week 6+ once per save. Nina is the second ally: persistent trust flag, discounts The Network by 10.

15. **Delayed consequences (2026-07-11).** Small Monday-through-Thursday choices now echo at the Friday Meeting instead of resolving purely in the moment, so declining or accepting evening "opportunities" isn't just an immediate Reputation tick: two or more declines in a week raise the Reputation bar needed to shield your best item from +70 to +80 ("busy weekend?" line, -4 Rep, delivered live at 4 PM); two or more accepted voluntolds with zero declines lower that bar to +65 and add a "reliable" +3 Rep beat instead. The Rumor now has a real fork: squashing it pays +2 Rep at the Meeting, leaving it pays -3 Rep at the Meeting, both as a preamble line before he starts reading. Filing an HR inquiry now gets your top unlocked item Noticed (costs more to lock) and earns a bitter aside from him on Friday. An unauthorized Facilities fix now arrives Noticed too (small risk baked into a small reward). Hanging vs. slow-walking Walsh's portrait (The Priority) now sets a same-day mood flag: pleased Miller shaves 1 Time off that day's lock cost, annoyed Miller adds 1. None of this needed a new subsystem: it all reuses the existing `noticed`/`lockCost`/Reputation-threshold machinery, just wired to more cards.

16. **The File Cabinet (2026-07-11).** New persistent view (top-bar button, modal) with two sections: **Completed Contracts** (every week's optional objective and whether it was met, pulled from a new `META.contractHistory`) and **Saved Files** (the "+Leverage, the ledger grows" narrative beats that already existed on The Offboarding, The Line Item, The Matcha Machine, Farewell Cake, The Austerity Memo, and the new Backfill card, now also pushed into `META.fileCabinet` as a real list instead of just flavor text). Players can additionally file away one item from the current week's board for free in the Saturday store (once per week), so a Credit item that got claimed by Miller can still be kept, unofficially, by the player. Nothing here changes balance; it makes existing hidden state visible, per the "smallest thing that proves the concept is fun" instinct.

17. **The boss's claim line now varies (2026-07-11).** The Friday Meeting's "he takes credit for your work" monologue was a single hardcoded line ("warming like a photocopier..."). It's now six variant lines picked at random with no immediate repeat (tracked via `META.lastClaimLine`), so the theft beat doesn't read as copy-pasted week over week.

18. **Early-week card variety (2026-07-11).** Week 1's pool was only 12 cards against 10 draws/week (83% of the deck shown, every week), which is why the deck felt repetitive early on. Added 8 new cards (The Kudos Channel, Password Reset Again, The Post-Meeting Meeting, The Printer Ate Something Important, Onboarding Buddy: Jordan, The All-Staff Survey, The Shared Calendar, The Backfill That Never Comes), 5 unlocked at week 1, so the week-1 pool is now 17 (about 59% shown per week). Full unlock curve: wk1 17 → wk2 23 → wk3 29 → wk4 33 → wk5 37 → wk6 39 → wk7 40.

19. **Company renamed to Everwell Group (2026-07-11).** Replaced "Corestone Dynamics" everywhere (boot line, footer note, the wellness-module flavor joke, README). Chosen over *Halcyon Concern* and *Perpetua Holdings*: Everwell ties directly into satire already in the game (the Mandatory Wellness Module, the Wellness Check-In evening event), making the company's own name part of the "wellness" con rather than a separate joke.

## Idea Backlog (built in v0.6, kept for reference; researched 2026-07-11)
Grounded in study of Papers Please (escalating rules, the inevitability of mistakes, personal stakes), Yuppie Psycho and Pager (familiar office turned wrong, obey-the-device pressure), The Stanley Parable (a narrator who presumes your choices), and roguelike-deckbuilder longevity findings (losses must be legible; unlocks extend engagement; pre-run modifiers reshape strategy).

**Gameplay / objectives:**
1. *Death recap.* On Burnout, itemize exactly what drained Sanity this week. Genre research is blunt about this: players quit when they lose without understanding why.
2. *Weekly contracts.* Optional Monday objectives ("end the week with 3 locks," "never enter Crunch," "keep Reputation above 60") paying bonus Leverage. Gives each run a personality beyond the deal of the deck.
3. *Card unlock schedule.* Start new saves with ~14 cards; unlock the rest at week milestones with a "NEW PERSONNEL FILE" reveal between weeks. Longevity through metered content.
4. *The Expense Report.* A recurring Friday-morning form that grows one absurd field every week (week 1: date; week 6: notarized initials of a witness). Papers Please pressure, Everwell flavor.
5. *Life Outside panel.* A small between-weeks tableau (a plant, a friend, a hobby) that withers with accepted voluntolds and recovers with free evenings. Makes the evening trade-off visible and personal.
6. *Weekly modifiers* (already pitched): one policy rule change drawn each Monday (audit week, quota week, reorg week).

**Presentation / animations:**
7. *The narrator inversion.* Below 30 Sanity, the terminal begins announcing choices before you click them ("You will attend the meeting."). Dissociation rendered as UI, original to us.
8. *Item-steal animation.* At the Friday Meeting, the claimed item physically slides out of your tracker into Miller's slide.
9. *Ink-stamp lock animation* for paper trails (the REASSIGNED stamp's benevolent twin).
10. *Progressive crunch dimming.* The screen loses brightness as Time runs out; the office is literally darker when you stay late.
11. *One balloon* drifting across Conference Room C on Malicious Compliance. Exactly one.
12. *Elevator interstitial* reserved for the future President cameo.

## Open Design Questions (for next working session)
1. ~~What does "Leverage" concretely look like on the player's screen?~~ **Resolved 2026-07-10, see Decisions Log item 11** (single currency + Saturday store + 3-item Escape Plan).
2. Does the Whistleblower ending want its own banked resource (documented-theft evidence from locked-but-stolen weeks), or is it a Leverage sink like the Escape Plan? (Deferred; needs the longer meta-track.)
