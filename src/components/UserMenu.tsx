import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Settings, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { signOut } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const navigate = useNavigate();
  const { profile, user, loading, isSuperAdmin } = useAuth();

  if (loading || !user) return null;

  const displayName = profile?.nom?.trim() || user.email?.split("@")[0] || "Utilisateur";
  const resolvedName =
    displayName !== "Utilisateur"
      ? displayName
      : (user.user_metadata["full_name"] as string | undefined)?.trim() || displayName;
  const initials = resolvedName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    await navigate({ to: "/auth" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 border border-sidebar-border">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={resolvedName} />
            ) : null}
            <AvatarFallback className="bg-sidebar-primary/20 text-xs text-sidebar-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left md:block">
            <p className="truncate text-sm font-medium leading-none">{resolvedName}</p>
            <p className="text-[10px] text-sidebar-foreground/65">
              {profile?.role ?? "Réparateur"}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isSuperAdmin ? (
          <DropdownMenuItem onClick={() => void navigate({ to: "/admin" })}>
            <Shield className="size-4" />
            Espace Admin
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={() => void navigate({ to: "/profil" })}>
          <User className="size-4" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void navigate({ to: "/parametres" })}>
          <Settings className="size-4" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleSignOut()}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="size-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
