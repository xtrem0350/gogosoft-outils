import { supabase } from "@/integrations/supabase/client";

export interface DomainChoice {
  choice_1: string;
  choice_2: string;
  choice_3: string;
}

export interface DomainRequest {
  id: string;
  shop_id: string;
  user_id: string;
  choice_1: string;
  choice_2: string | null;
  choice_3: string | null;
  assigned_domain: string | null;
  status:
    | "pending"
    | "checking"
    | "available"
    | "unavailable"
    | "assigned"
    | "active"
    | "expired";
  registrar: string;
  registered_at: string | null;
  expires_at: string | null;
}

// The domain tables are not yet represented in the generated Supabase types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function domainTable(): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (name: string) => any }).from("domain_requests");
}

export async function checkDomainAvailability(domain: string): Promise<boolean> {
  const normalized = domain.trim().toLowerCase();
  if (!/^[a-z0-9-]+\.ci$/.test(normalized)) {
    throw new Error("Le domaine doit respecter le format nom.ci.");
  }
  const unavailable = ["gogosoft.ci", "google.ci", "test.ci"];
  return !unavailable.includes(normalized) &&
    !normalized.includes("gogosoft") &&
    !normalized.includes("test");
}

export async function findClosestAvailableDomain(choices: string[]): Promise<string> {
  const normalizedChoices = choices.map((choice) => choice.trim().toLowerCase()).filter(Boolean);
  for (const choice of normalizedChoices) {
    if (await checkDomainAvailability(choice)) return choice;
  }

  const base = normalizedChoices[0]?.replace(/\.ci$/, "").replace(/[^a-z0-9]/g, "");
  if (!base) throw new Error("Saisissez au moins un nom de domaine valide.");
  const variants = [
    `${base}-ci.ci`,
    `${base}-abidjan.ci`,
    `mon-${base}.ci`,
    `${base}${Math.floor(Math.random() * 100)}.ci`,
  ];
  for (const variant of variants) {
    if (await checkDomainAvailability(variant)) return variant;
  }
  throw new Error("Aucun domaine disponible.");
}

export async function createDomainRequest(
  shopId: string,
  choices: DomainChoice,
): Promise<DomainRequest> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Non authentifié.");
  if (!shopId) throw new Error("Atelier introuvable.");

  const { data, error } = await domainTable()
    .insert({
      shop_id: shopId,
      user_id: userData.user.id,
      choice_1: choices.choice_1,
      choice_2: choices.choice_2 || null,
      choice_3: choices.choice_3 || null,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as DomainRequest;
}

export async function assignDomain(requestId: string, assignedDomain: string): Promise<void> {
  const { error } = await domainTable()
    .update({
      assigned_domain: assignedDomain.trim().toLowerCase(),
      status: "assigned",
      registered_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", requestId);
  if (error) throw error;
}

export async function getCurrentDomainRequest(shopId: string): Promise<DomainRequest | null> {
  if (!shopId) return null;
  const { data, error } = await domainTable()
    .select("*")
    .eq("shop_id", shopId)
    .in("status", ["assigned", "active"])
    .order("registered_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as DomainRequest | null) ?? null;
}

export async function renewDomain(domainRequestId: string): Promise<void> {
  const now = new Date();
  const { data, error: readError } = await domainTable()
    .select("expires_at")
    .eq("id", domainRequestId)
    .single();
  if (readError) throw readError;
  const previousExpiry =
    typeof (data as { expires_at?: unknown }).expires_at === "string"
      ? new Date((data as { expires_at: string }).expires_at)
      : now;
  const startDate = previousExpiry > now ? previousExpiry : now;
  startDate.setFullYear(startDate.getFullYear() + 1);
  const { error } = await domainTable()
    .update({ status: "active", expires_at: startDate.toISOString() })
    .eq("id", domainRequestId);
  if (error) throw error;
}
