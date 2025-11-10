"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type ConversationItem = {
  id: string;
  subject?: string | null;
  lastMessageAt?: string | null;
  lastSnippet?: string | null;
  unreadCount?: number | null;
  isPinned?: boolean | null;
};

type ApiResponse = {
  items?: ConversationItem[];
  total?: number;
};

export default function InboxSidebar() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const activeId = useMemo(() => {
    const parts = (pathname || "").split("/").filter(Boolean);
    const i = parts.findIndex((p) => p === "messages");
    return i !== -1 && parts[i + 1] ? parts[i + 1] : null;
  }, [pathname]);

  const fetchList = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        `/api/orgs/${orgId}/conversations`,
        typeof window !== "undefined" ? window.location.origin : "http://local"
      );
      if (q.trim()) url.searchParams.set("q", q.trim());
      url.searchParams.set("limit", "50");
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { "cache-control": "no-store" },
      });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const json = (await res.json()) as ApiResponse;
      const list = (json.items ?? []).slice();

      list.sort((a, b) => {
        const ap = a.isPinned ? 1 : 0;
        const bp = b.isPinned ? 1 : 0;
        if (ap !== bp) return bp - ap;

        const au = Math.min(a.unreadCount ?? 0, 999);
        const bu = Math.min(b.unreadCount ?? 0, 999);
        if (au !== bu) return bu - au;

        const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bt - at;
      });

      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load conversations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, q]);

  useEffect(() => {
    fetchList();
  }, [fetchList, refreshTick]);

  useEffect(() => {
    const t = setTimeout(() => fetchList(), 250);
    return () => clearTimeout(t);
  }, [q]);

  const open = (id: string) => router.push(`/org/${orgId}/messages/${id}`);

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Messages</h2>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              title="Refresh"
              aria-label="Refresh"
              onClick={() => setRefreshTick((n) => n + 1)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => router.push(`/org/${orgId}/messages/new`)}
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations…"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[64px] rounded-md border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-sm">
            <p className="text-destructive"> {error} </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setRefreshTick((n) => n + 1)}
            >
              Retry
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No conversations{q ? " match your search" : ""}.
          </div>
        ) : (
          <ul className="p-2">
            {items.map((c) => {
              const active = activeId === c.id;
              const unread = Math.min(c.unreadCount ?? 0, 999);
              const t = c.lastMessageAt ? new Date(c.lastMessageAt) : null;
              const timeStr = t
                ? t.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <li key={c.id}>
                  <button
                    onClick={() => open(c.id)}
                    className={cn(
                      "w-full text-left rounded-md border px-3 py-3 mb-2 transition",
                      "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
                      active ? "bg-accent" : "bg-card"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-medium truncate",
                              unread ? "text-foreground" : "text-foreground/90"
                            )}
                          >
                            {c.subject || "No subject"}
                          </span>
                          {c.isPinned ? (
                            <Badge
                              variant="secondary"
                              className="uppercase text-[10px]"
                            >
                              Pinned
                            </Badge>
                          ) : null}
                        </div>
                        {c.lastSnippet ? (
                          <p className="text-xs text-muted-foreground truncate">
                            {c.lastSnippet}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        {unread > 0 ? (
                          <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-medium text-primary-foreground">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        ) : null}
                        {timeStr && (
                          <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                            {timeStr}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Separator />
      <div className="p-2 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="truncate">
          Tip: press <kbd className="rounded border px-1">g</kbd>
          <span className="mx-0.5">then</span>
          <kbd className="rounded border px-1">m</kbd> to open Messages
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setRefreshTick((n) => n + 1)}
        >
          Sync
        </Button>
      </div>
    </div>
  );
}
