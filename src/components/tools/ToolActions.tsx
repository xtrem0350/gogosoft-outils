import {
  Download,
  ExternalLink,
  FileArchive,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Play,
  Copy,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { launchExe, openArchive, openFolder } from "@/services/launchService";
import type { Tool } from "@/types/database";

export interface ToolActionsProps {
  tool: Tool;
  downloadUrl?: string | null;
  compact?: boolean;
  onEdit?: (tool: Tool) => void;
  onDelete?: (tool: Tool) => void;
  onDuplicate?: (tool: Tool) => void;
}

async function showLaunchResult(action: Promise<{ ok: boolean; message: string }>) {
  const result = await action;
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
}

/** Actions d'utilisation et menu secondaire partagés par les vues d'outils. */
export function ToolActions({
  tool,
  downloadUrl,
  compact = false,
  onEdit,
  onDelete,
  onDuplicate,
}: ToolActionsProps) {
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(true);
    try {
      await showLaunchResult(action());
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!downloadUrl) {
      toast.info("Aucun lien de téléchargement n'est configuré.");
      return;
    }
    window.open(downloadUrl, "_blank", "noopener,noreferrer");
  }

  const actionButtonClass = compact ? "size-8" : "h-9 px-2.5";

  return (
    <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="outline"
        size={compact ? "icon" : "sm"}
        className={actionButtonClass}
        disabled={busy}
        onClick={() => void run(() => openFolder(tool))}
        aria-label={`Ouvrir le dossier de ${tool.nom}`}
        title="Ouvrir le dossier"
      >
        <FolderOpen />
        {!compact && <span>Ouvrir</span>}
      </Button>
      {tool.type === "exe" && (
        <Button
          size={compact ? "icon" : "sm"}
          className={actionButtonClass}
          disabled={busy}
          onClick={() => void run(() => launchExe(tool))}
          aria-label={`Lancer ${tool.nom}`}
          title="Lancer l'outil"
        >
          <Play />
          {!compact && <span>Lancer</span>}
        </Button>
      )}
      {tool.type === "archive" && (
        <Button
          size={compact ? "icon" : "sm"}
          className={actionButtonClass}
          disabled={busy}
          onClick={() => void run(() => openArchive(tool))}
          aria-label={`Ouvrir l'archive ${tool.nom}`}
          title="Ouvrir l'archive"
        >
          <FileArchive />
          {!compact && <span>Ouvrir</span>}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleDownload}
        aria-label={`Télécharger ${tool.nom}`}
        title="Télécharger"
      >
        <Download />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Actions supplémentaires">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(tool)}>
            <Pencil /> Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate?.(tool)}>
            <Copy /> Dupliquer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.info(tool.favori ? "Outil favori" : "Outil standard")}>
            <Star /> {tool.favori ? "Favori" : "Ajouter aux favoris"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete?.(tool)}>
            <Trash2 /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {downloadUrl && <ExternalLink className="sr-only" aria-hidden="true" />}
    </div>
  );
}
