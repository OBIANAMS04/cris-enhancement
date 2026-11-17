# Visual presentation: runbook (PREP-3)

**What this video is:** a 5-minute slide presentation. Every artefact it shows is already on the slides as a real
screenshot or real output, so **no live demo is needed**. Showing anything live is optional, and only in Q&A.
**Data:** synthetic only. Nothing here reaches TxDOT, Euna Procurement or any TxDOT system.

## 1. Starting state (10 minutes before you record)

1. Open `framework/recordings/03-ai-visual-presentation/presentation.html` (double-click it in File Explorer). It
   needs no server and no internet: the screenshots are inside the file.
2. Check it shows **1 / 7** and the title "A turned-away response leaves no record of why".
3. Zoom 100% (Ctrl+0). Press **F** for full screen. If the browser refuses full screen, the deck fills the window
   instead; press F or Esc to leave.
4. Hide everything else: close other tabs, hide the bookmarks bar (Ctrl+Shift+B), turn on Windows Focus / Do not
   disturb.
5. Press **T** on slide 1 when you start talking; **R** resets the timer.
6. Keys: Right/Left arrows or PageDown/PageUp move; Home/End; **C** opens the contents list.

## 2. Showing an artefact live (optional, only if asked in Q&A)

The artefacts on slides 4 and 5 can be produced live in about a minute.

| To show | Do this | You will see |
|---|---|---|
| The tests (slide 5) | In a terminal at the repo root: `node --test tests/` | Ends with `tests 73`, `pass 73`, `fail 0` (run 16 Nov 2026; takes a few seconds) |
| The receipt (slide 4) | Start the server (below), follow `../02-working-system-demo/demo-runbook.md` section 1 and beat 2, then open RSP-0001 | "Documents match the receipt" and a receipt hash. The hash will differ from 6f138e04 if the files differ; it is the files' fingerprint |
| The audit chain (slide 4) | After that, open **Audit log** in the workspace | "The chain is intact: all N lines match their hashes…" (N depends on the steps you took; it was 24 in the recorded run) |

Start the server for the workspace:
```
cd "C:\Users\obiki\Documents\AINWINTRVWSTFFS!!\CRIS-Enhancement"
node scripts/serve.mjs
```
Then open http://localhost:4321/workspace/#/submissions and pick **Quinn Demo (procurement officer)** in Acting as.

The 16-story rehearsal (`tests/demo-rehearsal.js`) is a Playwright script Claude Code runs; do not try it live.

## 3. Recovery

| If this happens | Do this |
|---|---|
| The deck opens without pictures | You opened a copy without the built-in images. Open the one in this folder; the PNGs are also in `screens/` |
| Arrow keys do nothing | Click once on the slide (not on a button) and try again; or the guided tour is open: press Esc |
| Full screen will not start | Use the fallback (the deck fills the window) or press F11 for the browser's own full screen |
| A live test run shows a failure | Do not debug on camera. Say "the recorded run is on the slide", and move on |
| Anything else | Carry on with the slides: everything the argument needs is on them |

## 4. Backup

- **Backup file:** a PDF of the deck. In the browser press Ctrl+P → Save as PDF; every slide prints on its own page
  without the buttons. Keep `CRIS-visual-presentation.pdf` on the desktop.
- **Backup video:** after one clean take, keep it as `CRIS-visual-presentation-backup.mp4`.
- **Screenshots:** `screens/` holds the real screenshots from the 16 Nov live run (the same as the PREP-2 kit):
  01 before, 03 Vendor B refused, 04 error addressed, 05 receipt verified, 06 status tracked, 07 audit chain intact.

## 5. Recording and handing in

- Record with the portal's own recorder (PREP-3 → Prepare → **Use a Studio recording**), Windows **Snipping Tool →
  Record** (Win+Shift+R) with the microphone on, or Xbox Game Bar (Win+G).
- Hand in on the portal under PREP-3: the video (or **Paste a link**), `presentation.html` and `speaker-notes.md`.
