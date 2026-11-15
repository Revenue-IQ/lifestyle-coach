# Profile ("About you")

Status: built in Phase 1 (web) · Last updated: 2026-11-14

## What it does

The small set of facts about a person that sharpen their ratings. It is not a signup form. After login the app offers it as a skippable "About you" quest, and every field can be left empty. Anything skipped is offered again later as a quest next to the result it would improve. Everything is editable afterwards.

## How it works

Every field is defined in one place together with its label, type, whether it is required, and the "why we ask" text shown on screen. A field without that text cannot exist.

| Field | Why we ask (shown on screen) | Required? |
|---|---|---|
| Name | "Any name you like. It doesn't have to be the one on your passport." A button offers a random one such as "Sleepy Otter". | Yes, but the random default means it never blocks anyone |
| Over 18 | "Our suggestions are written for adults. Under 18 we point you to a professional instead." | Yes, but only when the first suggestion is about to be shown |
| Age | "Sleep and nutrition ranges shift with age, so this sharpens your rating." | No |
| Sex | "Protein and iron targets differ. It also lets us check for pregnancy before giving diet advice." | No |
| Weight | "Your protein target is per kilo of body weight. Skip it and we use an average build." No humour on this ask. | No |
| Activity level | "How much you move changes how much food your body needs. A rough guess is fine." | No. Temporary: removed once the Movement area can derive it |

Not collected anywhere: real name, email address, date of birth, height. Login identity (the email used for the Clerk code) stays inside Clerk; the app's database stores only the Clerk user id.

Skipping a field never costs points, locks a screen or shows a warning. A rating produced without a field says what the missing answer would sharpen, for example "This assumes an average build. Add your weight for a sharper rating." Each field's `ifSkipped` text is already on the About you screen under the input.

**Where the code is.** Every field, with its label, type, `why` and `ifSkipped` text: `shared/src/fields.ts`. The `why` property is required by the type. The one component that renders an ask: `mobile/src/components/Ask.tsx`. Screens: `mobile/app/name.tsx` (Name quest, with the random-name button from `shared/src/names.ts`) and `mobile/app/about-you.tsx` (one optional field per step, Save and Skip the same size). API: `PATCH /api/profile` in `api/src/routes/profile.ts`, columns on `users`. Every field filled in for the first time earns points once; editing never removes any.

**Over 18, and two more gates, are asked before the first coach session** (Phase 3). "Are you 18 or over?" for every area, "Pregnant or breastfeeding?" before the Diet coach, and an optional "anything the coach should know" line stored as `conditions`. Defined in `GATE_FIELDS` in `shared/src/fields.ts`, asked once on the coach screen, stored on the profile. See `docs/features/coach.md`.

## Decisions

- **A skippable quest after login, not a signup step** — the project rule is that signup asks for nothing beyond what login needs, and people who feel stuck close intake forms. Rejected: collecting the profile up front because "we need it to figure out anything". The app gives a rougher result without it and asks at the moment of need.
- **"Over 18" as a yes/no, separate from age** — the safety rule in the tech-stack doc needs a definite answer, but exact age is sensitive and many people will skip it. One yes/no is cheap and honest, and it is asked only when it first matters.
- **Name, not alias** — the label is "Name" with a reason that makes clear any name will do. The owner's choice; "alias" sounded like a form field.
- **A random-name button** — makes the only truly required field a one-tap step, and fits the playful tone.
- **No real name, email or date of birth** — the owner's decision. None are needed for anything the app does. The email cannot be removed from login itself because Clerk needs an identifier, so it is hidden rather than absent.
- **No height** — only needed for a calorie estimate, which the diet rating does not do. Add it if a calorie estimate is ever wanted.
- **Activity level kept for now, marked temporary** — the diet rating needs it before the Movement area exists. Once movement is logged, the app derives it and stops asking, so the same thing is never asked twice.
- **"Goal" dropped** — replaced by the "What's bugging you" screen, which is more useful for working out where to look.

- **One field per step on About you, not a single form** — gives every optional ask its own Skip at full size, and keeps the reason next to the one question being asked. Rejected: all four fields on one screen with one Save, which reads like an intake form.
- **The Name quest is separate from About you** — it is the only required field, it has its own one-tap answer, and the home greeting changes the moment it is saved, which is a small reward in itself.

## Future

- Remove the activity level field when the Movement area can supply it.
- Pregnancy and health-condition questions, asked plainly at the moment a diet suggestion is about to be shown, as safety gates (phase to be decided).
