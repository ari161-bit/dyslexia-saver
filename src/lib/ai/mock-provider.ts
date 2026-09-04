import type {
  AccessibleVersion,
  AIResult,
  AIService,
  ExtractedContent,
  ExtractedSection,
  PracticeQuestion,
  RevisionGuide,
  VocabularyEntry,
} from "./types";

// Deterministic, source-grounded stand-in for a real LLM/OCR provider.
// Swap the AI_PROVIDER env var and register a new provider in service.ts
// to plug in OpenAI/Anthropic/Vision without touching call sites.

const COMMON_WORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","is","are","was","were",
  "it","this","that","as","by","from","at","be","has","have","had","not","its","their","they",
  "we","you","he","she","his","her","them","which","when","what","who","how","why","into","than",
]);

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function guessHeading(paragraph: string): string | null {
  const firstLine = paragraph.split(/[.!?]/)[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length <= 60 && paragraph.length > firstLine.length + 20) {
    return null;
  }
  return null;
}

function difficultWords(text: string, max = 8): string[] {
  const words = text.match(/[A-Za-z][A-Za-z'-]{5,}/g) ?? [];
  const seen = new Map<string, number>();
  for (const w of words) {
    const lower = w.toLowerCase();
    if (COMMON_WORDS.has(lower)) continue;
    seen.set(lower, (seen.get(lower) ?? 0) + 1);
  }
  return Array.from(seen.keys())
    .sort((a, b) => b.length - a.length)
    .slice(0, max);
}

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export class MockAIProvider implements AIService {
  readonly name = "mock";

  async extractContent({ text }: { text: string; fileType: string }): Promise<ExtractedContent> {
    const paragraphs = splitParagraphs(text);
    const sections: ExtractedSection[] = paragraphs.length
      ? paragraphs.map((p) => ({ heading: guessHeading(p), paragraphs: [p] }))
      : [{ heading: null, paragraphs: [text.trim() || "No text could be read from this file yet."] }];

    const questions = splitSentences(text)
      .filter((s) => s.trim().endsWith("?"))
      .map((q) => ({ text: q }));

    const titleGuess = paragraphs[0]?.split(/[.!?\n]/)[0]?.trim().slice(0, 80) || "Untitled resource";

    return {
      title: titleGuess,
      sections,
      questions,
      vocabulary: difficultWords(text, 10),
      rawText: text,
    };
  }

  async adaptText({ text }: { text: string }): Promise<AIResult<AccessibleVersion>> {
    const paragraphs = splitParagraphs(text);
    const sections: ExtractedSection[] = (paragraphs.length ? paragraphs : [text]).map((p) => ({
      heading: null,
      paragraphs: splitSentences(p),
    }));
    return { data: { sections }, groundedIn: text, provider: this.name };
  }

  async explainText({ text, question }: { text: string; question?: string }): Promise<AIResult<string>> {
    const sentences = splitSentences(text).slice(0, 3);
    const gist = sentences.join(" ");
    const explanation = question
      ? `Looking at the text, here's what's relevant to "${question}": ${gist || "the source doesn't say enough to answer that yet."}`
      : `In simpler terms: ${gist || "this section is short — try selecting a longer passage to explain."}`;
    return { data: explanation, groundedIn: text, provider: this.name };
  }

  async generateVocabulary({ text }: { text: string }): Promise<AIResult<VocabularyEntry[]>> {
    const words = difficultWords(text, 8);
    const sentences = splitSentences(text);
    const entries: VocabularyEntry[] = words.map((word) => {
      const example = sentences.find((s) => s.toLowerCase().includes(word)) ?? sentences[0] ?? "";
      return {
        term: titleCase(word),
        definition: `A key term from this material — ask your AI tutor or teacher to confirm the exact meaning of "${word}" in this context.`,
        example,
      };
    });
    return { data: entries, groundedIn: text, provider: this.name };
  }

  async generatePractice({ text, count = 5 }: { text: string; count?: number }): Promise<AIResult<PracticeQuestion[]>> {
    const sentences = splitSentences(text).filter((s) => s.split(" ").length > 6);
    const picked = sentences.slice(0, count);
    const questions: PracticeQuestion[] = picked.map((sentence) => {
      const words = sentence.replace(/[.?!]$/, "").split(" ");
      const blankIndex = words.findIndex((w) => w.length > 5 && !COMMON_WORDS.has(w.toLowerCase()));
      const answer = blankIndex >= 0 ? words[blankIndex].replace(/[,.]$/, "") : words[words.length - 1];
      const prompt = blankIndex >= 0
        ? words.map((w, i) => (i === blankIndex ? "_____" : w)).join(" ")
        : `What is the key idea in: "${sentence}"?`;
      return {
        question: prompt,
        type: "short_answer",
        answer,
        sourceQuote: sentence,
      };
    });
    return { data: questions, groundedIn: text, provider: this.name };
  }

  async generateRevisionGuide({ text }: { text: string }): Promise<AIResult<RevisionGuide>> {
    const sentences = splitSentences(text);
    const summary = sentences.slice(0, 2).join(" ") || "No content to summarize yet.";
    const keyPoints = sentences.slice(0, 6).map((s) => s.trim());
    const vocab = await this.generateVocabulary({ text });
    return {
      data: { summary, keyPoints, vocabulary: vocab.data.slice(0, 5) },
      groundedIn: text,
      provider: this.name,
    };
  }
}
