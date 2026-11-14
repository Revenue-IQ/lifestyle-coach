# What's bugging you

Status: built in Phase 1 (web) · Last updated: 2026-11-14

## What it does

The first screen a person sees, before any login. It asks one question: "What's bugging you?" The person picks any number of complaints from a short list, can add a line in their own words, and immediately gets a card called "Where to look first" that lights up the life areas most often behind those complaints. Only then does the app offer to save the result, which is where login happens.

This screen is the hook. The person gets something back before the app asks anything of them.

## How it works

**The complaint list.** Fixed, around ten items, each phrased the way a person would say it:

| Complaint | Looks first at | Also at |
|---|---|---|
| Tired all the time | Sleep | Diet, Movement |
| Trouble falling asleep | Sleep | Emotions |
| Wake up tired | Sleep | Diet |
| Bloated or stomach trouble | Gut | Diet |
| Snacking I can't stop | Diet | Sleep, Emotions |
| Low mood | Emotions | Sleep, Movement |
| Anxious or wound up | Emotions | Sleep, Gut |
| No energy to move | Movement | Diet, Sleep |
| Brain fog, can't focus | Sleep | Diet, Gut |
| Not sure, something's off | (none) | invites the baseline check-in instead |

**The map.** Each complaint gives 2 points to its first area and 1 point to each "also" area. The card ranks the five areas by total and shows the top ones lit, with the complaints that lit them. "Not sure" lights nothing and points to the wellbeing check-in as the next step. The mapping is a plain table in the app code for Phase 1, so the card works with no backend and no AI call.

**Free text.** One optional line, "in your own words, what feels off". Stored as written. Later phases may send it to the AI model to extract themes; it is never turned into a score.

**Saving.** The answers live on the device until the person creates an account. On "Save this and keep going" the app opens Clerk login (email code). After login the answers are sent to the backend, stored with a date, and the person's first points are awarded for them. Closing the app at the login screen loses nothing.

**Repeatable.** The person can answer again later ("Answer again" on the home screen). Each answer is a dated snapshot, so the app can show how the complaints change over time.

**Where the code is.** The list and the mapping: `shared/src/complaints.ts` (with tests). The screens: `mobile/app/index.tsx` and `mobile/app/where-to-look.tsx`; the card itself is `mobile/src/components/AreaCard.tsx`. Pre-login answers: `mobile/src/lib/pending.ts`, flushed by `mobile/app/home.tsx`. API: `POST /api/complaints` and `GET /api/complaints` in `api/src/routes/complaints.ts`, table `complaint_snapshots`.

**Behaviour details settled while building:**

- "Not sure, something's off" stands alone: picking it clears the other chips, and picking any other chip clears it.
- The Continue button needs at least one chip or a line of text; the API enforces the same rule.
- A signed-in person who has already answered is sent from the first screen to home, unless they came to answer again.
- If sending the saved answers fails after sign-in, nothing is lost: they stay on the device and home offers a retry.

## Decisions

- **Before login, not after** — people who feel stuck are wary of apps that want their data first. Showing a result before asking for anything is the hook, and it follows the project rule that signup asks for nothing beyond login.
- **A pick list, not a text box** — picking is faster than writing and gives the moment of recognition ("that's me"). Free text is still there for whatever the list misses.
- **A fixed mapping, not an AI call** — the card must appear instantly and work before any account exists. A static table does that and keeps the result identical every time. Rejected for Phase 1: asking the AI model to map complaints to areas, which would vary between runs and need a backend call before login. The mapping can move into the knowledge base later without changing the screen.
- **"Where to look first", not "root cause"** — the app can show which areas most likely contribute. It cannot diagnose a cause, and the wording must not promise one, both for safety and because the audience includes people already struggling.
- **This replaces the "goal" profile field** from the tech-stack doc. A complaint is more useful than a goal for working out where to look, and it maps directly onto the five life areas.
- **A five-area pulse was considered and dropped** — asking "how is your sleep, gut, mood..." after the complaint picker would ask the same thing twice.
- **Answers are sent from the home screen, not the sign-in screen** — with Clerk, sign-in ends in a redirect to home, so home is the one place that always runs after login whichever sign-in is in use. A first fetch of the home data that is still in flight when the answers are saved is cancelled and refetched, otherwise it would show the pre-save points.

## Future

- Move the complaint-to-area mapping into the knowledge base once it exists, so it can be tuned without an app release.
- Send the free text to the AI model to extract themes that the list missed (phase to be decided).
- Use the dated snapshots to show "what's changed since you started" as part of the improvement work.
