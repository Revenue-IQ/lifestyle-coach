---
name: gamification
description: How the Wellbeing app keeps people engaged - rewards for adding information, points, quests, levels, badges and visible progress, with no daily streaks - and the rules that keep the game kind. Use this skill whenever you design, build, change or review any screen, flow, feature, notification or wording in this app, because the whole app is meant to feel like a game, not only the parts labelled as one. Use it especially for anything involving points, rewards, streak-like ideas, badges, levels, progress, celebrations, reminders, the home screen, or what happens after the user adds information. Also use it when adding a new life area or a new kind of entry, to decide what it rewards.
---

# Gamification — Make Showing Up Feel Good

The whole Wellbeing app should feel like a game the person is quietly winning. This skill is how.

## Why the game exists, and how it can go wrong

The people using this app feel stuck. What gets someone unstuck is a run of small steps, and small steps are easy to skip because nothing seems to happen when you take one. The game's job is to make each small step visibly count.

The same audience is why the game has to be kind. A person who already feels they are failing does not need an app that scolds them for being away. If the game ever makes someone feel worse for having a bad week, or for not opening the app, it has failed, however good the engagement numbers look. Every rule below protects that.

## Principle 1: reward showing up, not scoring well

Rewards are earned by **adding information**, whatever that information says. Logging a day of takeaway earns the same as logging a day of salad.

This matters because the app is only useful when people are honest. If a better diet earned more points, people would log the diet they wish they had eaten, and every rating after that would be fiction.

- **The rating and the reward are separate things.** The rating says how the day went. The reward says "thanks for telling us".
- **Improvement is recognised, never demanded.** A badge for "protein up across your last three entries" is welcome. A penalty for a bad day is not.
- **Nothing is ever taken away for a low rating.**

## Principle 2: no clock, no daily streaks

Nobody is expected to open this app every day. People come when they feel like it, add what they want, and leave. The game is built around that.

So there are no daily streaks and nothing else that counts consecutive days. A streak turns a missed day into a loss, and in an app that is not meant for daily use, almost every day is a missed day.

- **Rewards count contributions, not days.** Progress comes from how much the person has added, never from how regularly they visit. The tenth entry is worth celebrating whether it took ten days or ten weeks.
- **Nothing ever goes down.** Points, levels and badges only accumulate. Time away costs nothing, and no reward expires.
- **Coming back is welcomed.** Returning after a gap gets a warm hello and picks up exactly where the person left off, with no mention of how long it has been.
- **No guilt, ever.** No "we missed you" pressure, no "you haven't logged in a while", no sad mascot.
- **Reminders are rare and inviting.** A reminder can offer something ("Got two minutes to log a meal?"). It never implies an obligation or a loss, and there is no daily nudge.
- **If a time-based reward is ever proposed, question it.** Anything like "three days in a row" or "this week's goal" brings the clock back in. Prefer the count-based version, such as "three entries".

## Principle 3: every contribution gets an immediate, visible response

When someone adds something, the app answers right away: points appear and progress moves. A step that gets no response feels like it did not count.

- **Scale the celebration to the act.** A small, quick response for a routine entry. Something bigger for a milestone such as a first entry, a tenth entry, a first entry in a new life area, or a level. If everything gets confetti, nothing feels special.
- **Say what the points were for**, in a few words, so the reward teaches the person what the app values.
- **Never block the person with a celebration.** It should be skippable and brief.

## Principle 4: extra information is a quest, not a form

The app forces almost no input (see the `asking-for-input` skill). The game is how it invites more.

Each optional piece of information is offered as a small quest with its payoff stated: what the person gets in the game and what gets better in the app. For example: "Add your weight. Your protein target gets sharper, and so does your score."

- **A quest keeps its why.** The reason for asking, from the `asking-for-input` skill, is part of the quest.
- **Ignoring a quest costs nothing.** It stays available and does not nag.
- **Do not raise the reward to push a reluctant person.** A quest for sensitive information is worth the same as any other. The person decides what they are comfortable sharing, and the game does not lean on them.
- **Offer few quests at a time.** One to three visible, so it reads as an invitation and not a to-do list.

## Principle 5: progress is always visible

At any moment the person can see where they stand and what the next small step is.

- **Each life area shows its own progress**, so a good week in one area is visible even when another is ignored.
- **Show the next step and what it gives.** "One more entry reaches level 3" is more motivating than a bare number.
- **Empty states are starting lines.** A screen with no data yet invites the first step and says what it will earn.

## Principle 6: an honest game

No dark patterns. The audience is vulnerable, and trust is the product.

- No fake urgency or countdowns.
- No rewards that can be bought.
- No comparison with other people unless the person asks for it.
- No points for things that do not help the person.
- The tone matches the rest of the app: playful and light, never mocking. The humour limits in the `asking-for-input` skill apply here too.

## How to build it

- **The backend owns the game.** Points, levels and badges are computed by the API from stored rows. The app only displays them. This keeps the numbers consistent across web and mobile, and keeps them from being faked on the device.
- **Plain tables, no gamification library**, as recorded in `docs/architecture/tech-stack.md`.
- **Points are a ledger.** Each award is a row saying what was earned, when, and for what. Totals are calculated from the ledger, so any total can be rechecked or recalculated if a rule changes.
- **Editing an entry never removes points.** Points reward the act of adding. If correcting an entry cost points, people would stop correcting, and the app wants corrections.
- **Cap what can be farmed.** Limit how many entries of one kind earn points in a day, so the easiest way to score is still to use the app normally.
- **Game rules live in one config place.** Point values, level thresholds and caps are named settings, not numbers scattered through the code. They will be tuned often.
- **The AI model never awards points.** Like ratings, rewards come from the app's own rules so they are the same every time.

## Before you call a feature done

- Does adding information here earn something, and does the person see it immediately?
- Is the reward the same whether the entry is "good" or "bad"?
- Does anything here count days, expire, or reward regular visits? Replace it with a count of contributions.
- Could anything on this screen make someone feel worse for being away? Remove it.
- Is the next step, and what it gives, visible?
- Is optional information offered as a quest with its why and its payoff?
- Are the game numbers read from the one config place?
- Is every calculation done by the backend?

## Related

- `asking-for-input` skill: how every ask is worded, why almost nothing is required, and where humour stops.
- `docs/architecture/tech-stack.md`: where game logic lives and why.
