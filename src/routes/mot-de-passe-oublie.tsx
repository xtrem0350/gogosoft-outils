import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendPasswordResetEmail } from "@/services/authService";

export const Route = createFileRoute("/mot-de-passe-oublie")({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await sendPasswordResetEmail(email);
      if (error) throw error;
      setSent(true);
      toast.success("Un lien de récupération a été envoyé.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'envoyer le lien.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8">
          <p className="text-sm font-medium text-orange-300">Sécurité du compte</p>
          <h1 className="mt-2 text-3xl font-bold">Mot de passe oublié ?</h1>
          <p className="mt-3 text-sm text-slate-300">
            Saisissez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              Vérifiez votre boîte de réception et suivez le lien reçu pour choisir un nouveau mot
              de passe.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Retour à la connexion</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-slate-200">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  required
                  className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Envoi en cours..." : "Envoyer le lien"}
            </Button>
          </form>
        )}

        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Retour à la connexion
        </Link>
      </section>
    </main>
  );
}
