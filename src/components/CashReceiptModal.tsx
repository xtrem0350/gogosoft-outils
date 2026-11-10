// src/components/CashReceiptModal.tsx

import { DocumentPrinter } from "@/components/documents/DocumentPrinter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export interface CashReceipt {
  reference: string;
  clientName: string;
  device: string;
  amount: number;
  date: string;
}

interface CashReceiptModalProps {
  receipt: CashReceipt | null;
  onClose: () => void;
}

export function CashReceiptModal({ receipt, onClose }: CashReceiptModalProps) {
  if (!receipt) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DocumentPrinter
          documentType="receipt"
          documentId={receipt.reference}
          data={{ ...receipt }}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
