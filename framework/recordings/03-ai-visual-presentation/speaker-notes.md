# Visual presentation: speaker notes (PREP-3)

For Obi only; never shown to the audience. Slides: `presentation.html` (one file; the screenshots are built into it,
so it opens offline and can be handed in on its own. Copies are in `screens/`).

**Outcome the portal asks for:** a visual argument someone could follow with the sound off.
**Length:** 5 minutes speaking. Questions (2 minutes) are separate and come after the reflection slide.
**The story:** the same workflow as the working-system demo (PREP-2): receiving one vendor response to the Crash
Records solicitation. The two videos tell one story.
**Rule for every slide:** let them look first (count two in your head), then speak. Never read the slide aloud.

## Honesty lines (keep them in your mouth)

- The workspace has **no AI model**. Its checks are fixed rules in `lib/submissions.js`. If "AI" comes up, say: "I
  built it with AI assistance, Claude Code. The system itself runs fixed rules."
- Synthetic data only. Nothing is connected to TxDOT or to Euna Procurement.
- Slide 1 is a **drawing**, not a screenshot of TxDOT. It is described from TxDOT's published terms (rules EV-04 and
  SUB-04 in `content/procurement-rules.json`). How the check is done and recorded inside TxDOT today was not observed.
- The four required documents and the closing time are demo settings (`content/solicitation.json`), not the CRIS
  solicitation's own list.
- No time saving was measured. Do not give one.
- This is a Colaberry rehearsal case study. The open points (Euna, the real required documents, the closing time) are
  closed by **working assumptions** drawn from TxDOT's public solicitation terms and public Texas procurement
  practice. Each is labelled on screen and lives in one file, so a live engagement would replace that file and nothing
  else. Never present the work as blocked by TxDOT.

## Timing at a glance

| Beat | Slide | Title on screen | Time | Ends at |
|---|---|---|---|---|
| 1. The problem, shown | 1 | A turned-away response leaves no record of why | 40 s | 0:40 |
| 2. Before and after | 2 | Same task: two hand checks gone, one record added | 60 s | 1:40 |
| 3. How the workflow runs | 3 | Rules check the facts; people make every decision | 70 s | 2:50 |
| 4. Evidence | 4 | It ran: the receipt matches and the chain is intact | 40 s | 3:30 |
| 4. Evidence | 5 | The same checks pass every time: 73 tests, 16 stories | 40 s | 4:10 |
| 5. The next step | 6 | Next: the Euna question is a working assumption, kept in one file | 50 s | 5:00 |
| Reflection | 7 | Which slide tempted me to add words? | after 5:00 | |

Press **T** to start the timer on slide 1. It turns amber at 4:30 and red at 5:00. **F** for full screen.

## Slide by slide

**Slide 1: A turned-away response leaves no record of why (0:00 to 0:40)**
*Cue:* slide up, say nothing for two seconds.
"Three vendor responses arrive at the procurement officer's desk. The officer checks each one by hand: did it come
before the closing time, and is every required document there: technical proposal, pricing, forms and
certifications, HUB subcontracting plan. TxDOT's published terms say a late response is not considered and only a
complete one is scored. Accepted ones go on to evaluation. A turned-away one leaves no record of why. This is a
drawing, from TxDOT's published terms, not a screenshot."
*Transition:* "Here is the same task with the workspace."

**Slide 2: Same task: two hand checks gone, one record added (0:40 to 1:40)**
*Cue:* point left, then right. Same task on both sides: receive one vendor response.
"On the left, by hand. On the right, the Submissions page. Two steps disappeared: reading the arrival time against
the closing time, and ticking each required document against the list. Fixed rules do both, the same way every time,
and they also check file type and size. One step is new: every outcome is recorded. A stored response gets a receipt;
a refused one is logged with a reason that names what is missing. What stays with a person: the officer moves the
response to evaluation."
*Why the removed steps were safe to remove (say it if you have time; it is assessed, 10%):* "Those two checks are
facts, not judgement: a time and whether a file is there. A rule does them the same way every time, they are tested,
and every refusal names its reason, so the officer can see exactly what the rule decided. No scoring and no award
was handed to the system."
*Transition:* "Let me walk the path once."

**Slide 3: Rules check the facts; people make every decision (1:40 to 2:50)**
*Cue:* trace left to right with the pointer, then the green row.
"What triggers it: a response arrives and the officer records it. What it does: it checks the closing time, the four
required documents, file type and size, and that a respondent is named. Then one of two things. Refused: it says why,
offers a 'Try this', and logs it. Or stored: with a SHA-256 receipt (a fingerprint of the files) and a line on the
audit log. Where a person approves, in green: one, the officer moves it to evaluation; two, evaluators score every
criterion, and a score far from the others is flagged and must be resolved; three, TxDOT alone awards. Blue is a fixed
rule. There is no AI model in it."
*Transition:* "How do you know it ran?"

**Slide 4: It ran: the receipt matches and the chain is intact (2:50 to 3:30)**
*Cue:* left image, then right.
"These are screenshots from a live run on 16 November, synthetic data. Left: RSP-0001 from Vendor A Demo, opened
again: 'Documents match the receipt', receipt 6f138e04. Right: the audit log from the same run: 'The chain is intact:
all 24 lines match their hashes.' Change one line and the page says the chain is broken."
*Transition:* "And it is not one lucky run."

**Slide 5: The same checks pass every time: 73 tests, 16 stories (3:30 to 4:10)**
*Cue:* the terminal first, then the tiles.
"That is the real test output, run today: 73 of 73 pass. Four of them are this workflow: stored with a receipt, an
error logged then addressed, the failure paths (late, wrong role, bad file, storage failure, double submit), and the
audit trail. The rehearsal script walks all 16 stories of the demo from an empty start, and it passes. And the dashed
tile: time saved is not measured. There is no baseline, so I show no number."
*Transition:* "So what is the next decision?"

**Slide 6: Next: the Euna question is a working assumption, kept in one file (4:10 to 5:00)**
*Cue:* the green box, then the two boxes under it, then the tiles.
"TxDOT takes submissions through Euna Procurement. This rehearsal has no Euna access, so I closed that question with a
working assumption: the workspace records each response itself, and the Submissions page says Euna is not connected.
Any Euna import format is an assumption too. It comes from TxDOT's published terms, rules SUB-04 and SUB-05. In a live
engagement, the agency's own process and Euna's export documentation would replace one file,
content/solicitation.json, with the real required documents and closing time. The rules and the tests stay as they
are. Today nothing is connected."
*Stop at 5:00.*

**Slide 7: Which slide tempted me to add words? (after 5:00, then Q&A)**
*My answer:* "The first one. There is no screenshot of TxDOT's own process, so I wanted to explain it in sentences.
That told me the image is a drawing from published terms, not an observation. The honest fix was a caption that says
so, not more words."
Then take questions (`rehearsal-checklist.md`).

## Pronunciation

| Word | Say |
|---|---|
| Obi | OH-bee |
| Oge (the tour's co-host) | OH-geh |
| TxDOT | Tex-Dot |
| CRIS | Chris |
| HUB (subcontracting plan) | hub, as in the word (Historically Underutilized Business) |
| Euna (Procurement) | YOO-nuh (check before the day) |
| SHA-256 | "shah two-fifty-six" |
| RSP-0001 | "R-S-P one" |
| EV-04, SUB-04 | "E-V four", "sub four" |

## The guided tour

The red **Take the guided tour** button plays OBI and Oge reading each slide, with the pointer on what is said. It is
for people who open the file later. Do **not** run it while you record; you are the narrator.
