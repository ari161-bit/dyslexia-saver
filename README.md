# Brightpath

An accessible learning platform for students with dyslexia, and the teachers, parents, and
schools who support them. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS,
shadcn/ui, and Supabase.

## Stack

- **Next.js 16** (App Router, Server Actions) + React 19 + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives, Lucide icons)
- **Supabase**: Postgres, Auth, Row Level Security, Storage
- **recharts** for lightweight progress charts
- Browser **SpeechSynthesis API** for real, working text-to-speech in the reader (no external
  TTS key required)
- A provider-agnostic `AIService` abstraction (`src/lib/ai`) — ships with a deterministic mock
  provider so the whole app runs with zero API keys; swap in a real LLM/OCR provider later
  without touching call sites

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.local.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   (Project Settings → API in the Supabase dashboard.)
3. Run the SQL migrations, in order, against your project. Easiest path: open the Supabase SQL
   Editor and paste the contents of each file in `supabase/migrations/`, in this order:
   - `0001_schema.sql` — tables and enums
   - `0002_rls.sql` — Row Level Security policies (every table is RLS-protected)
   - `0003_storage.sql` — storage buckets (`resources`, `avatars`) and their policies
   - `0004_public_rpcs.sql` — minimal-exposure lookup functions used by signup/join flows

   If you have the Supabase CLI linked to your project instead, `supabase db push` will apply
   the same files.
4. In Authentication → URL Configuration, set the Site URL to your app's URL (e.g.
   `http://localhost:3000` while developing) so email confirmation and password reset links
   redirect correctly.

## 2. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 3. Seed demo data (optional)

Populates 1 school, 3 teachers, 8 students, 4 parents, classes, a couple of sample resources
with generated adaptations, assignments, and two weeks of progress history.

```bash
npm run seed
```

All seed accounts use the password `Demo1234!` (emails printed at the end of the script, e.g.
`teacher1@brightpath.demo`, `student1@brightpath.demo`, `parent1@brightpath.demo`).

## Architecture notes

- **Roles**: `student`, `parent`, `teacher`, `school_admin` — enforced by Postgres RLS, not just
  UI checks. See `supabase/migrations/0002_rls.sql`.
- **School admin & teacher signup is gated**: creating a *new* school auto-approves its first
  admin (like standing up a new workspace); joining an *existing* school as a teacher or admin
  requires approval from that school's admin. See `src/lib/actions/auth.ts` and
  `src/app/(app)/school/teachers/page.tsx`.
- **Class / parent-child linking** uses short join codes (`classes.join_code`,
  `profiles.student_code`) resolved through security-definer RPCs, so nobody can browse the
  full user directory to find who to link to.
- **AI adaptations are never auto-published**: `resource_adaptations.approved` starts `false`;
  a teacher must explicitly publish before students can see it (`src/components/adapt`).
- **Reader** (`src/app/read/[resourceId]`) is a distraction-free route outside the dashboard
  shell, with persisted reading preferences, live TTS with paragraph/sentence/word highlighting,
  text selection → AI tutor / vocabulary lookup / notes.
- **Swapping the AI provider**: implement the `AIService` interface in `src/lib/ai/types.ts`,
  register it in `src/lib/ai/service.ts`, and set `AI_PROVIDER` in `.env.local`. Real OCR for
  PDFs/DOCX/images is a further extension point — uploads of non-plain-text files currently
  store the file and a placeholder note in `resources.extracted_text` until an OCR provider is
  wired in.

## Deploying

Any Next.js host works (Vercel, etc.). Set the same environment variables from `.env.local` in
your hosting provider, and make sure the Supabase Auth Site URL matches your production domain.
