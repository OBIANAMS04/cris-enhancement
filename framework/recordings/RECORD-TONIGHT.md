# Finishing Demo prep (23–24 November 2026)

CRIS is a Colaberry **rehearsal** case study, so the recordings are produced, not filmed: the studio in
`framework/recordings/studio/` turns each kit's speaker notes and runbook into a narrated video (OBI presents, Oge is
the co-host, in synthetic voices that are labelled on screen), with real clicks in the live workspace on synthetic data.

All videos: <https://obianams04.github.io/cris-enhancement/framework/recordings/videos/> (WebM; plays in Google
Chrome, Microsoft Edge and Firefox).

| Task | Hand-in | Status |
|---|---|---|
| PREP-1 Project introduction | Written narrative (Prepare) | Handed in 23 Nov · verified |
| PREP-2 Working-system demo | Video link (Practice): `videos/#prep-2`, 4:17 | Recorded 23 Nov, handed in |
| PREP-3 AI visual presentation | Slides link (Build) | Handed in 23 Nov · verified |
| PREP-4 Stakeholder update | Rehearsal record (Practice): `04-stakeholder-update/rehearsal-record.md` + video `videos/#prep-4`, 2:32 | Rehearsed with Cory (the portal's AI mentor) 23 Nov, handed in |
| PREP-5 Final showcase | Video link (Present & Share): `videos/#prep-5` | Recorded 23 Nov, handed in |
| PREP-6 Present at Demo Day | Staff mark it live on 24 Nov (+60) | Obi presents; the PREP-5 video is the backup |

## PREP-6 on the day (the only part that needs Obi)

1. Morning: `node scripts/serve.mjs`, open <http://localhost:4321/workspace/>, Audit log → **Reset demo** twice.
2. Open `05-final-showcase/presentation.html`, press **F** (full screen) and **T** (timer) at your first word.
3. Present from `05-final-showcase/demo-day-notes.md` (8 minutes, live proof in the middle).
4. If the live system or your voice fails, play the PREP-5 video from the videos page instead: it is the same
   showcase, narrated.

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
