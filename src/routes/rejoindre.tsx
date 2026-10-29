import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, CheckCircle2, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import authLogo from "@/assets/images/leprofile.png";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { acceptInvitation, getInvitationByCode, type PendingInvitation } from "@/services/invitationsService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/rejoindre")({ component: JoinInvitationPage });

function JoinInvitationPage() {
  const navigate = useNavigate();
  const { refresh: refreshShops } = useCurrentShop();
  const [code, setCode] = useState("");
  const [invitation, setInvitation] = useState<PendingInvitation | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ncni, setNcni] = useState("");
  const [lieuHabitation, setLieuHabitation] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview(null);
      return;
    }
    const preview = URL.createObjectURL(avatar);
    setAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [avatar]);

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
      let accountEmail = sessionData.session?.user.email ?? email.trim();

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
        accountEmail = data.user?.email ?? email.trim();
        if (!data.session) {
          toast.info("Vérifiez votre adresse e-mail, connectez-vous, puis réutilisez ce code pour rejoindre l'atelier.");
          return;
        }
      }

      let avatarUrl: string | undefined;
      if (avatar) {
        if (!avatar.type.startsWith("image/") || avatar.size > 5 * 1024 * 1024) {
          throw new Error("Choisissez une image de 5 Mo maximum.");
        }
        const extension = avatar.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${invitation.shop_id}/${userId}-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("team-avatars")
          .upload(path, avatar, { contentType: avatar.type, cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from("team-avatars").getPublicUrl(path).data.publicUrl;
      }

      const result = await acceptInvitation({
        code: invitation.code,
        user_id: userId,
        full_name: fullName,
        email: accountEmail,
        whatsapp,
        ncni,
        lieu_habitation: lieuHabitation,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      });
      if (!result.success) throw new Error("L'invitation n'a pas pu être acceptée.");
      window.localStorage.setItem("gogosoft.currentShopId", result.shop_id);
      await refreshShops(userId, true);
      toast.success("Bienvenue ! Votre compte est créé.");
      // useUserRoles recharge les rôles cumulés au montage du dashboard.
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de créer le compte.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-green-50 px-4 py-8 dark:from-slate-950 dark:via-slate-900 dark:to-green-950 sm:px-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border bg-background shadow-2xl md:min-h-[620px] md:grid-cols-[0.8fr_1.2fr]">
        <aside className="flex flex-col items-center justify-center gap-5 bg-slate-900 p-8 text-center text-white md:items-start md:text-left">
          <img src={authLogo} alt="GogoSoft" className="size-16 rounded-full object-cover" />
          <div>
            <p className="text-sm font-semibold uppercase text-orange-300">GogoSoft Tools Manager</p>
            <h1 className="mt-2 text-3xl font-bold">Rejoindre votre équipe</h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-200">
              Utilisez le code transmis par votre responsable pour rejoindre son atelier.
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-white/10">
            {invitation ? <UserRound className="size-6" /> : <KeyRound className="size-6" />}
          </div>
        </aside>
        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-lg space-y-6">
            <header>
              <p className="text-sm font-semibold text-primary">{invitation ? "Étape 2 sur 2" : "Étape 1 sur 2"}</p>
              <h2 className="mt-1 text-2xl font-bold">{invitation ? "Créer votre compte" : "Vérifier le code"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {invitation
                  ? `Invitation de ${invitation.shop_name ?? "votre atelier"} · ${invitation.role}`
                  : "Saisissez le code à 6 caractères communiqué par votre responsable."}
              </p>
            </header>
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
              <div className="grid gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
                <p><span className="font-medium">Nom :</span> {invitation.full_name}</p>
                <p><span className="font-medium">Rôle :</span> {invitation.role}</p>
                <p><span className="font-medium">WhatsApp :</span> {invitation.whatsapp}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input id="join-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="pl-9" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-password">Mot de passe</Label>
                <PasswordInput id="join-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-confirm-password">Confirmer le mot de passe</Label>
                <PasswordInput id="join-confirm-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="join-ncni">NCNI (facultatif)</Label>
                  <Input id="join-ncni" value={ncni} onChange={(event) => setNcni(event.target.value)} maxLength={40} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="join-home">Lieu d&apos;habitation (facultatif)</Label>
                  <Input id="join-home" value={lieuHabitation} onChange={(event) => setLieuHabitation(event.target.value)} maxLength={160} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="join-avatar">Photo de profil (facultatif)</Label>
                <div className="flex flex-col items-center gap-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Aperçu de la photo de profil"
                      className="size-24 rounded-full border-2 border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Camera className="size-8 text-slate-400" />
                    </div>
                  )}
                  <Input
                    id="join-avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      setAvatar(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="join-avatar"
                    className="cursor-pointer rounded-md bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Choisir une photo
                  </label>
                  {avatar ? (
                    <button type="button" onClick={() => setAvatar(null)} className="text-xs text-red-500 hover:underline">
                      Supprimer
                    </button>
                  ) : null}
                </div>
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
          </div>
        </section>
      </div>
    </main>
  );
}
