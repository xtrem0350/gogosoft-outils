import {
  authorizeSuperAdmin,
  CORS_HEADERS,
  deleteUserAndShopClosures,
  isRecord,
  jsonResponse,
  PROTECTED_USER_IDS,
} from "../_shared/superadmin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  try {
    const authorization = await authorizeSuperAdmin(request);
    if (authorization instanceof Response) return authorization;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Corps JSON invalide." }, 400);
    }
    if (!isRecord(body) || typeof body.userId !== "string" || !body.userId.trim()) {
      return jsonResponse({ error: "Identifiant utilisateur invalide." }, 400);
    }

    const userId = body.userId.trim();
    if (userId === authorization.userId || PROTECTED_USER_IDS.has(userId)) {
      return jsonResponse({ error: "Ce compte est protégé et ne peut pas être supprimé." }, 403);
    }

    const { data: targetProfile, error: targetProfileError } = await authorization.adminClient
      .from("profiles")
      .select("is_super_admin")
      .eq("id", userId)
      .maybeSingle();
    if (targetProfileError) throw targetProfileError;
    if (targetProfile?.is_super_admin === true) {
      return jsonResponse({ error: "Un compte SuperAdmin ne peut pas être supprimé." }, 403);
    }

    await deleteUserAndShopClosures(authorization.adminClient, userId);
    return jsonResponse({ success: true });
  } catch (reason) {
    console.error("delete-user failed", reason);
    return jsonResponse(
      { error: reason instanceof Error ? reason.message : "Suppression impossible." },
      500,
    );
  }
});
