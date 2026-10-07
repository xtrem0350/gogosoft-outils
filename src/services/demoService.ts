import { supabase } from "@/integrations/supabase/client";
import type { ClientRecord } from "@/services/clientService";
import type { Sale } from "@/services/salesService";
import type { OnlineProduct } from "@/services/shopOnlineService";
import type { WorkshopEvent, WorkshopStatus } from "@/services/workshopService";
import type { WorkshopTicket } from "@/types/database";
import type { ModuleId } from "@/types/modules";
import { demoCodesFromModuleIds } from "@/types/modules";

export const DEMO_SESSION_KEY = "gogosoft.demo.session";
export const DEMO_MODULES_KEY = "gogosoft.demo.modules";
export const DEMO_SESSION_CHANGED_EVENT = "gogosoft:demo-session-changed";
export const DEMO_SHOP_ID = "gogosoft-demo-shop";
export const DEMO_SHOP_SLUG = "demo-gogosoft";

export interface DemoSession {
  is_demo: true;
  modules: string[];
  expires_at: string;
  shop_id: string;
  tickets: WorkshopTicket[];
  clients: ClientRecord[];
  sales: Sale[];
  products: OnlineProduct[];
  events: WorkshopEvent[];
}

function getStoredSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    const record = typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
    if (
      !record ||
      record["is_demo"] !== true ||
      !Array.isArray(record["modules"]) ||
      !Array.isArray(record["tickets"]) ||
      !Array.isArray(record["clients"]) ||
      !Array.isArray(record["sales"]) ||
      !Array.isArray(record["products"]) ||
      !Array.isArray(record["events"]) ||
      typeof record["expires_at"] !== "string"
    ) {
      return null;
    }
    return value as DemoSession;
  } catch {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    return null;
  }
}

function saveSession(session: DemoSession): void {
  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  window.sessionStorage.setItem(DEMO_MODULES_KEY, JSON.stringify(session.modules));
  window.dispatchEvent(new Event(DEMO_SESSION_CHANGED_EVENT));
}

function recentDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

const clientSeeds = [
  { full_name: "Aya Kouassi", whatsapp: "+225 07 08 12 34 56" },
  { full_name: "Moussa Traoré", whatsapp: "+225 05 44 20 18 72" },
  { full_name: "Aïssata Bamba", whatsapp: "+225 01 02 76 54 32" },
  { full_name: "Jean Koffi", whatsapp: "+225 07 77 31 20 09" },
  { full_name: "Fatou Diallo", whatsapp: "+225 05 66 14 08 42" },
];

const phoneSeeds = [
  ["iPhone 12", "Écran cassé", 35000, "en_cours"],
  ["Samsung A54", "Batterie hors service", 18000, "diagnostic"],
  ["Tecno Spark 10", "Connecteur de charge", 12000, "en_attente"],
  ["Infinix Hot 30", "Ne s'allume pas", 25000, "termine"],
  ["Xiaomi Redmi Note 12", "Caméra", 22000, "livre"],
] as const;

const computerSeeds = [
  ["HP EliteBook 840", "Remplacement SSD", 45000, "en_cours"],
  ["Dell Latitude 5420", "Batterie", 38000, "diagnostic"],
  ["Lenovo ThinkPad T14", "Clavier", 30000, "en_attente"],
  ["MacBook Air M1", "Nettoyage et maintenance", 55000, "termine"],
] as const;

function createSeedSession(selectedModules: string[]): DemoSession {
  const selected = [...new Set(selectedModules)];
  const hasClientModule = selected.some((code) =>
    ["repair_phone", "repair_computer", "sale_phone", "sale_computer"].includes(code),
  );
  const clients: ClientRecord[] = (hasClientModule ? clientSeeds : []).map((client, index) => ({
    id: `demo-client-${index + 1}`,
    shop_id: DEMO_SHOP_ID,
    ...client,
    total_repairs: index % 3,
    created_at: recentDate(index * 3 + 1),
    updated_at: recentDate(index * 2),
  }));
  const repairTypes: Array<{ code: string; activity: "phone" | "computer"; seeds: typeof phoneSeeds | typeof computerSeeds }> = [
    { code: "repair_phone", activity: "phone", seeds: phoneSeeds },
    { code: "repair_computer", activity: "computer", seeds: computerSeeds },
  ];
  const repairTickets = repairTypes.flatMap(({ code, activity, seeds }) =>
    selected.includes(code)
      ? seeds.map(([device_model, issue, price, status], index) => ({
          id: `demo-ticket-${activity}-${index + 1}`,
          shop_id: DEMO_SHOP_ID,
          client_id: clients[index % clients.length]?.id ?? null,
          client_name: clients[index % clients.length]?.full_name ?? null,
          client_whatsapp: clients[index % clients.length]?.whatsapp ?? null,
          device_model,
          device_processor: null,
          device_imei: null,
          device_sn: null,
          device_os_version: null,
          issues: [issue],
          status: status as WorkshopStatus,
          diagnosis: null,
          notes: "Donnée de démonstration",
          price_estimate: price,
          price_final: status === "termine" || status === "livre" ? price : null,
          notified_at: null,
          entry_fee: 2000,
          entry_fee_paid: true,
          diagnostic_notes: issue,
          created_by: null,
          created_at: recentDate(index * 4 + 1),
          updated_at: recentDate(index * 2),
          activity_type: activity,
          category: activity,
        }))
      : [],
  );
  const consumableTickets = selected.includes("consumable")
    ? [
        ["Écran iPhone 12", "Écran", 2, "en_cours"],
        ["Batterie Samsung A14", "Batterie", 4, "en_attente"],
        ["Chargeur USB-C 25 W", "Chargeur", 9, "termine"],
        ["Coque renforcée universelle", "Coque", 12, "en_cours"],
      ].map(([device_model, category, quantity, status], index) => ({
        id: `demo-consumable-${index + 1}`,
        shop_id: DEMO_SHOP_ID,
        client_id: null,
        client_name: null,
        client_whatsapp: null,
        device_model,
        device_processor: null,
        device_imei: null,
        device_sn: null,
        device_os_version: null,
        issues: [],
        status: status as WorkshopStatus,
        diagnosis: null,
        notes: `Seuil d'alerte: ${index < 2 ? 5 : 3}`,
        price_estimate: quantity,
        price_final: null,
        notified_at: null,
        entry_fee: null,
        entry_fee_paid: false,
        diagnostic_notes: null,
        created_by: null,
        created_at: recentDate(index * 5 + 1),
        updated_at: recentDate(index),
        activity_type: "consumable",
        category,
      }))
    : [];
  const tickets = [...repairTickets, ...consumableTickets] as WorkshopTicket[];
  const saleSeeds = [
    ...(selected.includes("sale_phone")
      ? [{ activity: "phone" as const, name: "Samsung Galaxy A14", price: 95000 }]
      : []),
    ...(selected.includes("sale_computer")
      ? [{ activity: "computer" as const, name: "Dell Latitude 5410", price: 245000 }]
      : []),
  ];
  const sales: Sale[] = saleSeeds.map((sale, index) => ({
    id: `demo-sale-${index + 1}`,
    shop_id: DEMO_SHOP_ID,
    activity_type: sale.activity,
    product_name: sale.name,
    product_description: "Produit de démonstration",
    product_photo_url: null,
    characteristics: null,
    quantity: 1,
    unit_price: sale.price,
    total_price: sale.price,
    payment_status: index === 0 ? "paid" : "pending",
    payment_method: index === 0 ? "orange_money" : null,
    delivery_status: index === 0 ? "delivered" : "ready",
    client_id: clients[index]?.id ?? null,
    client_name: clients[index]?.full_name ?? null,
    client_whatsapp: clients[index]?.whatsapp ?? null,
    notes: null,
    created_by: null,
    created_at: recentDate(index + 2),
    updated_at: recentDate(index + 1),
  }));
  const productSeeds = [
    ...(selected.includes("shop_phone") || selected.includes("sale_phone")
      ? [
          { name: "iPhone 12 128 Go", category: "phone", price: 185000, stock: 3 },
          { name: "Samsung Galaxy A54", category: "phone", price: 145000, stock: 5 },
          { name: "Tecno Spark 10", category: "phone", price: 65000, stock: 7 },
        ]
      : []),
    ...(selected.includes("shop_computer") || selected.includes("sale_computer")
      ? [
          { name: "HP EliteBook 840 G7", category: "computer", price: 275000, stock: 2 },
          { name: "Dell Latitude 5420", category: "computer", price: 310000, stock: 3 },
          { name: "Lenovo ThinkPad T14", category: "computer", price: 295000, stock: 2 },
          { name: "MacBook Air M1", category: "computer", price: 460000, stock: 1 },
        ]
      : []),
    ...(selected.includes("consumable")
      ? [
          { name: "Écran iPhone 12", category: "consumable", price: 35000, stock: 2 },
          { name: "Batterie Samsung A14", category: "consumable", price: 12000, stock: 4 },
          { name: "Chargeur USB-C 25 W", category: "accessory", price: 8000, stock: 9 },
          { name: "Coque renforcée universelle", category: "accessory", price: 5000, stock: 12 },
        ]
      : []),
  ];
  const products: OnlineProduct[] = productSeeds.map((product, index) => ({
    id: `demo-product-${index + 1}`,
    shop_id: DEMO_SHOP_ID,
    name: product.name,
    category: product.category,
    description: "Article de démonstration — prix indicatif en FCFA.",
    price: product.price,
    stock: product.stock,
    image_urls: [],
    characteristics: {},
    is_available: true,
    is_featured: index === 0,
    created_by: null,
    created_at: recentDate(index + 1),
    updated_at: recentDate(index),
  }));
  const events: WorkshopEvent[] = tickets.map((ticket, index) => ({
    id: `demo-event-${index + 1}`,
    ticket_id: ticket.id,
    event_type: index === 0 ? "in_progress" : "received",
    description: `${ticket.device_model}: ${ticket.issues[0] ?? "Intervention"}`,
    created_by: null,
    created_at: ticket.created_at,
  }));

  return {
    is_demo: true,
    modules: selected,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    shop_id: DEMO_SHOP_ID,
    tickets,
    clients,
    sales,
    products,
    events,
  };
}

export function readDemoSession(): DemoSession | null {
  return getStoredSession();
}

export function isDemoMode(): boolean {
  return getStoredSession() !== null;
}

export function getDemoModuleCodes(): string[] {
  return getStoredSession()?.modules ?? [];
}

export function updateDemoModules(moduleCodes: string[]): void {
  const session = getStoredSession();
  if (!session) return;
  const modules = [...new Set(moduleCodes)];
  const refreshed = createSeedSession(modules);
  saveSession({ ...refreshed, expires_at: session.expires_at });
}

export function updateDemoSession(update: (session: DemoSession) => DemoSession): void {
  const session = getStoredSession();
  if (session) saveSession(update(session));
}

export async function startDemo(selectedModules: string[]): Promise<DemoSession> {
  if (selectedModules.length === 0) throw new Error("Sélectionnez au moins un module.");
  window.sessionStorage.removeItem("gogosoft.demo.cart");
  const session = createSeedSession(selectedModules);
  saveSession(session);
  return session;
}

export function endDemo(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  window.sessionStorage.removeItem(DEMO_MODULES_KEY);
  window.sessionStorage.removeItem("gogosoft.demo.cart");
  window.dispatchEvent(new Event(DEMO_SESSION_CHANGED_EVENT));
}

export async function getDemoInfo() {
  const localSession = getStoredSession();
  if (localSession) return { is_demo: true, demo_expires_at: localSession.expires_at };
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

export function getDemoTickets(
  activityType?: "phone" | "computer" | "consumable",
): WorkshopTicket[] {
  const tickets = getStoredSession()?.tickets ?? [];
  return activityType
    ? tickets.filter(
        (ticket) => (ticket as WorkshopTicket & { activity_type?: string }).activity_type === activityType,
      )
    : tickets;
}

export function getDemoClients(): ClientRecord[] {
  return getStoredSession()?.clients ?? [];
}

export function getDemoSales(activityType?: "phone" | "computer"): Sale[] {
  const sales = getStoredSession()?.sales ?? [];
  return activityType ? sales.filter((sale) => sale.activity_type === activityType) : sales;
}

export function getDemoProducts(filters: { category?: string; search?: string } = {}): OnlineProduct[] {
  const products = getStoredSession()?.products ?? [];
  const query = filters.search?.trim().toLocaleLowerCase();
  return products.filter(
    (product) =>
      (!filters.category || product.category === filters.category) &&
      (!query || product.name.toLocaleLowerCase().includes(query)),
  );
}

export function getDemoProductById(id: string): OnlineProduct | null {
  return getStoredSession()?.products.find((product) => product.id === id) ?? null;
}

export function getDemoEvents(ticketId?: string): WorkshopEvent[] {
  const events = getStoredSession()?.events ?? [];
  return ticketId ? events.filter((event) => event.ticket_id === ticketId) : events;
}

export function formatDemoTime(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expiré";
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}j ${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${seconds}s`;
  return `${seconds}s`;
}

export function selectedDemoModuleIds(ids: ModuleId[]): string[] {
  return demoCodesFromModuleIds(ids);
}
