import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { MessagesLayout } from "@/components/messages/messages-layout";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getConversationPreviews, getMessageableContacts, getProfileName, getThreadMessages } from "@/lib/data/messages";

export const metadata: Metadata = { title: "Messages" };

export default async function TeacherMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { with: withId } = await searchParams;
  const user = await getCurrentUser();
  const profile = user!.profile!;

  const [contacts, previews] = await Promise.all([
    getMessageableContacts(profile.id, profile.role),
    getConversationPreviews(profile.id),
  ]);

  const thread = withId ? await getThreadMessages(profile.id, withId) : [];
  const contactName = withId ? await getProfileName(withId) : undefined;

  return (
    <div>
      <PageHeader title="Messages" description="Stay connected with parents about what's happening in class." />
      <MessagesLayout
        basePath="/teacher/messages"
        contacts={contacts}
        previews={previews}
        selectedContactId={withId}
        selectedContactName={contactName}
        thread={thread}
        profileId={profile.id}
      />
    </div>
  );
}
