# Project introduction: 90-second script (PREP-1)

**Speaker:** Obi Anamelechi Kingsley · **Slide:** `slide.html` (one slide, on screen the whole time)
**Audience:** Ali Muwwakkil and Ram Katamaraja (Colaberry), and an interviewer who has never heard of the project
**Length:** 191 words, about 88 seconds at 130 words a minute. Spoken from memory.

---

## The script

### Block 1 · 0:00 to 0:20 · The person and their problem (40 words, about 18 s)

> I'm Obi. Picture a TxDOT procurement officer on closing day for the Crash Records solicitation, CRIS. Every response
> must carry every required document. The officer has to catch the one that is missing, and show why it was turned
> away.

### Block 2 · 0:20 to 0:40 · What it costs them (45 words, about 21 s)

> What does one miss cost? TxDOT's published terms are plain. A response without every required document is
> non-responsive: it is never scored. A late one is not considered under any circumstances. One missing file costs a
> vendor the whole bid, and costs TxDOT a competitor.

### Block 3 · 0:40 to 1:10 · What the project changes (64 words, about 30 s)

> My workspace changes the intake: every response is checked before it is stored, so a complete one gets a
> fingerprinted receipt, and an incomplete one is refused with the reason, logged, and tracked until the vendor
> resubmits. What stays human: evaluators score every criterion, resolve every flagged score, and TxDOT alone decides
> the award. The system does the arithmetic; it never makes the award.

### Block 4 · 1:10 to 1:30 · The next milestone (42 words, about 19 s)

> Next: everything runs on synthetic data, and some values are my proposals. The next milestone replaces them with
> TxDOT's answers: scoring weights, Euna access, risk matrix, required reports, service levels. Done means no
> "proposal" label left on screen. Then, real TxDOT connections.

**Total: 191 words.** That leaves about two seconds of slack for pauses. If a take runs long, cut "on closing day"
(block 1) and "under any circumstances" (block 2) first.

---

## How the script meets the checklist

| Checklist item | How this script meets it |
|---|---|
| Says who it helps without the word "users" | Names one real role, "a TxDOT procurement officer" (block 1), and the vendor whose bid is at stake (block 2). The word "users" never appears. |
| The cost statement comes from something he can point to | Block 2 restates two published TxDOT terms, both in `content/procurement-rules.json`: EV-04 (TxDOT RFO 601440000054109 sec. 17.1 and 17.6; incomplete responses are non-responsive and not scored) and SUB-04 (TxDOT Terms and Conditions 2.02(b); late responses are not considered). No number is estimated. |
| Says what the human still decides | Block 3: "evaluators score every criterion, resolve every flagged score, and TxDOT alone decides the award. The system does the arithmetic; it never makes the award." |
| Finishes inside ninety seconds | 191 words at 130 words a minute is about 88 seconds; each block is timed above and fits its slot. |
| The closing names real next work, not a claim it is finished | Block 4 names the open questions from the framework's Blockers table (scoring weights, Euna Procurement access, risk matrix, required reports, service levels), says what "done" means, and names the connection to real TxDOT systems as the work after that. It does not say the build is finished. |
| No buzzword opening | It opens with "I'm Obi. Picture a TxDOT procurement officer", a person and a moment, not a product description. |

---

## Pronunciation

| Word | Say it |
|---|---|
| Obi | OH-bee |
| TxDOT | "Tex-Dot" |
| CRIS | "Chris" |
| Euna (Procurement) | YOO-nuh (check how TxDOT and the vendor say it before recording) |
| HUB (if asked) | "hub", as in Historically Underutilized Business |
| non-responsive | non-ree-SPON-siv (a procurement term: the response is not considered) |

---

## Source notes (read before recording)

- **Cost (block 2).** Sourced from TxDOT's published terms for other solicitations (EV-04 and SUB-04 above). The CRIS
  solicitation's own terms are not in the repo; if they differ, use theirs. If asked "how much time does this cost
  today?", the honest answer is that no figure is in the build.
  **(source needed: minutes TxDOT procurement staff spend checking each response for completeness today, or how many
  responses to recent TxDOT solicitations were ruled non-responsive.)** If you find a sourced figure, it can replace
  "and costs TxDOT a competitor" in block 2, keeping the block at about 45 words.
- **"Every required document."** The demo uses four (technical proposal, pricing, forms and certifications, HUB
  subcontracting plan), from `content/solicitation.json`, which says they are demo settings that the real
  solicitation's terms replace. The script does not claim these are CRIS's real four.
- **"Fingerprinted receipt"** is the SHA-256 receipt saved with each response (STORY-008).
- **"TxDOT alone decides the award"** follows rule EV-06 in `content/procurement-rules.json` ("TxDOT is sole judge of
  best value"). The workspace ranks complete scores and names the highest as best value; it does not award.
- **Block 4** comes from the framework's Blockers (section 6). The nearest dated event is the 24 November demo; the
  script names the work after it, because that is the work still to be built.
- Everything shown runs on synthetic people and data; nothing is connected to TxDOT. Do not say otherwise if asked.

## Recording tips

- Look at the camera, not the slide. The slide carries the five points so you do not have to read.
- Pause for a beat between blocks; the four headings on the slide mark the transitions.
- Do one timed run with a stopwatch first. Aim for 85 to 88 seconds.
