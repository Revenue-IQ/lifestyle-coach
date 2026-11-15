# Inner Weather demo video: storyboard

Status: first render 2026-11-15, cut to 1 min 53 s with a sound loop the same day · `inner-weather-demo.mp4` (1920×1080, 30 fps, H.264, AAC stereo, 1 min 53 s)

The video walks through every user-facing part of the app in the order a person meets it, recorded from the local dev build in a phone-sized browser, with one short text bubble at a time saying what each part is. No narration; a light synthesized loop underneath. This file is the storyboard in words; `record.mjs` is the same storyboard as code, and the two should be changed together.

## How to re-render

Needs the API on 8787 and the web app on 8081 running with `AUTH_MODE=dev` (the dev sign-in), `psql` on the path, and `ffmpeg`/`ffprobe` (`brew install ffmpeg`). Nothing here reads `api/.env`.

```bash
cd docs/demo && npm install && npx playwright install chromium
```

```bash
cd docs/demo && node record.mjs
```

```bash
cd docs/demo && node compose.mjs
```

The cards use the brand files in `mobile/assets/brand/` (see `docs/architecture/brand.md`); after the mark changes, `node record.mjs --assets-only && node compose.mjs` redraws them with no recording. `record.mjs` deletes and recreates the demo account (`otter@example.com` in the dev sign-in; `DEMO_EMAIL` overrides it) so the first-session flow is real every time, records `build/screen.webm`, writes `build/timeline.json` with when each scene starts and ends, and draws the title card, closing card, phone frame and one PNG per bubble with the app's own typeface (Geist, from `node_modules`). `compose.mjs` lays it all out with ffmpeg and writes the MP4 next to this file. `build/` is ignored by git.

**It makes two live Gemini calls**: the coach's opening message and one reply. If the reply asks a question instead of proposing a step, the script sends one more line ("Yes, please add that as my step."), a third call. The count is printed at the end. Everything else is code with no model involved.

**Shortening without re-recording.** `edits.json` next to the scripts tells `compose.mjs` what to leave out of the recording: `drop` lists scene ids taken out whole, `trim` shaves seconds off the start or end of a scene's footage, and `title` / `closing` set the card lengths. A join where the screen visibly changes (a dropped scene, a cut-off start) gets the same white dip as a change of flow; the static tail of a scene is joined without one. The bubbles move with the footage. `--no-edits` renders the whole recording (3 min 25 s).

The current edit brings the 3 min 25 s recording to 1 min 53 s. The owner asked for about a minute and a half; at 1.25x that was 1 min 31 s but too quick to follow, so the footage runs at normal speed and the cuts carry the saving. Dropped whole: the two-week check-in (10, 11), the Today check-in (12), "First points, straight away" (6), "Your picture so far" (13), "Everything else waits quietly" (16) and "It already knows your rating" (22). The Sleep questionnaire shows two answers instead of seven: `cuts` jumps from the third question to the last one answered. The still start of the Name, About you and Skip scenes and the still tail of almost every scene are trimmed, and the cards are 2.5 s and 4.5 s. `speed` is 1; 1.25 brings it to 1 min 31 s if that is ever wanted. The recording still includes everything, so the home screen's "Two weeks" pill shows a score, and `--no-edits` gives the full version.

**Sound.** `audio` in `edits.json` picks the bed. `beat` (the default) is made by ffmpeg itself from one expression, so it needs no file and no licence: a plucked arpeggio up and down C, A minor, F and G at 104 BPM, a round bass every two beats, a soft kick on one and three, a quiet hi-hat on the eighths and a faint pad, with a short echo for room. `drone` is the first, slower version (a low G and D with a bowl strike every 22 seconds), kept because it was the owner's first ask before "something happening" replaced it. A path to a music file uses that file instead, looped. Every option is levelled to -19 LUFS, fades in over 1.5 s and out over the last 4 s, and is cut at the picture's length. `none` leaves the video silent.

**Replacing part of the footage.** `node record.mjs --retake <scene-id>` re-records the opening scenes up to that one into `build/retake.webm`, keeping the same holds so the scene starts match the original (it warns if any drifts more than 0.3 s), without touching the account or the main recording. `"retake": { "clip": "build/retake.webm", "until": 24.0 }` in `edits.json` then makes `compose.mjs` take everything before that recorded second from the re-take and everything after from the original. The current video uses a re-take of scenes 1 to 4 (recorded 2026-11-15 after the brand header landed on the first page), spliced at the start of the sign-in scene, where the unchanged "where to look" page is on screen in both takes. The sign-in page's own small lockup is not in the video: that scene is original footage, as asked.

Useful while editing:

- `node record.mjs --stop-before coach` records everything up to the coach with no model call.
- `node record.mjs --only steps` plants a step for the demo account and records only the step ladder.
- `node record.mjs --assets-only` redraws the bubbles and cards from the last `build/timeline.json` (edit a bubble's words or cut there, then run `compose.mjs` again, no re-recording).
- `node compose.mjs --out build/try.mp4` writes somewhere else; `--preview 12` renders only the first 12 seconds, quickly.

## Style rules

- One bubble on screen at a time, 3 to 8 words, no emoji, no exclamation marks. It fades in a quarter second after its scene starts and out a quarter second before it ends.
- The sound has a pulse but no melody line that competes with the bubbles: a repeating arpeggio, under the picture, never on top of it.
- One typeface (Geist, the app's), paper background (`#FBF8F3`), the phone recording at 1:1 in a rounded frame with a soft shadow, bubbles in white beside it. Plenty of empty space.
- Cuts between flows are a short dip to white. Inside a flow the screen just changes, as it does for a person using the app.
- The mouse is not shown. Taps read as the screen responding; typing is shown key by key.
- The words in the bubbles follow the product's own: "worth a look", "where to look first, not a verdict", "nothing is ever taken away".

## Layout

1920×1080 canvas. Phone recording 430×932 at (580, 74). Bubbles left-aligned at x = 1070, vertically centred on y = 540, at most 620 px wide. All of it is `LAYOUT` at the top of `record.mjs`.

## Scenes

Title card, 4.5 s recorded, 2.5 s in the cut: the brand mark (the sun clearing a horizon, 160 px) above **Inner Weather** / For people who feel stuck and want to know where to look first.

| # | Flow | On screen | Bubble | Hold |
|---|---|---|---|---|
| 1 | What's bugging you | Round one, "How have you been feeling?", under the brand header (mark, name, tagline, hairline) | It starts with how you feel | 4.5 s |
| 2 | | Taps Tired all the time, Can't sleep well, Stressed or worried a lot | Tap whatever fits. No account yet. | 6 s |
| 3 | | Next; round two, taps On my phone late at night, Lots of coffee or sugar, Work never really stops | Then what your days are like | 6.5 s |
| 4 | | Show me where to look; the "Where to look first" card (Sleep, Downtime, ...) | Where to look first, not a verdict | 7 s |
| 5 | Sign in | Save this and keep going; types the email on the dev sign-in | Only an email. No real name. | 6.5 s |
| 6 | | Continue; home with the +20 points banner. *Recorded, cut.* | First points, straight away | 5.5 s |
| 7 | Name, About you | Name pill; Pick one for me; Save; home greets by name | Any name you like | 6.5 s |
| 8 | | About you pill; age typed; Save | Every question says why it asks | 6.5 s |
| 9 | | Skip, Skip, Skip and finish; back home | Skipping costs nothing | 6 s |
| 10 | Two-week check-in | Two weeks pill; the five WHO-5 questions answered. *Recorded, cut from the current video by `edits.json`.* | Five questions about the last two weeks | 9 s |
| 11 | | See my score; "Your starting line", 52 out of 100. *Recorded, cut.* | Your starting line, out of 100 | 6.5 s |
| 12 | Today | Home; Right now pill; mood 4, energy 3; Save. *Recorded, cut.* | Two taps for today | 7 s |
| 13 | Home | Home at rest. *Recorded, cut.* | Your picture so far | 5 s |
| 14 | | Header: level, points, next level | Points and levels. No streaks. | 5 s |
| 15 | | Scrolls to Worth a look (Sleep, Good place to start) | Worth a look comes first | 5.5 s |
| 16 | | Scrolls to Everything else. *Recorded, cut.* | Everything else waits quietly | 5 s |
| 17 | Rating | Sleep row; area page, "Not rated yet"; Rate it · +25 points | Each area has a short questionnaire | 6 s |
| 18 | | Seven questions answered, "Phone or screen in bed?" skipped on purpose. *The cut shows the first two and the last.* | Honest answers, any of them skippable | 10 s |
| 19 | | See my rating; 44/100, needs attention, "Where the points went" with four gaps; level-up banner | A rating out of 100, gaps named | 8 s |
| 20 | Coach | Open Sleep; the area page with its gaps; Talk it through with the coach; the gates ("Are you 18 or over?"), Yes | Two safety questions, asked once | 6.5 s |
| 21 | | Continue; the coach's opening message, written from the rating (live call 1) | The coach speaks first | 9 s |
| 22 | | The same message, which names the 44 and the gaps. *Recorded, cut.* | It already knows your rating | 5.5 s |
| 23 | | Types "Caffeine, probably. I have coffee most afternoons. Can you add a step for stopping it after lunch?"; Send | Reply in your own words | 6 s |
| 24 | | The reply with "A step to try: Last coffee before 2pm" (live call 2) | One small step, not a plan | 4.5 s |
| 25 | | The source link under the reply (Sleep Foundation sleep hygiene) | Sources under every message | 4 s |
| 26 | | Make it my step; "This is your step now." | One tap makes it your step | 6 s |
| 27 | Steps | Back; "Your step right now" on the area page; Did it · +10, twice | Did it. Counted, never dated. | 9 s |
| 28 | | Third Did it; "You did it 3 times. Did it help?"; A bit | After three, one honest question | 6.5 s |
| 29 | | Keep going · 7 times; the card at 0 of 7, rung 2 | Three, then seven, then twenty-one | 6.5 s |
| 30 | | Home; "Your steps" above the areas, Sleep now 44 in Worth a look | Nothing is ever taken away | 6 s |

Closing card, 7 s recorded, 4.5 s in the cut: **The rules it keeps** / Crisis language gets a plain notice, not a coach reply. / Habits only, from sourced notes. / Nothing is ever taken away. / the lockup (`mobile/assets/brand/lockup.png`, 450 px wide) / Not therapy or a diagnosis. In crisis? Call or text 988.

"Hold" is the least a scene lasts; a scene that waits on the coach runs as long as the call takes.

## Decisions

- **A fresh account, not the seeded one** — the seeded `second@example.com` already has a rating, a rung-two step and a finished conversation, so "Make it my step" and the first rung could not be shown on it. A new account makes the whole first session real, at the cost of two model calls per render. Resuming an existing conversation makes no call, which is why nothing is re-opened.
- **The coach is live, not faked** — the demo shows what the product does. The reply in scene 23 is written to make a proposal likely in one turn (a clear lever, and "add a step", which the API recognises as an explicit ask); the script allows one more turn if the coach asks a question first.
- **Screen recording, not stitched screenshots** — the app answers taps at once, and that is the feel to show. Playwright's own recording, synced with a black-to-white flash at the start that `compose.mjs` finds with `blackdetect`, so the bubble times are the real times.
- **Bubbles beside the phone, not over it** — nothing on the screen is ever covered, and the screen stays the size of a real phone.
- **The closing card's first rule became its footer line (2026-11-15)** — once the lockup took the place of the name, the app's own footer line went under it, and "Not therapy or a diagnosis" no longer needed to be a rule line as well.
- **The crisis rule is a card, not a recording** — typing crisis language into the demo would put those words on screen for no reason. The closing card states the rule; the free-text notice and the coach's plain notice are described in `docs/features/coach.md`.
- **The dev sign-in card is left in** — it says plainly that any email works and nothing is sent, which is true of the local build the demo is recorded against. Record against a Clerk build if a production-looking sign-in is wanted.

## Known limits

- Recorded against the local dev build; the live copy at the production address is not in the video.
- The coach's words differ between renders. The storyboard quotes one render.
- The "Keep going" rung is demonstrated by logging the step three times in a minute; in real use the second and third logs of the same day earn no points, and the banner says so.
