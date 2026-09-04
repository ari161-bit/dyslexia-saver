"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Pause, Play, RefreshCw, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  generateAdaptationAction,
  setAdaptationApprovedAction,
  updateAdaptationAction,
} from "@/lib/actions/adaptations";
import type { AdaptationType } from "@/lib/types/database";

const TYPE_COPY: Record<AdaptationType, { title: string; description: string }> = {
  accessible: { title: "Accessible Reading", description: "Presentation adjusted for easier reading — meaning unchanged." },
  explain: { title: "Explain", description: "A simpler explanation of the same material." },
  vocabulary: { title: "Vocabulary", description: "Key terms identified from the source text." },
  breakdown: { title: "Break It Down", description: "Complex content divided into manageable steps." },
  audio: { title: "Audio", description: "Read the content aloud with adjustable speed." },
  practice: { title: "Practice", description: "Questions generated only from the source material." },
  revision: { title: "Revision", description: "A concise guide for reviewing this material." },
};

interface Props {
  resourceId: string;
  type: AdaptationType;
  initial: { id: string; content: unknown; approved: boolean } | null;
  onAssign: () => void;
}

export function AdaptationPanel({ resourceId, type, initial, onAssign }: Props) {
  const [adaptationId, setAdaptationId] = useState(initial?.id ?? null);
  const [content, setContent] = useState<unknown>(initial?.content ?? null);
  const [approved, setApproved] = useState(initial?.approved ?? false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const copy = TYPE_COPY[type];

  async function generate() {
    setLoading(true);
    const result = await generateAdaptationAction(resourceId, type);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setAdaptationId(result.adaptationId ?? null);
    setContent(result.content);
    setApproved(false);
  }

  async function save() {
    if (!adaptationId) return;
    setSaving(true);
    const result = await updateAdaptationAction(adaptationId, content, resourceId);
    setSaving(false);
    if (result.error) toast.error(result.error);
    else toast.success("Saved");
  }

  async function togglePublish() {
    if (!adaptationId) return;
    const next = !approved;
    const result = await setAdaptationApprovedAction(adaptationId, next, resourceId);
    if (result.error) toast.error(result.error);
    else {
      setApproved(next);
      toast.success(next ? "Published to students" : "Unpublished");
    }
  }

  function speak(text: string) {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  if (!content) {
    return (
      <EmptyState
        icon={Sparkles}
        title={`Generate ${copy.title}`}
        description={copy.description}
        action={
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-heading font-semibold">{copy.title}</p>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Badge variant={approved ? "default" : "secondary"} className="font-normal">
          {approved ? "Published" : "Draft"}
        </Badge>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {renderEditor(type, content, setContent, speaking, speak)}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Regenerate
        </Button>
        <Button variant="outline" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
        <Button variant="outline" onClick={onAssign}>Assign</Button>
        <Button onClick={togglePublish}>
          <CheckCircle2 className="h-4 w-4" /> {approved ? "Unpublish" : "Publish to students"}
        </Button>
      </div>
    </div>
  );
}

function renderEditor(
  type: AdaptationType,
  content: unknown,
  setContent: (c: unknown) => void,
  speaking: boolean,
  speak: (text: string) => void,
) {
  if (type === "accessible" || type === "breakdown") {
    const items: string[] =
      type === "accessible"
        ? (content as { sections: { paragraphs: string[] }[] }).sections.flatMap((s) => s.paragraphs)
        : (content as { steps: string[] }).steps;
    return (
      <div className="space-y-3">
        {items.map((text, i) => (
          <div key={i} className="flex gap-2">
            <span className="mt-2 text-xs font-medium text-muted-foreground">{i + 1}</span>
            <Textarea
              value={text}
              rows={2}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                setContent(type === "accessible" ? { sections: [{ heading: null, paragraphs: next }] } : { steps: next });
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (type === "explain") {
    const text = (content as { text: string }).text;
    return <Textarea rows={6} value={text} onChange={(e) => setContent({ text: e.target.value })} />;
  }

  if (type === "vocabulary") {
    const entries = (content as { entries: { term: string; definition: string; example: string }[] }).entries;
    return (
      <div className="space-y-4">
        {entries.map((entry, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border/60 p-3">
            <Input
              value={entry.term}
              className="font-semibold"
              onChange={(e) => {
                const next = [...entries];
                next[i] = { ...next[i], term: e.target.value };
                setContent({ entries: next });
              }}
            />
            <Textarea
              value={entry.definition}
              rows={2}
              onChange={(e) => {
                const next = [...entries];
                next[i] = { ...next[i], definition: e.target.value };
                setContent({ entries: next });
              }}
            />
            <p className="text-xs text-muted-foreground">Example: {entry.example}</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "practice") {
    const questions = (content as { questions: { question: string; answer: string; sourceQuote: string }[] }).questions;
    return (
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i} className="space-y-2 rounded-xl border border-border/60 p-3">
            <Textarea
              value={q.question}
              rows={2}
              onChange={(e) => {
                const next = [...questions];
                next[i] = { ...next[i], question: e.target.value };
                setContent({ questions: next });
              }}
            />
            <Input
              value={q.answer}
              onChange={(e) => {
                const next = [...questions];
                next[i] = { ...next[i], answer: e.target.value };
                setContent({ questions: next });
              }}
            />
            <p className="text-xs text-muted-foreground">From the source: &ldquo;{q.sourceQuote}&rdquo;</p>
          </div>
        ))}
      </div>
    );
  }

  if (type === "revision") {
    const guide = content as { summary: string; keyPoints: string[]; vocabulary: { term: string; definition: string }[] };
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Summary</p>
          <Textarea value={guide.summary} rows={3} onChange={(e) => setContent({ ...guide, summary: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Key points</p>
          {guide.keyPoints.map((point, i) => (
            <Input
              key={i}
              value={point}
              onChange={(e) => {
                const next = [...guide.keyPoints];
                next[i] = e.target.value;
                setContent({ ...guide, keyPoints: next });
              }}
            />
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Vocabulary</p>
          {guide.vocabulary.map((v, i) => (
            <p key={i} className="text-sm"><span className="font-medium">{v.term}:</span> {v.definition}</p>
          ))}
        </div>
      </div>
    );
  }

  if (type === "audio") {
    const text = (content as { text: string }).text;
    return (
      <div className="space-y-3">
        <Button variant="outline" onClick={() => speak(text)}>
          {speaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {speaking ? "Pause preview" : "Preview audio"}
        </Button>
        <p className="max-h-48 overflow-y-auto whitespace-pre-line text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }

  return null;
}
