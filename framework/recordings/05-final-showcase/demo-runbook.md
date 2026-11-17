# Final showcase: live-proof runbook (PREP-5 and PREP-6)

**The live proof (150 seconds):** the same flow as the working-system demo (PREP-2), so the two videos agree. Vendor A's
complete response is recorded with a receipt; Vendor B's response, missing two documents, is refused with the reason
and logged; Vendor B resubmits and the error is addressed; the audit log says "The chain is intact". One optional
guardrail if the clock allows: a vendor employee without current cyber training is refused access to documents
(STORY-011).

**Where it runs:** on this laptop, with the local server (http://localhost:4321/workspace/), as Ali asked for the
recordings (14 Nov). Not the Command Center.
**Data:** synthetic only. Vendor A Demo, Vendor B Demo, Quinn, Sage and Riley are made up; the eight PDFs in
`../02-working-system-demo/sample-files/` say "SYNTHETIC SAMPLE". Nothing here reaches TxDOT or any TxDOT system.

**Verified 16 Nov 2026 against the code in this repo** (Playwright, fresh browser profile, from a reset store): every
click and every message quoted below was seen on screen. Screenshots of that run are in `screens/01` to `screens/06`.

---

## 1. Starting state (10 minutes before)

1. Start the server and leave the window open:
   ```
   cd "C:\Users\obiki\Documents\AINWINTRVWSTFFS!!\CRIS-Enhancement"
   node scripts/serve.mjs
   ```
   It prints `Command Center at http://localhost:4321/`.
2. In the browser you will share (Edge preferred, or Chrome), open **http://localhost:4321/workspace/#/audit**.
3. Click **Start a new, empty demo**, then click it again when it reads **Press again to wipe this browser's demo
   data**. You see "A new, empty demo store was started." and "The chain is intact: all 10 lines …" (the 10 lines are
   the synthetic people being set up).
4. **Pre-stage the optional guardrail** (takes 15 seconds, not shown live): open
   **http://localhost:4321/workspace/#/security**, set **Acting as** (top right) to **Sage Demo (security officer)**,
   and in Riley's row of **Vendor clearance** click **Require retraining**. You see "Riley Demo (system administrator)
   must retake the training; clearance suspended." Riley's row now says **Blocked**.
5. Open **http://localhost:4321/workspace/#/submissions** and set **Acting as** to **Quinn Demo (procurement officer)**.
6. Check the "before" state: **Responses: No responses yet** and **Submission errors: No errors**.
7. Zoom 100% (Ctrl+0), window about 1280 x 800 or full screen. Close other tabs except the deck; hide the bookmarks
   bar (Ctrl+Shift+B); turn on Windows Focus / Do not disturb.
8. Open `framework/recordings/05-final-showcase/presentation.html` in a second tab (double-click it in File Explorer,
   or http://localhost:4321/framework/recordings/05-final-showcase/presentation.html). Press **F** for full screen.
9. Keep File Explorer open at `framework/recordings/02-working-system-demo/sample-files/` for the file pickers.

**Closing time:** the demo solicitation closes at 3:00 p.m. Central on 4 December 2026 (`content/solicitation.json`,
a demo value). Before that date nothing here is refused as late.

---

## 2. The run (inside beat 2, 0:50 to 3:20)

Each row: **say** first, **then** do, **then** say what happened.

| Say first | Then do | You will see |
|---|---|---|
| (On slide 2) "I'm acting as Quinn, the procurement officer, on synthetic data. Watch four things: …" | Switch to the workspace tab (Submissions). Point at **Responses** and **Submission errors**. | "No responses yet", "No errors". |
| "Vendor A Demo sends a complete response: the four documents the solicitation requires." | Type `Vendor A Demo` in **Respondent**. **Choose File** on **Technical proposal**, **Pricing**, **Forms and certifications**, **HUB subcontracting plan**: `vendor-a-1` to `vendor-a-4`. | Each field shows its file name. |
| "Watch the top of the page." | Click **Record the response**. | Green: "**RSP-0001 recorded for Vendor A Demo.** Receipt 83df7d9e…" (the receipt digits differ each run). RSP-0001 in **Responses**, status **submitted**. |
| *After:* "Checked before it was stored: on time, every required document, accepted file types. The receipt is a fingerprint of the four files." | | |
| "Now Vendor B, with only two of the four. Watch the top of the page." | Type `Vendor B Demo`; attach only `vendor-b-1` (Technical proposal) and `vendor-b-2` (Pricing). Click **Record the response**. | Red: "**The submission was not accepted.** Missing required document: Forms and certifications. Missing required document: HUB subcontracting plan." and "**Try this:** Attach the missing documents: Forms and certifications, HUB subcontracting plan." |
| *After:* "Refused, not stored, and it says exactly why. And it is logged:" | Scroll to **Submission errors**. | "**INC-0001 open** · … Submission error [Vendor B Demo]: Missing required document: …" |
| "The vendor sends the missing files while the solicitation is open. Watch the error." | Type `Vendor B Demo`; attach all four `vendor-b` files; click **Record the response**. | "**RSP-0002 recorded for Vendor B Demo.**" Submission errors: "**INC-0001 resolved** … **Addressed:** RSP-0002 submitted correctly." |
| *Optional, only if the timer reads 2:35 or less:* "One more guardrail. Riley is a vendor administrator whose cyber training is no longer current. Watch what happens when Riley tries to upload a document." | Click **Documents** (top navigation). **Acting as** → **Riley Demo (system administrator)**. **Choose File** `vendor-a-1-technical-proposal.pdf`; **Category** stays **Technical proposal**; click **Upload**. | Red: "**Access refused: Riley Demo (system administrator) has not completed the TxDOT-approved cyber security training.** … The attempt has been logged." and "**Try this:** Complete the cyber security course on the Training page; …" |
| *After:* "Cleared for protected work is a decision it makes alone, and it is enforced, not just reported." | | The amber line above it already says why ("Riley Demo (system administrator) has not completed the TxDOT-approved cyber security training. Until it is completed, any upload or opening is refused and logged."), and the red box is the refusal itself. Point at both. (Fixed 16 Nov: the line used to say "may upload" because it checked the role only.) |
| "And nothing is quietly changed. The audit log." | Click **Audit log** (top navigation). | "**The chain is intact: all … lines match their hashes and follow on from each other.**" Rows include "submission error logged", "user error", "submission error addressed". |
| *Close:* "It refused an incomplete bid, said why, logged it, and let the vendor put it right." | Switch back to the deck; **→** to slide 4. | |

(Slide 3 is the backup and is skipped when the live run works: from slide 2, press **→** twice to reach slide 4.)

---

## 3. Recovery

| If this happens | Do this |
|---|---|
| "This site can't be reached" | The server is not running: start it (section 1, step 1) and reload. If it does not come back in 20 seconds, go to section 4. |
| "Only a procurement officer or the contract manager can record a submission." | Wrong person in **Acting as**: choose **Quinn Demo (procurement officer)** and click again. Say: "one more refusal, by role." |
| The response is refused as late | The demo closing time has passed (after 4 Dec 2026). Say: "that is the closing-time rule working", then section 4. |
| RSP numbers are not 0001 / 0002 | The store was not reset. Carry on: the numbers do not matter. |
| A file is refused as the wrong type | You picked a non-PDF: use the PDFs in `sample-files/`. |
| Riley is **not** refused on Documents | Step 4 of section 1 was skipped. Skip the guardrail and go to the audit log. |
| Anything else, or you are past 2:40 | Stop, say "here is the same run recorded earlier", and show slide 3 or the backup video. |

## 4. Backup

- **Backup video:** record one clean full run of beat 2 the day before, with your voice, and keep it on the desktop as
  `CRIS-final-showcase-live-proof-backup.mp4`. You must be able to open it in ten seconds. The PREP-2 backup video
  (`CRIS-working-system-demo-backup.mp4`) shows the same flow and will do if this one is not ready.
- **Backup slide:** slide 3 of the deck shows the five screens of this run (`screens/02` to `06`).

## 5. Recording it (PREP-5 hand-in)

- The portal's recorder (PREP-5 → Prepare → **Use a Studio recording**), or Windows **Snipping Tool → Record**
  (Win+Shift+R) with the microphone on, or Xbox Game Bar (Win+G).
- One take, timer running, inside 8:00. Hand in on the portal with the answers to five likely questions
  (`rehearsal-checklist.md`).
- No production changes were made to produce this showcase: it runs on the build as committed.
