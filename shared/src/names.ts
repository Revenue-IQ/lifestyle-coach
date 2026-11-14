/** Random names for the "pick one for me" button. Light, never about the person. */
const ADJECTIVES = [
  'Sleepy', 'Curious', 'Gentle', 'Brave', 'Quiet', 'Sunny', 'Cosy', 'Wandering',
  'Patient', 'Cheerful', 'Thoughtful', 'Breezy', 'Steady', 'Dreamy', 'Hopeful', 'Mellow',
];
const ANIMALS = [
  'Otter', 'Fox', 'Panda', 'Heron', 'Badger', 'Koala', 'Lynx', 'Puffin',
  'Tortoise', 'Owl', 'Capybara', 'Hedgehog', 'Seal', 'Moose', 'Robin', 'Yak',
];

export function randomName(rng: () => number = Math.random): string {
  const a = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(rng() * ANIMALS.length)];
  return `${a} ${b}`;
}
