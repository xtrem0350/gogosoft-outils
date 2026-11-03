import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transferRoleToMember } from "@/services/roleService";
import type { TeamMember } from "@/services/teamService";
import { toast } from "sonner";

interface TransferRoleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopId: string;
  role: string;
  ownerId: string;
  members: TeamMember[];
}

export function TransferRoleModal({
  open,
  onClose,
  onSuccess,
  shopId,
  role,
  ownerId,
  members,
}: TransferRoleModalProps) {
  const [memberUserId, setMemberUserId] = useState("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (open) setMemberUserId("");
  }, [open, role]);

  const eligibleMembers = [...new Map(
    members.filter((member) => member.user_id !== ownerId).map((member) => [member.user_id, member]),
  ).values()];

  async function transferRole() {
    if (!memberUserId) {
      toast.error("Sélectionnez un membre.");
      return;
    }
    setTransferring(true);
    try {
      await transferRoleToMember(shopId, ownerId, memberUserId, role);
      toast.success(`Rôle ${role} transféré.`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfert impossible.");
    } finally {
      setTransferring(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transférer le rôle {role}</DialogTitle>
          <DialogDescription>
            Le rôle sera retiré à l&apos;Owner et attribué au membre sélectionné.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="transfer-role-member">Membre</Label>
          <Select value={memberUserId} onValueChange={setMemberUserId}>
            <SelectTrigger id="transfer-role-member">
              <SelectValue placeholder="Sélectionner un membre" />
            </SelectTrigger>
            <SelectContent>
              {eligibleMembers.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.full_name || member.email || member.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={transferring}>Annuler</Button>
          <Button onClick={() => void transferRole()} disabled={transferring || eligibleMembers.length === 0}>
            {transferring ? "Transfert..." : "Transférer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
