// src/components/CashReceiptModal.tsx

import { useEffect } from "react";
import { toast } from "sonner";
import { DocumentPrinter } from "@/components/documents/DocumentPrinter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { archiveCashReceipt, type CashReceiptRecord } from "@/services/cashService";

export type CashReceipt = CashReceiptRecord;

export interface CashReceiptDraft {
  reference: string;
  clientName: string;
  device: string;
  amount: number;
  date: string;
  source_id: string;
  paymentMethod: string;
}

interface CashReceiptModalProps {
  receipt: CashReceipt | null;
  onClose: () => void;
}

export function CashReceiptModal({ receipt, onClose }: CashReceiptModalProps) {
  useEffect(() => {
    if (!receipt) return;
    try {
      archiveCashReceipt(receipt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'archiver le reçu.");
    }
  }, [receipt]);

  if (!receipt) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DocumentPrinter
          documentType="receipt"
          documentId={receipt.receipt_number}
          data={{
            "N° reçu": receipt.receipt_number,
            reference: receipt.reference,
            clientName: receipt.clientName,
            device: receipt.device,
            amount: receipt.amount,
            date: receipt.date,
            shop_name: receipt.shop_name,
            payment_method: receipt.paymentMethod,
          }}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
