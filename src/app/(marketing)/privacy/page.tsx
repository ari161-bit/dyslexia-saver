import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">
        <p>
          Brightpath (&quot;we&quot;, &quot;our&quot;) provides an accessible learning support
          platform for students, teachers, parents, and schools. This policy explains what
          information we collect, how we use it, and the choices you have — with particular
          care given that many of our users are minors.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account information:</strong> name, email address, and role (student, parent, teacher, or school admin).</li>
          <li><strong>Learning content:</strong> documents you upload, extracted text, AI-generated adaptations, notes, and reading preferences.</li>
          <li><strong>Activity data:</strong> assignments, submissions, and practice/reading engagement — used to show progress, never to diagnose or label a student.</li>
          <li><strong>Relationship data:</strong> links between parents and students, and between teachers, classes, and schools, used only to control who can see what.</li>
          <li><strong>Messages:</strong> content sent between parents and teachers within the platform.</li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>To operate core features: adapting materials, tracking assignments, generating practice questions, and showing progress.</li>
          <li>To enforce access control — for example, a parent can only see their own linked child&apos;s data, and a teacher can only see their own students.</li>
          <li>To communicate account and safety-related notices.</li>
        </ul>
        <p>We do not sell personal information, and we do not use student data for advertising.</p>

        <h2>Children&apos;s privacy</h2>
        <p>
          Brightpath is designed to be used within a school or family context, not signed up
          for independently by young children. Student accounts are connected to a teacher
          (via a school) and, optionally, a parent — both relationships require explicit
          confirmation before either party can view the student&apos;s data. Parents may
          contact us at any time to review or request deletion of their child&apos;s
          information.
        </p>

        <h2>AI-generated content</h2>
        <p>
          Adaptations, explanations, vocabulary, and practice questions are generated from the
          material a teacher or student uploads. Teacher-created adaptations are never shown
          to students until a teacher explicitly reviews and publishes them. We do not use
          uploaded content to train third-party models.
        </p>

        <h2>Data sharing</h2>
        <p>
          We do not share personal information with third parties except: service providers
          who help us operate the platform (such as our database and hosting providers) under
          confidentiality obligations, or where required by law.
        </p>

        <h2>Data retention and deletion</h2>
        <p>
          We retain account and learning data for as long as the account is active. Any user
          can request deletion of their account and associated data by contacting us at the
          email below; school administrators can also request removal of a school&apos;s data.
        </p>

        <h2>Security</h2>
        <p>
          Access to data is enforced at the database level (row-level security), so each
          account can only ever query the rows it is authorized to see — not just restricted
          by the app&apos;s interface.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Update or correct your account information at any time in Settings.</li>
          <li>Request an export or deletion of your data by contacting us.</li>
          <li>Parents may withdraw consent for a linked child at any time.</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Questions about this policy or your data can be sent to{" "}
          <a href="mailto:privacy@brightpath.app" className="text-primary underline">privacy@brightpath.app</a>.
        </p>
      </div>
    </div>
  );
}
