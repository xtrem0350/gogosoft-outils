import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Camera, KeyRound, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import profileLogo from "@/assets/images/profile.png";
import { PasswordInput } from "@/components/PasswordInput";
import { PhoneInput } from "@/components/PhoneInput";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkPasswordStrength } from "@/lib/passwordStrength";
import { resolveEmailFromIdentifier, signInWithIdentifier, signUp } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

const pseudoSchema = z
  .string()
  .trim()
  .min(3, "Le pseudo doit contenir au moins 3 caractères.")
  .regex(/^[A-Za-z0-9_]+$/, "Le pseudo ne peut contenir que des lettres, chiffres et underscore.");

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(avatarFile);
    setAvatarPreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [avatarFile]);

  async function handleSignIn(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    try {
      const result = await signInWithIdentifier(identifier, password);
      if (result.error) {
        const message = result.error.message || "Aucun compte trouvé avec cet identifiant";
        toast.error(
          message === "invalid_credentials" ? "Aucun compte trouvé avec cet identifiant" : message,
        );
        return;
      }
      await navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(event?: React.FormEvent) {
    event?.preventDefault();
    const strength = checkPasswordStrength(password);
    if (strength.score < 3) {
      toast.error(
        "Le mot de passe doit être au moins de niveau Fort pour finaliser l'inscription.",
      );
      return;
    }

    const pseudoResult = pseudoSchema.safeParse(pseudo);
    if (!pseudoResult.success) {
      toast.error(pseudoResult.error.issues[0]?.message ?? "Pseudo invalide.");
      return;
    }

    const normalizedPseudo = pseudoResult.data;

    let existingPseudo: { id: string } | null = null;
    let pseudoError: { message?: string; code?: string } | null = null;

    try {
      const response = await supabase
        .from("profiles")
        .select("id")
        .eq("pseudo", normalizedPseudo)
        .maybeSingle();

      existingPseudo = response.data as { id: string } | null;
      pseudoError = response.error as { message?: string; code?: string } | null;
    } catch (error) {
      pseudoError = {
        message: error instanceof Error ? error.message : "Erreur pseudo",
        code: "UNKNOWN",
      };
    }

    if (pseudoError) {
      const message = String(pseudoError.message ?? "").toLowerCase();
      if (pseudoError.code === "42703" || message.includes("pseudo") || message.includes("column")) {
        toast.error(
          "La migration Supabase du pseudo n'est pas encore appliquée. Exécute 20260923000000_pseudo.sql dans le SQL Editor.",
        );
        return;
      }

      toast.error("Impossible de vérifier le pseudo pour le moment.");
      return;
    }

    if (existingPseudo) {
      toast.error("Ce pseudo est déjà utilisé. Merci d'en choisir un autre.");
      return;
    }

    setBusy(true);
    try {
      const result = await signUp(email, password, fullName, phone, avatarFile, normalizedPseudo);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Compte créé. Vous pouvez maintenant créer votre première boutique.");
      await navigate({ to: "/boutiques/nouveau" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inscription impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&auto=format&fit=crop)",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl backdrop-blur-md">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="flex min-h-[280px] flex-col justify-center bg-slate-900/70 p-8 text-white lg:min-h-[640px] lg:p-10">
              <div className="flex flex-col items-center justify-center gap-5 text-center">
                <button
                  type="button"
                  aria-label="Choisir une photo de profil"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="group relative flex size-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 transition-transform duration-200 hover:scale-105 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-500"
                >
                  {avatarPreview ? (
                    <>
                      <img
                        src={avatarPreview}
                        alt="Aperçu de la photo de profil"
                        className="size-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                        <Camera className="size-4" />
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        src={profileLogo}
                        alt="GogoSoft logo"
                        className="size-full object-cover"
                      />
                      <span className="absolute inset-0 bg-slate-900/0 transition-colors group-hover:bg-slate-900/5" />
                    </>
                  )}
                </button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setAvatarFile(file);
                  }}
                />
                {!avatarPreview ? (
                  <p className="text-center text-xs text-slate-400">
                    Cliquez pour ajouter une photo
                  </p>
                ) : null}

                <div>
                  <h2 className="text-2xl font-bold text-white">Atelier numérique</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-slate-300">
                    Tous vos outils, au même endroit. Centralisez vos réparations, vos clients, vos
                    diagnostics et l’activité de votre équipe.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-950/60 p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-md">
                <div className="mb-8">
                  <p className="text-sm font-medium text-blue-300">Bienvenue</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">GogoSoft Tools Manager</h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Connectez-vous pour gérer votre atelier.
                  </p>
                </div>

                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-white/5">
                    <TabsTrigger
                      value="signin"
                      className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900"
                    >
                      Connexion
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900"
                    >
                      Inscription
                    </TabsTrigger>
                  </TabsList>

                  <form
                    onSubmit={(event) => {
                      if (activeTab === "signin") {
                        void handleSignIn(event);
                      } else {
                        void handleSignUp(event);
                      }
                    }}
                  >
                    <TabsContent value="signin" className="space-y-4 pt-5">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input
                            id="signin-identifier"
                            type="text"
                            value={identifier}
                            onChange={(event) => setIdentifier(event.target.value)}
                            placeholder="Email, pseudo ou WhatsApp"
                            autoComplete="username"
                            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <PasswordInput
                            id="signin-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Mot de passe"
                            autoComplete="current-password"
                            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <Button className="mt-4 w-full" disabled={busy} type="submit">
                        Se connecter
                        <ArrowRight className="size-4" />
                      </Button>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4 pt-5">
                      <div className="space-y-4">
                        <div className="relative">
                          <UserRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input
                            id="signup-name"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Nom complet"
                            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400"
                            required
                          />
                        </div>

                        <div className="relative">
                          <Input
                            id="signup-pseudo"
                            value={pseudo}
                            onChange={(event) => setPseudo(event.target.value)}
                            placeholder="Pseudo"
                            className="border-white/10 bg-white/5 text-white placeholder:text-slate-400"
                            required
                          />
                        </div>

                        <PhoneInput value={phone} onChange={setPhone} className="w-full" />

                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Adresse e-mail"
                            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400"
                            required
                          />
                        </div>

                        <div className="relative">
                          <KeyRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <PasswordInput
                            id="signup-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Mot de passe"
                            autoComplete="new-password"
                            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400"
                          />
                        </div>
                        <PasswordStrengthBar password={password} />
                      </div>

                      <Button className="mt-4 w-full" disabled={busy} type="submit">
                        Créer mon compte
                        <ArrowRight className="size-4" />
                      </Button>
                    </TabsContent>
                  </form>
                </Tabs>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
