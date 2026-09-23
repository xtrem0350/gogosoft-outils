/** Carnet d'expérience : fiches de réparation personnelles du réparateur. */
import { supabase } from "@/integrations/supabase/client";
import { hasActiveSession, requireShopId } from "@/lib/supabaseGuard";
import { getTicketById, ISSUES_DATABASE, type IssueKey } from "@/services/workshopService";

/** Niveau de difficulté ressenti par le réparateur. */
export type GuideDifficulty = "easy" | "medium" | "hard" | "expert";

/** Étape d'une fiche d'expérience. */
export interface GuideStep {
  title: string;
  detail?: string;
}

/** Lien externe (vidéo YouTube, iFixit, forum...). */
export interface GuideLink {
  label: string;
  url: string;
}

/** Fiche d'expérience enregistrée. */
export interface RepairGuide {
  id: string;
  shop_id: string | null;
  author_id: string | null;
  brand: string;
  device_model: string;
  processor: string | null;
  difficulty: GuideDifficulty | null;
  estimated_time: number | null;
  actual_time: number | null;
  tools_needed: string[] | null;
  steps: GuideStep[] | null;
  images: string[] | null;
  external_links: GuideLink[] | null;
  personal_notes: string | null;
  is_public: boolean;
  created_at: string | null;
  updated_at: string | null;
}

/** Données de création d'une fiche d'expérience. */
export interface CreateGuideData {
  shop_id: string;
  brand: string;
  device_model: string;
  processor?: string | null;
  difficulty?: GuideDifficulty | null;
  estimated_time?: number | null;
  actual_time?: number | null;
  tools_needed?: string[];
  steps?: GuideStep[];
  images?: string[];
  external_links?: GuideLink[];
  personal_notes?: string | null;
  is_public?: boolean;
}

/** Filtres de recherche des fiches publiques. */
export interface PublicGuideFilters {
  brand?: string;
  device_model?: string;
  difficulty?: GuideDifficulty;
  search?: string;
}

/** Récupère les fiches d'expérience de la boutique courante. */
export async function getMyGuides(shopId: string | null | undefined): Promise<RepairGuide[]> {
  if (!(await hasActiveSession()) || !shopId) return [];
  const { data, error } = await supabase
    .from("repair_guides")
    .select("*")
    .eq("shop_id", requireShopId(shopId))
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RepairGuide[];
}

/** Récupère les fiches partagées avec la communauté. */
export async function getPublicGuides(filters: PublicGuideFilters = {}): Promise<RepairGuide[]> {
  if (!(await hasActiveSession())) return [];
  let request = supabase.from("repair_guides").select("*").eq("is_public", true);
  if (filters.brand) request = request.ilike("brand", `%${filters.brand}%`);
  if (filters.device_model) request = request.ilike("device_model", `%${filters.device_model}%`);
  if (filters.difficulty) request = request.eq("difficulty", filters.difficulty);
  if (filters.search) {
    request = request.or(
      `brand.ilike.%${filters.search}%,device_model.ilike.%${filters.search}%`,
    );
  }
  const { data, error } = await request.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RepairGuide[];
}

/** Crée une fiche d'expérience. */
export async function createGuide(data: CreateGuideData): Promise<RepairGuide> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const shopId = requireShopId(data.shop_id);
  const { data: auth } = await supabase.auth.getUser();
  const { data: guide, error } = await supabase
    .from("repair_guides")
    .insert({
      ...data,
      shop_id: shopId,
      author_id: auth.user?.id ?? null,
      steps: data.steps ?? null,
      external_links: data.external_links ?? null,
    } as never)
    .select()
    .single();
  if (error) throw error;
  return guide as unknown as RepairGuide;
}

/** Met à jour une fiche d'expérience. */
export async function updateGuide(
  id: string,
  data: Partial<CreateGuideData>,
): Promise<RepairGuide> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { data: guide, error } = await supabase
    .from("repair_guides")
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return guide as unknown as RepairGuide;
}

/** Supprime une fiche d'expérience. */
export async function deleteGuide(id: string): Promise<void> {
  if (!(await hasActiveSession())) throw new Error("NO_SESSION");
  const { error } = await supabase.from("repair_guides").delete().eq("id", id);
  if (error) throw error;
}

/** Pré-remplit une fiche d'expérience à partir d'une fiche d'atelier terminée. */
export async function convertTicketToGuide(ticketId: string): Promise<CreateGuideData | null> {
  const ticket = await getTicketById(ticketId);
  if (!ticket?.shop_id) return null;
  const diagnosis = ticket.diagnosis as { tools?: string[]; process?: string[] } | null;
  const issueLabels = ticket.issues.map(
    (issue) => ISSUES_DATABASE[issue as IssueKey]?.label ?? issue,
  );
  return {
    shop_id: ticket.shop_id,
    brand: (ticket.device_model ?? "").split(" ")[0] || "Inconnue",
    device_model: ticket.device_model ?? "",
    processor: ticket.device_processor,
    difficulty: "medium",
    tools_needed: diagnosis?.tools ?? [],
    steps: (diagnosis?.process ?? []).map((title) => ({ title })),
    personal_notes: [ticket.notes, ticket.diagnostic_notes, issueLabels.join(", ")]
      .filter(Boolean)
      .join("\n"),
    is_public: false,
  };
}
