import "server-only";
import {
  AIServiceError,
  type AccessibleVersion,
  type AIResult,
  type AIService,
  type ExtractedContent,
  type PracticeQuestion,
  type RevisionGuide,
  type VocabularyEntry,
} from "./types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are a content-adaptation engine for Brightpath, a learning platform for students with dyslexia.
Rules:
- Only use information present in the source text the user gives you. Never invent facts, names, numbers, or details not in the source.
- Keep meaning unchanged when adapting presentation.
- Write in clear, plain language suited to a struggling reader — short sentences, common words.
- Always respond with a single valid JSON object matching the schema described in the user's instructions. No markdown, no commentary, no code fences.`;

async function callGroq(prompt: string): Promise<unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AIServiceError("Groq API key is not configured", "provider_error");

  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    throw new AIServiceError("Could not reach the AI provider", "provider_error");
  }

  if (response.status === 429) throw new AIServiceError("Rate limited by AI provider", "rate_limited");
  if (!response.ok) throw new AIServiceError(`AI provider error (${response.status})`, "provider_error");

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new AIServiceError("AI provider returned no content", "provider_error");

  try {
    return JSON.parse(content);
  } catch {
    throw new AIServiceError("AI provider returned malformed JSON", "provider_error");
  }
}

function truncate(text: string, max = 12000): string {
  return text.length > max ? text.slice(0, max) : text;
}

export class GroqAIProvider implements AIService {
  readonly name = "groq";

  async extractContent({ text }: { text: string; fileType: string }): Promise<ExtractedContent> {
    if (!text.trim()) {
      return { title: "Untitled resource", sections: [], questions: [], vocabulary: [], rawText: text };
    }

    const result = (await callGroq(
      `Source text:\n"""${truncate(text)}"""\n\nReturn JSON: {"title": string, "sections": [{"heading": string|null, "paragraphs": string[]}], "questions": [{"text": string}], "vocabulary": string[]}. "sections" should break the source into logical parts with short paragraphs. "questions" are any questions already present in the source text (empty array if none). "vocabulary" is up to 10 words from the source likely to be difficult for the reader.`,
    )) as ExtractedContent;

    return { ...result, rawText: text };
  }

  async adaptText({ text }: { text: string }): Promise<AIResult<AccessibleVersion>> {
    const result = (await callGroq(
      `Source text:\n"""${truncate(text)}"""\n\nRewrite this for easier reading: shorter sentences, simpler words, meaning unchanged. Return JSON: {"sections": [{"heading": string|null, "paragraphs": string[]}]}.`,
    )) as AccessibleVersion;
    return { data: result, groundedIn: text, provider: this.name };
  }

  async explainText({ text, question }: { text: string; question?: string }): Promise<AIResult<string>> {
    const prompt = question
      ? `Source text:\n"""${truncate(text)}"""\n\nA student asked: "${question}". Answer using only the source text, in 2-4 simple sentences. Return JSON: {"explanation": string}.`
      : `Source text:\n"""${truncate(text)}"""\n\nExplain this passage in simpler terms, in 2-4 short sentences, using only what's in the text. Return JSON: {"explanation": string}.`;
    const result = (await callGroq(prompt)) as { explanation: string };
    return { data: result.explanation, groundedIn: text, provider: this.name };
  }

  async generateVocabulary({ text }: { text: string }): Promise<AIResult<VocabularyEntry[]>> {
    const result = (await callGroq(
      `Source text:\n"""${truncate(text)}"""\n\nIdentify up to 8 words or terms from this text a struggling reader might find difficult. For each, give a simple definition (in the context of this text) and copy one example sentence from the source that contains the word. Return JSON: {"entries": [{"term": string, "definition": string, "example": string}]}.`,
    )) as { entries: VocabularyEntry[] };
    return { data: result.entries ?? [], groundedIn: text, provider: this.name };
  }

  async generatePractice({ text, count = 5 }: { text: string; count?: number }): Promise<AIResult<PracticeQuestion[]>> {
    const result = (await callGroq(
      `Source text:\n"""${truncate(text)}"""\n\nWrite ${count} short-answer practice questions based only on this text. Each answer must be a single word or short phrase that appears in or is directly supported by the source, so it can be checked by exact match. Include the exact sentence from the source that supports each answer. Return JSON: {"questions": [{"question": string, "type": "short_answer", "answer": string, "sourceQuote": string}]}.`,
    )) as { questions: PracticeQuestion[] };
    return { data: result.questions ?? [], groundedIn: text, provider: this.name };
  }

  async generateRevisionGuide({ text }: { text: string }): Promise<AIResult<RevisionGuide>> {
    const result = (await callGroq(
      `Source text:\n"""${truncate(text)}"""\n\nCreate a short revision guide from this text. Return JSON: {"summary": string, "keyPoints": string[], "vocabulary": [{"term": string, "definition": string, "example": string}]}. "summary" is 2-3 sentences. "keyPoints" is up to 6 short bullet points. "vocabulary" is up to 5 key terms.`,
    )) as RevisionGuide;
    return { data: result, groundedIn: text, provider: this.name };
  }
}
