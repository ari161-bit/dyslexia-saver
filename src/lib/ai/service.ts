import "server-only";
import { MockAIProvider } from "./mock-provider";
import { GroqAIProvider } from "./groq-provider";
import { AIServiceError, type AIService } from "./types";

const BLOCKED_PATTERNS = [/\bself[- ]harm\b/i, /\bhow to (make|build) a (bomb|weapon)\b/i];

function moderate(text: string) {
  if (BLOCKED_PATTERNS.some((re) => re.test(text))) {
    throw new AIServiceError("Content flagged by safety filters", "moderation_blocked");
  }
}

function getProvider(): AIService {
  const providerName = (process.env.AI_PROVIDER ?? "mock")
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();
  switch (providerName) {
    case "groq":
      return new GroqAIProvider();
    case "mock":
    default:
      return new MockAIProvider();
    // case "openai": return new OpenAIProvider();
    // case "anthropic": return new AnthropicProvider();
  }
}

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_PER_MINUTE = 60;

function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  if (bucket.count >= RATE_LIMIT_PER_MINUTE) {
    throw new AIServiceError("Too many AI requests, please wait a moment", "rate_limited");
  }
  bucket.count += 1;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err instanceof AIServiceError && err.code !== "provider_error") throw err;
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("AI provider failed");
}

function log(method: string, meta: Record<string, unknown>) {
  console.log(`[ai] ${method}`, { ...meta, ts: new Date().toISOString() });
}

class GuardedAIService implements AIService {
  constructor(private readonly provider: AIService, private readonly rateLimitKey: string) {}

  async extractContent(input: { text: string; fileType: string }) {
    checkRateLimit(this.rateLimitKey);
    moderate(input.text);
    log("extractContent", { chars: input.text.length, fileType: input.fileType });
    return withRetry(() => this.provider.extractContent(input));
  }

  async adaptText(input: { text: string }) {
    checkRateLimit(this.rateLimitKey);
    moderate(input.text);
    log("adaptText", { chars: input.text.length });
    return withRetry(() => this.provider.adaptText(input));
  }

  async explainText(input: { text: string; question?: string }) {
    checkRateLimit(this.rateLimitKey);
    moderate(input.text + (input.question ?? ""));
    log("explainText", { chars: input.text.length, hasQuestion: !!input.question });
    return withRetry(() => this.provider.explainText(input));
  }

  async generateVocabulary(input: { text: string }) {
    checkRateLimit(this.rateLimitKey);
    moderate(input.text);
    log("generateVocabulary", { chars: input.text.length });
    return withRetry(() => this.provider.generateVocabulary(input));
  }

  async generatePractice(input: { text: string; count?: number }) {
    checkRateLimit(this.rateLimitKey);
    moderate(input.text);
    log("generatePractice", { chars: input.text.length, count: input.count });
    return withRetry(() => this.provider.generatePractice(input));
  }

  async generateRevisionGuide(input: { text: string }) {
    checkRateLimit(this.rateLimitKey);
    moderate(input.text);
    log("generateRevisionGuide", { chars: input.text.length });
    return withRetry(() => this.provider.generateRevisionGuide(input));
  }
}

export function getAIService(rateLimitKey: string): AIService {
  return new GuardedAIService(getProvider(), rateLimitKey);
}

export { AIServiceError } from "./types";
export type * from "./types";
