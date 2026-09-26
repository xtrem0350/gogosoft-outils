import { APP_VERSION, RELEASE_NOTES } from "./version";

const STORAGE_KEY = "gogosoft_last_seen_version";

export function getLastSeenVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastSeenVersion(version: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

export function hasNewVersion(): boolean {
  return getLastSeenVersion() !== APP_VERSION;
}

export function getLatestReleaseNote() {
  return RELEASE_NOTES.find((release) => release.version === APP_VERSION) ?? RELEASE_NOTES[0]!;
}
