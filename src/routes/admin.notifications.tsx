import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getGlobalNotifications, sendGlobalNotification } from "@/services/adminService";

export const Route = createFileRoute("/admin/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<Array<{ id: string; message: string; created_at: string }>>([]);
  const [saving, setSaving] = useState(false);
  async function refresh() {
    try {
      setRows(await getGlobalNotifications());
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Chargement impossible.");
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await sendGlobalNotification(message.trim());
      setMessage("");
      toast.success("Notification envoyée à la plateforme.");
      await refresh();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Envoi impossible.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHero
        title="Notifications"
        subtitle="Diffusez une information à tous les abonnés"
        icon={Bell}
      />
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle notification globale</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <Textarea
              required
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Message destiné aux abonnés"
            />
            <Button disabled={saving || !message.trim()}>{saving ? "Envoi…" : "Envoyer"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notifications envoyées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row) => (
            <article key={row.id} className="border-b pb-4 last:border-0">
              <p className="whitespace-pre-wrap text-sm">{row.message}</p>
              <time className="mt-2 block text-xs text-muted-foreground">
                {new Date(row.created_at).toLocaleString("fr-FR")}
              </time>
            </article>
          ))}
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune notification envoyée.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
