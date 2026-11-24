# The recording studio (how the CRIS rehearsal videos are made)

CRIS is a Colaberry rehearsal case study, so the PREP videos are produced here, not filmed: the narration comes from
each kit's `speaker-notes.md` / `demo-runbook.md` (OBI presents, Oge is the co-host), the decks change slide on cue,
and the live parts are real clicks in the workspace on synthetic data. Every video says on screen that the voices are
synthetic.

| File | What it does |
|---|---|
| `plans.mjs` | What each video shows and says, step by step (PREP-1 to PREP-5). Edit the words here. |
| `stage.html` | The recording stage: the screen on top, the captions and speaker badge below, a highlight ring, title cards. |
| `tts.ps1` | Speaks each line to a WAV with the voices built into Windows (David for OBI; Zira for Oge, who is always a female voice). |
| `record.mjs` | Runs a plan in Edge, captures the tab (picture and sound), saves `../videos/<plan>.webm`. |
| `verify.mjs` | Plays a video in Google Chrome: checks length, sound and stills (`../videos/stills/`). |

Output: `framework/recordings/videos/` (WebM: VP9 video, Opus sound; plays in Chrome, Edge and Firefox), with a player
page at <https://obianams04.github.io/cris-enhancement/framework/recordings/videos/>.

## Re-record a video

1. Tools once, outside the repo: `mkdir ..\rec-tools; cd ..\rec-tools; npm i playwright fix-webm-duration`
   (no browser download is needed: it drives the installed Microsoft Edge; checks use the installed Google Chrome).
2. In the CRIS folder: `node scripts/serve.mjs` (leave it running).
3. In a second terminal: `node framework/recordings/studio/record.mjs prep-2-working-system-demo` (or any plan name in
   `plans.mjs`; no name records all of them). An Edge window opens and plays the video while it records; leave it alone.
4. Check it in Chrome: `node framework/recordings/studio/verify.mjs prep-2-working-system-demo 5 60 180`.

## Switching to natural (neural) voices

The built-in Windows voices are clear but robotic. Microsoft's natural voices come from its **Azure AI Speech**
service, which has a free tier (500,000 characters a month; all five videos use about 15,000). With your own key in
place, `record.mjs` uses the neural voices automatically (OBI: Andrew; Oge: Ava, a natural female voice) through Microsoft's official API.

1. Sign in at <https://portal.azure.com> (a free Azure account works).
2. Open <https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices>.
3. Pick your subscription, create a resource group (for example `cris-voices`), choose a region (for example
   **East US**), give it a name, and choose pricing tier **Free F0**. Press **Review + create**, then **Create**.
4. When it is deployed, open the resource, then **Keys and Endpoint**. Copy **KEY 1** and note the **Location/Region**
   (for example `eastus`).
5. In PowerShell (on your machine, not in a chat), store them for your user account:
   `setx AZURE_SPEECH_KEY "<paste KEY 1>"` and `setx AZURE_SPEECH_REGION "eastus"`.
6. Restart VS Code so new terminals see them, then re-record (step 3 above). The key stays in your environment; it is
   never written to the repo.
