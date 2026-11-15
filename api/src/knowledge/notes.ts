import type { AreaId } from '@wellbeing/shared';

/**
 * The knowledge base, as content. Each note is written in our own words from
 * public guidance and names its source. The coach may only advise from notes
 * retrieved for the person's gaps, and every reply keeps the ids it used.
 *
 * REVIEW BEFORE THE DEMO: the project owner reads every note before it is
 * loaded for real people (docs/architecture/tech-stack.md). Nothing here is
 * medical advice; anything that touches a condition points to a professional.
 *
 * Tags are plain words that match the questionnaire gap phrases, so retrieval
 * still works by tag overlap when no embedding model is configured.
 */
export interface NoteSeed {
  id: string;
  area: AreaId;
  title: string;
  body: string;
  source: { name: string; url: string };
  tags: string[];
}

const NHS_EAT_WELL = { name: 'NHS Eat well', url: 'https://www.nhs.uk/live-well/eat-well/' };
const WHO_DIET = { name: 'WHO healthy diet fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet' };
const BDA = { name: 'British Dietetic Association food facts', url: 'https://www.bda.uk.com/food-health/food-facts.html' };
const NHS_SLEEP = { name: 'NHS sleep and tiredness', url: 'https://www.nhs.uk/live-well/sleep-and-tiredness/' };
const SLEEP_FOUNDATION = { name: 'Sleep Foundation sleep hygiene', url: 'https://www.sleepfoundation.org/sleep-hygiene' };
const CDC_ACTIVITY = { name: 'CDC physical activity guidelines for adults', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html' };
const WHO_ACTIVITY = { name: 'WHO physical activity fact sheet', url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity' };
const NHS_GUT = { name: 'NHS digestive health', url: 'https://www.nhs.uk/live-well/eat-well/digestive-health/' };
const BDA_FIBRE = { name: 'BDA fibre food fact sheet', url: 'https://www.bda.uk.com/resource/fibre.html' };
const SURGEON_GENERAL = { name: 'US Surgeon General advisory on loneliness and social connection', url: 'https://www.hhs.gov/surgeongeneral/priorities/connection/index.html' };
const CAMPAIGN_LONELINESS = { name: 'Campaign to End Loneliness', url: 'https://www.campaigntoendloneliness.org/' };
const MIND = { name: 'Mind: loneliness', url: 'https://www.mind.org.uk/information-support/tips-for-everyday-living/loneliness/' };

export const NOTES: NoteSeed[] = [
  // ---------------------------------------------------------------- diet
  {
    id: 'diet-regular-meals',
    area: 'diet',
    title: 'Regular meals steady energy',
    body: 'Going long stretches without eating is a common cause of the mid-afternoon crash and strong evening cravings. Aim for something at roughly regular times, even if one of them is small. A fixed breakfast or lunch time is an easier first step than changing what you eat.',
    source: NHS_EAT_WELL,
    tags: ['irregular meals', 'one meal a day', 'skipping meals', 'crash', 'cravings', 'snacking'],
  },
  {
    id: 'diet-breakfast-protein',
    area: 'diet',
    title: 'A protein breakfast cuts cravings later',
    body: 'A breakfast with protein in it, such as eggs, yoghurt, dal, paneer or beans, tends to keep people fuller through the morning than toast or cereal alone. People who skip breakfast often make up for it with snacks later in the day.',
    source: BDA,
    tags: ['protein', 'breakfast', 'snacking', 'cravings', 'one meal a day'],
  },
  {
    id: 'diet-protein-each-meal',
    area: 'diet',
    title: 'Protein at every meal',
    body: 'Protein is the part of a meal that keeps you full and steady between meals. Spreading it across the day works better than one large portion. Eggs, dairy, dal, beans, lentils, tofu, fish, chicken and nuts all count; a portion is roughly the size of your palm.',
    source: BDA,
    tags: ['protein missing from many meals', 'very little protein', 'protein', 'full', 'cravings'],
  },
  {
    id: 'diet-protein-vegetarian',
    area: 'diet',
    title: 'Vegetarian protein that works',
    body: 'Dal, chickpeas, rajma, paneer, curd, tofu, soya chunks and peanuts are all solid protein sources. Pairing a pulse with a grain, such as dal with rice or beans on toast, gives the full range of amino acids over the day.',
    source: BDA,
    tags: ['protein', 'vegetarian', 'dal', 'paneer', 'very little protein'],
  },
  {
    id: 'diet-five-a-day',
    area: 'diet',
    title: 'Fruit and veg: a handful is a portion',
    body: 'The guidance is at least five portions of fruit and vegetables a day, and a portion is about a handful. Frozen, tinned and cooked all count. The easiest way in is adding one portion to a meal you already eat, such as a banana with breakfast or a side of veg at dinner.',
    source: NHS_EAT_WELL,
    tags: ['fruit and veg only a few times a week', 'very little fruit or veg', 'vegetables', 'fibre'],
  },
  {
    id: 'diet-fibre-energy',
    area: 'diet',
    title: 'Fibre keeps energy level',
    body: 'Most adults get about half the recommended 30 grams of fibre a day. Fibre slows the release of energy from food, so meals with wholegrains, pulses, fruit and veg keep you going longer than refined ones. Swap one white staple for a wholegrain version to start.',
    source: BDA_FIBRE,
    tags: ['fibre', 'very little fruit or veg', 'energy', 'wholegrain', 'crash'],
  },
  {
    id: 'diet-takeaway-swap',
    area: 'diet',
    title: 'Make takeaways work harder',
    body: 'Takeaway and packaged meals tend to be high in salt, fat and sugar and low in fibre and protein. You do not have to stop; pick options with a protein and a vegetable in them, and add a side salad or fruit at home. Replacing one takeaway a week with a simple home meal is a realistic step.',
    source: WHO_DIET,
    tags: ['many takeaway or packaged meals', 'most meals are takeaway or packaged', 'takeaway', 'processed'],
  },
  {
    id: 'diet-easy-home-meals',
    area: 'diet',
    title: 'Three home meals that take ten minutes',
    body: 'Eggs with toast and a tomato; tinned beans or dal heated with rice from the freezer; yoghurt with fruit and nuts. Having two or three meals you can make without thinking is what makes cooking at home happen on tired days.',
    source: NHS_EAT_WELL,
    tags: ['takeaway', 'cooking', 'many takeaway or packaged meals', 'tired'],
  },
  {
    id: 'diet-sugary-drinks',
    area: 'diet',
    title: 'Sugary drinks and the afternoon slump',
    body: 'A sugary drink or sweet coffee gives a fast rise in blood sugar and a dip an hour or two later, which feels like tiredness. The guidance is to keep free sugars low, and drinks are the quickest place to cut them. Swapping one a day for water, sparkling water or an unsweetened version is a clear win.',
    source: WHO_DIET,
    tags: ['two or three sugary drinks a day', 'a lot of sugary drinks', 'sugar', 'slump', 'energy'],
  },
  {
    id: 'diet-water',
    area: 'diet',
    title: 'Mild dehydration feels like tiredness',
    body: 'Six to eight glasses of fluid a day is the usual guidance, more in heat or when active. Being slightly dehydrated shows up as tiredness, headaches and poor concentration before thirst does. Keeping a bottle in sight is the simplest fix.',
    source: NHS_EAT_WELL,
    tags: ['not much water', 'hardly any water', 'water', 'headaches', 'tired', 'brain fog'],
  },
  {
    id: 'diet-late-meals',
    area: 'diet',
    title: 'Big meals close to bed',
    body: 'A large meal within two hours of bed can disturb sleep and bring on reflux. Moving the main meal earlier, or making the late one lighter and the earlier one bigger, often helps both sleep and morning appetite.',
    source: NHS_SLEEP,
    tags: ['big meals close to bedtime', 'late eating', 'reflux', 'sleep'],
  },
  {
    id: 'diet-snacking-structure',
    area: 'diet',
    title: 'Snacking is often a meals problem',
    body: 'Constant snacking is usually a sign that meals are too small, too far apart or short on protein and fibre, rather than a willpower problem. Fixing the meals first makes the snacking shrink by itself. If a snack is needed, pair something with protein, such as fruit with nuts or yoghurt.',
    source: BDA,
    tags: ['snacking', 'cravings', 'irregular meals', 'protein missing from many meals'],
  },
  {
    id: 'diet-plate-shape',
    area: 'diet',
    title: 'A simple plate shape',
    body: 'A balanced meal is roughly half vegetables or salad, a quarter protein and a quarter starchy carbohydrate, ideally wholegrain. It is a shape, not a weighing exercise, and it works for a thali, a bowl or a sandwich.',
    source: NHS_EAT_WELL,
    tags: ['balance', 'vegetables', 'protein', 'portions'],
  },
  {
    id: 'diet-salt',
    area: 'diet',
    title: 'Most salt comes from packaged food',
    body: 'Most of the salt people eat is already in bread, sauces, snacks and ready meals rather than added at the table. The guidance is under 6 grams a day. Cooking from basic ingredients more often lowers it without trying.',
    source: WHO_DIET,
    tags: ['salt', 'processed', 'takeaway'],
  },
  {
    id: 'diet-alcohol-energy',
    area: 'diet',
    title: 'Alcohol, sleep and the next day',
    body: 'Alcohol in the evening makes falling asleep easier and the second half of the night worse, which shows up as tiredness and low mood next day. Having two or three alcohol-free days a week is the usual starting guidance.',
    source: NHS_SLEEP,
    tags: ['alcohol', 'sleep', 'tired', 'low mood'],
  },
  {
    id: 'diet-small-step',
    area: 'diet',
    title: 'Change one thing for a week',
    body: 'Diet changes stick when they are small and specific: one added portion of veg at dinner, one swapped drink, one earlier lunch. Trying to overhaul everything usually lasts a few days. Pick the easiest, do it for a week, then add the next.',
    source: NHS_EAT_WELL,
    tags: ['habit', 'first step', 'small change'],
  },
  {
    id: 'diet-iron-tiredness',
    area: 'diet',
    title: 'Tiredness and iron',
    body: 'Persistent tiredness can sometimes be low iron, especially in people who menstruate or eat little meat. Iron-rich foods include lentils, beans, dark leafy greens, fortified cereals and red meat, and vitamin C with the meal helps absorb plant iron. Ongoing tiredness is worth a conversation with a doctor rather than guesswork.',
    source: BDA,
    tags: ['tired all the time', 'iron', 'tired', 'vegetarian'],
  },
  {
    id: 'diet-caffeine-food',
    area: 'diet',
    title: 'Coffee is not breakfast',
    body: 'Caffeine on an empty stomach masks hunger for a while and then it arrives all at once. If mornings are coffee only, adding even a small protein food alongside steadies the rest of the morning.',
    source: NHS_EAT_WELL,
    tags: ['breakfast', 'caffeine', 'one meal a day', 'cravings'],
  },
  {
    id: 'diet-weekend-pattern',
    area: 'diet',
    title: 'Weekdays matter more than weekends',
    body: 'A pattern that is decent on five days and loose on two is a good pattern. Aiming for perfect every day is the fastest way to give up. Decide what the weekday default looks like and let the rest be.',
    source: NHS_EAT_WELL,
    tags: ['habit', 'consistency', 'guilt'],
  },
  {
    id: 'diet-fruit-sugar',
    area: 'diet',
    title: 'Whole fruit is not the sugar problem',
    body: 'The sugar in whole fruit comes with fibre and water, which slows it down, so fruit does not cause the spike that juice and sweets do. Juice counts as a sugary drink; whole fruit counts as a portion of five a day.',
    source: WHO_DIET,
    tags: ['sugar', 'fruit', 'sugary drinks'],
  },
  {
    id: 'diet-gut-link',
    area: 'diet',
    title: 'Diet and gut are the same project',
    body: 'Many gut complaints, especially bloating and irregularity, respond to the same changes that improve diet in general: more fibre added gradually, more plant variety, regular meals and enough water. If the gut is the main complaint, start there.',
    source: NHS_GUT,
    tags: ['bloating', 'gut', 'fibre', 'variety'],
  },
  {
    id: 'diet-when-to-see-someone',
    area: 'diet',
    title: 'When food changes are not the answer',
    body: 'Unexplained weight loss, ongoing tiredness, blood in stools, or a history of disordered eating are reasons to talk to a doctor or a registered dietitian rather than change your diet on your own. General guidance like this app gives is not a substitute.',
    source: BDA,
    tags: ['professional', 'safety', 'tired all the time'],
  },

  // ---------------------------------------------------------------- sleep
  {
    id: 'sleep-regular-times',
    area: 'sleep',
    title: 'Same wake time every day',
    body: 'A fixed wake-up time, including weekends, is the single most effective sleep habit, more than bedtime. It anchors the body clock so sleepiness arrives at the same time each evening. Start with the wake time and let bedtime follow.',
    source: NHS_SLEEP,
    tags: ['bed and wake times all over the place', 'regular', 'rhythm', 'wake up tired'],
  },
  {
    id: 'sleep-hours',
    area: 'sleep',
    title: 'Seven to nine hours is the range',
    body: 'Most adults need seven to nine hours. Regularly getting less shows up as low mood, cravings and poor concentration before it feels like sleepiness. Going to bed fifteen minutes earlier for a week is a more realistic step than an hour.',
    source: NHS_SLEEP,
    tags: ['under seven hours most nights', 'well under six hours most nights', 'hours', 'tired all the time'],
  },
  {
    id: 'sleep-caffeine-cutoff',
    area: 'sleep',
    title: 'Caffeine after lunch is still there at bedtime',
    body: 'Caffeine takes five to six hours to halve in the body, so an afternoon coffee is still working at midnight. A cut-off around early afternoon helps people who take a long time to fall asleep or wake in the night. Tea, cola and energy drinks count too.',
    source: SLEEP_FOUNDATION,
    tags: ['caffeine late in the day', 'caffeine in the evening', 'caffeine', 'a long time to fall asleep', 'broken nights'],
  },
  {
    id: 'sleep-screens',
    area: 'sleep',
    title: 'The phone in bed',
    body: 'Screens in bed delay sleep two ways: the light tells the brain it is daytime, and the scrolling keeps it alert. Charging the phone outside the bedroom, or at least across the room, is the step that works; a cheap alarm clock removes the main excuse.',
    source: SLEEP_FOUNDATION,
    tags: ['a screen in bed most nights', 'falling asleep to a screen', 'screens', 'phone', 'a long time to fall asleep'],
  },
  {
    id: 'sleep-wind-down',
    area: 'sleep',
    title: 'A short wind-down routine',
    body: 'Doing the same two or three calm things before bed, such as dimming lights, a shower and a few pages of a book, teaches the body that sleep is next. Twenty minutes is enough. It matters most for people who lie awake with a busy head.',
    source: NHS_SLEEP,
    tags: ['a long time to fall asleep', 'lying awake for hours', 'wind down', 'anxious'],
  },
  {
    id: 'sleep-get-up-if-awake',
    area: 'sleep',
    title: 'If you are awake, get up',
    body: 'Lying in bed awake for long stretches teaches the brain that bed is for worrying. If you have been awake for what feels like twenty minutes, get up, do something dull in dim light, and go back when sleepy. It feels wrong and it works.',
    source: SLEEP_FOUNDATION,
    tags: ['lying awake for hours', 'broken nights', 'waking most nights', 'a long time to fall asleep'],
  },
  {
    id: 'sleep-daylight-movement',
    area: 'sleep',
    title: 'Daylight and movement set the clock',
    body: 'Getting outside in daylight in the first hour or two after waking, and moving during the day, both make sleep come more easily at night. A ten-minute morning walk does more for sleep than most evening tricks.',
    source: NHS_SLEEP,
    tags: ['groggy most mornings', 'waking up unrefreshed', 'daylight', 'movement', 'a long time to fall asleep'],
  },
  {
    id: 'sleep-bedroom',
    area: 'sleep',
    title: 'Cool, dark and quiet',
    body: 'A bedroom that is slightly cool, as dark as you can make it and quiet helps both falling asleep and staying asleep. Blackout curtains or an eye mask and earplugs are cheap fixes for light and noise you cannot control.',
    source: SLEEP_FOUNDATION,
    tags: ['broken nights', 'waking most nights', 'bedroom', 'light', 'noise'],
  },
  {
    id: 'sleep-alcohol',
    area: 'sleep',
    title: 'Alcohol and broken sleep',
    body: 'Alcohol helps you drop off and then fragments the second half of the night, which is why a few drinks lead to waking at 3am and feeling unrefreshed. Keeping alcohol to earlier in the evening, or having alcohol-free nights, helps broken sleep quickly.',
    source: NHS_SLEEP,
    tags: ['broken nights', 'waking most nights', 'waking up unrefreshed', 'alcohol'],
  },
  {
    id: 'sleep-naps',
    area: 'sleep',
    title: 'Naps: short and early',
    body: 'A nap of twenty minutes before mid-afternoon can help on a bad day. Long or late naps take the pressure off night-time sleep and make the next night worse. If falling asleep at night is the problem, skip naps for a week.',
    source: SLEEP_FOUNDATION,
    tags: ['a long time to fall asleep', 'naps', 'groggy most mornings'],
  },
  {
    id: 'sleep-when-to-see-someone',
    area: 'sleep',
    title: 'When sleep needs a professional',
    body: 'Loud snoring with pauses in breathing, falling asleep during the day without meaning to, or insomnia that has lasted months despite good habits are reasons to see a doctor. Sleep apnoea and chronic insomnia have effective treatments that habits alone will not provide.',
    source: NHS_SLEEP,
    tags: ['professional', 'safety', 'waking up unrefreshed', 'snoring'],
  },

  // ---------------------------------------------------------------- movement
  {
    id: 'movement-guideline',
    area: 'movement',
    title: 'The weekly target, and how little counts',
    body: 'The guideline is about 150 minutes a week of movement that raises your breathing, plus two sessions that work the muscles. That is thirty minutes on five days, and it can be split into ten-minute pieces. Any amount above nothing brings a benefit.',
    source: CDC_ACTIVITY,
    tags: ['nothing that gets you out of breath', 'only one active day a week', 'guideline', 'breathless'],
  },
  {
    id: 'movement-break-up-sitting',
    area: 'movement',
    title: 'Break up sitting',
    body: 'Long unbroken sitting is linked to tiredness and poorer health on its own, separately from how much you exercise. Standing or walking for two or three minutes every half hour or so, such as taking calls standing or walking to refill water, adds up without needing a workout.',
    source: WHO_ACTIVITY,
    tags: ['long hours sitting', 'most of the day sitting', 'sitting', 'desk'],
  },
  {
    id: 'movement-walking',
    area: 'movement',
    title: 'Walking is the first step',
    body: 'A brisk walk counts as moderate activity. Adding ten minutes to a walk you already do, such as getting off a stop early or a loop after lunch, is more likely to last than a new exercise plan. Energy tends to go up after a week or two, not down.',
    source: CDC_ACTIVITY,
    tags: ['not much walking', 'very little walking', 'walking', 'no energy to move', 'first step'],
  },
  {
    id: 'movement-strength-basics',
    area: 'movement',
    title: 'Strength without a gym',
    body: 'Two short sessions a week of sit-to-stands from a chair, wall or knee push-ups, and carrying shopping or climbing stairs on purpose all count as strength work. Muscle keeps energy, balance and metabolism up as years go by. Five minutes is a real session.',
    source: CDC_ACTIVITY,
    tags: ['little strength work', 'no strength work', 'strength', 'muscle'],
  },
  {
    id: 'movement-energy-paradox',
    area: 'movement',
    title: 'Movement makes energy',
    body: 'It feels backwards, but regular gentle movement reduces tiredness rather than adding to it, and the effect shows within a couple of weeks. The trick is to start below what feels possible, such as five minutes, so the body learns to recover.',
    source: WHO_ACTIVITY,
    tags: ['no energy to move', 'tired all the time', 'exhausted after activity', 'not enough movement to tell'],
  },
  {
    id: 'movement-wiped-out',
    area: 'movement',
    title: 'If movement wipes you out',
    body: 'Being exhausted for the rest of the day after activity usually means the dose was too high for now, not that movement is wrong. Halve it, keep it regular, and build up slowly. If even gentle activity leaves you wiped out for days, that is worth raising with a doctor.',
    source: WHO_ACTIVITY,
    tags: ['exhausted after activity', 'recovery', 'professional', 'safety'],
  },
  {
    id: 'movement-mood',
    area: 'movement',
    title: 'Movement and mood',
    body: 'Regular activity has a measurable effect on low mood and anxiety, comparable to other first-line approaches for mild cases, and the effect starts with modest amounts. Outdoors and with other people adds to it.',
    source: WHO_ACTIVITY,
    tags: ['low mood', 'anxious', 'mood', 'outdoors'],
  },
  {
    id: 'movement-attach-to-habit',
    area: 'movement',
    title: 'Attach it to something you already do',
    body: 'Movement that is tied to an existing habit happens; movement that needs a decision each day mostly does not. After the morning coffee, during a particular call, straight after work before sitting down: pick the slot first, then the activity.',
    source: CDC_ACTIVITY,
    tags: ['habit', 'first step', 'consistency'],
  },

  // ---------------------------------------------------------------- gut
  {
    id: 'gut-fibre-gradually',
    area: 'gut',
    title: 'Add fibre slowly, with water',
    body: 'Fibre is the main lever for regularity and for feeding gut bacteria, but adding a lot at once causes bloating and wind. Increase it over two or three weeks, one food at a time, and drink more water alongside or it can make constipation worse.',
    source: BDA_FIBRE,
    tags: ['often constipated', 'bloating most days', 'fibre', 'little variety in plant foods'],
  },
  {
    id: 'gut-plant-variety',
    area: 'gut',
    title: 'Thirty plants a week',
    body: 'People who eat around thirty different plant foods a week have a more varied gut microbiome than those who eat ten, in the research that counted. Nuts, seeds, herbs, spices, beans, grains, fruit and veg all count, so a dal with coriander, cumin and onion is already four.',
    source: NHS_GUT,
    tags: ['little variety in plant foods', 'very few plant foods', 'variety', 'microbiome'],
  },
  {
    id: 'gut-fermented',
    area: 'gut',
    title: 'Fermented foods, a spoonful a day',
    body: 'Live yoghurt, curd, kefir, kimchi, sauerkraut and fermented batters contain live bacteria that support the gut. A small daily portion is enough; it does not need to be a supplement or a special product.',
    source: NHS_GUT,
    tags: ['few fermented foods', 'no fermented foods', 'fermented', 'yoghurt'],
  },
  {
    id: 'gut-eating-slowly',
    area: 'gut',
    title: 'Eat sitting down, slowly',
    body: 'Eating fast, standing or while working means swallowing air and giving the stomach a lot at once, both of which cause bloating. Sitting down, putting the fork down between mouthfuls and taking fifteen minutes over a meal often reduces bloating within days.',
    source: NHS_GUT,
    tags: ['rushed meals', 'eating on the run at every meal', 'bloating most days', 'bloating after most meals'],
  },
  {
    id: 'gut-reflux-habits',
    area: 'gut',
    title: 'Reflux: timing and size',
    body: 'Heartburn responds to smaller, earlier meals, not lying down for two to three hours after eating, and cutting back on the usual triggers such as very fatty or spicy food, alcohol and coffee. Raising the head of the bed helps night-time reflux. Frequent heartburn over weeks should be checked by a doctor.',
    source: NHS_GUT,
    tags: ['weekly heartburn', 'heartburn most days', 'reflux', 'big meals close to bedtime'],
  },
  {
    id: 'gut-constipation',
    area: 'gut',
    title: 'Constipation basics',
    body: 'Enough fluid, enough fibre, regular movement and not ignoring the urge to go are the four basics. A routine, such as sitting after breakfast when the gut is most active, helps more than people expect. Kiwi fruit, prunes and oats have good evidence.',
    source: NHS_GUT,
    tags: ['often constipated', 'constipation', 'fibre', 'water'],
  },
  {
    id: 'gut-loose-urgent',
    area: 'gut',
    title: 'Loose or urgent stools',
    body: 'Frequent loose or urgent stools can come from caffeine, alcohol, artificial sweeteners, very fatty meals or stress, and a food and symptom diary for a week often shows the pattern. If it has lasted more than a few weeks, comes with blood or weight loss, or wakes you at night, see a doctor.',
    source: NHS_GUT,
    tags: ['often loose or urgent', 'swinging between constipation and the opposite', 'diarrhoea', 'professional'],
  },
  {
    id: 'gut-stress-link',
    area: 'gut',
    title: 'The gut and stress talk to each other',
    body: 'Anxiety and stress change how the gut moves and feels, and gut symptoms feed back into anxiety. Slow breathing before meals, regular sleep and a walk after eating all help the gut directly. This is one reason the gut and sleep areas light up together.',
    source: NHS_GUT,
    tags: ['anxious', 'bloating', 'stress', 'sleep'],
  },
  {
    id: 'gut-when-to-see-someone',
    area: 'gut',
    title: 'Gut symptoms that need a doctor',
    body: 'Blood in the stool, unexplained weight loss, symptoms that wake you at night, a persistent change in bowel habit over several weeks, or difficulty swallowing are not for self-management. Please see a doctor; the habits here are for everyday gut comfort, not for ruling things out.',
    source: NHS_GUT,
    tags: ['professional', 'safety', 'blood', 'weight loss'],
  },

  // ---------------------------------------------------------------- social
  {
    id: 'social-why-it-matters',
    area: 'social',
    title: 'Connection is a health lever',
    body: 'Lacking social connection carries a health risk comparable to smoking or inactivity, and it affects sleep, mood and energy directly. It is not a soft extra. Small, regular contact counts for more than occasional big events.',
    source: SURGEON_GENERAL,
    tags: ['hardly any real conversations', 'often feeling isolated', 'feeling isolated most of the time', 'lonely'],
  },
  {
    id: 'social-one-person',
    area: 'social',
    title: 'One person you could call',
    body: 'Having even one person you could ring at a bad moment is the strongest single protective factor researchers find. If nobody comes to mind, the step is not to make a friend from scratch but to warm up one existing contact: a sibling, an old colleague, a neighbour, with a short message this week.',
    source: CAMPAIGN_LONELINESS,
    tags: ['no one to call when things go wrong', 'not sure who you would call', 'support', 'lonely'],
  },
  {
    id: 'social-small-regular-contact',
    area: 'social',
    title: 'Small and regular beats big and rare',
    body: 'A ten-minute call each week with the same person does more for belonging than a party every few months. Pick one person and one fixed slot, such as a Sunday evening call. Routine removes the hardest part, which is deciding to reach out.',
    source: CAMPAIGN_LONELINESS,
    tags: ['about one real conversation a week', 'hardly any real conversations', 'routine', 'contact'],
  },
  {
    id: 'social-regular-group',
    area: 'social',
    title: 'Join something that repeats',
    body: 'A weekly class, parkrun, choir, faith group, volunteering shift or sports team does the arranging for you: the same people, same place, same time. Belonging grows from repeated low-stakes contact, which is exactly what a regular group provides.',
    source: SURGEON_GENERAL,
    tags: ['no regular group any more', 'no regular group or activity', 'group', 'routine', 'rarely seeing people in person'],
  },
  {
    id: 'social-in-person',
    area: 'social',
    title: 'In person does something messages cannot',
    body: 'Messaging keeps a thread alive, but face-to-face time is what shifts loneliness. Suggesting a specific plan, such as a walk on Saturday morning, works better than "we should catch up". People say yes to concrete invitations far more often than you expect.',
    source: SURGEON_GENERAL,
    tags: ['rarely seeing people in person', 'almost never seeing people in person', 'invitation', 'in person'],
  },
  {
    id: 'social-weak-ties',
    area: 'social',
    title: 'Weak ties count',
    body: 'Short friendly exchanges with people you barely know, such as the barista, a neighbour, the person at the next desk, measurably lift mood and sense of belonging. They are also the lowest-risk practice for someone out of the habit of talking to people.',
    source: MIND,
    tags: ['hardly any real conversations', 'often feeling isolated', 'small talk', 'practice'],
  },
  {
    id: 'social-living-alone',
    area: 'social',
    title: 'Living alone, without it being lonely',
    body: 'Living alone is not the same as loneliness, but it removes the accidental contact that households provide, so contact has to be planned. Working from a café or library one day a week, a standing weekly meal with someone, or a regular group each put some of that back.',
    source: MIND,
    tags: ['living alone and finding it hard', 'alone', 'routine', 'working from home'],
  },
  {
    id: 'social-helping-others',
    area: 'social',
    title: 'Helping someone else',
    body: 'Volunteering or simply being useful to someone, such as helping a neighbour or mentoring, reduces loneliness as much as receiving support does, and it gives contact a purpose, which many people find easier than socialising for its own sake.',
    source: SURGEON_GENERAL,
    tags: ['no regular group or activity', 'purpose', 'volunteering', 'often feeling isolated'],
  },
  {
    id: 'social-when-to-see-someone',
    area: 'social',
    title: 'When loneliness is part of something bigger',
    body: 'If isolation comes with persistent low mood, loss of interest in things, or thoughts of not wanting to be here, it needs more than habits: please talk to a doctor or a mental health professional, and if you are in danger, contact your local emergency services or a crisis line now. The steps here are for everyday connection.',
    source: MIND,
    tags: ['professional', 'safety', 'low mood', 'feeling isolated most of the time'],
  },
];

export function notesForArea(area: AreaId): NoteSeed[] {
  return NOTES.filter((n) => n.area === area);
}
