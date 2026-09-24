import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { updatePassword } from "@/services/authService";
import { checkPasswordStrength } from "@/lib/passwordStrength";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (checkPasswordStrength(password).score < 3) {
      toast.error("Choisissez un mot de passe fort.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      toast.success("Votre mot de passe a été mis à jour.");
      await navigate({ to: "/auth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour le mot de passe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
            <KeyRound className="size-5" />
          </div>
          <h1 className="text-3xl font-bold">Nouveau mot de passe</h1>
          <p className="mt-3 text-sm text-slate-300">Choisissez un mot de passe fort pour sécuriser votre compte.</p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium text-slate-200">
              Nouveau mot de passe
            </label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Nouveau mot de passe"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium text-slate-200">
              Confirmer le mot de passe
            </label>
            <PasswordInput
              id="confirm-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              placeholder="Confirmer le mot de passe"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Mise à jour..." : "Enregistrer le nouveau mot de passe"}
          </Button>
        </form>

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
