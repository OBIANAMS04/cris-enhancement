# Demo prep: finished (24 November 2026)

CRIS is a Colaberry **rehearsal** case study, so the recordings are produced, not filmed: the studio in
`framework/recordings/studio/` turns each kit's speaker notes and runbook into a narrated video (OBI presents, Oge is
the co-host (always a female voice), in synthetic voices that are labelled on screen), with real clicks in the live workspace on synthetic data.

All videos: <https://obianams04.github.io/cris-enhancement/framework/recordings/videos/> (WebM; plays in Google
Chrome, Microsoft Edge and Firefox).

| Task | Video | Status on the portal (24 Nov) |
|---|---|---|
| PREP-1 Project introduction | 1:22 | Complete; take in its practice room |
| PREP-2 Working-system demo | 4:18 | Complete; take in its practice room |
| PREP-3 AI visual presentation | 4:48 | Complete; take in its practice room |
| PREP-4 Stakeholder update | 2:32 | Complete; take handed in (with the rehearsal record, Cory the AI mentor, labelled) |
| PREP-5 Final showcase | 7:26 | Complete (video link) |
| PREP-6 Present at Demo Day | 10:04: the showcase, then five audience questions | Take in its practice room; staff mark it (+60) |

21 of 22 portal tasks are complete. There is no live presentation: CRIS is a rehearsal, so PREP-6 is produced from
the kit like the others (`05-final-showcase/demo-day-notes.md` and the five answers in `rehearsal-checklist.md`).

## How a video reaches the portal

Each practice room is a private Zoom meeting that the portal records. `rec-tools/zoom-record.mjs` (outside the repo)
joins it in Chrome with no microphone or camera, shares only the player tab (`studio/player.html?v=<name>`) with its
sound, plays the video to the end and leaves; the take appears in the task within about half an hour.
Never launch Chrome with `--use-fake-ui-for-media-stream` for this: it shares the whole screen.

## Filling the other portfolio slots (Obi, by hand)

Each PREP task has its own portfolio of seven slots (one per presentation type), filled only by takes recorded in
**that task's** practice room. On 24 Nov Zoom began refusing automated joins ("Automated bots aren't allowed to join
this meeting"), so the remaining slots need a person to join. One take is about the video's length plus a minute.

1. Open the task in the portal, for example
   <https://enterprise.colaberry.ai/portal/projects/workspace/a563218c-c3a4-433c-8ed7-4e8e0573f59c/PREP-1>, go to
   **Step 4 Practice**, and press **Join** (or **Launch**). Join from the browser, with microphone and camera off.
2. In another Chrome tab, open the player for the video you want, for example
   <https://obianams04.github.io/cris-enhancement/framework/recordings/studio/player.html?v=prep-2-working-system-demo>.
3. Wait until Zoom shows **REC**. Then **Share** → **Chrome Tab** → pick the tab titled **CRIS recording**, tick
   **Share tab audio**, press **Share**.
4. Click the player (or press Space). When it says **Finished**, press **Stop Share**, then **Leave**.
5. Wait a minute, then do the next video in the same room. Tell Claude when done: Claude sets each take's type.

| Room (task) | Already filled | Videos still to play (`?v=` name) |
|---|---|---|
| PREP-1 | Project introduction | prep-2-working-system-demo, prep-3-ai-visual-presentation, prep-4-stakeholder-update, prep-5-final-showcase, prep-arch-architecture-review, prep-handoff-client-handoff |
| PREP-2 | Working-system demo | prep-1-project-introduction, prep-3-…, prep-4-…, prep-5-…, prep-arch-…, prep-handoff-… |
| PREP-3 | AI visual presentation | prep-1-…, prep-2-…, prep-4-…, prep-5-…, prep-arch-…, prep-handoff-… |
| PREP-4 | Stakeholder update | prep-1-…, prep-2-…, prep-3-…, prep-5-…, prep-arch-…, prep-handoff-… |
| PREP-5 | Final showcase (clean take) | prep-1-…, prep-2-…, prep-3-…, prep-4-…, prep-arch-…, prep-handoff-… |
| PREP-6 | Final showcase (Demo Day) | prep-1-…, prep-2-…, prep-3-…, prep-4-…, prep-arch-…, prep-handoff-… |

Each empty slot says "+30 pts the first time". If time is short, play the two types never recorded anywhere
(Architecture review and Client handoff) first. The SSS build's videos are `sss-…` names
(see the videos page); its rooms only open while SSS is the active build, and CRIS must be made active again
afterwards (Projects → CRIS card → Open build).

## Re-recording

See `studio/README.md`: one command per video, and how to switch to Microsoft's natural (neural) voices with your own
free Azure AI Speech key.

## Settled for the rehearsal (no need to ask anyone)

- CRIS is a Colaberry rehearsal case study: TxDOT is not consulted. Open points are **working assumptions** from
  TxDOT's published terms, labelled on screen and kept one file each.
- PREP-4 decision for Ali: **A**, accept the assumptions and show the evaluation labelled as proposals.
- PREP-5 decision: **A**, accept the case study as complete; time saved stays "not measured yet".
- Hosting cost: none (static site, no server, no database). Pricing is not raised.
- The reflection answers in each kit are final.
