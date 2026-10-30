import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CashExit } from "@/services/cashService";

interface CaisseExitsTabProps {
  exits: CashExit[];
  onAdd: () => void;
  onReceipt: (exit: CashExit) => void;
}

const formatMoney = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
const formatDate = (value: string) => new Date(value).toLocaleString("fr-FR");

export function CaisseExitsTab({ exits, onAdd }: CaisseExitsTabProps) {
  return (
    <Card className="card-3d rounded-xl">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div><CardTitle>Sorties de caisse</CardTitle><p className="text-sm text-muted-foreground">Pièces et dépenses diverses de la période.</p></div>
        <Button type="button" onClick={onAdd}><Plus className="size-4" /> Ajouter une sortie</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {exits.length ? exits.map((exit) => (
          <div key={exit.id} className="flex flex-wrap justify-between gap-3 rounded-lg border p-3">
            <div><p className="font-medium">{exit.type === "parts" ? "Paiement pièces" : "Dépense diverse"}</p><p className="text-sm text-muted-foreground">{exit.description || "Sans description"} · {formatDate(exit.created_at)}</p></div>
            <span className="font-bold text-destructive">− {formatMoney(exit.amount)}</span>
          </div>
        )) : <p className="text-sm text-muted-foreground">Aucune sortie de caisse sur cette période.</p>}
      </CardContent>
    </Card>
  );
}
