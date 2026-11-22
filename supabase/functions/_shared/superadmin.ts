import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const PROTECTED_USER_IDS = new Set([
  "c86f8569-bbcd-4207-be36-9cce86b654cd",
  "ec3f5f29-e0c1-4c2a-b94f-55057f40b730",
  "3e314d77-3bd0-42f4-b96e-3ef845526f46",
  "627d76b2-54bb-491f-a8f3-00054e07630f",
]);

export function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function authorizeSuperAdmin(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentification requise." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Configuration Supabase Edge Function incomplète.");
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Session invalide ou expirée." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.is_super_admin !== true) {
    return jsonResponse({ error: "Action réservée au SuperAdmin." }, 403);
  }

  return { adminClient, userId: user.id };
}

export async function deleteUserAndShopClosures(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<void> {
  const { data: shops, error: shopsError } = await adminClient
    .from("shops")
    .select("id")
    .eq("owner_id", userId);
  if (shopsError) throw shopsError;

  for (const shop of shops ?? []) {
    const { error: closuresError } = await adminClient
      .from("cash_closures")
      .delete()
      .eq("shop_id", shop.id);
    if (closuresError) throw closuresError;
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteError) throw deleteError;
}
