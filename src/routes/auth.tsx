import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp } from "@/services/authService";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
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

  async function handleSignUp() {
    setBusy(true);
    try {
      const result = await signUp(email, password, fullName, phone);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Compte créé avec succès. Vérifiez votre e-mail si nécessaire.");
      setActiveTab("signin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inscription impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--accent),transparent_32%),var(--background)] px-5 py-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-2xl backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
          <section className="surface-gradient flex min-h-[280px] flex-col justify-between p-8 text-white lg:p-12">
            <AnimatedLogo />
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/55">Atelier numérique</p>
              <h1 className="max-w-sm font-display text-4xl font-bold leading-tight">Tous vos outils, au même endroit.</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
                Centralisez vos utilitaires de réparation, vos accès et l’activité de votre équipe.
              </p>
            </div>
          </section>

          <section className="p-7 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="text-sm font-medium text-primary">Bienvenue</p>
                <h2 className="mt-2 text-2xl font-bold">Accéder à GogoSoft Tools</h2>
                <p className="mt-2 text-sm text-muted-foreground">Connectez-vous pour retrouver votre espace de travail.</p>
              </div>

              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Connexion</TabsTrigger>
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 pt-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Adresse e-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input id="signin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input id="signin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" minLength={6} required />
                    </div>
                  </div>

                  <Button className="w-full" disabled={busy} onClick={() => void handleSignIn()}>
                    Se connecter
                    <ArrowRight className="size-4" />
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 pt-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input id="signup-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="pl-9" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Adresse e-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input id="signup-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="pl-9" placeholder="+225 01 02 03 04" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" minLength={6} required />
                    </div>
                  </div>

                  <Button className="w-full" disabled={busy} onClick={() => void handleSignUp()}>
                    Créer mon compte
                    <ArrowRight className="size-4" />
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
