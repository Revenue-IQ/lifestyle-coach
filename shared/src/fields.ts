/**
 * Every input the app asks for is defined here, next to the reason it is asked.
 * The `why` text is required by the type, so a field without a reason cannot exist.
 * `required` is off unless the comment next to it says what breaks without the answer.
 * See the asking-for-input skill and docs/features/profile.md.
 */

export interface FieldOption<V extends string = string> {
  value: V;
  label: string;
}

interface BaseField {
  id: string;
  label: string;
  /** Shown on screen with the question. True, specific, about the person's benefit. */
  why: string;
  /** Off by default. Turning it on needs a comment saying what breaks without the answer. */
  required?: boolean;
  /** What the app does instead when the answer is skipped, shown next to results. */
  ifSkipped?: string;
}

export interface TextField extends BaseField {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
}
export interface NumberField extends BaseField {
  type: 'number';
  min: number;
  max: number;
  unit?: string;
  placeholder?: string;
}
export interface ChoiceField<V extends string = string> extends BaseField {
  type: 'choice';
  options: FieldOption<V>[];
}
export interface YesNoField extends BaseField {
  type: 'yesno';
}
export interface ScaleField extends BaseField {
  type: 'scale';
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export type FieldDef = TextField | NumberField | ChoiceField | YesNoField | ScaleField;

export const SEX_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other / prefer to say it my way' },
] as const satisfies readonly FieldOption[];
export type Sex = (typeof SEX_OPTIONS)[number]['value'];

export const ACTIVITY_OPTIONS = [
  { value: 'mostly-sitting', label: 'Mostly sitting' },
  { value: 'on-my-feet-a-bit', label: 'On my feet a bit' },
  { value: 'active-most-days', label: 'Active most days' },
  { value: 'very-active', label: 'Very active or training' },
] as const satisfies readonly FieldOption[];
export type ActivityLevel = (typeof ACTIVITY_OPTIONS)[number]['value'];

/** Profile fields, in the order the About you screen shows them. */
export const PROFILE_FIELDS = {
  name: {
    id: 'name',
    type: 'text',
    label: 'What should we call you?',
    why: "Any name you like. It doesn't have to be the one on your passport.",
    placeholder: 'Sleepy Otter',
    maxLength: 40,
    // Required: the app needs something to call the person. A random name is offered
    // so this is one tap and never blocks anyone.
    required: true,
  },
  over18: {
    id: 'over18',
    type: 'yesno',
    label: 'Are you 18 or over?',
    why: 'Our suggestions are written for adults. Under 18 we point you to a professional instead.',
    // Required only at the moment the first suggestion is about to be shown: the
    // safety rule needs a definite answer. It is not required to use the app.
  },
  age: {
    id: 'age',
    type: 'number',
    label: 'How old are you?',
    why: 'Sleep and nutrition ranges shift with age, so this sharpens your rating.',
    min: 18,
    max: 120,
    unit: 'years',
    ifSkipped: 'We use ranges for an average adult.',
  },
  sex: {
    id: 'sex',
    type: 'choice',
    label: 'Sex',
    why: 'Protein and iron targets differ. It also lets us check for pregnancy before giving diet advice.',
    options: [...SEX_OPTIONS],
    ifSkipped: 'We use targets that work for most adults.',
  },
  weightKg: {
    id: 'weightKg',
    type: 'number',
    label: 'Weight',
    why: 'Your protein target is per kilo of body weight. Skip it and we use an average build.',
    min: 30,
    max: 300,
    unit: 'kg',
    ifSkipped: 'This assumes an average build. Add your weight for a sharper rating.',
  },
  activityLevel: {
    id: 'activityLevel',
    type: 'choice',
    label: 'How much do you move in a normal week?',
    why: 'How much you move changes how much food your body needs. A rough guess is fine.',
    options: [...ACTIVITY_OPTIONS],
    ifSkipped: 'We assume a mostly-sitting week.',
    // Temporary: removed once the Movement area can work this out from what is logged.
  },
} as const satisfies Record<string, FieldDef>;

export type ProfileFieldId = keyof typeof PROFILE_FIELDS;

/** The optional About you fields, in display order (name has its own quest). */
export const ABOUT_YOU_FIELD_IDS: ProfileFieldId[] = ['age', 'sex', 'weightKg', 'activityLevel'];

/** The "today" check-in. */
export const TODAY_FIELDS = {
  mood: {
    id: 'mood',
    type: 'scale',
    label: 'How is your mood right now?',
    why: 'Over time this sits next to your area ratings, so you can see what moves with what.',
    min: 1,
    max: 5,
    minLabel: 'Rough',
    maxLabel: 'Great',
    // Required: a check-in with no mood and no energy would be an empty entry.
    required: true,
  },
  energy: {
    id: 'energy',
    type: 'scale',
    label: 'And your energy?',
    why: 'Energy often shifts before mood does, so it is an early signal worth keeping.',
    min: 1,
    max: 5,
    minLabel: 'Flat',
    maxLabel: 'Buzzing',
    required: true,
  },
  note: {
    id: 'note',
    type: 'text',
    label: 'Anything to add?',
    why: 'A few words now are gold when you look back later. Optional, as always.',
    placeholder: 'Slept badly, big lunch, long walk...',
    maxLength: 280,
  },
} as const satisfies Record<string, FieldDef>;

/** The free-text line on the What's bugging you screen. */
export const FREE_TEXT_FIELD = {
  id: 'freeText',
  type: 'text',
  label: 'In your own words, what feels off?',
  why: "The list can't cover everything. This stays as you wrote it, and we read it, not score it.",
  placeholder: "I'm fine on paper but...",
  maxLength: 500,
} as const satisfies TextField;
