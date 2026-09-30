import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InactivityWarningModalProps {
  open: boolean;
  timeRemaining: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export function InactivityWarningModal({
  open,
  timeRemaining,
  onStayLoggedIn,
  onLogoutNow,
}: InactivityWarningModalProps) {
  const secondsRemaining = Math.max(0, Math.ceil(timeRemaining / 1000));

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">⏰ Vous allez être déconnecté</DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Vous serez déconnecté dans {secondsRemaining} secondes pour cause d'inactivité.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onLogoutNow}>
            Se déconnecter maintenant
          </Button>
          <Button onClick={onStayLoggedIn}>Rester connecté</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
