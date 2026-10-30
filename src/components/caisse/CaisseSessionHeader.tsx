import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CashSession } from "@/services/cashService";

interface CaisseSessionHeaderProps {
  shopId: string | null;
  session: CashSession | null;
  openedByName: string | undefined;
  onOpen: (openingAmount: number) => void | Promise<void>;
  onClose: (closingAmount: number, notes?: string) => void | Promise<void>;
}

const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;

export function CaisseSessionHeader({
  session,
  openedByName,
  onOpen,
  onClose,
}: CaisseSessionHeaderProps) {
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("0");
  const [closingAmount, setClosingAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function confirmOpen(): Promise<void> {
    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    setSaving(true);
    try {
      await onOpen(amount);
      setOpenModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function confirmClose(): Promise<void> {
    const amount = Number(closingAmount);
    if (!Number.isFinite(amount) || amount < 0) return;
    setSaving(true);
    try {
      await onClose(amount, notes.trim() || undefined);
      setCloseModal(false);
    } finally {
      setSaving(false);
    }
  }

  const openedAt = session ? new Date(session.opened_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <>
      <Card className="card-3d rounded-xl">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="font-medium">
            {session
              ? `🟢 Caisse ouverte depuis ${openedAt} par ${openedByName ?? session.opened_by}. Montant initial : ${formatMoney(session.opening_amount)}`
              : "🔴 Caisse fermée."}
          </p>
          <Button type="button" variant={session ? "outline" : "default"} onClick={() => session ? setCloseModal(true) : setOpenModal(true)}>
            {session ? "Fermer la caisse" : "Ouvrir la caisse"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={(open) => !saving && setOpenModal(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ouvrir la caisse</DialogTitle></DialogHeader>
          <label className="grid gap-2 text-sm font-medium">
            Montant initial
            <Input type="number" min="0" step="1" value={openingAmount} onChange={(event) => setOpeningAmount(event.target.value)} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)} disabled={saving}>Annuler</Button>
            <Button type="button" onClick={() => void confirmOpen()} disabled={saving}>{saving ? "Ouverture…" : "Ouvrir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeModal} onOpenChange={(open) => !saving && setCloseModal(open)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fermer la caisse</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium">
              Montant réel
              <Input type="number" min="0" step="1" value={closingAmount} onChange={(event) => setClosingAmount(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Notes
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCloseModal(false)} disabled={saving}>Annuler</Button>
            <Button type="button" onClick={() => void confirmClose()} disabled={saving}>{saving ? "Fermeture…" : "Fermer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
