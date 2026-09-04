"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateReadingPreferencesAction } from "@/lib/actions/reading-preferences";
import type { ReadingPreferences } from "@/lib/data/reading-preferences";
import { cn } from "@/lib/utils";

export function AccessibilitySettingsForm({ initial }: { initial: ReadingPreferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<ReadingPreferences>) {
    setPrefs((p) => ({ ...p, ...patch }));
  }

  async function save() {
    setSaving(true);
    const result = await updateReadingPreferencesAction(prefs);
    setSaving(false);
    if (result?.error) toast.error(result.error);
    else toast.success("Preferences saved");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Font size ({prefs.font_size}px)</Label>
          <Slider min={14} max={32} step={1} value={[prefs.font_size]} onValueChange={([v]) => update({ font_size: v })} />
        </div>
        <div className="space-y-2">
          <Label>Line spacing ({prefs.line_spacing.toFixed(1)})</Label>
          <Slider min={1.2} max={2.4} step={0.1} value={[prefs.line_spacing]} onValueChange={([v]) => update({ line_spacing: v })} />
        </div>
        <div className="space-y-2">
          <Label>Letter spacing ({prefs.letter_spacing.toFixed(2)}em)</Label>
          <Slider min={0} max={0.15} step={0.01} value={[prefs.letter_spacing]} onValueChange={([v]) => update({ letter_spacing: v })} />
        </div>
        <div className="space-y-2">
          <Label>Word spacing ({prefs.word_spacing.toFixed(2)}em)</Label>
          <Slider min={0} max={0.4} step={0.02} value={[prefs.word_spacing]} onValueChange={([v]) => update({ word_spacing: v })} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Use a legible reading font</p>
            <p className="text-xs text-muted-foreground">Atkinson Hyperlegible, designed for readability</p>
          </div>
          <Switch checked={prefs.dyslexia_font} onCheckedChange={(v) => update({ dyslexia_font: v })} />
        </div>
        <div className="space-y-2">
          <Label>Highlight while reading</Label>
          <Select value={prefs.highlight_mode} onValueChange={(v) => update({ highlight_mode: v as ReadingPreferences["highlight_mode"] })}>
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
          <Label>Background</Label>
          <Select value={prefs.background} onValueChange={(v) => update({ background: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="cream">Cream</SelectItem>
              <SelectItem value="sage">Sage</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Live preview</p>
        <div
          className={cn(
            "rounded-2xl border border-border p-6",
            prefs.background === "dark" && "bg-neutral-900 text-neutral-100",
            prefs.background === "cream" && "bg-[#fbf3e3] text-neutral-900",
            prefs.background === "sage" && "bg-[#eaf1e7] text-neutral-900",
            prefs.background === "white" && "bg-white text-neutral-900",
          )}
          style={{
            fontSize: `${prefs.font_size}px`,
            lineHeight: prefs.line_spacing,
            letterSpacing: `${prefs.letter_spacing}em`,
            wordSpacing: `${prefs.word_spacing}em`,
            fontFamily: prefs.dyslexia_font ? "var(--font-legible)" : "var(--font-sans)",
          }}
        >
          Plants make their own food using sunlight, water, and air. This process is called
          photosynthesis, and it happens mostly in the leaves.
        </div>
      </div>
    </div>
  );
}
