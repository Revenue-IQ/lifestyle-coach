# Points and levels

Status: built in Phase 1, area ratings added in Phase 2 (web) · Last updated: 2026-11-14

## What it does

Every time a person adds information, the app answers at once: a short banner says how many points it earned and what for, the total on the home screen moves, and the next level is always one line away ("15 more to level 3"). Levels only go up. Nothing expires, nothing counts days, and a bad week costs nothing. The rules follow the `gamification` project skill.

## How it works

**The numbers, all in one place** (`api/src/config/game.ts`):

| Contribution | Points | Cap |
|---|---|---|
| What's bugging you | 20 | once a day earns points |
| Picking a name | 10 | once ever |
| Two-week check-in (WHO-5) | 30 | once a day earns points |
| Today's check-in | 5 | three a day earn points |
| Each About you detail | 5 | once per field, ever |
| Rating a life area | 25 | once a day per area earns points |

Level thresholds (total points): 0, 30, 80, 150, 250, 400, 600, 850, 1150, 1500. Level 1 is where everyone starts.

**The ledger.** Every award is a row in `points_ledger`: who, what kind, how many points, the reason text, which entry or field it was for, and when. Totals and levels are always calculated from the ledger (`api/src/game/award.ts` and `rules.ts`), never stored, so a rule change can be recomputed.

**Caps.** An entry past its cap is still stored and still counts for the person; it just earns nothing that day. The banner says so plainly. Caps are per calendar day in UTC. A cap can be per reference (`perRef`), which is how rating two different areas in a day earns twice while rating the same area twice does not.

**Quests.** The home screen offers up to three invitations (`api/src/routes/me.ts`), each with its payoff and points: tell us what's bugging you (if never answered), pick a name, the two-week check-in (if never taken), a bit about you (while any field is empty). They are offered in that order and disappear once done. Ignoring them costs nothing.

**The response.** Every write endpoint returns an `award` with the points, the reason, the new total and level, what the next level needs, and whether a level was reached. The app shows it in one banner (`mobile/src/game/AwardContext.tsx`) that fades after a few seconds, longer for a level-up, and can be tapped away.

## Decisions

- **Backend computes everything** — the app only displays numbers the API returns, so web and mobile agree and nothing can be faked on the device.
- **Capped entries are not written to the ledger** — the history of what earned points stays readable, and the entry itself is still in its own table. Rejected: writing 0-point rows, which would make "how many earned today" queries need a filter everywhere.
- **Profile points per field, once ever** — rewards the act of adding each detail. Editing or clearing a field later never removes the points, so people keep their data accurate.
- **Same reward whatever the answer says** — a "rough" mood earns the same five points as a "great" one, and a low WHO-5 score the same thirty as a high one. The rating and the reward are separate, as the skill requires.
- **No comparison, no purchase, no clock** — there are no leaderboards, nothing can be bought, and no rule mentions consecutive days.

## Future

- Badges for milestones that count contributions (first entry in each life area, tenth entry, baseline improved across three check-ins).
- Per-area progress once the life areas exist.
- Tune the point values and thresholds once real people have used it; they were set by feel on 2026-11-14.
