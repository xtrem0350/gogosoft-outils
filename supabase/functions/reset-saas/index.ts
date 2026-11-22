import {
  authorizeSuperAdmin,
  CORS_HEADERS,
  deleteUserAndShopClosures,
  isRecord,
  jsonResponse,
  PROTECTED_USER_IDS,
} from "../_shared/superadmin.ts";

const USERS_PER_PAGE = 1000;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée." }, 405);
  }

  let deletedUsers = 0;
  try {
    const authorization = await authorizeSuperAdmin(request);
    if (authorization instanceof Response) return authorization;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Corps JSON invalide." }, 400);
    }
    if (!isRecord(body) || body.confirmation !== "RESET") {
      return jsonResponse({ error: "Confirmation RESET requise." }, 400);
    }

    const { data: superAdminProfiles, error: profilesError } = await authorization.adminClient
      .from("profiles")
      .select("id")
      .eq("is_super_admin", true);
    if (profilesError) throw profilesError;

    const protectedUserIds = new Set(PROTECTED_USER_IDS);
    protectedUserIds.add(authorization.userId);
    for (const profile of superAdminProfiles ?? []) {
      protectedUserIds.add(profile.id);
    }

    const users = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await authorization.adminClient.auth.admin.listUsers({
        page,
        perPage: USERS_PER_PAGE,
      });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < USERS_PER_PAGE) break;
    }

    const targets = users.filter((user) => !protectedUserIds.has(user.id));
    for (const user of targets) {
      try {
        await deleteUserAndShopClosures(authorization.adminClient, user.id);
        deletedUsers += 1;
      } catch (reason) {
        console.error("reset-saas stopped while deleting user", user.id, reason);
        return jsonResponse(
          {
            error: `Réinitialisation interrompue après ${deletedUsers} compte(s) supprimé(s). ${
              reason instanceof Error ? reason.message : "Erreur inconnue."
            }`,
            deletedUsers,
          },
          500,
        );
      }
    }

    return jsonResponse({ success: true, deletedUsers });
  } catch (reason) {
    console.error("reset-saas failed", reason);
    return jsonResponse(
      {
        error: `Réinitialisation impossible après ${deletedUsers} compte(s) supprimé(s). ${
          reason instanceof Error ? reason.message : "Erreur inconnue."
        }`,
        deletedUsers,
      },
      500,
    );
  }
});
