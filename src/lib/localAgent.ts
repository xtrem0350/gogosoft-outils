/**
 * Configuration du serveur local (agent Windows) qui exécute réellement
 * l'ouverture des dossiers et le lancement des exécutables.
 * Le code de l'agent se trouve dans `server/local-agent.ts`.
 */
const STORAGE_KEY = "gogosoft.agentUrl";

/** URL par défaut de l'agent local. */
export const DEFAULT_AGENT_URL = "http://localhost:4567";

/** Retourne l'URL de l'agent local configurée par l'utilisateur. */
export function getAgentUrl(): string {
  if (typeof window === "undefined") return DEFAULT_AGENT_URL;
  return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_AGENT_URL;
}

/** Enregistre l'URL de l'agent local. */
export function setAgentUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
}

/** Vérifie que l'agent local répond (endpoint `GET /health`). */
export async function pingAgent(): Promise<boolean> {
  try {
    const res = await fetch(`${getAgentUrl()}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}
