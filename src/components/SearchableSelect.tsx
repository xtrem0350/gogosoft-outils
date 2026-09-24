/** Liste déroulante avec recherche pour référencer un élément déjà créé. */
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value?: string;
  onSelect: (option: SearchableOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  onCreateNew?: () => void;
  createLabel?: string;
  className?: string;
}

/** Sélecteur générique basé sur Popover + Command. */
export function SearchableSelect({
  options,
  value,
  onSelect,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  loading = false,
  onCreateNew,
  createLabel = "Créer un nouveau",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </span>
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              <p className="text-sm text-muted-foreground">
                {loading ? "Chargement..." : emptyMessage}
              </p>
              {onCreateNew ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                >
                  <Plus className="size-4" />
                  {createLabel}
                </Button>
              ) : null}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.description ?? ""} ${option.value}`}
                  onSelect={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  {option.icon}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                  <Check
                    className={cn(
                      "size-4",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateNew && options.length > 0 ? (
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    setOpen(false);
                    onCreateNew();
                  }}
                >
                  <Plus className="size-4" />
                  {createLabel}
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
