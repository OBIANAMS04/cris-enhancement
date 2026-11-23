# Final showcase: rehearsal checklist (PREP-5, live as PREP-6)

## The portal's checklist (you are held to these)

- [ ] **Every number on a slide is marked measured, estimated, or target.** Slide 5 tags every figure: MEASURED (16 of
      16 stories, 50 of 50 criteria, 800 points, 73 unit tests, the 16-story rehearsal at about 87 s of clicks, a
      document retrieved within 2 s), TARGET (the 2-second criterion; service levels 4 / 8 / 24 / 72 hours; scoring
      weights 35 / 15 / 10 / 10 / 30; 4 required documents; the 4 Dec 2026 closing time), and NOT MEASURED YET (time
      saved for TxDOT staff). Slide 7 tags its two evidence items. No figure is estimated, so the ESTIMATED tag appears
      only in the legend. Say the label aloud with each number.
- [ ] **At least one real limit stated without apologising.** Slide 6 gives five, each with what it would take. No
      "unfortunately", no "it's only a demo".
- [ ] **Live proof uses safe data, with a backup recording.** Synthetic vendors and people, PDFs marked "SYNTHETIC
      SAMPLE"; backup video on the desktop and slide 3 (`demo-runbook.md` section 4).
- [ ] **I can say what the system never decides on its own.** Scores, the award, closing a breach without a recorded
      notification, anything about real vendors (slide 4).
- [ ] **Finishes inside eight minutes.** Timer on the deck (T): amber at 7:00, red at 8:00. Leave the browser by 3:20.
- [ ] **Answers ready for five likely questions, grounded in what was built.** Below.

## How it is assessed, and where the kit meets it

| Assessed | Weight | Where |
|---|---|---|
| Named role and specific cost | 20% | Slide 1: a TxDOT procurement officer; the cost is a bid ruled non-responsive and never scored (TxDOT's published terms) |
| All six beats, limits given real time | 15% | Slides 1, 2, 4, 5, 6, 7; Limits has a full 60 s |
| Live proof runs; every figure marked | 25% | `demo-runbook.md` (verified 16 Nov); slide 5 tags |
| AI/human boundary stated as a rule | 15% | Slide 4: "decides alone" / "never decides" |
| Inside 8 minutes | 15% | Timings in `speaker-notes.md` |
| Answers grounded; "I do not know yet" where true | 10% | Below |

## Rehearsal runs

| Run | Date | Total time | Live proof ended by 3:20? | Notes |
|---|---|---|---|---|
| 1 (alone, aloud, timed) | | | | |
| 2 (with the optional guardrail) | | | | |
| 3 (the recording, PREP-5) | | | | |
| 4 (dress rehearsal for 24 Nov, PREP-6) | | | | |

## Five likely questions, with answers from the repo only

1. **"Where is the AI in this?"**
   There is no AI model in the workspace. Its checks are fixed rules in `lib/` (one file per story), tested by 73 unit
   tests (`node --test tests/`). AI was used to build it: Claude Code wrote code under my direction, and the tests,
   the 16-story browser rehearsal (`tests/demo-rehearsal.js`) and the portal's verification of all 16 stories are how
   it was checked. The rule: it decides completeness, timeliness, outlier flags and clearance; people decide scores
   and TxDOT decides the award.
2. **"How much time does this save TxDOT?"**
   **I do not know yet.** It is not measured: no figure for how long TxDOT procurement staff spend checking a response
   today is in the build. What I can show is measured: the check runs before anything is stored, and the refusal is
   named and logged. No timed trial was run in this rehearsal; for any live engagement, the next step on slide 7 is one
   timed trial with a procurement officer to measure it.
3. **"Is it connected to TxDOT or Euna Procurement?"**
   No. Synthetic data, in one browser. TxDOT does use Euna (its RFOs require submission through it), but this
   rehearsal has no Euna access and we found no public API documentation. So it is closed by a working assumption: the
   workspace records submissions itself, the Submissions page says Euna is not connected, and any import format is an
   assumption. It lives in `content/solicitation.json`; a live engagement would replace that file with the agency's
   own process and Euna's export documentation.
4. **"What if your rules are wrong: the documents, the weights, the closing time?"**
   They are working assumptions, drawn from TxDOT's published terms and public Texas procurement practice, and
   labelled as proposals on screen. Required documents and closing time are in
   `content/solicitation.json`; evaluation weights (35 / 15 / 10 / 10 / 30) in `content/procurement-rules.json`, built
   from public Texas procurement sources; service levels in `lib/sla.js` and `lib/support.js`. Each lives in one file,
   so in a live engagement the agency's real values replace that file without touching the logic, and the tests and
   rehearsal are re-run.
5. **"Who can see the documents, and how do you know nothing was changed?"**
   Only four roles can upload or open response documents: compliance officer, procurement officer, TxDOT contract
   manager and the vendor's system administrator (`lib/documents.js`); vendor staff also need TxDOT-approved cyber training in the last 365 days (a working
   assumption from cited Texas rules). Every refusal is logged. Each file is stored and read back by its SHA-256
   hash; the receipt re-checks it ("Documents match the receipt"), and every action is on an audit log chained by
   hashes, so a changed line is reported. There is no real sign-in: the "Acting as" picker stands in for it.

**If asked about cost or hosting:** "There is no hosting cost in this rehearsal. It is a static site with no server and
no database, run locally (`node scripts/serve.mjs`) or on GitHub Pages. What a live deployment would cost is out of
scope for the rehearsal." Do not raise pricing or commercial terms.

## Shortened run order (if you have 5 minutes)

1. Problem, 30 s: slide 1, the three tiles only.
2. Live proof, 100 s: Vendor A recorded → Vendor B refused and logged → resubmitted and addressed. Skip the guardrail
   and the audit log; say "every step is on a hash-chained audit log".
3. The rule, 50 s: slide 4, read the two boxes.
4. Results, 40 s: slide 5, the six tiles, "time saved: not measured yet".
5. Limits, 40 s: slide 6, the first three limits.
6. Next step, 30 s: slide 7, option A (accept the case study, assumptions documented) and the timed trial for any
   live engagement.

## Reflection to end on

**"Which limit were you most tempted to leave out, and why does that make it the important one?"**
My answer (slide 8): "That there is no AI model inside; the checks are fixed rules. I was tempted to leave it out
because 'AI' is what people expect to hear. It matters most because fixed rules only catch what was written down,
which is why people score, TxDOT decides the award, and every refusal is logged for a person to see."

## Decisions made (rehearsal)

- **Slide 7:** Ali and Ram are asked to accept the CRIS case study as complete with its working assumptions documented
  (option A, recommended), or to hold it open (option B). One timed trial with a procurement officer is the stated next
  step for any live engagement. Time saved stays "not measured yet".
- **Open points:** closed by working assumptions from TxDOT's published terms and public Texas procurement practice,
  each labelled on screen and kept in one file. Nothing waits on TxDOT.
- **Euna:** no Euna access in the rehearsal; the workspace records submissions itself; the import format is an
  assumption.
- **Cost and hosting:** no hosting cost in the rehearsal (a static site, run locally or on GitHub Pages); a live
  deployment's cost is out of scope. Pricing and commercial terms are not raised.
- **Reflection (slide 8):** no AI model inside; the answer above is final.
- **Demo Day slot:** the slot Colaberry assigns on 24 November (see `demo-day-notes.md`).
