import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageComposer } from "./message-composer";
import { cn } from "@/lib/utils";
import type { Contact, ConversationPreview } from "@/lib/data/messages";
import type { Tables } from "@/lib/types/database";

export function MessagesLayout({
  basePath,
  contacts,
  previews,
  selectedContactId,
  selectedContactName,
  thread,
  profileId,
}: {
  basePath: string;
  contacts: Contact[];
  previews: ConversationPreview[];
  selectedContactId?: string;
  selectedContactName?: string;
  thread: Tables<"bp_messages">[];
  profileId: string;
}) {
  const previewByContact = new Map(previews.map((p) => [p.contactId, p]));
  const allContacts = [...contacts];
  for (const p of previews) {
    if (!allContacts.find((c) => c.id === p.contactId)) {
      allContacts.push({ id: p.contactId, name: "Conversation", subtitle: "" });
    }
  }

  if (allContacts.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages"
        description="You're all caught up. Conversations will appear here once a connection is made."
      />
    );
  }

  return (
    <div className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[280px_1fr]" style={{ minHeight: 480 }}>
      <div className="divide-y divide-border overflow-y-auto border-b border-border md:border-b-0 md:border-r">
        {allContacts.map((c) => {
          const preview = previewByContact.get(c.id);
          return (
            <Link
              key={c.id}
              href={`${basePath}?with=${c.id}`}
              className={cn(
                "block px-4 py-3 transition-colors hover:bg-accent/40",
                selectedContactId === c.id && "bg-accent/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{c.name}</p>
                {preview?.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">{c.subtitle}</p>
              {preview ? <p className="mt-1 truncate text-xs text-muted-foreground">{preview.lastMessage}</p> : null}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col">
        {selectedContactId ? (
          <>
            <div className="border-b border-border px-4 py-3">
              <p className="font-medium">{selectedContactName}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {thread.map((m) => (
                <div key={m.id} className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm", m.sender_id === profileId ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary")}>
                  <p>{m.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                </div>
              ))}
            </div>
            <MessageComposer recipientId={selectedContactId} pathname={`${basePath}?with=${selectedContactId}`} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            Choose a conversation to get started.
          </div>
        )}
      </div>
    </div>
  );
}
