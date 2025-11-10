"use client";

import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import InboxSidebar from "@/features/conversations/components/InboxSidebar";
import { useCallback, useEffect, useState } from "react";

type ConversationItem = {
  id: string;
  subject?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number | null;
};

export default function MessagesPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orgs/${orgId}/conversations`, {
        method: "GET",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok)
        throw new Error(`Failed to load conversations (${res.status})`);
      const json = (await res.json()) as { items?: ConversationItem[] };
      setItems(json.items ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load conversations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!loading && items.length > 0) {
      router.replace(`/org/${orgId}/messages/${items[0].id}`);
    }
  }, [loading, items, orgId, router]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] gap-4">
      <aside className="w-full max-w-xs shrink-0">
        <Card className="h-full overflow-hidden">
          <InboxSidebar />
        </Card>
      </aside>
      <section className="flex-1">
        <Card className="h-full grid place-items-center p-8 text-center">
          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
              <div className="h-5 w-64 animate-pulse rounded bg-muted" />
            </div>
          ) : error ? (
            <div className="space-y-4">
              <h2 className="text-xl font-medium">Couldn’t load messages</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div>
                <Button variant="outline" onClick={fetchConversations}>
                  Retry
                </Button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-medium">No conversations yet</h2>
              <p className="text-sm text-muted-foreground">
                Start a new conversation from a client profile or the Messages
                page.
              </p>
              <Separator />
              <Button
                variant="default"
                onClick={() => router.push(`/org/${orgId}/clients`)}
              >
                View Clients
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-5 w-52 animate-pulse rounded bg-muted" />
              <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
