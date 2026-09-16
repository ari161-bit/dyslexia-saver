// The flagship demo lesson (Photosynthesis — Grade 7), grounded in the
// exact seeded passage used elsewhere in the app (scripts/seed.ts) and
// shared between the logged-in lesson pathways screen
// (src/components/reader/lesson-pathways.tsx) and the public, no-login
// competition demo (src/app/demo). Kept in one place so the two never
// drift apart.
export const DEMO_LESSON_TITLE = "Photosynthesis — Grade 7";
export const DEMO_LESSON_SUBJECT = "Science";

export const DEMO_LESSON_TEXT =
  "Plants make their own food using sunlight, water, and air. This process is called photosynthesis. It happens mostly in the leaves, inside tiny green parts called chloroplasts. Chlorophyll, the green pigment in chloroplasts, captures light energy. The plant combines that energy with water from the roots and carbon dioxide from the air to produce glucose and oxygen. Oxygen is released into the air, which is part of why plants are so important to life on Earth. Without photosynthesis, most food chains would not exist.";

export const DEMO_LESSON_QUESTION = "What do plants use, besides sunlight, to make their own food?";
export const DEMO_LESSON_ANSWER = "Water and air.";

export const DEMO_EXPLAIN_SIMPLE = [
  "Plants make their own food. They need sunlight, water, and air to do this. This is called photosynthesis.",
  "It happens inside the leaves, in tiny green parts called chloroplasts.",
  "Chlorophyll is the green color in the leaf. It catches light from the sun.",
  "The plant mixes that light energy with water and air. This makes sugar (glucose) and oxygen.",
  "The plant lets oxygen out into the air. Living things need that oxygen to breathe.",
  "Without photosynthesis, most living things would have no food.",
];

export interface DemoQAItem {
  question: string;
  accept: string[];
  sourceQuote: string;
}

export const DEMO_PRACTICE_QUESTIONS: DemoQAItem[] = [
  {
    question: DEMO_LESSON_QUESTION,
    accept: ["water", "air", "carbon dioxide", "co2"],
    sourceQuote: "combines that energy with water from the roots and carbon dioxide from the air",
  },
  {
    question: "What is the name of the green pigment that captures light energy?",
    accept: ["chlorophyll"],
    sourceQuote: "Chlorophyll, the green pigment in chloroplasts, captures light energy.",
  },
  {
    question: "What two things does photosynthesis produce?",
    accept: ["glucose", "oxygen"],
    sourceQuote: "produce glucose and oxygen",
  },
];

export const DEMO_KEY_IDEAS = {
  summary:
    "Plants make their own food through photosynthesis, using sunlight, water, and carbon dioxide to produce glucose and oxygen.",
  keyPoints: [
    "Photosynthesis happens mainly inside the leaves.",
    "Chloroplasts are the tiny green parts where it happens.",
    "Chlorophyll captures light energy from the sun.",
    "The process makes glucose (the plant's food) and oxygen.",
  ],
};

export function checkDemoAnswer(response: string, accept: string[]) {
  const normalized = response.trim().toLowerCase();
  if (!normalized) return false;
  return accept.some((keyword) => normalized.includes(keyword));
}
