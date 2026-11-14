# Wellbeing check-in

Status: built in Phase 1 (web) · Last updated: 2026-11-14

## What it does

Two ways of telling the app how you feel, which answer different questions.

**The baseline ("how have the last two weeks been")** is the measurement. Five short questions give a wellbeing score from 0 to 100. The person answers it once near the start, as a quest after login, and can redo it any time. Each answer is a dated snapshot, so the app can later show the line moving. This is how the improvement half of the product will prove it worked.

**Today ("how are you right now")** is a quick entry, like logging a meal. Mood 1 to 5, energy 1 to 5, an optional one-line note. Repeatable, earns points each time, and over time its trend sits next to the area ratings.

## How it works

**The baseline uses the WHO-5 Well-Being Index**, word for word, with attribution shown on the screen. Over the last two weeks:

1. I have felt cheerful and in good spirits
2. I have felt calm and relaxed
3. I have felt active and vigorous
4. I woke up feeling fresh and rested
5. My daily life has been filled with things that interest me

Each is answered on the WHO-5 scale: all of the time (5), most of the time (4), more than half of the time (3), less than half of the time (2), some of the time (1), at no time (0). The raw total (0 to 25) is multiplied by 4 to give the 0 to 100 score. The backend computes the score from the stored answers; the app only displays it.

**Safety rule, enforced in backend code:** a score of 28 or below shows a plain message suggesting the person talk to a doctor or a professional, before anything else and with no humour. A score of 50 or below is flagged as low wellbeing in the result wording. These thresholds are the published WHO-5 cut-offs and live in the one config place with the other rule numbers.

**Today's check-in** is stored as an entry with mood, energy, the note and a timestamp. Points are awarded per entry, capped per day so it cannot be farmed, under the gamification rules.

**Both are optional.** Nothing in the app is locked behind either. The "Not sure, something's off" complaint on the first screen points to the baseline as a natural next step.

**Where the code is.** WHO-5 wording, scale, scoring and cut-offs: `shared/src/who5.ts` (with tests). Screens: `mobile/app/baseline.tsx` (one question per step, "Not now" on the first step, Back after that; the result screen) and `mobile/app/today.tsx`. API: `POST /api/baseline` and `POST /api/today` in `api/src/routes/baseline.ts` and `api/src/routes/today.ts`, tables `baseline_checkins` and `today_checkins`. The band messages live in the baseline route.

## Decisions

- **WHO-5 rather than a homemade scale** — a recognised scale makes "improved by 12 points" mean something outside this app, which matters for a product whose promise is "we'll show you it got better". Rejected: five questions in our own voice, which would match the app's tone but produce a number nobody else recognises. The wording around the scale can still sound like us.
- **WHO-5 rather than a clinical screener such as PHQ-9** — WHO-5 is positively worded and built for general populations. A depression questionnaire would make a "gray zone" app feel like a clinic and bring obligations the app is not set up for.
- **Licensing to confirm before any paid release** — the original authors' site describes WHO-5 as free to use, but the World Health Organization's own copy of the questionnaire is published under a non-commercial Creative Commons licence (CC BY-NC-SA 3.0 IGO). Fine for the Buildathon demo. Before the app is sold or carries ads, confirm permission with WHO or switch the baseline to a homemade scale.
- **Baseline and today kept separate** — the baseline is a measurement taken rarely; today's check-in is a cheap contribution that keeps the game moving. Merging them would make the measurement noisy and the daily entry heavy.
- **The score is computed by the backend** — same rule as every rating: numbers come from stored rows and code, never from the device or the AI model, so they are consistent and can be recomputed.
- **The five-area pulse was dropped** — see the "What's bugging you" doc; the complaint picker already covers it.
- **No points toast on the "professional" result** — the points are still earned, but nothing celebratory is shown on top of the "talk to a professional" message. The result screen mentions the points in one quiet sentence instead.
- **The last question does not auto-advance** — the first four move on by themselves after an answer; the fifth waits for "See my score", so the person can change their mind before submitting.

## Future

- A chart of baseline scores over time, as the headline of the improvement work.
- Reminders to redo the baseline, offered rarely and never as an obligation, in line with the gamification rules.
- Today's mood and energy trend shown next to each area's rating.
