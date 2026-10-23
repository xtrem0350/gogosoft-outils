import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvitation, getInvitationByCode, type PendingInvitation } from "@/services/invitationsService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/rejoindre")({ component: JoinInvitationPage });

function JoinInvitationPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    try {
      const found = await getInvitationByCode(code);
      if (!found) {
        toast.error("Code invalide ou expiré.");
        return;
      }
      setInvitation(found);
      setFullName(found.full_name);
      setWhatsapp(found.whatsapp);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de vérifier ce code.");
    } finally {
      setChecking(false);
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation) return;
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setCreating(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      let userId = sessionData.session?.user.id;

      if (!userId) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: whatsapp.trim(),
            },
          },
        });
        if (error) throw error;
        userId = data.user?.id;
        if (!userId) throw new Error("Supabase n'a pas retourné l'utilisateur créé.");
        if (!data.session) {
          toast.info("Vérifiez votre adresse e-mail, connectez-vous, puis réutilisez ce code pour rejoindre l'atelier.");
          return;
        }
      }

      const result = await acceptInvitation({
        code: invitation.code,
        user_id: userId,
        full_name: fullName,
        email,
        whatsapp,
      });
      if (!result.success) throw new Error("L'invitation n'a pas pu être acceptée.");
      toast.success("Bienvenue ! Votre compte est créé.");
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer le compte.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-green-950">
      <Card className="card-3d w-full max-w-lg border-0 shadow-3d">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-ivoirien text-white">
            {invitation ? <UserRound className="size-7" /> : <KeyRound className="size-7" />}
          </div>
          <CardTitle className="text-2xl">Rejoindre un atelier</CardTitle>
          <p className="text-sm text-muted-foreground">
            {invitation
              ? `Invitation de ${invitation.shop_name ?? "votre atelier"} · ${invitation.role}`
              : "Saisissez le code communiqué par le propriétaire de l'atelier."}
          </p>
        </CardHeader>
        <CardContent>
          {!invitation ? (
            <form onSubmit={(event) => void verifyCode(event)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invitation-code">Code d&apos;invitation</Label>
                <Input
                  id="invitation-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="ABC234"
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  className="text-center font-mono text-2xl font-bold tracking-[0.3em]"
                />
              </div>
              <Button type="submit" disabled={checking || code.length !== 6} className="w-full">
                {checking ? "Vérification…" : "Vérifier le code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={(event) => void createAccount(event)} className="grid gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Invitation vérifiée pour le rôle {invitation.role}.</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-full-name">Nom complet</Label>
                <Input id="join-full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} autoComplete="name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input id="join-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="pl-9" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-whatsapp">WhatsApp</Label>
                <Input id="join-whatsapp" type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required maxLength={30} autoComplete="tel" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-password">Mot de passe</Label>
                <PasswordInput id="join-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-confirm-password">Confirmer le mot de passe</Label>
                <PasswordInput id="join-confirm-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setInvitation(null)} disabled={creating}>
                  Modifier le code
                </Button>
                <Button type="submit" className="flex-1 bg-ivoirien bg-ivoirien-hover" disabled={creating}>
                  {creating ? "Création…" : "Créer mon compte"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
