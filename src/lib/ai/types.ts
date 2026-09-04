export interface ExtractedSection {
  heading: string | null;
  paragraphs: string[];
}

export interface ExtractedQuestion {
  text: string;
  answerHint?: string;
}

export interface ExtractedContent {
  title: string;
  sections: ExtractedSection[];
  questions: ExtractedQuestion[];
  vocabulary: string[];
  rawText: string;
}

export interface VocabularyEntry {
  term: string;
  definition: string;
  example: string;
}

export interface PracticeQuestion {
  question: string;
  type: "multiple_choice" | "short_answer";
  options?: string[];
  answer: string;
  sourceQuote: string;
}

export interface RevisionGuide {
  summary: string;
  keyPoints: string[];
  vocabulary: VocabularyEntry[];
}

export interface AccessibleVersion {
  sections: ExtractedSection[];
}

export interface AIResult<T> {
  data: T;
  groundedIn: string;
  provider: string;
}

export interface AIService {
  extractContent(input: { text: string; fileType: string }): Promise<ExtractedContent>;
  adaptText(input: { text: string }): Promise<AIResult<AccessibleVersion>>;
  explainText(input: { text: string; question?: string }): Promise<AIResult<string>>;
  generateVocabulary(input: { text: string }): Promise<AIResult<VocabularyEntry[]>>;
  generatePractice(input: { text: string; count?: number }): Promise<AIResult<PracticeQuestion[]>>;
  generateRevisionGuide(input: { text: string }): Promise<AIResult<RevisionGuide>>;
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "rate_limited" | "moderation_blocked" | "provider_error" | "invalid_input",
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}
