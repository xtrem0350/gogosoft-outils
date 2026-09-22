import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Building2, Mail, Phone, Save, ShieldAlert, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProfile, updateProfile } from "@/services/authService";
import { getUserShops, updateShop } from "@/services/shopService";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parametres")({ component: ParametresPage });

function ParametresPage() {
  const [tab, setTab] = useState("profil");
  const [profile, setProfile] = useState<{
    nom: string | null;
    email: string | null;
    phone?: string | null;
  }>({ nom: "", email: "", phone: "" });
  const [shop, setShop] = useState<{
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  } | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; message: string }>>(
    [],
  );

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const nextProfile = await getProfile(userId);
      if (nextProfile) {
        setProfile({
          nom: nextProfile.nom,
          email: nextProfile.email,
          phone: (nextProfile as { phone?: string | null }).phone ?? null,
        });
      }

      const shops = await getUserShops();
      const currentShopId = window.localStorage.getItem("gogosoft.currentShopId") ?? shops[0]?.id;
      const currentShop = shops.find((item) => item.id === currentShopId) ?? shops[0] ?? null;
      if (currentShop) {
        setShop({
          id: currentShop.id,
          name: currentShop.name,
          address: currentShop.address ?? null,
          phone: currentShop.phone ?? null,
        });
      }

      if (currentShopId) {
        const { data: rows } = await (supabase.from("whatsapp_templates" as never) as any)
          .select("*")
          .eq("shop_id", currentShopId)
          .order("created_at", { ascending: false });
        setTemplates((rows ?? []) as Array<{ id: string; name: string; message: string }>);
      }
    })().catch(() => undefined);
  }, []);

  async function saveProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast.error("Utilisateur non authentifié.");
      return;
    }
    await updateProfile(userId, {
      nom: profile.nom,
      email: profile.email ?? undefined,
      phone: profile.phone ?? null,
    } as never);
    toast.success("Profil mis à jour.");
  }

  async function saveShop() {
    if (!shop) return;
    await updateShop(shop.id, { name: shop.name, address: shop.address, phone: shop.phone });
    toast.success("Boutique mise à jour.");
  }

  async function deleteAccount() {
    if (!window.confirm("Supprimer votre compte ? Cette action est irréversible.")) return;
    toast.info("La suppression du compte doit être traitée côté serveur / Supabase Admin.");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Configuration</p>
        <h1 className="mt-2 text-3xl font-bold">Paramètres</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full md:grid-cols-4">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="boutique">Boutique</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="full-name"
                    value={profile.nom ?? ""}
                    onChange={(e) =>
                      setProfile((current) => ({ ...current, nom: e.target.value }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="profile-phone"
                    value={profile.phone ?? ""}
                    onChange={(e) =>
                      setProfile((current) => ({ ...current, phone: e.target.value }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="profile-email"
                    type="email"
                    value={profile.email ?? ""}
                    onChange={(e) =>
                      setProfile((current) => ({ ...current, email: e.target.value }))
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <Button onClick={() => void saveProfile()}>
                <Save className="size-4" />
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boutique" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Boutique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Nom</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="shop-name"
                    value={shop?.name ?? ""}
                    onChange={(e) =>
                      setShop((current) =>
                        current ? { ...current, name: e.target.value } : current,
                      )
                    }
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-address">Adresse</Label>
                <Input
                  id="shop-address"
                  value={shop?.address ?? ""}
                  onChange={(e) =>
                    setShop((current) =>
                      current ? { ...current, address: e.target.value } : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-phone">Téléphone</Label>
                <Input
                  id="shop-phone"
                  value={shop?.phone ?? ""}
                  onChange={(e) =>
                    setShop((current) =>
                      current ? { ...current, phone: e.target.value } : current,
                    )
                  }
                />
              </div>
              <Button onClick={() => void saveShop()}>
                <Save className="size-4" />
                Enregistrer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun template enregistré.</p>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="rounded-lg border p-3">
                    <p className="font-medium">{template.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{template.message}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="mt-6">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-destructive/25 bg-background/50 p-4 text-sm text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-4 text-destructive" />
                <p>Cette action supprimera définitivement votre compte et les données associées.</p>
              </div>
              <Button variant="destructive" onClick={() => void deleteAccount()}>
                <AlertTriangle className="size-4" />
                Supprimer mon compte
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
