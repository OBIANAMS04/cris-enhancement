# Working-system demo: rehearsal checklist (PREP-2)

## The portal's checklist (you are held to these)

- [ ] **My sample data contains nothing real or private.** Vendor A Demo and Vendor B Demo, Quinn Demo, and the eight
      PDFs in `sample-files/` marked "SYNTHETIC SAMPLE". No real vendor, person or TxDOT record.
- [ ] **I say what to watch BEFORE I click, every time.** Each row of the runbook starts with "Say first".
- [ ] **I show one failure deliberately and explain the recovery.** Vendor B with two of four documents: refused,
      logged as INC-0001, resubmitted complete, marked addressed.
- [ ] **I have a backup recording and I know how to reach it in ten seconds.** `CRIS-working-system-demo-backup.mp4`
      on the desktop (record it the day before).
- [ ] **Notifications, bookmarks and other tabs are hidden before I share.** Focus / Do not disturb on;
      Ctrl+Shift+B; only two tabs: the presentation and the workspace.
- [ ] **I have rehearsed the exact window I am going to share.** Same browser, same zoom (100%), same size.

## Rehearsal runs

| Run | Date | Total time | Narration before every click? | Notes |
|---|---|---|---|---|
| 1 (alone, narrating aloud, nobody watching) | | | | |
| 2 (timed) | | | | |
| 3 (the recording) | | | | |

**The drill the portal recommends:** run it once with your screen shared to nobody, narrating aloud. If a click ever
comes before the words, you are showing rather than teaching: move the words earlier.

## Five likely questions, with answers from the build

1. **"What else does it refuse?"**
   Before anything is stored, it refuses: a response after the closing time; a missing required document; an empty
   file; a file over the size limit; a file type it does not accept (for example .exe); a response with no respondent
   named; and anyone other than a procurement officer or the contract manager trying to record one. Each refusal says
   why, offers a "Try this" fix, and is logged. A retried submission with the same key is stored once, and a storage
   failure is logged as an incident instead of being lost. (Source: `lib/submissions.js`, tests in
   `tests/story-008-submissions.test.mjs`.)
2. **"How do you know the documents weren't changed after they arrived?"**
   Each file is stored and read back by its SHA-256 hash; the receipt is the fingerprint of all of them. Opening a
   response re-checks them: "Documents match the receipt". Every action is also on the audit log, chained by hashes;
   change one line and the log page says the chain is broken.
3. **"Is this connected to TxDOT or Euna Procurement?"**
   No. CRIS is a Colaberry rehearsal case study: it runs on synthetic data in the browser, and the page says so.
   There is no Euna access in the rehearsal; the workspace records submissions itself, and any Euna import format is a
   working assumption.
4. **"Who decides what, the system or a person?"**
   The system checks completeness and keeps the record. People score every criterion, a score far from the others is
   flagged and must be resolved before the evaluation can be archived, and TxDOT alone decides the award.
5. **"What would it take to use this for real?"**
   The client's own values in place of the working assumptions (required documents, closing time, scoring weights,
   service levels): each lives in one file, so the logic does not change. Then hosting and sign-in on the client's
   systems. In the rehearsal there is no hosting cost: it is a static site with no server and no database, run locally
   or on GitHub Pages.

## Shortened run order (if you have 4 minutes)

1. Starting condition, 30 s: slide 2, then the empty Submissions page.
2. Action, 60 s: Vendor A complete → RSP-0001 recorded.
3. Skip opening RSP-0001; point at the receipt in the table instead.
4. Failure path, 90 s: Vendor B with two documents → refused and logged → resubmit → addressed.
5. Audit log, 20 s: "The chain is intact."

## Reflection to end on

**What did the system refuse to do, and are you glad it refused?** It refused to store a response missing two
required documents, and said which. Yes: an incomplete bid must never reach scoring, and the officer now has a record
of why it was turned away and how it was put right.
