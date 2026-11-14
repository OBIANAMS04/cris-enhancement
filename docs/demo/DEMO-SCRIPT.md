# CRIS Enhancement: Live Demo Script

**Demo date:** 24 November 2026 · **Presenter:** Obi · **Watching:** Ali Muwwakkil, Ram Katamaraja (Colaberry)
**Length:** 20 minutes of demo plus 10 minutes of questions · **Everything on screen is synthetic data.**

The labels in this script (buttons, fields, page names, people) are copied from the code and from the browser walks in
`tests/workspace-walk*.js`. Type them exactly as written.

---

## 1. Before you start

### 1.1 Two things to fix BEFORE demo day (found while writing this script)

1. **Fixed 14 Nov: submissions would have been refused as late.** The demo solicitation closed on 20 Nov, so on 24 Nov
   "Record the response" would have refused every vendor and Segments 11 and 12 could not run. `content/solicitation.json`
   now closes on 4 Dec 2026, 3 pm Central (`2026-12-04T21:00:00.000Z`), and the late-submission test follows that date.
2. **The Command Center will show a "stale data" warning on every tab.** `.colaberry/manifest.json` says
   `generated_at: 2026-11-10`; the page warns when data is over 7 days old ("Sync from the portal to refresh"). Either sync from the
   portal before the demo to refresh the file, or say out loud: "That warning is the page being honest about the age of the plan file."

### 1.2 Setup checklist (do this 30 minutes before)

| # | Step | Done |
|---|---|---|
| 1 | Use one laptop, **Chrome or Edge, a fresh profile or a private window**. Close other tabs and notifications. | |
| 2 | Set the laptop clock and time zone to **Central Time (Chicago)**. The service-hours check (Mon to Fri, 6:00 to 20:00 Central) depends on it. Check it is a weekday. | |
| 3 | Open the live site: **https://obianams04.github.io/cris-enhancement/** (Command Center) and, in a second tab, **https://obianams04.github.io/cris-enhancement/workspace/** (the workspace). | |
| 4 | Browser **zoom 100%**, window about 1280 x 900 (full screen on a 1080p projector is fine). Do not use phone width. | |
| 5 | Start from an empty store: open the workspace, go to **Audit log**, press **Start a new, empty demo**, then press the same button again when it says "Press again to wipe this browser's demo data". (Or clear site data for the site in browser settings.) Then reload. The first ticket will be TKT-0001. | |
| 6 | Make **four small PDF files** for Submissions, named `vendor-a-1.pdf` to `vendor-a-4.pdf` (any content, under 10 MB). Also make `technical-proposal.txt` (any text) and `virus.exe` (an empty file renamed) for Documents, and one more small PDF `cert.pdf` for the Security segment. Put them on the desktop. | |
| 7 | Have the **Acting as** picker in view (top right of the workspace). It starts on "Avery Demo (TxDOT user)". The choice is remembered in the browser. | |
| 8 | Open the **backup deck** (section 7) in another tab and the screenshots folder in a file window. | |
| 9 | Do one complete dry run the day before with the same browser. Reset again (step 5) afterwards. | |
| 10 | Have the cheat sheet of training answers (section 2) open on your phone. | |

### 1.3 Who is who (the "Acting as" picker)

Pick by the exact text shown in the list.

| Name in the picker | Role | Used in |
|---|---|---|
| Avery Demo (TxDOT user) | TxDOT user | 2, 6, 7, 9, 16 |
| Jordan Demo (TxDOT manager) | TxDOT manager | 5, 7 |
| Sam Demo (support staff) | TxDOT staff member | 2, 7 |
| Riley Demo (system administrator) | vendor administrator | 3, 14, 15 |
| Casey Demo (developer) | vendor developer | 6, 14 |
| Taylor Demo (contract manager) | TxDOT contract manager | 8, 12 |
| Morgan Demo (compliance officer) | compliance officer | 9, 10, 14, 16 |
| Quinn Demo (procurement officer) | procurement officer | 9, 11, 12 |
| Rowan Demo (risk manager) | risk manager | 13 |
| Sage Demo (security officer) | security officer | 14 |

### 1.4 Rules of the stage

- The order below carries data forward (a monitoring check in Segment 4 feeds the reports in Segments 5 and 8; the outage
  in Segment 4 feeds the risk assessment in Segment 13; the violation in Segment 10 is cleared in Segment 14).
  **Do not skip segments without reading the "Needs" line.**
- Each segment is about one minute. Read only the **Say** line and do the **Clicks**.
- If something fails, use that segment's **Fallback**. Never debug on stage.

---

## 2. Cheat sheet: training answers (80% needed to pass)

Pick the option whose text matches. The questions are read from `content/training-materials.json`.

| Course | Q1 | Q2 | Q3 |
|---|---|---|---|
| Using the Help desk | How urgent you say it is | Reopen the ticket and say what is still wrong | Its history, opened from the reference |
| Cyber security training (TxDOT-approved programme) | Vendor employees working on CRIS | Completion and its date | Every year |

To fail on purpose, pick any wrong option.

---

## 3. Run of show (20 minutes)

| # | Minutes | Segment | Story | Page / address | Who is acting | Proof moment |
|---|---|---|---|---|---|---|
| 0 | 0:00 to 1:00 | Opening and honesty statement | n/a | Command Center | n/a | "Everything is synthetic; some values are proposals" |
| 1 | 1:00 to 3:00 | Command Center | STORY-000 | `/` (nine tabs) | n/a | Every card opens a page; Sample is labelled |
| 2 | 3:00 to 4:00 | Help desk | STORY-001 | `#/help-desk` | Avery, then Sam | Reference, named person, deadline, help article; status "resolved" |
| 3 | 4:00 to 5:00 | Support dashboard | STORY-012 | `#/support` | Riley | Maintenance in service hours refused; night window scheduled |
| 4 | 5:00 to 6:00 | Monitoring | STORY-002 | `#/monitoring` | any | Real measurements; outage drill raises an alert |
| 5 | 6:00 to 7:00 | Performance reports | STORY-003 | `#/reports` | Jordan | No data = refused with a reason; with data = archived with hash |
| 6 | 7:00 to 8:00 | Feature development | STORY-004 | `#/features` | Avery, Casey | Release refused without the "need check"; infeasible idea answered |
| 7 | 8:00 to 9:00 | Training | STORY-005 | `#/training` | Sam, Jordan, Avery | Hold refused without a recording; failed check is not a completion |
| 8 | 9:00 to 10:00 | Reporting engine | STORY-006 | `#/reporting-engine` | Taylor | Cost report refused: needs the TxDOT financial system |
| 9 | 10:00 to 11:00 | Documents | STORY-013 | `#/documents` | Morgan, Avery, Quinn | Wrong file refused; stranger refused; opens in under 2 s, fingerprint matches |
| 10 | 11:00 to 12:00 | Compliance | STORY-007 | `#/compliance` | Morgan | 14 rules checked; a legal update raises a violation |
| 11 | 12:00 to 13:00 | Submissions | STORY-008 | `#/submissions` | Quinn | Incomplete response refused and logged; full one stored with receipt |
| 12 | 13:00 to 14:00 | Evaluation | STORY-009 | `#/evaluation` | Quinn, Taylor | Typo score flagged; correction keeps the original; ranking archived |
| 13 | 14:00 to 15:00 | Risk | STORY-010 | `#/risk` | Rowan | Outage becomes a scored risk with owner and plan |
| 14 | 15:00 to 16:30 | Security | STORY-011 | `#/security` | Sage, Riley | Breach logged with deadline; uncleared vendor blocked; retraining clears it and the Segment 10 violation |
| 15 | 16:30 to 17:30 | Performance and user errors | STORY-014 | `#/performance` | Riley | Slow-response alert; every refusal comes with "Try this:" |
| 16 | 17:30 to 18:30 | Incident reports | STORY-015 | `#/incident-reports` | Morgan, Avery | Versioned report; Avery refused; access log |
| 17 | 18:30 to 19:30 | Audit log: the closing proof | all | `#/audit` | any | Chain intact; change one line and it is caught |
| 18 | 19:30 to 20:00 | Close | n/a | Command Center | n/a | What needs TxDOT's answers; next steps |

The segments follow the story line (command center, then help and operations, then training, reporting and compliance,
then procurement, then security and errors, then incident reports, then the audit trail), not the story numbers.
All 16 stories are covered: 000, 001, 012, 002, 003, 004, 005, 006, 013, 007, 008, 009, 010, 011, 014, 015.

---

## 4. Segment scripts

Workspace pages are at `https://obianams04.github.io/cris-enhancement/workspace/#/<page>`; use the page tabs across the top.

### Segment 0 (0:00 to 1:00): Opening

**Say:** "Everything you will see runs on made-up people and made-up data. Nothing is connected to TxDOT. Where I used a value
TxDOT has not given us yet, such as response times or scoring weights, the screen says so, and I will list them at the end."

**Clicks:** Show the Command Center at `https://obianams04.github.io/cris-enhancement/`. Do not click yet.

**Fallback:** If the site does not load, go to section 7 (backup).

### Segment 1 (1:00 to 3:00): Command Center, STORY-000

**Point:** One place that shows what is being built, how far along it is, and never shows a number the project has not produced.

**Clicks:**
1. On **Overview**, point at the stamp "Data as of" (see 1.1) and at the **Real / Sample** switch (top right).
2. Click through the tabs, one sentence each: **Outcomes**, **Users and use case**, **Guardrails**, **Systems**, **Project management**, **AI agents**.
3. On **Guardrails**, open the card for REQ-010 (compliance with laws) to show a drill-down page.
4. On **Systems**, point out the grey "Not checked from here": no connection is claimed.
5. On **Knowledge base**, type in the box `Which stories cover REQ-010?` and press **Ask**. It answers with "From:" naming its source.
   Then ask `What is the weather in Austin tomorrow?`: it says it can't answer.
6. Click **Sample**: the banner and tags say sample. Click **Real** to go back.
7. Click **Open the workspace →** (top right) to enter the workspace.

**Audience should see:** nine tabs, labelled sample data, a source on every answer, grey systems.

**Fallback:** Screenshots `framework/screens/01-overview-real.png`, `05-systems.png`, `08-knowledge-chat.png`, `12-overview-sample.png`.
If the Project management tab looks empty, say: "The plan file carries no dates yet, so the page shows none."

### Segment 2 (3:00 to 4:00): Help desk, STORY-001

**Point:** A user reports a problem and immediately gets a reference, a named person, a deadline and a matching help article.

**Clicks:**
1. Go to **Help desk**. Acting as **Avery Demo (TxDOT user)**.
2. **What is wrong?** type `Cannot sign in, my account is locked`. **Area**: `Signing in`. **How urgent?**: the `high` option. Click **Report the issue**.
3. Show the box that says who has the issue and the help article (TKT-0001).
4. Report a second one: **What is wrong?** `Crash report form will not submit`, **How urgent?** `urgent`, **Report the issue** (TKT-0002).
5. Open TKT-0001 (address `#/help-desk/TKT-0001`). Acting as **Sam Demo (support staff)** click **Start work**.
6. **What fixed it?** type `Account unlocked and a password reset link sent.` Click **Mark resolved**.
7. Acting as **Avery Demo (TxDOT user)**, back on **Help desk**: **Ticket reference** `tkt-0001`, click **Check status**. It shows "Status: resolved".

**Audience should see:** a reference, an owner, a deadline (from the proposed 4/8/24/72 hour levels), and a resolved status.

**Fallback:** `framework/screens/m1-01-helpdesk-assistance.png`, `m1-02-ticket-resolved.png`.

### Segment 3 (4:00 to 5:00): Support dashboard, STORY-012

**Point:** Open tickets are watched against their service level, and maintenance is kept out of service hours.

**Clicks:**
1. Go to **Support dashboard**. Acting as **Riley Demo (system administrator)**. The queue shows TKT-0002 only (TKT-0001 is resolved).
2. In the maintenance form: **What** `Apply security patches`, **Component** `Web servers`.
3. First show the refusal: **Starts (your local time)** a weekday at 10:00, **Ends (your local time)** same day 11:00, click **Schedule**.
   It says it overlaps service hours. (Works only if the laptop is on Central time.)
4. Then set **Starts** to tomorrow 23:00 and **Ends** to the day after at 01:00, click **Schedule**. "MW-0001 scheduled".

**Fallback:** `framework/screens/m1-03-support-dashboard.png`. If the time zone is not Central, skip step 3.

### Segment 4 (5:00 to 6:00): Monitoring, STORY-002

**Point:** Real measurements, not pretend ones, and an outage raises an alert.

**Clicks:**
1. Go to **Monitoring**. It says "No checks yet": nothing is shown before anything is measured.
2. Click **Run a check now** twice (a few seconds apart). Four components appear with availability and response time.
3. Click **Run the outage drill**. A red notice starting "ALERT: Outage drill" appears.

**Say:** "CRIS itself is not reachable from here, so it checks this site. The drill points at a file that does not exist."

**Fallback:** `framework/screens/m1-04-monitoring-alert.png`. Do the check clicks even if the drill misbehaves: later segments need at least one check.

### Segment 5 (6:00 to 7:00): Performance reports, STORY-003

**Point:** A report is only produced from recorded data, and once archived a change is caught.

**Clicks:**
1. Go to **Performance reports**. Acting as **Jordan Demo (TxDOT manager)**.
2. **From** `2026-10-01`, **To** `2026-10-02`, click **Generate**. Error: "No monitoring samples" and what is missing.
3. Set **From** and **To** to **today**, click **Generate**. "RPT-0001 generated and archived".
4. Open RPT-0001: "Matches its archived hash".

**Fallback:** `framework/screens/m1-05-report-missing-data.png`, `m1-06-performance-report.png`.

### Segment 6 (7:00 to 8:00): Feature development, STORY-004

**Point:** User feedback becomes a feature only with a recorded check that it meets the need; impossible requests get an honest answer.

**Clicks:**
1. Go to **Feature development**. Acting as **Avery Demo (TxDOT user)**. **Your feedback** `Let me filter crash reports by county`, click **Send feedback**.
   Again with `Show crash data from other states`, **Send feedback**.
2. Acting as **Casey Demo (developer)**. On FB-0001: **Feature title** `County filter on crash reports`, **Reason** `Frequent request; county is already in the data`, click **Feasible: propose it**.
3. On FB-0002: **Reason** `CRIS holds Texas crash records only.`, click **Not feasible: answer**.
4. Open FC-0001. Click **Move to approved**, then **Move to in build**, then **Move to released**. It is refused ("record how this change meets...").
5. **How does it meet the feedback?** type `Avery filtered by Travis County in the demo and found the reports.` Click **Move to released** again. Released.
6. Back on **Feature development**: both submitters see an answer in the table.

**Fallback:** `framework/screens/m1-07-feature-released.png`.

### Segment 7 (8:00 to 9:00): Training, STORY-005

**Point:** "Completed" means someone passed a short check (80%), not that they sat in a room.

**Clicks:**
1. Go to **Training**. Acting as **Sam Demo (support staff)**. **Course** `Using the Help desk`; **When (your local time)** tomorrow 09:00 (it must be in the future); click **Schedule** (TS-0001).
2. Open TS-0001, click **Mark held**. Refused: a recording is required. **Where the recording is kept** `recordings/help-desk.mp4`, click **Mark held** again.
3. Acting as **Jordan Demo (TxDOT manager)**: answer from the cheat sheet, click **Submit answers**. "Passed with 100%".
4. Acting as **Avery Demo (TxDOT user)**: **How did you take part?** `recording`, answer wrongly on purpose, **Submit answers**: "not passed yet". Then answer correctly and submit again.
   The progress table shows the completion via "recording".

**Fallback:** `framework/screens/m2-01-training-session.png`. To save time, skip Avery's wrong attempt.

### Segment 8 (9:00 to 10:00): Reporting engine, STORY-006

**Point:** A report that cannot be built to specification is refused, logged, and the missing piece is named.

**Needs:** a monitoring check from Segment 4.

**Clicks:**
1. Go to **Reporting engine**. Acting as **Taylor Demo (contract manager)**.
2. **Specification** `System performance report`, click **Generate** ("generated to SPEC-...").
3. **Specification** `Contract cost summary`, click **Generate**. "cannot meet its specification" and the page names the **TxDOT financial system**.
4. **Cause and action taken** `Read access to the TxDOT financial system requested from TxDOT IT.` Click **Mark addressed**.

**Say:** "This one needs TxDOT's help: the report needs their financial system."

**Fallback:** `framework/screens/m2-02-reporting-engine-error.png`, `m2-03-report-to-spec.png`.

### Segment 9 (10:00 to 11:00): Documents, STORY-013

**Point:** Response documents are filed, fingerprinted, access-controlled and open in under two seconds.

**Clicks:**
1. Go to **Documents**. Acting as **Morgan Demo (compliance officer)**.
2. **File** choose `technical-proposal.txt`; **Category** `Technical proposal`; click **Upload**. "DOC-0001 stored".
3. Choose `virus.exe`, **Category** `Other`, **Upload**: refused ("not accepted").
4. Acting as **Avery Demo (TxDOT user)**: open DOC-0001, click **Open the document**: "Access refused".
5. Acting as **Quinn Demo (procurement officer)**: open DOC-0001, click **Open the document**. It shows "Retrieved in ... ms" and "matches its fingerprint".
6. Point at the log at the bottom: refusal and opening both listed.

**Fallback:** `framework/screens/m2-04-documents-library.png`, `m2-05-document-opened.png`. (If time: upload a second version using **Replaces** to show version 2.)

### Segment 10 (11:00 to 12:00): Compliance, STORY-007

**Point:** The laws are in a register, each with a check; when a law changes the check re-runs at once.

**Clicks:**
1. Go to **Compliance**. Acting as **Morgan Demo (compliance officer)**.
2. Click **Run every compliance check**. "no violations found" (14 rules; some are "not applicable" with a reason).
3. **Rule** `CR-08`; **What changed** `Vendor cyber security training must now be renewed every 30 days (drill).`; **New values** `valid_days=30`; click **Apply and re-check**.
   The notice says version 2 and "fail": a violation.

**Say:** "The register is a research compilation of public sources. TxDOT legal must confirm it. It is not legal advice."
**Leave the violation showing.** It is cleared live in Segment 14.

**Fallback:** `framework/screens/m2-06-compliance-clean.png`, `m2-07-compliance-legal-update.png`.

### Segment 11 (12:00 to 13:00): Submissions, STORY-008

**Point:** A response is checked before it is stored, and a failed one is logged, not lost.

**Needs:** the closing-time fix in 1.1.

**Clicks:**
1. Go to **Submissions**. Acting as **Quinn Demo (procurement officer)**.
2. **Respondent** `Vendor A Demo`; attach one PDF to each of the four required file fields (Technical proposal, Pricing, Forms and certifications, HUB subcontracting plan); click **Record the response**. "RSP-0001 recorded".
3. **Respondent** `Vendor B Demo`; attach only **two** files; click **Record the response**. Refused: "Missing required document", and an incident is logged.
4. Redo Vendor B with all four files. "RSP-0002 recorded", and the error shows "Addressed".
5. Open RSP-0001, wait a moment: "Documents match the receipt". Click **Move to under evaluation**. Do the same for RSP-0002.

**Say:** "Euna Procurement is not connected. We need to know whether TxDOT requires submissions through it."

**Fallback:** `framework/screens/m3-01-submission-error.png`, `m3-02-response-tracking.png`. If every submission is refused as late, the closing time was not fixed: say "this is the closing-time rule working", then use screenshots for Segment 12 too.

### Segment 12 (13:00 to 14:00): Evaluation, STORY-009

**Point:** Scores are weighted, outliers are flagged, corrections keep the original, and the final ranking is archived.

**Clicks:**
1. Go to **Evaluation**. Acting as **Quinn Demo (procurement officer)**: fill every box with 8 for Vendor A and 7 for Vendor B, click **Record scores** on each sheet.
2. Acting as **Taylor Demo (contract manager)**: for Vendor A enter **1** in the first box and 8 in the rest (the "typo"), 7 everywhere for Vendor B. Click **Record scores** on each.
   A flag appears: a score more than 4 points from the others.
3. Click **Archive the evaluation**: "cannot be archived yet" (a flag is unresolved).
4. In the flag, **Corrected score** `8`, **Why** `Typed 1 instead of 8.`, click **Correct**. "original stays on record".
5. Click **Archive the evaluation**: "archived: ranking and all scores" with "Best value: Vendor A Demo". The archive row shows "verified".

**Say:** "The weights (35 / 15 / 10 / 10 / 30, price at 30%) are our proposal built from public Texas procurement examples. They are not TxDOT's."

**Fallback:** `framework/screens/m3-03-evaluation-flagged.png`, `m3-04-evaluation-ranking.png`.

### Segment 13 (14:00 to 15:00): Risk, STORY-010

**Point:** The system reads itself for problems and records each as a scored risk with an owner and a plan.

**Needs:** the outage drill from Segment 4.

**Clicks:**
1. Go to **Risk**. Acting as **Rowan Demo (risk manager)**. Click **Run a risk assessment**. The notice shows new risks and "1 logged for review".
2. Point at the heat map and the register (score 1 to 9, owner, mitigation).
3. In the open risk: **Action taken** `Drill target removed from the monitor list; component confirmed up.` Click **Mark mitigated**.
4. The assessment archive shows "verified".

**Say:** "The 1 to 9 scale is ours. TxDOT's own matrix is not known to us yet."

**Fallback:** `framework/screens/m3-05-risk-assessment.png`, `m3-06-risk-mitigated.png`. If no risk appears, go to **Monitoring**, click **Run the outage drill**, and repeat.

### Segment 14 (15:00 to 16:30): Security, STORY-011

**Point:** Only vendor staff with current TxDOT-approved cyber training may touch response documents, and a breach cannot be closed until the notice is recorded.

**Clicks:**
1. Go to **Security**. Acting as **Sage Demo (security officer)**. The table shows vendor staff as "Cleared".
2. **What happened** `Phishing email opened on a vendor administrator account`; tick **Sensitive personal information may be involved**; click **Log the breach**.
   Notice: severity-1 incident with a "Notification due by" date.
3. **Containment** `Account disabled, password reset, sessions revoked.` Click **Mark contained**.
4. In Riley's row click **Require retraining**: "clearance suspended".
5. Try **Close the breach** (with a **Cause**): refused, "record the notification". **Who was notified, and when** `Affected requesters notified by letter, 24 Nov.` Click **Record notification**. Then **Cause** `Credential phishing; MFA enforced on vendor accounts.` and **Close the breach**.
6. Go to **Documents**, acting as **Riley Demo (system administrator)**: choose `cert.pdf`, **Category** `Cyber security training records`, **Upload**. Refused: "has not completed the TxDOT-approved cyber security training", with "Complete the cyber security course on the Training page".
7. *(Retraining, about a minute; keep it brisk.)* Go to **Training**, acting as **Riley**: **Course** `Cyber security training (TxDOT-approved programme)`, **When** tomorrow 09:00, **Schedule**. Open the new session, **Where the recording is kept** `recordings/cyber.mp4`, **Mark held**. Answer the check (cheat sheet) as **Riley**, **Submit answers**; switch to **Casey Demo (developer)** and do the same.
8. Back in **Documents** as Riley, upload `cert.pdf` again: "stored".
9. Go to **Compliance** as **Morgan Demo (compliance officer)**, click **Run every compliance check**: the Segment 10 violation is gone.

**Short version if behind:** do steps 1 to 6 only, say "retraining clears it", and show `m4-02-access-blocked.png`.

**Say:** "The 365-day training period and the 60-day breach-notice period follow the cited Texas rules, but TxDOT has not confirmed them."

**Fallback:** `framework/screens/m4-01-security-breach.png`, `m4-02-access-blocked.png`.

### Segment 15 (16:30 to 17:30): Performance and user errors, STORY-014

**Point:** The system learns each component's normal speed, alerts when it slows, and turns every user mistake into a helpful suggestion.

**Clicks:**
1. Go to **Performance and errors**. Acting as **Riley Demo (system administrator)**. Click **Check now and scan** six or seven times. The table shows "Normal" once it has enough samples (5 needed).
2. Click **Run the slow-response drill**. A red notice "ALERT: Response time anomaly".
3. Go to **Support dashboard** and schedule maintenance **inside** service hours (a weekday 10:00 to 11:00, Central time). Refused, with a **Try this:** box: "Book it outside service hours, for example...".
4. Back on **Performance and errors**: the user-error log shows the refusal.

**Fallback:** `framework/screens/m4-03-user-error-suggestion.png`, `m4-04-performance-anomaly.png`. (The earlier checks from Segment 4 and the Segment 14 refusals already count; you may need fewer clicks.)

### Segment 16 (17:30 to 18:30): Incident reports, STORY-015

**Point:** Every incident gets a full report with a timeline; new reports are new versions; only named roles can read them.

**Needs:** the slow-response alert from Segment 15. Click **Check now and scan** twice on the Performance page first so the alert clears (the walk does this).

**Clicks:**
1. Go to **Incident reports**. Acting as **Morgan Demo (compliance officer)**.
2. On the "Response time anomaly" row click **Generate report**: "version 1, stored". Click again (the button now says **New version**): "version 2, stored".
3. In the Documentation table click **Open** on it: "Matches its archived hash", "Versions:", a timeline and linked risks.
4. Copy the address, switch to **Avery Demo (TxDOT user)**, reload that address: "Access refused".
5. Back on **Incident reports**: the Access log lists both the opening and the refusal.

**Say:** "TxDOT's incident management system is not connected. Reports are built from this workspace's own incidents."

**Fallback:** `framework/screens/m4-05-incident-report.png`, `m4-06-incident-access-log.png`.

### Segment 17 (18:30 to 19:30): Audit log, the closing proof

**Point:** Everything you saw is written to one log, chained by hashes; change one line and it is caught.

**Clicks:**
1. Go to **Audit log**. The green notice: "The chain is intact: all N lines match their hashes."
2. Open the browser developer console (F12, Console tab) and paste:

   ```js
   window.__saved = localStorage.getItem('cris-workspace-v1');
   const s = JSON.parse(window.__saved); s.tables.AuditEntry[3].actor = 'someone else';
   localStorage.setItem('cris-workspace-v1', JSON.stringify(s));
   ```
3. Reload. The red notice says "line 4 was changed after it was written".
4. Restore (only possible if you did not reload the page in between, because `window.__saved` is lost on reload; so copy the first line's value into a text file beforehand, or finish with **Start a new, empty demo**):

   ```js
   localStorage.setItem('cris-workspace-v1', window.__saved);
   ```

**Fallback:** `framework/screens/m1-08-audit-log.png`, `m1-09-audit-tamper-detected.png`. If the console is blocked, show the intact notice and the tamper screenshot.

### Segment 18 (19:30 to 20:00): Close

**Say:** "Sixteen stories, all verified by the Colaberry portal. Everything you saw is on synthetic data. What we need from TxDOT
is listed in the framework: confirm service levels and hours, the real list of required reports, financial-system access,
legal review of the compliance register, the real scoring criteria, whether Euna is required, their risk matrix, and
incident-system access."

---

## 5. Honest caveats to say out loud

Say these early (Segment 0) and late (Segment 18).

1. **All data is synthetic.** The ten people are invented. Nothing is connected to TxDOT.
2. **Proposed values awaiting TxDOT:**
   - Service levels **4 / 8 / 24 / 72 hours** (urgent / high / normal / low) and service hours **Mon to Fri, 6:00 to 20:00 Central**.
   - The **five report specifications** (system performance, incident log, help desk and support activity, training and cyber security completion, contract cost summary). TxDOT has not given us its list.
   - **Evaluation criteria and weights** (35 / 15 / 10 / 10 / 30). Built from public Texas procurement sources; no CRIS-specific weights are public.
   - The **risk matrix** (1 to 9, likelihood x impact). Ours, not TxDOT's.
   - The **closing time** of the demo solicitation and the four required documents.
   - The **compliance register**: 14 rules from public sources, to be confirmed by TxDOT legal. Not legal advice.
   - The **365-day** cyber-training validity and **60-day** breach-notice period (cited from Texas law, unconfirmed by TxDOT).
   - The **anomaly thresholds** (over 3 times the median, at least 50 ms above, 5 samples first). Ours.
3. **Not connected:** TxDOT financial system (REQ-011; the cost report is refused), Euna Procurement (REQ-012), TxDOT incident management system (REQ-018). CRIS itself is not reachable, so monitoring checks this demo site.
4. **Per browser:** the store and documents live in this browser only. There is no shared backend yet.
5. **"Meets the need"** (Feature development) is a recorded statement at release, not a measured outcome.
6. The Command Center "Data as of" date reflects the last portal sync.

---

## 6. Likely questions, short answers

| Question | Answer |
|---|---|
| Is it secure? | Every action is checked against the data model and written to a hash-chained audit log in the same save. Documents are fingerprinted (SHA-256) and role-checked. Vendor staff need current cyber training to touch documents. This is a demo: there are no real logins (the "Acting as" picker stands in), so real sign-in would come with a production build. |
| Where is the data kept? How long? | In this browser only (local storage and IndexedDB). Nothing leaves it. For the real system, rule CR-12 in the register covers retention under the TSLAC-approved TxDOT schedule; the demo parameter is a placeholder to be confirmed by TxDOT legal. |
| How would it connect to real TxDOT systems? | Through clear interfaces on the stand-ins: the financial system for the cost report, the incident management system for incident reports, CRIS for monitoring. Each needs TxDOT to say whether and how access can be given. Until then they stay marked "not connected". |
| And Euna Procurement? | TxDOT does use it (their RFOs require submission through it). We found no public API documentation, so submissions are tracked in the workspace. We need TxDOT to say whether submissions must flow through Euna and whether an API or export exists. |
| What does it cost? | Not part of this demo and no price is in the build. That is a Colaberry commercial discussion (Ali and Ram). |
| What is not built? | Real logins, a shared multi-user backend, any live TxDOT connection, real email or notification delivery, and TxDOT's actual rules and values (all proposals today). |
| How do we know the 16 stories are really done? | The Colaberry portal verified each one by reading the repo and a pushed commit naming the story: 16 of 16, 800 points, 50 of 50 acceptance criteria. 73 unit tests and five browser walks pass. |
| Is the compliance register legal advice? | No. It is a research compilation for TxDOT legal to confirm. |
| What happens next? | We need TxDOT's answers to the open questions, then replace the proposed values (each lives in one file) and connect the systems that can be reached. |
| Why does the demo reset? | Data is per browser. "Start a new, empty demo" on the Audit log page wipes it. |

---

## 7. If the demo machine fails: the one-page backup

**Decide within 30 seconds.** If the live site does not load or the laptop freezes, move to the backup without apology.

1. **Switch to a second device or browser** and open the live site: https://obianams04.github.io/cris-enhancement/ (workspace: `/workspace/`).
2. **If the internet is down**, run the site locally on any laptop with Node 20 or later: `node scripts/serve.mjs`, then open `http://localhost:4321/`.
3. **If the site will not run at all**, show the milestone presentations (each is a 3 to 5 minute HTML deck with charts):

| Deck | Covers | File (in the repo) | Live address |
|---|---|---|---|
| m1 | Help desk, support, monitoring, reports, features (STORY-001, 012, 002, 003, 004) | `framework/presentations/m1/index.html` | https://obianams04.github.io/cris-enhancement/framework/presentations/m1/ |
| m2 | Training, reporting engine, documents, compliance (STORY-005, 006, 013, 007) | `framework/presentations/m2/index.html` | https://obianams04.github.io/cris-enhancement/framework/presentations/m2/ |
| m3 | Submissions, evaluation, risk (STORY-008, 009, 010) | `framework/presentations/m3/index.html` | https://obianams04.github.io/cris-enhancement/framework/presentations/m3/ |
| m4 | Security, performance and errors, incident reports (STORY-011, 014, 015) | `framework/presentations/m4/index.html` | https://obianams04.github.io/cris-enhancement/framework/presentations/m4/ |

4. **Screenshots** (folder `framework/screens/`), to show in this order:

| Segment | Files |
|---|---|
| Command Center | `01-overview-real.png`, `05-systems.png`, `08-knowledge-chat.png`, `12-overview-sample.png` |
| Help desk, support | `m1-01-helpdesk-assistance.png`, `m1-02-ticket-resolved.png`, `m1-03-support-dashboard.png` |
| Monitoring, reports, features | `m1-04-monitoring-alert.png`, `m1-05-report-missing-data.png`, `m1-06-performance-report.png`, `m1-07-feature-released.png` |
| Training, reporting engine | `m2-01-training-session.png`, `m2-02-reporting-engine-error.png`, `m2-03-report-to-spec.png` |
| Documents, compliance | `m2-04-documents-library.png`, `m2-05-document-opened.png`, `m2-06-compliance-clean.png`, `m2-07-compliance-legal-update.png` |
| Submissions, evaluation, risk | `m3-01-submission-error.png`, `m3-02-response-tracking.png`, `m3-03-evaluation-flagged.png`, `m3-04-evaluation-ranking.png`, `m3-05-risk-assessment.png`, `m3-06-risk-mitigated.png` |
| Security, performance, incident reports | `m4-01-security-breach.png`, `m4-02-access-blocked.png`, `m4-03-user-error-suggestion.png`, `m4-04-performance-anomaly.png`, `m4-05-incident-report.png`, `m4-06-incident-access-log.png` |
| Audit trail | `m1-08-audit-log.png`, `m1-09-audit-tamper-detected.png` |
| Portal proof | `m1-11-portal-story-001-completed.png`, `m2-09-portal-story-007-completed.png`, `m3-08-portal-story-010-completed.png`, `m4-07-portal-story-015-completed.png` |

5. **Say:** "The live system runs the same code; these are the screenshots the browser walks took when each story passed."
6. **Last resort:** the written status is `framework/PROJECT-FRAMEWORK.md` (also on the published page). Talk through the table in its section 3.
