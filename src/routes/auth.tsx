import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";

import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendPhoneOtp, signIn, signUp, verifyPhoneOtp } from "@/services/authService";

export const Route = createFileRoute("/auth")({ component: AuthPage });

type AuthMode = "signin" | "signup" | "phone";

/** Page de connexion multi-mode de GogoSoft. */
function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submitEmail() {
    setBusy(true);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password, fullName);
    setBusy(false);
    if (result.error) { toast.error(result.error.message); return; }
    if (mode === "signup") { toast.success("Compte créé. Vérifiez votre e-mail si nécessaire."); return; }
    await navigate({ to: "/" });
  }

  async function submitPhone() {
    setBusy(true);
    const result = otpSent ? await verifyPhoneOtp(phone, token) : await sendPhoneOtp(phone);
    setBusy(false);
    if (result.error) { toast.error(result.error.message); return; }
    if (!otpSent) { setOtpSent(true); toast.success("Code envoyé par SMS."); return; }
    await navigate({ to: "/" });
  }

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--accent),transparent_32%),var(--background)] px-5 py-8 lg:px-12">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
      <div className="grid w-full overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-2xl backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
        <section className="surface-gradient flex min-h-[280px] flex-col justify-between p-8 text-white lg:p-12"><AnimatedLogo /><div><p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/55">Atelier numérique</p><h1 className="max-w-sm font-display text-4xl font-bold leading-tight">Tous vos outils, au même endroit.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-white/70">Centralisez vos utilitaires de réparation, vos accès et l’activité de votre équipe.</p></div></section>
        <section className="p-7 sm:p-10 lg:p-12"><div className="mx-auto max-w-md"><div className="mb-8"><p className="text-sm font-medium text-primary">Bienvenue</p><h2 className="mt-2 text-2xl font-bold">Accéder à GogoSoft Tools</h2><p className="mt-2 text-sm text-muted-foreground">Connectez-vous pour retrouver votre espace de travail.</p></div>
          {mode !== "phone" ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submitEmail(); }}>
            {mode === "signup" && <div className="space-y-2"><Label htmlFor="name">Nom complet</Label><div className="relative"><UserRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="pl-9" required /></div></div>}
            <div className="space-y-2"><Label htmlFor="email">Adresse e-mail</Label><div className="relative"><Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" required /></div></div>
            <div className="space-y-2"><Label htmlFor="password">Mot de passe</Label><div className="relative"><KeyRound className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" minLength={6} required /></div></div>
            <Button className="w-full" disabled={busy}>{mode === "signup" ? "Créer mon compte" : "Se connecter"}<ArrowRight /></Button>
          </form> : <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submitPhone(); }}><div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><div className="relative"><Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input id="phone" type="tel" placeholder="+33 6 00 00 00 00" value={phone} onChange={(event) => setPhone(event.target.value)} className="pl-9" required disabled={otpSent} /></div></div>{otpSent && <div className="space-y-2"><Label htmlFor="token">Code reçu</Label><Input id="token" inputMode="numeric" value={token} onChange={(event) => setToken(event.target.value)} required /></div>}<Button className="w-full" disabled={busy}>{otpSent ? "Vérifier le code" : "Recevoir un code"}<ArrowRight /></Button></form>}
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm"><button className="text-primary hover:underline" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setOtpSent(false); }}>{mode === "signup" ? "J'ai déjà un compte" : "Créer un compte"}</button><button className="text-muted-foreground hover:text-foreground" onClick={() => { setMode(mode === "phone" ? "signin" : "phone"); setOtpSent(false); }}>{mode === "phone" ? "Connexion e-mail" : "Connexion par téléphone"}</button></div>
        </div></section>
      </div>
    </div>
  </main>;
}