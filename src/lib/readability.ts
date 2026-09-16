// A lightweight Flesch Reading Ease approximation for showing a directional
// "this is easier to read" comparison live — not a clinically precise
// score, just a real, honest calculation run on whatever text is passed in
// (never a fabricated number).
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const matches = w.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;
  if (w.endsWith("e") && count > 1) count--;
  return Math.max(count, 1);
}

export interface ReadabilityScore {
  score: number;
  grade: string;
}

export function fleschReadingEase(text: string): ReadabilityScore {
  const trimmed = text.trim();
  if (!trimmed) return { score: 0, grade: "N/A" };

  const sentenceCount = Math.max((trimmed.match(/[.!?]+/g) ?? []).length, 1);
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(words.length, 1);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const raw = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let grade = "Very hard";
  if (score >= 90) grade = "Very easy";
  else if (score >= 70) grade = "Easy";
  else if (score >= 60) grade = "Fairly easy";
  else if (score >= 50) grade = "Standard";
  else if (score >= 30) grade = "Fairly hard";
  else if (score >= 10) grade = "Hard";

  return { score, grade };
}
