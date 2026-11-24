import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupportTickets } from "@/services/adminService";
import {
  getChatConversations,
  getChatUserId,
  getMessages,
  markAsRead,
  sendMessage,
  subscribeToChat,
  type ChatConversation,
  type ChatMessage,
} from "@/services/chatService";

export const Route = createFileRoute("/admin/support")({ component: SupportPage });

function SupportPage() {
  const [tickets, setTickets] = useState<Awaited<ReturnType<typeof getSupportTickets>>>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"tickets" | "messages">("tickets");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    void getSupportTickets()
      .then(setTickets)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Chargement impossible."),
      );
  }, []);

  useEffect(() => {
    let active = true;
    const refreshConversations = async () => {
      try {
        const [userId, nextConversations] = await Promise.all([
          getChatUserId(),
          getChatConversations(),
        ]);
        if (!active) return;
        setChatUserId(userId);
        setConversations(nextConversations);
        setSelectedShopId((current) => current ?? nextConversations[0]?.shop_id ?? null);
        setChatError(null);
      } catch (reason) {
        if (active) {
          setChatError(reason instanceof Error ? reason.message : "Impossible de charger les conversations.");
        }
      }
    };
    const refreshMessages = async () => {
      if (!selectedShopId || !chatUserId) return;
      try {
        const nextMessages = await getMessages(selectedShopId);
        if (!active) return;
        setMessages(nextMessages);
        await Promise.all(
          nextMessages
            .filter((message) => message.receiver_id === chatUserId && !message.read_at)
            .map((message) => markAsRead(message.id)),
        );
        setChatError(null);
      } catch (reason) {
        if (active) {
          setChatError(reason instanceof Error ? reason.message : "Impossible de charger les messages.");
        }
      }
    };
    void refreshConversations();
    void refreshMessages();
    const unsubscribe = subscribeToChat(null, () => {
      void refreshConversations();
      void refreshMessages();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [chatUserId, selectedShopId]);

  async function sendReply() {
    const conversation = conversations.find((entry) => entry.shop_id === selectedShopId);
    if (!conversation || !chatUserId || !draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(chatUserId, conversation.owner_id, conversation.shop_id, draft);
      setDraft("");
      setMessages(await getMessages(conversation.shop_id));
      setChatError(null);
    } catch (reason) {
      setChatError(reason instanceof Error ? reason.message : "Impossible d'envoyer la réponse.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHero title="Support" subtitle="Demandes ouvertes des abonnés" icon={MessageSquare} />
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Tabs value={tab} onValueChange={(value) => {
        if (value === "tickets" || value === "messages") setTab(value);
      }}>
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="tickets" className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{ticket.subject}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ticket.user_id} · {new Date(ticket.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800">
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm">{ticket.message}</p>
              </CardContent>
            </Card>
          ))}
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Aucun ticket ouvert.
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
        <TabsContent value="messages" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          {chatError ? (
            <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 lg:col-span-2">
              {chatError}
            </p>
          ) : null}
          <Card>
            <CardContent className="space-y-2 p-3">
              {conversations.map((conversation) => (
                <button
                  type="button"
                  key={conversation.shop_id}
                  onClick={() => setSelectedShopId(conversation.shop_id)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    selectedShopId === conversation.shop_id ? "border-orange-500 bg-orange-50" : ""
                  }`}
                >
                  <span className="font-semibold">{conversation.shop_name}</span>
                  <span className="mt-1 block truncate text-sm text-muted-foreground">
                    {conversation.latest_message}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Date(conversation.latest_at).toLocaleString("fr-FR")}
                  </span>
                </button>
              ))}
              {conversations.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Aucune conversation.</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div aria-live="polite" className="max-h-96 min-h-40 space-y-3 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      message.sender_id === chatUserId
                        ? "ml-auto bg-orange-100 text-orange-950"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.message}</p>
                    <p className="mt-1 text-right text-xs opacity-70">
                      {new Date(message.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendReply();
                    }
                  }}
                  placeholder="Répondre au propriétaire…"
                  maxLength={10_000}
                  disabled={!selectedShopId || sending}
                />
                <Button
                  type="button"
                  aria-label="Envoyer la réponse"
                  disabled={!draft.trim() || !selectedShopId || sending}
                  onClick={() => void sendReply()}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
