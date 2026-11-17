# Visual presentation: rehearsal checklist (PREP-3)

## The portal's checklist (you are held to these)

- [ ] **Every slide makes one point and its title says what that point is.** Titles: "A turned-away response leaves
      no record of why" · "Same task: two hand checks gone, one record added" · "Rules check the facts; people make
      every decision" · "It ran: the receipt matches and the chain is intact" · "The same checks pass every time: 73
      tests, 16 stories" · "Next: TxDOT decides whether Euna is the front door".
- [ ] **Someone could follow with the sound off.** Drill: click through the deck on mute with someone who has not
      seen it; ask them to say the argument back.
- [ ] **No slide asks the audience to read while I talk.** No sentence bullets: boxes, arrows, screenshots and short
      labels. The only longer text is the small source captions; do not read them aloud.
- [ ] **Every number on screen is sourced or labelled as an estimate.** 4 documents (`content/solicitation.json`,
      demo setting) · 24 audit lines and receipt 6f138e04 (live run, 16 Nov 2026) · 73 / 73 tests (`node --test
      tests/`, 16 Nov 2026) · 16 / 16 stories (`tests/demo-rehearsal.js`, framework §3) · time saved: "Not
      measured", dashed. There are **no estimates** on the slides.
- [ ] **The before-and-after is the same task.** Both sides of slide 2 are labelled "Task: receive one vendor
      response".
- [ ] **The human approvals are marked.** Slide 3: three green boxes, Approval 1 to 3, with a person icon.
- [ ] **I can say why the removed steps were safe to remove** (speaker notes, slide 2).

## How it is assessed, and where it is answered

| Criterion | Weight | Where |
|---|---|---|
| Problem shown before explained | 20% | Slide 1: look for two seconds, then speak |
| Genuine before/after | 15% | Slide 2, same task both sides |
| Real artefact, estimates labelled | 25% | Slides 4 and 5: real screenshots and real test output; "Not measured" dashed |
| Workflow marks where a human approves | 15% | Slide 3, green Approval 1 to 3 |
| Legible, carries the argument without narration | 15% | Big boxes; evidence screenshots zoomed to the proof line |
| Can explain why removed steps were safe | 10% | Slide 2 notes; question 2 below |

## Rehearsal runs

| Run | Date | Total time | Looked before speaking on slide 1? | Notes |
|---|---|---|---|---|
| 1 (on mute, someone else clicks) | | | n/a | Could they say the argument back? |
| 2 (timed, aloud) | | | | |
| 3 (the recording) | | | | |

## Five likely questions, answered only from the repo

1. **"Where is the AI?"**
   There is no AI model in the workspace. The checks are fixed rules in `lib/submissions.js`: the closing time, every
   required document, accepted file types (pdf, docx, xlsx, txt, csv, png, jpg) and size (10 MB, `lib/documents.js`),
   a named respondent, and the right role. The build itself was made with AI assistance (Claude Code), and every story
   was then verified by the Colaberry portal reading the repo.
2. **"Why was it safe to drop the hand checks?"**
   They check facts, not judgement: an arrival time and whether each required file is present and readable. The rule
   applies them the same way every time and is covered by tests, including the failure paths: late, wrong role, bad
   file, storage failure, double submit (`tests/story-008-submissions.test.mjs`). Every refusal names its reason, offers
   a "Try this" fix and is logged as an incident the officer can see, and a refused vendor can resubmit while the
   solicitation is open. Nothing about quality, scoring or the award was given to the system.
3. **"How much time does it save?"**
   It was not measured, and the slide says so. There is no baseline of how long TxDOT's hand check takes.
   *(Needs Obi's input: only if you want to time a hand check yourself; label any figure as an estimate.)*
4. **"Is this how TxDOT works today?"**
   The "before" is a drawing described from TxDOT's published terms (EV-04: only complete responses are scored;
   SUB-04: late responses are not considered). The research also found TxDOT takes submissions through Euna
   Procurement, which refuses a submission with a file in the wrong format (SUB-05). How the officer's check is done
   and recorded inside TxDOT was not observed. *(Needs Obi's input if Ali or TxDOT can describe the real process.)*
5. **"What happens next, and who decides?"**
   TxDOT, through Ali, decides whether responses must come through Euna Procurement and whether Euna has an API or
   export (framework §6 Blockers; no public API documentation was found). Then the real required documents and
   closing time replace the demo settings in `content/solicitation.json`. *(Needs Obi's input: whether Ali has
   replied on the TxDOT questions by the recording day.)*

## Shortened run order (if you have 3 minutes)

1. Slide 1, 30 s: look, then "a turned-away response leaves no record of why".
2. Slide 2, 40 s: two hand checks gone, one record added, the officer still decides.
3. Slide 3, 40 s: trigger, check, refused or stored, the three green approvals.
4. Slide 4, 30 s: the receipt matches, the chain is intact. Skip slide 5 (say "73 tests pass" in one line).
5. Slide 6, 40 s: the Euna decision and what settles it.

## Reflection to end on

**"Which slide were you tempted to add words to, and what does that tell you about the image?"**
Draft (make it yours; *needs Obi's input*): the problem slide, because there is no screenshot of TxDOT's own process.
It told me the image is a drawing from published terms, not an observation, and the honest fix was a caption saying
so, not more words.
