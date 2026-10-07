import { supabase } from "@/integrations/supabase/client";

export async function startDemo(selectedModules: string[]) {
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw authError;
  if (!authData.session) throw new Error("Pas de session");

  const response = await fetch(
    `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/setup-demo`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.session.access_token}`,
      },
      body: JSON.stringify({ modules: selectedModules }),
    },
  );

  if (!response.ok) throw new Error("Impossible de démarrer la démo");
  return await response.json();
}

export async function getDemoInfo() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("is_demo, demo_expires_at")
    .eq("id", user.id)
    .maybeSingle();

  return data;
}

export function formatDemoTime(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}min`;
}