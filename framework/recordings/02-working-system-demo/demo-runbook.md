# Working-system demo: runbook (PREP-2)

**One outcome, end to end:** a vendor's response to the Crash Records solicitation, from receipt to "under
evaluation", with every step on the audit log, including the response that was refused.
**Length:** 7 minutes speaking; 3 minutes of questions are separate.
**Where it runs:** on this laptop, with the local server. Not the Command Center, and not the GitHub Pages link
(Ali, 14 Nov: record it locally with the server running).
**Data:** synthetic only. Vendor A Demo and Vendor B Demo are made up; the eight PDFs in `sample-files/` say
"SYNTHETIC SAMPLE" on the page. Nothing here reaches TxDOT or any TxDOT system.

Rehearsed on 16 Nov 2026 against the code in this repo: every step and every message below was seen on screen.
The screenshots in `screens/` are from that run.

---

## 1. Starting state (do this 10 minutes before you record)

1. Open a terminal (PowerShell or Git Bash) and start the server:
   ```
   cd "C:\Users\obiki\Documents\AINWINTRVWSTFFS!!\CRIS-Enhancement"
   node scripts/serve.mjs
   ```
   It prints `Command Center at http://localhost:4321/`. Leave this window open for the whole recording.
2. In the browser you will record (Edge or Chrome), open **http://localhost:4321/workspace/#/audit**.
3. Click **Start a new, empty demo**, then click it again when it says **Press again to wipe this browser's demo
   data**. You see "A new, empty demo store was started."
4. Open **http://localhost:4321/workspace/#/submissions**. In **Acting as** (top right) pick
   **Quinn Demo (procurement officer)**.
5. Check the page shows: **Responses: No responses yet** and **Submission errors: No errors**. That is the
   "before" state.
6. Zoom 100% (Ctrl+0). Window about 1280 x 800, or full screen. Close other tabs; hide the bookmarks bar
   (Ctrl+Shift+B); turn on Windows Focus / Do not disturb so no notification appears.
7. Open `framework/recordings/02-working-system-demo/presentation.html` in a second tab for the opening and closing
   slides (double-click it in File Explorer). Press **F** for full screen, **T** to start the timer.
8. Keep File Explorer open at `framework/recordings/02-working-system-demo/sample-files/` for the file pickers.

**If the closing-time message says submissions are late:** the solicitation's demo closing time is
4 December 2026 (`content/solicitation.json`). After that date, move it again before recording.
**If the service-hours rules matter:** they do not in this demo; Submissions has none.

---

## 2. The run (7 minutes)

Each step: **say** what to watch, **then** click, **then** say what happened.

### Beat 1. The starting condition (0:00 to 1:00)

| Say first | Then do | You will see |
|---|---|---|
| "I'm Obi. The job: a TxDOT procurement officer receives vendor responses to the Crash Records solicitation. Every response must arrive before the closing time with every required document, and the officer must be able to show why any response was turned away." | Slide 1, then slide 2. | Slides. |
| "This is the workspace, running on my laptop with synthetic data. I am acting as Quinn, the procurement officer. Watch two places: the Responses table, which is empty, and Submission errors, which says no errors." | Switch to the Submissions tab. Point at **Responses** and **Submission errors**. | "No responses yet", "No errors". |

### Beat 2. The action (1:00 to 3:00)

| Say first | Then do | You will see |
|---|---|---|
| "Vendor A Demo has sent a complete response: four documents, the four the solicitation requires." | Type `Vendor A Demo` in **Respondent**. | |
| "I attach each one to its slot: technical proposal, pricing, forms and certifications, HUB subcontracting plan." | **Choose File** on each of the four fields: `vendor-a-1` to `vendor-a-4`. | Each field shows its file name. |
| "Watch the green message at the top and the Responses table. I click Record the response." | Click **Record the response**. | The page scrolls to "**RSP-0001 recorded for Vendor A Demo.** Receipt 6f13…"; the table gains RSP-0001, status **submitted**. |

### Beat 3. The result (3:00 to 5:00)

| Say first | Then do | You will see |
|---|---|---|
| "It was checked before it was stored: on time, every required document, accepted file types. The receipt is a fingerprint of the four files." | Point at the receipt. | |
| "Let's open it. Watch for one line: whether the stored documents still match the receipt." | Click **RSP-0001**. | "Status: submitted · **Documents match the receipt** 6f13…", the four documents, and **Tracking**: every step from the audit log. |
| "They match. Now the officer moves it on. Watch the status." | Click **Move to under evaluation**. | "**RSP-0001 is now under evaluation.**" Status: under evaluation; Tracking gains "response under evaluation". |
| "That is the outcome that matters: a complete response, provably unchanged, tracked step by step, ready for scoring." | | |

### Beat 4. The control and the failure path (5:00 to 7:00)

| Say first | Then do | You will see |
|---|---|---|
| "Now the case it must refuse. Vendor B sends only two of the four documents. Watch the top of the page." | Back to **Submissions**. Type `Vendor B Demo`; attach only `vendor-b-1` and `vendor-b-2`. Click **Record the response**. | Red: "**The submission was not accepted.** Missing required document: Forms and certifications. Missing required document: HUB subcontracting plan." and "**Try this:** Attach the missing documents…" |
| "It refused rather than storing an incomplete bid, said exactly why, and logged it. Look at Submission errors." | Scroll to **Submission errors**. | "**INC-0001 open** · Submission error [Vendor B Demo]: Missing required document…" |
| "What does a person do next? The vendor sends the missing files while the solicitation is open. Watch the error." | Type `Vendor B Demo`; attach all four `vendor-b` files; click **Record the response**. | "**RSP-0002 recorded for Vendor B Demo.**" Submission errors: "**INC-0001 resolved** … **Addressed:** RSP-0002 submitted correctly." |
| "And nothing is quietly changed. Here is the audit log." | Open **Audit log** (top navigation). | "**The chain is intact: all … lines match their hashes and follow on from each other.**" The refusal is there too: "submission error logged", "user error", then "submission error addressed". |
| Close: "It refused an incomplete bid, said why, logged it, and let the vendor put it right. People still score every response and TxDOT alone decides the award." | Slide 7 (the reflection). | |

---

## 3. Recovery paths during the recording

| If this happens | Do this |
|---|---|
| The page shows "This site can't be reached" | The server is not running: start it (section 1, step 1) and reload. |
| The response is refused as late | The demo closing time has passed: see section 1. Say "this is the closing-time rule working" and show the backup video. |
| "Only a procurement officer or the contract manager can record a submission." | Wrong person in **Acting as**: pick **Quinn Demo (procurement officer)** and click again. Good moment, actually: it is one more refusal. |
| RSP numbers are not 0001/0002 | The store was not wiped. Carry on (the numbers do not matter) or reset (section 1, step 3). |
| A file is refused as the wrong type | You picked a non-PDF: choose the PDFs in `sample-files/`. |
| Anything else | Stop, say "here is the same run recorded earlier", and play the backup video. |

## 4. Backup plan

- **Backup video:** record one clean full run the day before, with your voice, and keep it on the desktop as
  `CRIS-working-system-demo-backup.mp4`. You must be able to open it in ten seconds.
- **Screenshots:** `screens/01-before.png` to `screens/07-audit-chain-intact.png` show every beat; the presentation's
  backup slide lists them.

## 5. Recording it (the hand-in)

- Simplest: the portal's own recorder (PREP-2 → Prepare → **Use a Studio recording**), or Windows **Snipping Tool →
  Record** (Win+Shift+R) with the microphone on, or Xbox Game Bar (Win+G).
- Hand in on the portal: PREP-2 → Present & Share → Working-system demo slot, or **Paste a link** to the video.
- No production changes were made to produce this demo: it runs on the build as committed.
