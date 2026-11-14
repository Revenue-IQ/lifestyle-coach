import { AREAS, type AreaId } from './areas';
import type { ChoiceField, FieldOption } from './fields';

/**
 * The "how it usually is" questionnaire for each life area, and the scoring
 * that turns it into a rating out of 100 with named gaps.
 * See docs/features/area-ratings.md. This file is content: the questions,
 * their reasons and their scores are meant to be read and tuned by a person.
 *
 * Every answer carries a score from 0 to 3. A low answer can carry a `gap`,
 * a plain phrase naming what is dragging the rating down. The rating is the
 * share of points earned across the questions that were answered.
 */
export interface ScoredOption extends FieldOption {
  score: 0 | 1 | 2 | 3;
  /** Named when this answer is a gap worth working on. */
  gap?: string;
}

export interface AreaQuestion extends ChoiceField {
  options: ScoredOption[];
}

export interface AreaQuestionnaire {
  area: AreaId;
  /** One or two lines above the first question. */
  intro: string;
  questions: AreaQuestion[];
}

const MAX_PER_QUESTION = 3;

export const QUESTIONNAIRES: Record<AreaId, AreaQuestionnaire> = {
  sleep: {
    area: 'sleep',
    intro: 'Think about a normal week, not your best night or your worst.',
    questions: [
      {
        id: 'hours',
        type: 'choice',
        label: 'On most nights, how many hours of sleep do you actually get?',
        why: 'Seven to nine is the range most adults need. Fewer shows up as tiredness, cravings and low mood before anything else.',
        options: [
          { value: '7-9', label: '7 to 9', score: 3 },
          { value: '9+', label: 'More than 9', score: 2 },
          { value: '6-7', label: '6 to 7', score: 2 },
          { value: '5-6', label: '5 to 6', score: 1, gap: 'under seven hours most nights' },
          { value: '<5', label: 'Under 5', score: 0, gap: 'well under six hours most nights' },
        ],
      },
      {
        id: 'regular',
        type: 'choice',
        label: 'Do you go to bed and get up at roughly the same times, weekends included?',
        why: 'A steady rhythm does more for energy than an extra hour. Your body likes to know the plan.',
        options: [
          { value: 'within-1h', label: 'Within an hour, most days', score: 3 },
          { value: 'drift-1-2h', label: 'They drift by an hour or two', score: 2 },
          { value: 'all-over', label: 'All over the place', score: 0, gap: 'bed and wake times all over the place' },
        ],
      },
      {
        id: 'latency',
        type: 'choice',
        label: 'How long does it usually take you to fall asleep?',
        why: 'Up to twenty minutes is normal. Longer usually points at light, caffeine or a busy head, all of which can be worked on.',
        options: [
          { value: '<20', label: 'Under 20 minutes', score: 3 },
          { value: '20-40', label: '20 to 40 minutes', score: 2 },
          { value: '40+', label: 'More than 40 minutes', score: 1, gap: 'a long time to fall asleep' },
          { value: 'hours', label: 'Hours, some nights', score: 0, gap: 'lying awake for hours' },
        ],
      },
      {
        id: 'screens',
        type: 'choice',
        label: 'Phone or screen in bed?',
        why: 'The light and the scrolling both push sleep later. No lecture, we all do it. We just need to know.',
        options: [
          { value: 'never', label: 'Not in bed', score: 3 },
          { value: 'sometimes', label: 'Sometimes', score: 2 },
          { value: 'most-nights', label: 'Most nights', score: 1, gap: 'a screen in bed most nights' },
          { value: 'fall-asleep-to-it', label: 'I fall asleep to it', score: 0, gap: 'falling asleep to a screen' },
        ],
      },
      {
        id: 'caffeine',
        type: 'choice',
        label: 'Caffeine after 2pm?',
        why: 'Half of an afternoon coffee is still in you at bedtime. It is one of the easiest things to move.',
        options: [
          { value: 'never', label: 'Rarely or never', score: 3 },
          { value: 'sometimes', label: 'Sometimes', score: 2 },
          { value: 'most-days', label: 'Most days', score: 1, gap: 'caffeine late in the day' },
          { value: 'evening', label: 'Evening coffee or energy drinks', score: 0, gap: 'caffeine in the evening' },
        ],
      },
      {
        id: 'waking',
        type: 'choice',
        label: 'How do you feel in the first hour after waking?',
        why: 'The best single sign of whether sleep is doing its job.',
        options: [
          { value: 'rested', label: 'Rested, mostly', score: 3 },
          { value: 'ok-after-coffee', label: 'Fine once I have had a coffee', score: 2 },
          { value: 'groggy', label: 'Groggy for a while', score: 1, gap: 'groggy most mornings' },
          { value: 'unrefreshed', label: 'Like I did not sleep', score: 0, gap: 'waking up unrefreshed' },
        ],
      },
      {
        id: 'night-waking',
        type: 'choice',
        label: 'Do you wake in the night and struggle to get back to sleep?',
        why: 'Broken nights and short nights have different causes, so we ask separately.',
        options: [
          { value: 'rarely', label: 'Rarely', score: 3 },
          { value: 'weekly', label: 'About once a week', score: 2 },
          { value: 'several', label: 'Several nights a week', score: 1, gap: 'broken nights' },
          { value: 'every-night', label: 'Most nights', score: 0, gap: 'waking most nights' },
        ],
      },
    ],
  },

  diet: {
    area: 'diet',
    intro: 'A normal day, not a good one. We are not counting calories and nobody is judging the biscuits.',
    questions: [
      {
        id: 'meals',
        type: 'choice',
        label: 'How many proper meals do you have on a normal day?',
        why: 'Skipped meals are one of the commonest reasons for the 4pm crash and the evening snack raid.',
        options: [
          { value: '3+', label: 'Three or more', score: 3 },
          { value: '2', label: 'Two', score: 2 },
          { value: 'varies', label: 'It varies a lot', score: 1, gap: 'irregular meals' },
          { value: '1', label: 'Usually one', score: 0, gap: 'often one meal a day' },
        ],
      },
      {
        id: 'protein',
        type: 'choice',
        label: 'Does each meal have something with protein in it? Eggs, dal, beans, meat, fish, yoghurt, paneer, tofu.',
        why: 'Protein is what keeps you full and steady between meals. It is the first thing we would look at for cravings.',
        options: [
          { value: 'always', label: 'Almost always', score: 3 },
          { value: 'usually', label: 'Usually', score: 2 },
          { value: 'sometimes', label: 'Sometimes', score: 1, gap: 'protein missing from many meals' },
          { value: 'rarely', label: 'Rarely', score: 0, gap: 'very little protein' },
        ],
      },
      {
        id: 'plants',
        type: 'choice',
        label: 'How often is there fruit or veg on your plate?',
        why: 'Fibre is what keeps energy and the gut steady. A handful counts.',
        options: [
          { value: 'most-meals', label: 'Most meals', score: 3 },
          { value: 'daily', label: 'About once a day', score: 2 },
          { value: 'few-weekly', label: 'A few times a week', score: 1, gap: 'fruit and veg only a few times a week' },
          { value: 'rarely', label: 'Rarely', score: 0, gap: 'very little fruit or veg' },
        ],
      },
      {
        id: 'takeaway',
        type: 'choice',
        label: 'How many meals a week come from a takeaway, a packet or a drive-through?',
        why: 'They are quick and we get it. They just tend to be short on the things above, so the number matters more than the guilt.',
        options: [
          { value: '0-2', label: 'Up to two', score: 3 },
          { value: '3-5', label: 'Three to five', score: 2 },
          { value: '6-9', label: 'Six to nine', score: 1, gap: 'many takeaway or packaged meals' },
          { value: '10+', label: 'Ten or more', score: 0, gap: 'most meals are takeaway or packaged' },
        ],
      },
      {
        id: 'sugary-drinks',
        type: 'choice',
        label: 'Sugary drinks or sweet coffees on a normal day?',
        why: 'The quickest route to a 3pm slump. We count them, we do not scold.',
        options: [
          { value: 'none', label: 'None', score: 3 },
          { value: 'one', label: 'One', score: 2 },
          { value: '2-3', label: 'Two or three', score: 1, gap: 'two or three sugary drinks a day' },
          { value: 'more', label: 'More than that', score: 0, gap: 'a lot of sugary drinks' },
        ],
      },
      {
        id: 'water',
        type: 'choice',
        label: 'Roughly how much water do you drink a day?',
        why: 'Mild dehydration feels like tiredness and headaches. Cheap to fix, so worth asking.',
        options: [
          { value: 'plenty', label: 'Plenty, a couple of litres', score: 3 },
          { value: 'about-a-litre', label: 'About a litre', score: 2 },
          { value: 'few-glasses', label: 'A few glasses', score: 1, gap: 'not much water' },
          { value: 'hardly', label: 'Mostly things that are not water', score: 0, gap: 'hardly any water' },
        ],
      },
      {
        id: 'late-eating',
        type: 'choice',
        label: 'How often do you eat a big meal within two hours of bed?',
        why: 'It affects sleep and reflux, which is why this one sits between Diet and Sleep.',
        options: [
          { value: 'rarely', label: 'Rarely', score: 3 },
          { value: 'weekly', label: 'Once or twice a week', score: 2 },
          { value: 'most-nights', label: 'Most nights', score: 0, gap: 'big meals close to bedtime' },
        ],
      },
    ],
  },

  movement: {
    area: 'movement',
    intro: 'Movement, not exercise. Stairs, walking and carrying shopping all count.',
    questions: [
      {
        id: 'sitting',
        type: 'choice',
        label: 'On a normal day, how many hours are you sitting?',
        why: 'Sitting time matters on its own, separately from exercise. Desk, car, sofa, all of it.',
        options: [
          { value: '<6', label: 'Under 6', score: 3 },
          { value: '6-8', label: '6 to 8', score: 2 },
          { value: '8-10', label: '8 to 10', score: 1, gap: 'long hours sitting' },
          { value: '10+', label: 'More than 10', score: 0, gap: 'most of the day sitting' },
        ],
      },
      {
        id: 'breathless',
        type: 'choice',
        label: 'How many days a week do you do something that gets you a bit out of breath, for 20 minutes or more?',
        why: 'The guideline is about 150 minutes a week. Even one day a week moves the needle on energy and mood.',
        options: [
          { value: '4+', label: 'Four or more', score: 3 },
          { value: '2-3', label: 'Two or three', score: 2 },
          { value: '1', label: 'One', score: 1, gap: 'only one active day a week' },
          { value: 'none', label: 'None, right now', score: 0, gap: 'nothing that gets you out of breath' },
        ],
      },
      {
        id: 'strength',
        type: 'choice',
        label: 'Any strength work? Lifting, bodyweight, carrying heavy things, stairs on purpose.',
        why: 'Muscle is what keeps energy and metabolism up as years go by. Twice a week is the guideline; once is a start.',
        options: [
          { value: '2+', label: 'Twice a week or more', score: 3 },
          { value: 'weekly', label: 'About once a week', score: 2 },
          { value: 'occasionally', label: 'Occasionally', score: 1, gap: 'little strength work' },
          { value: 'never', label: 'Not really', score: 0, gap: 'no strength work' },
        ],
      },
      {
        id: 'walking',
        type: 'choice',
        label: 'Walking: how much on a normal day?',
        why: 'The cheapest energy there is, and the easiest thing to add to a day.',
        options: [
          { value: '45+', label: '45 minutes or more', score: 3 },
          { value: '20-45', label: '20 to 45 minutes', score: 2 },
          { value: '10-20', label: '10 to 20 minutes', score: 1, gap: 'not much walking' },
          { value: 'hardly', label: 'Hardly any', score: 0, gap: 'very little walking' },
        ],
      },
      {
        id: 'after',
        type: 'choice',
        label: 'How do you usually feel after moving?',
        why: 'Tells us whether the hard part is starting or recovering. They need different first steps.',
        options: [
          { value: 'better', label: 'Better', score: 3 },
          { value: 'fine', label: 'Fine', score: 2 },
          { value: 'dont-know', label: 'I do not move enough to know', score: 1, gap: 'not enough movement to tell' },
          { value: 'wiped', label: 'Wiped out for the rest of the day', score: 0, gap: 'exhausted after activity' },
        ],
      },
    ],
  },

  gut: {
    area: 'gut',
    intro: 'Plain questions about digestion. Nothing here is embarrassing to us.',
    questions: [
      {
        id: 'bloating',
        type: 'choice',
        label: 'How often do you feel bloated or uncomfortable after eating?',
        why: 'The commonest gut complaint, and often linked to how and what you eat rather than anything wrong with you.',
        options: [
          { value: 'rarely', label: 'Rarely', score: 3 },
          { value: 'weekly', label: 'Once or twice a week', score: 2 },
          { value: 'most-days', label: 'Most days', score: 1, gap: 'bloating most days' },
          { value: 'most-meals', label: 'After almost every meal', score: 0, gap: 'bloating after most meals' },
        ],
      },
      {
        id: 'regular',
        type: 'choice',
        label: 'How regular are you? Yes, we are asking about poo.',
        why: 'Anywhere from three times a day to three times a week, without straining, is the normal range.',
        options: [
          { value: 'regular', label: 'Regular and easy', score: 3 },
          { value: 'bit-irregular', label: 'A bit irregular', score: 2 },
          { value: 'constipated', label: 'Often constipated', score: 1, gap: 'often constipated' },
          { value: 'loose', label: 'Often loose or urgent', score: 1, gap: 'often loose or urgent' },
          { value: 'both', label: 'Swings between both', score: 0, gap: 'swinging between constipation and the opposite' },
        ],
      },
      {
        id: 'reflux',
        type: 'choice',
        label: 'Heartburn or reflux?',
        why: 'Often tied to late meals, portion size and a few specific foods, all of which can be changed.',
        options: [
          { value: 'rarely', label: 'Rarely', score: 3 },
          { value: 'occasionally', label: 'Occasionally', score: 2 },
          { value: 'weekly', label: 'Weekly', score: 1, gap: 'weekly heartburn' },
          { value: 'most-days', label: 'Most days', score: 0, gap: 'heartburn most days' },
        ],
      },
      {
        id: 'variety',
        type: 'choice',
        label: 'In a week, how varied are the plant foods you eat? Veg, fruit, grains, beans, nuts, seeds, herbs.',
        why: 'Variety is what feeds a healthy gut. Thirty different plants a week is the research number. Nobody counts; a rough feel is fine.',
        options: [
          { value: 'lots', label: 'Lots of different ones', score: 3 },
          { value: 'moderate', label: 'A fair mix', score: 2 },
          { value: 'same-few', label: 'The same few things', score: 1, gap: 'little variety in plant foods' },
          { value: 'hardly', label: 'Hardly any plants', score: 0, gap: 'very few plant foods' },
        ],
      },
      {
        id: 'fermented',
        type: 'choice',
        label: 'Fermented foods? Yoghurt, curd, kefir, kimchi, sauerkraut, idli or dosa batter.',
        why: 'They top up the good bacteria. A spoonful most days is plenty.',
        options: [
          { value: 'most-days', label: 'Most days', score: 3 },
          { value: 'few-weekly', label: 'A few times a week', score: 2 },
          { value: 'rarely', label: 'Rarely', score: 1, gap: 'few fermented foods' },
          { value: 'never', label: 'Never', score: 0, gap: 'no fermented foods' },
        ],
      },
      {
        id: 'rushed',
        type: 'choice',
        label: 'Do you eat quickly, standing up, or at a screen?',
        why: 'Digestion starts with chewing. Rushed meals are a quiet, common cause of bloating.',
        options: [
          { value: 'rarely', label: 'Rarely', score: 3 },
          { value: 'sometimes', label: 'Sometimes', score: 2 },
          { value: 'most-meals', label: 'Most meals', score: 1, gap: 'rushed meals' },
          { value: 'always', label: 'Pretty much always', score: 0, gap: 'eating on the run at every meal' },
        ],
      },
    ],
  },

  social: {
    area: 'social',
    intro: 'This one is about people. Honest answers help most, and nobody else sees them.',
    questions: [
      {
        id: 'conversations',
        type: 'choice',
        label: 'In a normal week, how many real conversations do you have? Beyond work and logistics.',
        why: 'What predicts loneliness is not friends on paper but contact in practice.',
        options: [
          { value: 'most-days', label: 'Most days', score: 3 },
          { value: '2-3', label: 'Two or three a week', score: 2 },
          { value: 'one', label: 'About one', score: 1, gap: 'about one real conversation a week' },
          { value: 'hardly', label: 'Hardly any', score: 0, gap: 'hardly any real conversations' },
        ],
      },
      {
        id: 'someone-to-call',
        type: 'choice',
        label: 'Is there someone you could call at 2am if something went wrong?',
        why: 'One person is enough. It is the single strongest protective factor researchers have found.',
        options: [
          { value: 'several', label: 'Yes, more than one', score: 3 },
          { value: 'one', label: 'Yes, one person', score: 2 },
          { value: 'not-sure', label: 'Not sure', score: 1, gap: 'not sure who you would call' },
          { value: 'no', label: 'No', score: 0, gap: 'no one to call when things go wrong' },
        ],
      },
      {
        id: 'in-person',
        type: 'choice',
        label: 'How often do you see people in person, not for work?',
        why: 'Screens help, but in-person contact does something messages cannot.',
        options: [
          { value: 'weekly', label: 'Weekly or more', score: 3 },
          { value: 'couple-monthly', label: 'A couple of times a month', score: 2 },
          { value: 'monthly', label: 'Monthly or less', score: 1, gap: 'rarely seeing people in person' },
          { value: 'almost-never', label: 'Almost never', score: 0, gap: 'almost never seeing people in person' },
        ],
      },
      {
        id: 'regular-group',
        type: 'choice',
        label: 'Are you part of anything regular? A group, class, team, faith community, volunteering.',
        why: 'Regular things do the hard work of arranging for you. You just turn up.',
        options: [
          { value: 'weekly', label: 'Yes, weekly', score: 3 },
          { value: 'sometimes', label: 'Yes, now and then', score: 2 },
          { value: 'used-to', label: 'I used to be', score: 1, gap: 'no regular group any more' },
          { value: 'no', label: 'No', score: 0, gap: 'no regular group or activity' },
        ],
      },
      {
        id: 'home',
        type: 'choice',
        label: 'Who is around at home?',
        why: 'Living alone is fine for many people. We ask because of how it feels, not the headcount.',
        options: [
          { value: 'family', label: 'Family or a partner', score: 2 },
          { value: 'housemates', label: 'Housemates', score: 2 },
          { value: 'alone-fine', label: 'Just me, and that is fine', score: 2 },
          { value: 'alone-hard', label: 'Just me, and it is hard', score: 0, gap: 'living alone and finding it hard' },
        ],
      },
      {
        id: 'isolated',
        type: 'choice',
        label: 'How often do you feel left out or isolated?',
        why: 'The honest answer helps us weigh everything else here.',
        options: [
          { value: 'rarely', label: 'Rarely', score: 3 },
          { value: 'sometimes', label: 'Sometimes', score: 2 },
          { value: 'often', label: 'Often', score: 1, gap: 'often feeling isolated' },
          { value: 'most-of-the-time', label: 'Most of the time', score: 0, gap: 'feeling isolated most of the time' },
        ],
      },
    ],
  },
};

/** Answers as the app sends them: question id to option value. Unanswered questions are absent. */
export type AreaAnswers = Record<string, string>;

export type AreaBand = 'attention' | 'could-be-better' | 'solid';

export const AREA_BAND_THRESHOLDS = { attention: 45, couldBeBetter: 70 } as const;

export const AREA_BAND_LABELS: Record<AreaBand, string> = {
  attention: 'Needs attention',
  'could-be-better': 'Could be better',
  solid: 'Solid',
};

/** Fewer answered questions than this and the rating is marked rough. */
export const MIN_ANSWERED_FOR_FIRM = 3;

export interface AreaRating {
  area: AreaId;
  /** 0 to 100, or null when nothing was answered. */
  score: number | null;
  band: AreaBand | null;
  answered: number;
  total: number;
  rough: boolean;
  /** The gap phrases from low answers, in question order. */
  gaps: string[];
}

export function areaBand(score: number): AreaBand {
  if (score < AREA_BAND_THRESHOLDS.attention) return 'attention';
  if (score < AREA_BAND_THRESHOLDS.couldBeBetter) return 'could-be-better';
  return 'solid';
}

/** Drops unknown questions and unknown option values. */
export function cleanAnswers(area: AreaId, answers: AreaAnswers): AreaAnswers {
  const clean: AreaAnswers = {};
  for (const q of QUESTIONNAIRES[area].questions) {
    const v = answers[q.id];
    if (typeof v === 'string' && q.options.some((o) => o.value === v)) clean[q.id] = v;
  }
  return clean;
}

export function rateArea(area: AreaId, answers: AreaAnswers): AreaRating {
  const questionnaire = QUESTIONNAIRES[area];
  let earned = 0;
  let answered = 0;
  const gaps: string[] = [];
  for (const q of questionnaire.questions) {
    const option = q.options.find((o) => o.value === answers[q.id]);
    if (!option) continue;
    answered += 1;
    earned += option.score;
    if (option.gap) gaps.push(option.gap);
  }
  const total = questionnaire.questions.length;
  if (answered === 0) return { area, score: null, band: null, answered, total, rough: true, gaps };
  const score = Math.round((earned / (answered * MAX_PER_QUESTION)) * 100);
  return { area, score, band: areaBand(score), answered, total, rough: answered < MIN_ANSWERED_FOR_FIRM, gaps };
}

export const ALL_QUESTIONNAIRES = AREAS.map((a) => QUESTIONNAIRES[a]);
