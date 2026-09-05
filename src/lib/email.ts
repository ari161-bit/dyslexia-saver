import "server-only";
import { Resend } from "resend";

// Mirrors the AI service's "runs with zero API keys" philosophy: without
// RESEND_API_KEY set, invites still work end-to-end — the link just isn't
// emailed automatically, so the inviter copies/shares it manually. Once a
// key is set, delivery becomes real with no code changes.
export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  schoolName: string;
  className?: string | null;
  role: "teacher" | "student" | "school_admin";
  acceptUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — invite for ${opts.to} not sent. Link: ${opts.acceptUrl}`);
    return { sent: false, reason: "not_configured" };
  }

  const resend = new Resend(apiKey);
  const roleLabel = opts.role === "school_admin" ? "an admin" : opts.role === "teacher" ? "a teacher" : "a student";
  const context = opts.className ? `${opts.schoolName} — ${opts.className}` : opts.schoolName;

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Brightpath <onboarding@resend.dev>",
    to: opts.to,
    subject: `${opts.inviterName} invited you to Brightpath`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 4px;">Brightpath</p>
        <p style="color: #666; margin: 0 0 24px;">Accessible learning for students with dyslexia</p>
        <p><strong>${opts.inviterName}</strong> invited you to join <strong>${context}</strong> as ${roleLabel} on Brightpath.</p>
        <a href="${opts.acceptUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ea580c; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Accept invite
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">This invite expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error("[email] Resend error", error);
    return { sent: false, reason: error.message };
  }
  return { sent: true };
}
