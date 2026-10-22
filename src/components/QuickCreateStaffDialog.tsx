import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaff } from "@/services/staffService";
import { STAFF_ROLE_LABELS, type StaffMember, type StaffRole } from "@/types/staff";

interface QuickCreateStaffDialogProps {
  open: boolean;
  onClose: () => void;
  shopId: string;
  defaultRole?: StaffRole;
  onSuccess: (staff: StaffMember) => void;
}

export function QuickCreateStaffDialog({
  open,
  onClose,
  shopId,
  defaultRole = "technicien",
  onSuccess,
}: QuickCreateStaffDialogProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<StaffRole>(defaultRole);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName("");
    setPhone("");
    setRole(defaultRole);
  }, [defaultRole, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim()) {
      toast.error("Le nom complet est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const staff = await createStaff({
        shop_id: shopId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role,
      });
      toast.success("Employé créé");
      onSuccess(staff);
      setFullName("");
      setPhone("");
      setRole(defaultRole);
      onClose();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Impossible de créer l'employé.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un employé</DialogTitle>
          <DialogDescription>Ajoutez un employé à l'équipe de cette boutique.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-full-name">Nom complet</Label>
            <Input
              id="staff-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-phone">Téléphone</Label>
            <Input
              id="staff-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optionnel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Rôle</Label>
            <select
              id="staff-role"
              value={role}
              onChange={(event) => setRole(event.target.value as StaffRole)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving || !fullName.trim()}
              className="bg-ivoirien bg-ivoirien-hover shadow-3d"
            >
              {saving ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
