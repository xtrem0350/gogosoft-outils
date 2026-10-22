import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Search, UserPlus, UserX, Users } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/EmptyState";
import { QuickCreateStaffDialog } from "@/components/QuickCreateStaffDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentShop } from "@/hooks/useCurrentShop";
import { deactivateStaff, getStaffByShop, updateStaff } from "@/services/staffService";
import { STAFF_ROLE_LABELS, type StaffMember, type StaffRole } from "@/types/staff";

export const Route = createFileRoute("/personnel")({ component: PersonnelPage });

type StaffFilter = "all" | "technicians" | "sellers" | "other";

const roleColors: Record<StaffRole, string> = {
  owner: "bg-orange-500 text-white",
  manager: "bg-orange-400 text-white",
  technicien: "bg-green-500 text-white",
  technicien_pc: "bg-green-600 text-white",
  vendeur: "bg-blue-500 text-white",
  caissier: "bg-purple-500 text-white",
  magasinier: "bg-slate-500 text-white",
};

function PersonnelPage() {
  const { shopId, loading: shopLoading } = useCurrentShop();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deactivatingStaff, setDeactivatingStaff] = useState<StaffMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<StaffRole>("technicien");
  const [savingEdit, setSavingEdit] = useState(false);

  async function reloadStaff(id: string) {
    setError(null);
    try {
      setStaff(await getStaffByShop(id));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Impossible de charger le personnel.";
      setError(message);
      throw reason;
    }
  }

  useEffect(() => {
    if (shopLoading) return;
    if (!shopId) {
      setStaff([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void getStaffByShop(shopId)
      .then((rows) => {
        if (active) setStaff(rows);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Impossible de charger le personnel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [shopId, shopLoading]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return staff.filter((member) => {
      if (filter === "technicians" && !["technicien", "technicien_pc"].includes(member.role)) {
        return false;
      }
      if (filter === "sellers" && member.role !== "vendeur") return false;
      if (
        filter === "other" &&
        ["technicien", "technicien_pc", "vendeur"].includes(member.role)
      ) {
        return false;
      }
      return !normalizedQuery || (member.full_name ?? "").toLocaleLowerCase().includes(normalizedQuery);
    });
  }, [filter, query, staff]);

  function openEdit(member: StaffMember) {
    setEditingStaff(member);
    setEditName(member.full_name ?? "");
    setEditPhone(member.phone ?? "");
    setEditRole(member.role);
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingStaff || !editName.trim()) {
      toast.error("Le nom complet est obligatoire.");
      return;
    }
    setSavingEdit(true);
    try {
      const updated = await updateStaff(editingStaff.id, {
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
      });
      if (!updated) throw new Error("Employé introuvable.");
      setStaff((current) => current.map((member) => (member.id === updated.id ? updated : member)));
      setEditingStaff(null);
      toast.success("Employé mis à jour.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de modifier l'employé.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivatingStaff) return;
    try {
      await deactivateStaff(deactivatingStaff.id);
      if (shopId) await reloadStaff(shopId);
      toast.success("Employé désactivé.");
      setDeactivatingStaff(null);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de désactiver l'employé.");
    }
  }

  const visibleMembers = filteredStaff.filter((member) => member.is_active);

  return (
    <main className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Personnel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez votre équipe</p>
        </div>
        <Button
          type="button"
          disabled={!shopId}
          onClick={() => setCreateOpen(true)}
          className="bg-ivoirien bg-ivoirien-hover text-white shadow-3d"
        >
          <UserPlus className="mr-2 size-4" />
          Inviter un employé
        </Button>
      </header>

      <div className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Rechercher par nom"
            aria-label="Rechercher un employé par nom"
          />
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filtrer le personnel">
          {(
            [
              ["all", "Tous"],
              ["technicians", "Techniciens"],
              ["sellers", "Vendeurs"],
              ["other", "Autres"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
              className={filter === value ? "bg-orange-600 text-white hover:bg-orange-700" : ""}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading || shopLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Chargement du personnel…</p>
      ) : !shopId ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sélectionnez une boutique pour consulter son équipe.
        </p>
      ) : staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun employé"
          description="Ajoutez le premier employé pour commencer à gérer votre équipe."
          actionLabel="Ajouter le premier employé"
          onAction={() => setCreateOpen(true)}
        />
      ) : filteredStaff.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun employé ne correspond à ces filtres.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {["Nom", "Rôle", "Téléphone", "Statut", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr key={member.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{member.full_name || "Sans nom"}</td>
                  <td className="px-4 py-3">
                    <Badge className={roleColors[member.role]}>
                      {STAFF_ROLE_LABELS[member.role]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{member.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        member.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {member.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Modifier ${member.full_name ?? "l'employé"}`}
                        title="Modifier"
                        onClick={() => openEdit(member)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {member.is_active ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label={`Désactiver ${member.full_name ?? "l'employé"}`}
                          title="Désactiver"
                          onClick={() => setDeactivatingStaff(member)}
                        >
                          <UserX className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleMembers.length === 0 && filteredStaff.length > 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    Aucun employé actif dans cette sélection.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      <QuickCreateStaffDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        shopId={shopId ?? ""}
        onSuccess={(created) => setStaff((current) => [created, ...current])}
      />

      <Dialog open={editingStaff !== null} onOpenChange={(open) => !open && setEditingStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'employé</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void saveEdit(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-staff-name">Nom complet</Label>
              <Input
                id="edit-staff-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-staff-phone">Téléphone</Label>
              <Input
                id="edit-staff-phone"
                type="tel"
                value={editPhone}
                onChange={(event) => setEditPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-staff-role">Rôle</Label>
              <select
                id="edit-staff-role"
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as StaffRole)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingStaff(null)}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={savingEdit || !editName.trim()}
                className="bg-ivoirien bg-ivoirien-hover text-white"
              >
                {savingEdit ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deactivatingStaff !== null}
        onOpenChange={(open) => !open && setDeactivatingStaff(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver cet employé ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivatingStaff?.full_name ?? "Cet employé"} ne sera plus actif dans l'équipe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeactivate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
