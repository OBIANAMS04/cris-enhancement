# Final showcase: speaker notes (PREP-5, delivered live as PREP-6)

For Obi only; never shown to the audience. The live clicks and the exact on-screen text are in `demo-runbook.md`.
Rule for the live part: **say what to watch, then click, then say what happened.**

**Audience:** Ali Muwwakkil and Ram Katamaraja (Colaberry); on 24 November, the Demo Day room.
**Presenter:** Obi Anamelechi Kingsley, alone, no handoffs.
**Length:** 8 minutes speaking, then 5 minutes of questions (separate).
**Brief:** the story, live proof, and your own judgement about the limits of what you built.

## Timing at a glance

| Beat | Slide / screen | Time | Ends at | Words (at 130 a minute) |
|---|---|---|---|---|
| 1. The problem and who has it | Slide 1 | 50 s | 0:50 | about 105 |
| 2. Live proof | Slide 2, then the browser (slide 3 is backup only) | 150 s | 3:20 | narration between clicks |
| 3. What AI does and what humans decide | Slide 4 | 80 s | 4:40 | about 170 |
| 4. Results | Slide 5 | 80 s | 6:00 | about 165 |
| 5. Limits | Slide 6 | 60 s | 7:00 | about 125 |
| 6. The next step | Slide 7 | 60 s | 8:00 | about 120 |
| Reflection | Slide 8 | inside question time | | |

Press **T** on the presentation to start its timer at your first word. It turns **amber at 7:00** (you should be on
slide 7 by then) and **red at 8:00**. Checkpoints: leave the browser by **3:20**, reach Limits by **6:00**.

## Slide by slide

### Slide 1 · One missing file costs a vendor the whole bid (0:00 to 0:50)

> "I'm Obi. Picture a TxDOT procurement officer receiving vendor responses to the Crash Records solicitation, CRIS.
> Every response must carry every required document and arrive before the closing time, and the officer must be able
> to show why any response was turned away. What does one miss cost? TxDOT's own published terms are plain: a response
> without every required document is non-responsive. It is never scored. A late one is not considered at all. So one
> missing file costs a vendor the whole bid, and costs TxDOT a competitor."

*Cue:* point at the three tiles in order: role, problem, cost. *Do not* add a time or money figure: none is sourced.
*Transition:* "Let me show you the check that catches it."

### Slide 2 · Live proof: one response accepted, one refused (0:50 to 3:20)

> "I'm acting as Quinn, the procurement officer, on synthetic data: made-up vendors, nothing connected to TxDOT. Watch
> four things: a complete response recorded with a receipt; an incomplete one refused, with the reason, and logged;
> the fix; and the audit log."

*Switch to the browser* (Alt+Tab or the workspace tab) by **1:00**. Then follow `demo-runbook.md` section 2 exactly.
Target times inside the beat:

| Step | Ends by |
|---|---|
| Starting state: "No responses yet", "No errors" | 1:05 |
| Vendor A recorded: "RSP-0001 recorded for Vendor A Demo. Receipt …" | 1:35 |
| Vendor B refused: "The submission was not accepted." and INC-0001 open | 2:10 |
| Vendor B resubmits: "RSP-0002 recorded", INC-0001 "Addressed" | 2:35 |
| *Optional guardrail, only if the clock reads 2:35 or less:* Riley refused on Documents | 2:55 |
| Audit log: "The chain is intact" | 3:10 |
| Back to the deck, slide 4 | 3:20 |

*Close the beat:* "It refused an incomplete bid, said why, logged it, and let the vendor put it right."
*Transition (on slide 4):* "So who decides what?"

**Slide 3 is the backup.** Show it only if the live run cannot run (see the runbook, section 4). Then narrate the same
four screens in the same words, and say "this is the same run, recorded on 16 November."

### Slide 4 · The rule: what it decides alone, what it never decides (3:20 to 4:40)

> "Here is the line, as a rule. The system decides three things alone: whether a response is complete and on time;
> whether a score is so far from the others that it must be checked; and whether a person is cleared for protected
> work, which means current TxDOT-approved cyber training. It never decides four things: the scores, which evaluators
> give; the award, which TxDOT alone decides; closing a security breach without a recorded notification; and anything
> about real vendors, because it holds none.
> And to be exact about the AI: there is no AI model inside this workspace. Its checks are fixed rules, written down
> and tested. The build itself was made with AI assistance, Claude Code, and every rule is checked by tests."

*Cue:* left box, then right box, then the amber line. Say "never" slowly.
*Transition:* "What did that produce?"

### Slide 5 · Results: what was measured, and what was not (4:40 to 6:00)

> "Every number here carries a label. Measured: sixteen of sixteen stories verified by the Colaberry portal, fifty of
> fifty acceptance criteria, eight hundred points. Seventy-three unit tests passing. A browser rehearsal of all sixteen
> stories passing from a clean start, about eighty-seven seconds of clicks. And a stored document retrieved within its
> two-second criterion.
> What is not measured: time saved for TxDOT procurement staff. Not measured yet. I have no figure, so I will not
> give you one.
> And the values along the bottom are targets: the service levels, the scoring weights, the four required documents
> and the closing time are working assumptions, drawn from TxDOT's published terms and labelled on screen."

*Cue:* point at each green tile, then the red dashed tile, then the bottom line. Say the word "measured" or "target"
aloud with each number.
*Transition:* "Which brings me to what it does not do."

### Slide 6 · Limits: what it does not handle yet (6:00 to 7:00)

Say it plainly. No "unfortunately", no "just a demo". Each limit, then what it would take.

> "Five limits. One: synthetic data only. Two: nothing is connected: not TxDOT, not Euna Procurement, not TxDOT's
> financial or incident systems. In this rehearsal the workspace records submissions itself; a live engagement would
> need the agency's access and Euna's export documentation. Three: it runs in one browser,
> with no server-side storage, no accounts and no sign-in; that takes a shared backend and real sign-in, and the rules
> stay as they are. Four: the required documents, scoring weights, service levels and risk matrix are working
> assumptions from TxDOT's published terms; each lives in one file, so a live engagement replaces that file and
> nothing else. Five: there is no hosting cost. It is a static site with no server and no database, run locally or on
> GitHub Pages. What a live deployment would cost is out of scope for this rehearsal."

*Transition:* "So what is the next decision?"

### Slide 7 · The next decision: accept the case study, assumptions documented (7:00 to 8:00)

> "The next decision belongs to Ali and Ram. Option A, which I recommend: accept the CRIS case study as complete, with
> its working assumptions documented. Option B: hold it open. The evidence today: every working assumption is labelled
> on screen and lives in one file, and the sixteen-story rehearsal passes from a clean start. For any live engagement,
> the next step is one timed trial with a procurement officer: minutes per response checked by hand against minutes
> in the workspace. Until that trial, time saved is not measured, and I give no figure. Thank you."

### Slide 8 · Which limit was I most tempted to leave out? (question time)

> "Which limit was I most tempted to leave out? That there is no AI model inside: the checks are fixed rules. I was
> tempted because 'AI' is what people expect to hear in a showcase like this. It is the important one because fixed
> rules only catch what was written down. That is exactly why people score every response, TxDOT alone decides the
> award, and every refusal is logged for a person to see."

Then: "Questions?" (answers in `rehearsal-checklist.md`).

## Pronunciation

| Word | Say |
|---|---|
| Obi | OH-bee |
| Oge (tour co-host, if asked) | OH-geh |
| TxDOT | Tex-Dot |
| CRIS | Chris |
| Euna (Procurement) | YOO-nuh (check before the day) |
| HUB (subcontracting plan) | hub (Historically Underutilized Business) |
| non-responsive | non-ree-SPON-siv |
| RSP-0001 | "R-S-P one" |
| INC-0001 | "incident one" |
| SHA-256 (if asked) | "sha two-fifty-six" |

## Honesty lines (do not overclaim)

- Synthetic people and data; nothing is connected to TxDOT or Euna Procurement.
- No AI model runs in the workspace. AI (Claude Code) helped build it; tests check it.
- Time saved for TxDOT staff: "not measured yet". If pressed: "I do not know yet."
- The four required documents, the closing time, weights, service levels and risk matrix are working assumptions from
  TxDOT's published terms, labelled on screen, each in one file.
- This is a rehearsal case study. Never present it as blocked by TxDOT: the open points are closed by documented working
  assumptions, and a live engagement would replace the files that hold them.
- Do not raise pricing or commercial terms.
