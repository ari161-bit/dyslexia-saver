"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, ImagePlus, Link2, Loader2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { createCommentAction, createPostAction, type StreamActionResult } from "@/lib/actions/class-stream";
import type { StreamPost } from "@/lib/data/class-stream";

export function ClassStream({ classId, posts, canPost }: { classId: string; posts: StreamPost[]; canPost: boolean }) {
  return (
    <div className="space-y-5">
      {canPost ? <PostComposer classId={classId} /> : null}
      {posts.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No posts yet"
          description={canPost ? "Share something with the class to get the stream started." : "Your teacher hasn't posted anything yet."}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} classId={classId} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostComposer({ classId }: { classId: string }) {
  const [state, formAction, pending] = useActionState<StreamActionResult, FormData>(createPostAction, {});
  const [showLink, setShowLink] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setShowLink(false);
      setShowImage(false);
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <input type="hidden" name="classId" value={classId} />
      <Textarea name="body" rows={3} placeholder="Share something with the class…" required className="resize-none" />
      {showLink ? <Input name="linkUrl" type="url" placeholder="https://…" /> : null}
      {showImage ? <Input name="imageUrl" type="url" placeholder="Image URL — https://…" /> : null}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowLink((v) => !v)}>
            <Link2 className="h-3.5 w-3.5" /> Link
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowImage((v) => !v)}>
            <ImagePlus className="h-3.5 w-3.5" /> Image
          </Button>
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Post
        </Button>
      </div>
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    </form>
  );
}

function PostCard({ classId, post }: { classId: string; post: StreamPost }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">{post.authorName}</p>
        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>

      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="mt-3 max-h-80 w-full rounded-xl object-cover" />
      ) : null}

      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {post.linkUrl}
        </a>
      ) : null}

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {post.comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-semibold">{c.authorName}</span>{" "}
            <span className="text-muted-foreground">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
            <p className="mt-0.5">{c.body}</p>
          </div>
        ))}
        <CommentComposer classId={classId} postId={post.id} />
      </div>
    </div>
  );
}

function CommentComposer({ classId, postId }: { classId: string; postId: string }) {
  const [state, formAction, pending] = useActionState<StreamActionResult, FormData>(createCommentAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex items-start gap-2">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="postId" value={postId} />
      <Input name="body" placeholder="Reply…" required className="h-9" />
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="h-9 flex-shrink-0">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reply"}
      </Button>
      {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}
