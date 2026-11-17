# Demo Day notes: presenting the final showcase live (PREP-6, 24 November 2026)

PREP-6 "Present at Demo Day" uses the same final-showcase format as PREP-5: 8 minutes speaking, 5 minutes of questions,
the same six beats, the same deck (`presentation.html`), the same live proof (`demo-runbook.md`). This page covers only
what changes when it is live in front of an audience.

*(Needs Obi's input: confirm with Ali which slot you have on 24 November: this 8-minute showcase, or the 20-minute
run of show in `framework/demo/DEMO-SCRIPT.md`. This page assumes the 8-minute showcase.)*

## What changes when it is live

| Recorded (PREP-5) | Live (PREP-6) |
|---|---|
| You can stop and retake | One take. A fault is handled on stage, in under 30 seconds, by the recovery table or the backup |
| The timer is for you | The room has a hard stop. Leave the browser by 3:20 whatever happens; drop the optional guardrail first |
| Your laptop screen | A projector or a shared screen: zoom may need 110 to 125%; check the far corner of the room can read the red refusal |
| Questions come later, in writing | 5 minutes of questions straight after; answers in `rehearsal-checklist.md`. "I do not know yet" is an allowed answer |
| Notifications only spoil a take | Notifications are seen by everyone: Focus / Do not disturb on, email and chat closed |
| You look at the camera | Look at the people; glance at the screen only to point |

## Setup the morning of (from `framework/demo/DEMO-SCRIPT.md` section 1, adapted)

| # | Step | Done |
|---|---|---|
| 1 | One laptop, **Edge or Chrome, a fresh profile or a private window**. Close other tabs and notifications. (Edge also gives the guided tour its natural voices, if anyone opens it.) | |
| 2 | Laptop clock and time zone on **Central Time (Chicago)**; it is a weekday (24 Nov 2026 is a Tuesday). | |
| 3 | Start the local server: `node scripts/serve.mjs` from the repo folder (`demo-runbook.md` section 1, step 1). Ali asked for the recordings to run locally; the same holds live. Keep the GitHub Pages workspace (https://obianams04.github.io/cris-enhancement/workspace/) as the second route. | |
| 4 | Plug into the projector **before** the session. Mirror the display, zoom 100% (raise it if the back row cannot read), window about 1280 x 800 or full screen. | |
| 5 | Reset the store on **Audit log**: **Start a new, empty demo**, then **Press again to wipe this browser's demo data**. | |
| 6 | Pre-stage the optional guardrail: Security, acting as **Sage Demo (security officer)**, **Require retraining** on Riley (`demo-runbook.md` section 1, step 4). | |
| 7 | Submissions, acting as **Quinn Demo (procurement officer)**: "No responses yet", "No errors". | |
| 8 | Deck open in the second tab at slide 1, full screen (F). Timer at 0:00 (R resets it). | |
| 9 | File Explorer open at `framework/recordings/02-working-system-demo/sample-files/`. | |
| 10 | Backup video `CRIS-final-showcase-live-proof-backup.mp4` on the desktop, opened once to check it plays with sound. | |
| 11 | Did one full dry run the day before in the same browser, then reset (step 5). | |
| 12 | Water; phone on silent with `rehearsal-checklist.md` open for the five answers. | |

**Do not open the Command Center** in this showcase: it shows a "stale data" warning until the portal is synced
(`DEMO-SCRIPT.md` 1.1). If someone asks to see it, say: "That warning is the page being honest about the age of the
plan file."

## The backup plan (decide within 30 seconds)

1. **The live run fails mid-way:** say "here is the same run, recorded earlier", play the backup video from the step
   that failed, or show slide 3 and narrate its five screens in the runbook's words. Then carry on at slide 4.
   The 8-minute clock does not stop: never debug on stage.
2. **The local server will not start:** use the GitHub Pages workspace (https://obianams04.github.io/cris-enhancement/workspace/);
   the same reset and clicks work there.
3. **The laptop or projector fails:** the deck is a single HTML file; open it on any machine from the repo
   (https://github.com/OBIANAMS04/cris-enhancement, `framework/recordings/05-final-showcase/presentation.html`), and
   use slide 3 for the proof.
4. **Nothing works:** speak the six beats from `speaker-notes.md`. The rule (slide 4), the results (slide 5) and the
   limits (slide 6) do not depend on a screen.

## Live-room reminders

- Say what to watch **before** each click. Pause a beat after each refusal so the room can read it.
- Say the label with every number: "measured", "target", "not measured yet".
- The limits are said plainly, without apology.
- Close on the reflection, then "Questions?". Repeat each question before answering, so the room hears it.
