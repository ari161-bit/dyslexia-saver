"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Settings2,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ExtractedSection } from "@/lib/ai/types";
import type { ReadingPreferences } from "@/lib/data/reading-preferences";
import { updateReadingPreferencesAction } from "@/lib/actions/reading-preferences";
import { explainSelectionAction, lookupWordAction, saveNoteAction } from "@/lib/actions/ai-actions";
import type { Tables } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const BACKGROUNDS: Record<string, string> = {
  white: "bg-white text-neutral-900",
  cream: "bg-[#fbf3e3] text-neutral-900",
  sage: "bg-[#eaf1e7] text-neutral-900",
  dark: "bg-neutral-900 text-neutral-100",
};

const WIDTHS: Record<string, string> = {
  narrow: "max-w-xl",
  comfortable: "max-w-2xl",
  wide: "max-w-4xl",
};

interface FlatParagraph {
  sectionIndex: number;
  paragraphIndexInSection: number;
  heading: string | null;
  text: string;
}

function splitSentences(text: string): { text: string; start: number }[] {
  const result: { text: string; start: number }[] = [];
  const re = /[^.!?]+[.!?]*\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[0].trim()) result.push({ text: m[0], start: m.index });
  }
  return result.length ? result : [{ text, start: 0 }];
}

export function ReaderView({
  resource,
  sections,
  initialPreferences,
  notes,
}: {
  resource: Tables<"resources">;
  sections: ExtractedSection[];
  initialPreferences: ReadingPreferences;
  notes: Tables<"notes">[];
}) {
  const [prefs, setPrefs] = useState(initialPreferences);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [charIndex, setCharIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const paragraphs = useMemo<FlatParagraph[]>(() => {
    const flat: FlatParagraph[] = [];
    sections.forEach((section, sectionIndex) => {
      section.paragraphs.forEach((p, paragraphIndexInSection) => {
        flat.push({ sectionIndex, paragraphIndexInSection, heading: paragraphIndexInSection === 0 ? section.heading : null, text: p });
      });
    });
    return flat.length ? flat : [{ sectionIndex: 0, paragraphIndexInSection: 0, heading: null, text: "No content yet." }];
  }, [sections]);

  const savePrefs = useCallback((patch: Partial<ReadingPreferences>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    const t = setTimeout(() => updateReadingPreferencesAction(patch), 400);
    return () => clearTimeout(t);
  }, []);

  const speakParagraph = useCallback(
    (index: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const text = paragraphs[index]?.text;
      if (!text) {
        setIsSpeaking(false);
        setPlayingIndex(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = prefs.reading_speed;
      utterance.onboundary = (e) => {
        if (e.name === "word" || e.charIndex !== undefined) setCharIndex(e.charIndex);
      };
      utterance.onend = () => {
        if (index + 1 < paragraphs.length) {
          setPlayingIndex(index + 1);
          setCharIndex(0);
        } else {
          setIsSpeaking(false);
          setPlayingIndex(null);
        }
      };
      window.speechSynthesis.speak(utterance);
      setPlayingIndex(index);
      setIsSpeaking(true);
      setCharIndex(0);
    },
    [paragraphs, prefs.reading_speed],
  );

  useEffect(() => {
    if (isSpeaking && playingIndex !== null) speakParagraph(playingIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingIndex]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  function togglePlay() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    speakParagraph(playingIndex ?? 0);
  }

  function jump(delta: number) {
    const target = Math.min(Math.max((playingIndex ?? 0) + delta, 0), paragraphs.length - 1);
    speakParagraph(target);
  }

  function handleMouseUp() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (text && sel && sel.rangeCount > 0 && containerRef.current?.contains(sel.anchorNode)) {
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setSelection({ text, x: rect.left + rect.width / 2, y: rect.top + window.scrollY });
    } else {
      setSelection(null);
    }
  }

  async function handleExplain() {
    if (!selection) return;
    setTutorLoading(true);
    setTutorAnswer(null);
    const result = await explainSelectionAction(selection.text);
    setTutorLoading(false);
    setTutorAnswer(result.explanation ?? result.error ?? "Something went wrong.");
  }

  async function handleLookup() {
    if (!selection) return;
    setTutorLoading(true);
    setTutorAnswer(null);
    const result = await lookupWordAction(selection.text.split(" ")[0], resource.extracted_text ?? selection.text);
    setTutorLoading(false);
    if (result.error) setTutorAnswer(result.error);
    else setTutorAnswer(`${result.term}: ${result.definition}${result.example ? `\n\n"${result.example}"` : ""}`);
  }

  async function handleSaveNote() {
    if (!selection) return;
    const result = await saveNoteAction(resource.id, selection.text, selection.text);
    if (result.error) toast.error(result.error);
    else toast.success("Note saved");
    setSelection(null);
  }

  async function submitNote() {
    const result = await saveNoteAction(resource.id, noteDraft);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Note saved");
      setNoteDraft("");
      setNoteOpen(false);
    }
  }

  function renderParagraph(p: FlatParagraph, index: number) {
    const isActive = playingIndex === index && isSpeaking;
    if (prefs.highlight_mode === "paragraph") {
      return (
        <p
          key={index}
          className={cn("rounded-lg px-2 py-1 transition-colors", isActive && "bg-accent text-accent-foreground")}
        >
          {p.text}
        </p>
      );
    }
    if (prefs.highlight_mode === "sentence" && isActive) {
      const sentences = splitSentences(p.text);
      const activeSentence = sentences.findIndex(
        (s, i) => charIndex >= s.start && (i === sentences.length - 1 || charIndex < sentences[i + 1].start),
      );
      return (
        <p key={index} className="px-2 py-1">
          {sentences.map((s, i) => (
            <span key={i} className={cn(i === activeSentence && "rounded bg-accent px-0.5 text-accent-foreground")}>
              {s.text}
            </span>
          ))}
        </p>
      );
    }
    if (prefs.highlight_mode === "word" && isActive) {
      const words = p.text.split(/(\s+)/);
      let running = 0;
      let activeWordStart = -1;
      for (const w of words) {
        if (charIndex >= running && charIndex < running + w.length) {
          activeWordStart = running;
          break;
        }
        running += w.length;
      }
      running = 0;
      return (
        <p key={index} className="px-2 py-1">
          {words.map((w, i) => {
            const start = running;
            running += w.length;
            return (
              <span key={i} className={cn(start === activeWordStart && "rounded bg-accent px-0.5 text-accent-foreground")}>
                {w}
              </span>
            );
          })}
        </p>
      );
    }
    return (
      <p key={index} className="px-2 py-1">
        {p.text}
      </p>
    );
  }

  return (
    <div className={cn("min-h-screen", BACKGROUNDS[prefs.background] ?? BACKGROUNDS.cream)}>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/10 bg-inherit/95 px-4 py-3 backdrop-blur">
        <Link href="/student/learning" className="flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="max-w-[45%] truncate text-sm font-semibold">{resource.title}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setFocusMode((v) => !v)} aria-label="Toggle focus mode">
            <BookOpen className="h-[18px] w-[18px]" />
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Reading preferences">
                <Settings2 className="h-[18px] w-[18px]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-sm">
              <SheetTitle className="px-4 pt-4">Reading Preferences</SheetTitle>
              <div className="space-y-6 px-4 py-4">
                <div className="space-y-2">
                  <Label>Font size ({prefs.font_size}px)</Label>
                  <Slider min={14} max={32} step={1} value={[prefs.font_size]} onValueChange={([v]) => savePrefs({ font_size: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Line spacing ({prefs.line_spacing.toFixed(1)})</Label>
                  <Slider min={1.2} max={2.4} step={0.1} value={[prefs.line_spacing]} onValueChange={([v]) => savePrefs({ line_spacing: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Letter spacing ({prefs.letter_spacing.toFixed(2)}em)</Label>
                  <Slider min={0} max={0.15} step={0.01} value={[prefs.letter_spacing]} onValueChange={([v]) => savePrefs({ letter_spacing: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Word spacing ({prefs.word_spacing.toFixed(2)}em)</Label>
                  <Slider min={0} max={0.4} step={0.02} value={[prefs.word_spacing]} onValueChange={([v]) => savePrefs({ word_spacing: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Content width</Label>
                  <Select value={prefs.content_width} onValueChange={(v) => savePrefs({ content_width: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="narrow">Narrow</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="wide">Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <Select value={prefs.alignment} onValueChange={(v) => savePrefs({ alignment: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Background</Label>
                  <Select value={prefs.background} onValueChange={(v) => savePrefs({ background: v })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="cream">Cream</SelectItem>
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Highlight while reading</Label>
                  <Select value={prefs.highlight_mode} onValueChange={(v) => savePrefs({ highlight_mode: v as ReadingPreferences["highlight_mode"] })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="paragraph">Paragraph</SelectItem>
                      <SelectItem value="sentence">Sentence</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Playback speed ({prefs.reading_speed.toFixed(2)}x)</Label>
                  <Slider min={0.5} max={1.75} step={0.25} value={[prefs.reading_speed]} onValueChange={([v]) => savePrefs({ reading_speed: v })} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className={cn("mx-auto px-6 py-10 font-legible", WIDTHS[prefs.content_width] ?? WIDTHS.comfortable, focusMode && "max-w-xl")}
        style={{
          fontSize: `${prefs.font_size}px`,
          lineHeight: prefs.line_spacing,
          letterSpacing: `${prefs.letter_spacing}em`,
          wordSpacing: `${prefs.word_spacing}em`,
          textAlign: prefs.alignment as "left" | "justify",
        }}
      >
        {paragraphs.map((p, i) => (
          <div key={i} className={cn("mb-4", focusMode && playingIndex !== null && playingIndex !== i && isSpeaking && "opacity-40")}>
            {p.heading ? <h2 className="mb-2 font-heading text-xl font-semibold not-italic">{p.heading}</h2> : null}
            {renderParagraph(p, i)}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 z-20 flex items-center justify-center gap-3 border-t border-black/10 bg-inherit/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => jump(-1)} aria-label="Previous paragraph">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button size="icon" className="h-11 w-11 rounded-full" onClick={togglePlay} aria-label={isSpeaking ? "Pause" : "Play"}>
          {isSpeaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={() => jump(1)} aria-label="Next paragraph">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <span className="ml-2 text-xs opacity-70">{prefs.reading_speed.toFixed(2)}x</span>
        <div className="mx-2 h-6 w-px bg-black/10" />
        <Sheet open={noteOpen} onOpenChange={setNoteOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <StickyNote className="h-4 w-4" /> Notes ({notes.length})
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
            <SheetTitle className="px-1">Notes</SheetTitle>
            <div className="space-y-3 px-1 py-3">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Write down something you want to remember..."
                rows={3}
              />
              <Button size="sm" onClick={submitNote} disabled={!noteDraft.trim()}>
                Save note
              </Button>
              <div className="max-h-48 space-y-2 overflow-y-auto pt-2">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet on this resource.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="rounded-lg bg-secondary/50 p-2.5 text-sm">
                      {n.content}
                    </div>
                  ))
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {selection ? (
        <div
          className="fixed z-30 flex -translate-x-1/2 -translate-y-full gap-1 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          style={{ left: selection.x, top: Math.max(selection.y - 8, 8) }}
        >
          <Button size="sm" variant="ghost" onClick={handleExplain}>
            <Sparkles className="h-3.5 w-3.5" /> Explain
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLookup}>
            Look up
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSaveNote}>
            Save
          </Button>
        </div>
      ) : null}

      {tutorLoading || tutorAnswer ? (
        <div className="fixed bottom-20 left-1/2 z-30 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> AI Tutor
            </p>
            <button onClick={() => setTutorAnswer(null)} className="text-xs text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
          {tutorLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking it through...
            </p>
          ) : (
            <p className="whitespace-pre-line text-sm">{tutorAnswer}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
