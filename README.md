# Friday Meeting

A roguelike about the one person who actually keeps the building running: an Operations Manager at Everwell Group, a mid-size corporate office whose business function nobody can quite explain. Every run is one workweek: survive Monday through Friday, earn Credit, and protect your best work from Director Miller, who claims your biggest unprotected win every Friday at 4 PM and converts it into his Raise Points.

Between weeks, spend Leverage in the Saturday store on the version of you that leaves: therapy, boundaries, a portfolio, a network, six months of runway. The raise is capped at 3%. The exit is not.

**▶ Play it:** open `index.html` in any browser, or play the hosted version at `https://<your-username>.github.io/friday-meeting/` once Pages is enabled.

Tone: dark workplace comedy, weighted toward Severance's cold institutional dread (The Office / Office Space round it out). **This is a work of fiction.** It draws on real workplace dynamics in general (credit theft, unpaid "voluntold" labor, performative urgency) but does not depict any real institution, employer, or person. All characters, organizations, and events are fictional.

## How to play

No install, no build, no dependencies. Open `index.html`. Progress (week number, Leverage, store purchases) saves in your browser via localStorage; the boot screen has an ERASE EMPLOYEE RECORD button if you want a fresh start.

The short version of the rules the game teaches:

- **Sanity** is HP. Zero = Burnout ending. **Time** resets daily; running out puts you in Crunch (sanity costs ×1.5). **Credit** is what your work is worth, and what gets claimed.
- Every Credit-earning result appears on the **At Risk tracker**. Spend Time on a **Paper Trail** to lock it. Targets lock in at midnight Thursday.
- Friday, 4 PM: Director Miller reads the week aloud and claims your highest **unlocked** item. From week 3 he claims two. Lock everything and he claims nothing: the Malicious Compliance ending.
- Endings pay **Leverage**, spent in the Saturday store. Buy all three Escape Plan items and you can hand in your notice mid-meeting: the true ending.
- Difficulty escalates weekly via boot-screen "policy updates." They are announced. That's the joke.

## Development

The game is a single self-contained `index.html` (vanilla HTML/JS/CSS, zero dependencies, no assets). Design decisions, balance numbers, and rationale live in [`docs/Friday_Meeting_Design_Doc.md`](docs/Friday_Meeting_Design_Doc.md), the living source of truth. Changes are tracked in [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

The `project.godot` file and `scenes/`/`scripts/` folders are leftovers from an earlier engine plan (see design doc Decision 9) and can be ignored or deleted.

## Publishing (GitHub Pages)

The included workflow (`.github/workflows/deploy.yml`) publishes the repo to Pages on every push to `main`. One-time setup: repo **Settings → Pages → Source: "GitHub Actions."**

## License

Original code is [MIT-licensed](LICENSE). No third-party assets are currently used; if any are added they'll be credited in `art/CREDITS.md` / `audio/CREDITS.md` (CC0 or permissive licenses only).
