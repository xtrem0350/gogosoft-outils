import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Mail, Phone, ShieldCheck, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";

import { PhoneInput } from "@/components/PhoneInput";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkPasswordStrength } from "@/lib/passwordStrength";
import { signIn, signUp } from "@/services/authService";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignIn(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    try {
      const result = await signIn(email, password);
      if (result.error) {
        toast.error(result.error.message);
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
      toast.error("Le mot de passe doit être au moins de niveau Fort pour finaliser l'inscription.");
      return;
    }

    setBusy(true);
    try {
      const result = await signUp(email, password, fullName, phone, avatarFile);
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
          <div className="grid lg:grid-cols-[1fr_1.1fr]">
            <section className="flex min-h-[280px] flex-col justify-between bg-slate-900/70 p-8 text-white lg:p-12">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 ring-1 ring-blue-300/40">
                  <ShieldCheck className="h-6 w-6 text-blue-200" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-200/80">GogoSoft</p>
                  <p className="text-sm text-slate-200">Tools Manager</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-slate-300">Atelier numérique</p>
                <h1 className="max-w-sm text-4xl font-bold leading-tight">Tous vos outils, au même endroit.</h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-slate-200/80">
                  Centralisez vos réparations, vos clients, vos diagnostics et l’activité de votre équipe.
                </p>
              </div>
            </section>

            <section className="bg-slate-950/60 p-7 sm:p-10 lg:p-12">
              <div className="mx-auto max-w-md">
                <div className="mb-8">
                  <p className="text-sm font-medium text-blue-300">Bienvenue</p>
                  <h2 className="mt-2 text-3xl font-bold text-white">GogoSoft Tools Manager</h2>
                  <p className="mt-2 text-sm text-slate-300">Connectez-vous pour gérer votre atelier.</p>
                </div>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/5">
                    <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">Connexion</TabsTrigger>
                    <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white data-[state=active]:text-slate-900">Inscription</TabsTrigger>
                  </TabsList>

                  <form onSubmit={(event) => {
                    if (activeTab === "signin") {
                      void handleSignIn(event);
                    } else {
                      void handleSignUp(event);
                    }
                  }}>
                    <TabsContent value="signin" className="space-y-4 pt-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-slate-200">Adresse e-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input id="signin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-slate-200">Mot de passe</Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input id="signin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400" minLength={6} required />
                        </div>
                      </div>

                      <Button className="w-full" disabled={busy} type="submit">
                        Se connecter
                        <ArrowRight className="size-4" />
                      </Button>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4 pt-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className="text-slate-200">Nom complet</Label>
                          <div className="relative">
                            <UserRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                            <Input id="signup-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-avatar" className="text-slate-200">Photo de profil</Label>
                          <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2">
                            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                              {avatarPreview ? (
                                <img src={avatarPreview} alt="Aperçu avatar" className="size-full object-cover" />
                              ) : (
                                <Upload className="size-5 text-slate-300" />
                              )}
                            </div>
                            <Input
                              id="signup-avatar"
                              type="file"
                              accept="image/*"
                              className="max-w-[160px] file:mr-2 file:rounded file:border-0 file:bg-blue-500 file:text-white"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setAvatarFile(file);
                                if (file) {
                                  const nextPreview = URL.createObjectURL(file);
                                  setAvatarPreview(nextPreview);
                                } else {
                                  setAvatarPreview(null);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-slate-200">Adresse e-mail</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-slate-200">Téléphone</Label>
                        <PhoneInput value={phone} onChange={setPhone} className="w-full" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-slate-200">Mot de passe</Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-2.5 size-4 text-slate-400" />
                          <Input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-400" required />
                        </div>
                        <PasswordStrengthBar password={password} />
                      </div>

                      <Button className="w-full" disabled={busy} type="submit">
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
