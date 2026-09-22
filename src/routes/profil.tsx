import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, ShieldAlert, Store, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { SubscriptionCard } from "@/components/SubscriptionCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getProfile, signOut, updateProfile } from "@/services/authService";
import { getUserShops, type Shop } from "@/services/shopService";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profil")({ component: ProfilPage });

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  phone: z.string().trim().min(8, "Saisissez un numéro valide."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function ProfilPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refresh } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: "", phone: "" } });

  useEffect(() => {
    if (!user) return;
    form.reset({
      full_name: profile?.full_name ?? (user.user_metadata["full_name"] as string | undefined) ?? "",
      phone: (user.user_metadata["phone"] as string | undefined) ?? "",
    });
  }, [form, profile, user]);

  useEffect(() => {
    if (!user) {
      setLoadingShops(false);
      return;
    }
    void getUserShops().then(setShops).catch(() => setShops([])).finally(() => setLoadingShops(false));
  }, [user]);

  async function save(values: ProfileFormValues) {
    if (!user) return;
    try {
      await updateProfile(user.id, { full_name: values.full_name });
      const { error } = await supabase.auth.updateUser({ data: { full_name: values.full_name, phone: values.phone } });
      if (error) throw error;
      await refresh();
      toast.success("Informations mises à jour.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour le profil.");
    }
  }

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/auth" });
  }

  async function requestAccountDeletion() {
    toast.error("La suppression complète du compte doit être activée côté serveur Supabase.");
  }

  if (authLoading) return <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">Chargement du profil...</div>;
  if (!user) return null;
  const displayName = profile?.full_name ?? (user.user_metadata["full_name"] as string | undefined) ?? user.email ?? "Utilisateur";
  const initials = displayName.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><p className="text-sm font-medium text-primary">Compte</p><h1 className="mt-2 text-3xl font-bold">Mon profil</h1><p className="mt-2 text-muted-foreground">Gérez vos informations et vos accès à GogoSoft Tools Manager.</p></div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card><CardContent className="flex items-center gap-4 p-6"><div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">{initials}</div><div><h2 className="text-xl font-semibold">{displayName}</h2><p className="text-sm text-muted-foreground">{user.email}</p><p className="text-sm text-muted-foreground">{(user.user_metadata["phone"] as string | undefined) ?? "Téléphone non renseigné"}</p></div></CardContent></Card>
          <Card><CardHeader><CardTitle>Modifier mes informations</CardTitle></CardHeader><CardContent><Form {...form}><form onSubmit={form.handleSubmit(save)} className="space-y-4"><FormField control={form.control} name="full_name" render={({ field }) => <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="phone" render={({ field }) => <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} type="tel" /></FormControl><FormMessage /></FormItem>} /><Button type="submit" disabled={form.formState.isSubmitting}><User className="size-4" />Enregistrer</Button></form></Form></CardContent></Card>
          <Card><CardHeader><CardTitle>Mes boutiques</CardTitle></CardHeader><CardContent>{loadingShops ? <p className="text-sm text-muted-foreground">Chargement des boutiques...</p> : shops.length === 0 ? <p className="text-sm text-muted-foreground">Aucune boutique associée.</p> : <div className="grid gap-3 sm:grid-cols-2">{shops.map((shop) => <div key={shop.id} className="flex items-center gap-3 rounded-lg border p-3"><Store className="size-4 text-primary" /><div><p className="font-medium">{shop.name}</p><p className="text-xs text-muted-foreground">{shop.address ?? "Adresse non renseignée"}</p></div></div>)}</div>}</CardContent></Card>
        </div>
        <div className="space-y-6">
          {subscriptionLoading ? <Card><CardContent className="p-5 text-sm text-muted-foreground">Chargement de l'abonnement...</CardContent></Card> : <SubscriptionCard subscription={subscription} />}
          <Card className="border-destructive/30"><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="size-5" />Danger</CardTitle></CardHeader><CardContent className="space-y-3"><Button variant="outline" className="w-full" onClick={() => void handleSignOut()}><LogOut className="size-4" />Se déconnecter</Button><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="w-full"><Trash2 className="size-4" />Supprimer mon compte</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer le compte ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. La suppression complète doit être exécutée par une fonction serveur Supabase sécurisée.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => void requestAccountDeletion()}>Confirmer</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
