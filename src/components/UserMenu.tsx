import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { signOut } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export function UserMenu() {
  const navigate = useNavigate();
  const { profile, user, loading } = useAuth();

  if (loading || !user) return null;

  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Utilisateur";
  const initials = displayName
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
        <Button variant="ghost" className="flex items-center gap-2 px-2 text-white hover:bg-white/10 hover:text-white">
          <Avatar className="size-8 border border-white/20">
            {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={displayName} /> : null}
            <AvatarFallback className="bg-primary/20 text-xs text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left md:block">
            <p className="truncate text-sm font-medium leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-300">{profile?.role ?? "Membre"}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => void navigate({ to: "/profil" })}>
          <User className="size-4" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void navigate({ to: "/parametres" })}>
          <Settings className="size-4" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleSignOut()} className="text-red-600 focus:text-red-600">
          <LogOut className="size-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
