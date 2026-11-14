---
name: asking-for-input
description: How the Wellbeing app asks people for information - every question explains why it is being asked, with a light touch of humour, and almost nothing is mandatory. Use this skill whenever you design, build, change or review anything in this app that collects information from the user - forms, onboarding, profile fields, meal or habit logging, prompts, empty states, validation, error messages, or any wording that asks the user to enter something. Also use it when deciding whether a field should be required, and when adding a new life area. Use it even if the request only says "add a field" or "build the X screen".
---

# Asking For Input — Explain Why, Keep It Light, Force Nothing

The Wellbeing app only works if people tell it things about their life. This skill is how the app asks.

## Who is on the other side

The people using this app feel stuck. Many are tired, a bit ashamed of their habits, and wary of yet another app that wants their data. A form that demands answers without a reason feels like a clinic intake sheet, and they close it.

So the app asks the way a good friend would: it says why it wants to know, it keeps the mood light, and it takes "not now" for an answer. Every rule below follows from that.

## Rule 1: every ask carries its why

Whenever the app asks for something, the reason is on screen with the question. Not behind an info icon, not in a help page.

A good reason is:

- **True and specific.** It says what the app actually does with the answer. "We use your weight to set your protein target" is a reason. "To personalise your experience" is not.
- **About the person's benefit.** What gets better for them if they answer.
- **Short.** One sentence, two at most.
- **Honest about where the answer goes** when that would matter to the person, for example that a meal description is sent to an AI model to estimate nutrients.

If you cannot write a true, specific reason for a field, the app does not need that field. Remove it.

## Rule 2: a bit of humour, not too much

Light humour makes the ask feel human. Too much makes a health app feel like it is not taking the person seriously.

- **One light line per ask at most**, and only where it fits. A plain, warm reason beats a forced joke.
- **Joke about the app, the form, or life in general.** Never about the person's body, weight, habits, mistakes, or how stuck they are.
- **No humour on sensitive asks.** Weight, health conditions, mood and anything the person might feel judged on get a plain, kind reason.
- **No humour in errors, safety messages, or "see a professional" messages.**
- **The reason must survive if the joke is deleted.** Humour decorates the why. It never replaces it.

Examples:

| Ask | Too dry | Too much | Right |
|---|---|---|---|
| What did you eat today? | "Enter meals." | "Spill the beans! Literally, if you ate beans! We won't tell your mum!!" | "Tell us what you ate and we'll work out the protein, carbs and fat. The 4pm biscuits count too. We don't judge, we just add." |
| Activity level | "Select activity level (required)." | "Couch potato or gym rat? Be honest, we can smell lies!" | "How much you move changes how much food your body needs, so this sharpens your targets. A rough guess is fine." |
| Weight | "Weight (kg)*" | "Time to face the scales, champ!" | "Your protein target depends on your weight, so this makes your rating more accurate. Skip it if you'd rather not, and we'll use a rougher estimate." |

Notice the weight example has no joke at all. That is deliberate.

## Rule 3: optional unless truly necessary

The default for every input is optional. People add things when they feel like adding them.

**An input is necessary only when a feature cannot produce any meaningful result without it.** Logging in is necessary. A meal description is necessary to rate that meal. Almost nothing else is.

When you think a field must be required, try these first, in order:

1. **Give a rougher result without it.** Use a sensible default or a wider range, and say what the missing answer would sharpen. "This rating assumes an average build. Add your weight for a sharper one."
2. **Ask at the moment of need.** Do not collect a profile at signup "for later". Ask for the answer on the screen where it first makes a difference, when the reason is obvious.
3. **Only then require it**, and say plainly that the feature cannot work without it, and why.

Other consequences of this rule:

- **Signup asks for nothing beyond what login needs.** No profile wizard standing between the person and the app.
- **Every optional ask has a visible, guilt-free way out.** "Skip" or "Not now", the same size as the main button. No "Are you sure?" follow-up.
- **Skipping never breaks anything and never costs anything.** No lost points, no locked screens, no warning banners.
- **Do not nag.** A skipped ask can be offered again later in a natural place, such as a quest (see the `gamification` skill) or next to the result it would improve. It does not come back as a popup.
- **Accept rough answers.** Free text, approximate amounts and "about" values are welcome. Do not reject an entry for missing detail; estimate, and let the person correct it.
- **Everything entered stays editable.** People answer more freely when they know they can fix it later.

## How to build it

Make the why impossible to forget rather than relying on memory:

- **Every input is defined in one place with its reason next to it.** Whatever structure describes a field (label, type, whether it is optional) also carries the "why we ask" text. A field without that text should not be able to exist: make the reason a required property so the type checker complains.
- **`required` is off by default** in that definition, and turning it on needs a comment saying what breaks without the answer.
- **One shared component renders an ask**: question, reason, input, and the skip action for optional ones. Screens use it instead of laying out raw inputs, so the pattern stays consistent.
- **Keep the wording with the field definition**, not scattered through screens, so tone can be reviewed and adjusted in one pass.

## Before you call a screen done

- Does every ask show a true, specific reason on screen?
- Would each reason still make sense with the humour removed?
- Is there any humour on a sensitive ask, an error, or a safety message? Remove it.
- Is anything required that could instead give a rougher result, or be asked later?
- Can the person skip every optional ask in one tap, with no penalty and no guilt?
- Can they edit what they entered afterwards?

## Related

- `gamification` skill: optional asks are offered as small quests with a reward, which is how the app invites more information without forcing it.
- `docs/architecture/tech-stack.md`: the rating needs a profile (weight, age, sex, activity level, goal). Under this skill those are asked when the first rating needs them, and a rougher rating is shown if they are skipped.
