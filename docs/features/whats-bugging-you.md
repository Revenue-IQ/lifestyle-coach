# What's bugging you

Status: built in Phase 1 (web), two rounds in Phase 4 · Last updated: 2026-11-15

## What it does

The first screens a person sees, before any login. Two quick rounds of cards: "How have you been feeling?" then "What are your days like?" The person taps whatever fits, can add a line in their own words, and immediately gets a card called "Where to look first" that lights up the life areas most often behind those answers. Only then does the app offer to save the result, which is where login happens.

This screen is the hook. The person gets something back before the app asks anything of them.

## How it works

**Two rounds of cards (since 2026-11-15, Phase 4).** Round one, "How have you been feeling?", is outcomes. Round two, "What are your days like?", is the levers. Tap any number in each, zero included; round one also has a "Not sure, something's just off" link that stands alone; round two carries the free-text line. Nothing picked and nothing written is saved as "not sure". The list came from a teammate's cards.json; the text is theirs, the mapping below is ours.

| Round 1: how have you been feeling? | Looks first at | Also at |
|---|---|---|
| Tired all the time | Sleep | Food, Movement |
| Can't sleep well | Sleep | Movement |
| Stressed or worried a lot | Sleep | Movement, Social |
| Hard to focus | Sleep | Food |
| Bloated or upset stomach | Gut | Food |
| Feeling low | Social | Sleep, Movement |
| Nothing feels fun anymore | Social | Movement, Sleep |
| Feeling lonely | Social | Movement |
| Easily annoyed | Sleep | Social |
| Dread going to work | Social | Sleep, Movement |
| Not sure, something's just off | (none) | invites the two-week check-in |

| Round 2: what are your days like? | Looks first at | Also at |
|---|---|---|
| On my phone late at night | Sleep | |
| Sitting most of the day | Movement | Sleep |
| Skip meals or eat late | Food | Gut, Sleep |
| Eat in a rush or at my desk | Gut | Food |
| Lots of coffee or sugar | Food | Sleep |
| Work never really stops | Sleep | Social, Movement |
| No time for myself | Movement | Social, Sleep |
| Rarely see friends | Social | |
| Hardly get outside | Movement | Sleep |
| I live for the weekend | Social | Movement |
| A drink helps me relax | Sleep | Gut |

**The map.** Each card gives 2 points to its first area and 1 to each "also" area. Ties break in the start order Sleep, Food, Gut, Movement, Social, which is also how home orders equal rows. The pre-login card shows the top three lit areas with the cards that lit them. On home, every area with at least one card sits under "Worth a look", ranked, and the first row wears "Good place to start". The mapping is a plain table in shared code, so the card works with no backend and no AI call.

**Flags.** Two cards carry a flag beyond their mapping. "Feeling low" and "Nothing feels fun anymore" (flag `mood`) put a plain support notice on the result screen (low mood is common and worth taking seriously; more than two weeks means a doctor or therapist; 988 if things feel heavier), move the two-week check-in to the top of home with its reason until it is done, and tell the coach, which suggests the check-in once if it is missing, or mentions professional support alongside its step when the WHO-5 score is in the low band. "Bloated or upset stomach" (flag `gut`) gives the Gut coach a standing line: ongoing, painful or with other symptoms means a doctor first. "A drink helps me relax" is mapped and nothing more; no frequency question (see Decisions).

**The original list** (Phase 1: Tired all the time, Trouble falling asleep, Wake up tired, Bloated or stomach trouble, Snacking I can't stop, Low mood, Anxious or wound up, No energy to move, Brain fog, Mostly on my own) is kept in the table as hidden cards, so answers already stored keep their picture. They are no longer offered.

**Free text.** One optional line on round two, "in your own words, what feels off". Stored as written, never scored. It is crisis-checked (2026-11-14): if it carries crisis language, the result screen shows a plain notice with resources before the card, no humour, and the same notice sits at the top of home while those words are the latest answer.

**Saving.** The answers live on the device until the person creates an account. On "Save this and keep going" the app opens sign-in. After login the answers are sent to the backend, stored with a date, and the person's first points are awarded for them. Closing the app at the login screen loses nothing. A failed save shows its error under the buttons and keeps the answers (fixed 2026-11-15: it used to throw into Expo's red overlay).

**Repeatable.** The person can answer again later ("What's bugging you · change" in the home screen's Worth a look header). Each answer is a dated snapshot.

**Where the code is.** The cards, rounds, mapping and flags: `shared/src/complaints.ts` (with tests). The screens: `mobile/app/index.tsx` (both rounds) and `mobile/app/where-to-look.tsx`; the card itself is `mobile/src/components/AreaCard.tsx`. Pre-login answers: `mobile/src/lib/pending.ts`, flushed by `mobile/app/home.tsx`. API: `POST /api/complaints` and `GET /api/complaints` in `api/src/routes/complaints.ts`, table `complaint_snapshots`; the home ordering and the start badge in `api/src/routes/areas.ts`.

**Behaviour details settled while building:**

- "Not sure" stands alone: picking it clears the other cards, and picking any other card clears it. Since 2026-11-15 it is a full-width chip under the grid, the same weight as the others: as a text link it looked like a footnote, and for many people it is the truest answer.
- A signed-in person who has already answered is sent from the first screen to home, unless they came to answer again.
- If sending the saved answers fails after sign-in, nothing is lost: they stay on the device and home offers a retry.

## Decisions

- **Two rounds, feelings then days (2026-11-15)** — a teammate proposed the split. Outcomes and habits were mixed in the old list; habits map onto the areas and the questionnaire gaps far more directly, so the second round gives the card better evidence than anything before. Each round stays skippable.
- **Weighted mapping and a top-three card, not "flag everything equally"** — the proposal flagged every area with one card and ordered them in a fixed list. Ordering by what the person actually picked is the point of the card; the fixed order survives as the tiebreak and as the "Good place to start" badge.
- **Downtime folded into existing areas, not added** — eight of the 21 cards pointed at a sixth area, Downtime, for stress and work pressure. A real area needs a questionnaire, a dozen sourced notes, coach tags and tests, so for now those cards point at the levers behind stress (sleep first, then movement and social contact). The cards are the evidence for Downtime as the next area; see Future.
- **Low mood is a nudge, not a crisis line** — the proposal showed 988 for a single "Feeling low" tap. That would alarm exactly the people the app is for. The notice names the two-week check-in as the next step and 988 only for "heavier than that"; crisis language in the free text still gets the crisis notice.
- **988 first, finder second (US-only for now)** — decided 2026-11-15. The country-neutral helpline finder stays in every crisis message for anyone outside the US.
- **No alcohol frequency question** — asking how often someone drinks and acting on the answer is a screening instrument, which is the medical territory the coach stays out of. The card is mapped to sleep and gut and the notes do the talking.

- **Before login, not after** — people who feel stuck are wary of apps that want their data first. Showing a result before asking for anything is the hook, and it follows the project rule that signup asks for nothing beyond login.
- **A pick list, not a text box** — picking is faster than writing and gives the moment of recognition ("that's me"). Free text is still there for whatever the list misses.
- **A fixed mapping, not an AI call** — the card must appear instantly and work before any account exists. A static table does that and keeps the result identical every time. Rejected for Phase 1: asking the AI model to map complaints to areas, which would vary between runs and need a backend call before login. The mapping can move into the knowledge base later without changing the screen.
- **"Where to look first", not "root cause"** — the app can show which areas most likely contribute. It cannot diagnose a cause, and the wording must not promise one, both for safety and because the audience includes people already struggling.
- **This replaces the "goal" profile field** from the tech-stack doc. A complaint is more useful than a goal for working out where to look, and it maps directly onto the five life areas.
- **A five-area pulse was considered and dropped** — asking "how is your sleep, gut, mood..." after the complaint picker would ask the same thing twice.
- **Answers are sent from the home screen, not the sign-in screen** — with Clerk, sign-in ends in a redirect to home, so home is the one place that always runs after login whichever sign-in is in use. A first fetch of the home data that is still in flight when the answers are saved is cancelled and refetched, otherwise it would show the pre-save points.

## Future

- **Downtime as a sixth area.** Stress, worry, work that never stops, no time for oneself, living for the weekend: the most common complaints in this audience have no area of their own. Needs a questionnaire, notes with sources, coach tags, a colour and tests, then the cards above move their first pointer to it.
- Move the complaint-to-area mapping into the knowledge base once it exists, so it can be tuned without an app release.
- Send the free text to the AI model to extract themes that the list missed (phase to be decided).
- Use the dated snapshots to show "what's changed since you started" as part of the improvement work.
