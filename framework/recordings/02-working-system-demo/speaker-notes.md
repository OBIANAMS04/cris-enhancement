# Working-system demo: speaker notes (PREP-2)

For Obi only; never shown to the audience. The live clicks and exact on-screen text are in `demo-runbook.md`.
Rule for every step: **say what to watch, then click, then say what happened.**

**Audience:** Ali Muwwakkil and Ram Katamaraja (Colaberry), then anyone who watches the recording later.
**Owner and presenter:** Obi Anamelechi Kingsley, alone, no handoffs.
**Purpose:** show one complete outcome working end to end, including the case it refuses.
**Style and theme:** the CRIS deck style (navy, amber, red tour button); plain words, no jargon.

## Timing at a glance

| Beat | Slides / screen | Time | Ends at |
|---|---|---|---|
| 1. The starting condition | Slides 1 and 2, then the empty Submissions page | 60 s | 1:00 |
| 2. The action | Vendor A, complete response | 120 s | 3:00 |
| 3. The result | RSP-0001 receipt check and status | 120 s | 5:00 |
| 4. The control and failure path | Vendor B refused, logged, resubmitted; audit log | 120 s | 7:00 |
| Reflection | Slide 7 | (Q&A starts) | |

Press **T** on the presentation to start its timer; it turns amber at 6:00 and red at 7:00.

## Slide by slide

**Slide 1: A vendor response, from inbox to evaluation (0:00 to 0:20)**
"I'm Obi. This is the Crash Records workspace I built for the TxDOT CRIS service agreement. In seven minutes I'll take
one vendor response from the moment it arrives to the moment it is ready to be scored, and I'll show you the response
it refuses." *Transition:* "Here's the job."

**Slide 2: The starting condition (0:20 to 1:00)**
"A TxDOT procurement officer receives vendor responses. Every one must arrive before the closing time with every
required document, and the officer must be able to show why any response was turned away. TxDOT's own terms say an
incomplete response is never scored. I'm going to act as Quinn, the procurement officer, on synthetic data. Watch two
places on the next screen: Responses, which is empty, and Submission errors, which says none."
*Switch to the browser.* Point at both.

**Slides 3 to 5 are the backup for the live part.** Show them only if the live demo cannot run.

**Live, beat 2: the action (1:00 to 3:00)**
- Before typing: "Vendor A has sent a complete response: the four documents the solicitation requires."
- Before attaching: "One file per slot: technical proposal, pricing, forms and certifications, HUB subcontracting plan."
- Before the click: "Watch the top of the page and the Responses table." Click **Record the response**.
- After: "Recorded, with a receipt: a fingerprint of the four files. It was checked before it was stored: on time,
  every required document, accepted file types."

**Live, beat 3: the result (3:00 to 5:00)**
- Before opening RSP-0001: "Watch for one line: whether the stored documents still match the receipt."
- After: "They match. And Tracking shows every step, read from the audit log."
- Before **Move to under evaluation**: "Now the officer moves it on. Watch the status."
- After: "Under evaluation. That is the outcome: a complete response, provably unchanged, tracked, ready to score."

**Live, beat 4: the control and failure path (5:00 to 7:00)**
- Before the click: "Now the case it must refuse. Vendor B sends two of the four documents. Watch the top of the page."
- After: "Refused. It names the two missing documents and tells the officer what to do: attach them. And it is logged:
  look, Submission errors, INC-0001, open."
- Recovery: "What does a person do next? The vendor sends the missing files while the solicitation is still open.
  Watch the error." Resubmit with all four. "Recorded, and the error now says addressed."
- Before the audit log: "And nothing is quietly changed." Open **Audit log**. "The chain is intact. The refusal is on
  the record too, next to the response that put it right."
- Close (on slide 7): "It refused an incomplete bid, said why, logged it, and let the vendor put it right. People still
  score every response, and TxDOT alone decides the award."

**Slide 7: What did the system refuse to do, and are you glad it refused?**
"It refused to store a response missing two required documents. Yes, I'm glad: storing it would have let an incomplete
bid reach scoring, which TxDOT's own terms forbid, and nobody would have known why it was missing later."
Then take questions (see `rehearsal-checklist.md`).

## Pronunciation

| Word | Say |
|---|---|
| Obi | OH-bee |
| TxDOT | Tex-Dot |
| CRIS | Chris |
| HUB (subcontracting plan) | hub, as in the word (Historically Underutilized Business) |
| Euna (Procurement) | YOO-nuh (check before the day) |
| RSP-0001 | "R-S-P one" |
| INC-0001 | "incident one" |

## Honesty lines (say them if asked; do not overclaim)

- Synthetic people and data; nothing is connected to TxDOT or to Euna Procurement.
- The four required documents and the closing time are demo settings, not the CRIS solicitation's own list.
- It runs on one laptop in the browser; there is no TxDOT server behind it.
