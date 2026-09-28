import { supabase } from "@/integrations/supabase/client";

export interface DeviceInfo {
  imei: string;
  os: string;
  build: string;
}

const DEVICE_ID_KEY = "gogosoft_device_id";

function hashFingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `web-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function detectOperatingSystem(userAgent: string): string {
  if (/android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Inconnu";
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { imei: "web-server", os: "Inconnu", build: "Inconnu" };
  }

  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio}`;
  const fingerprint = [
    navigator.userAgent,
    navigator.platform,
    navigator.language,
    navigator.hardwareConcurrency,
    screenInfo,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  let imei = hashFingerprint(fingerprint);
  try {
    const storedId = window.localStorage.getItem(DEVICE_ID_KEY);
    if (storedId) imei = storedId;
    else window.localStorage.setItem(DEVICE_ID_KEY, imei);
  } catch {
    // Keep the deterministic fingerprint when browser storage is unavailable.
  }

  return {
    imei,
    os: detectOperatingSystem(navigator.userAgent),
    build: navigator.userAgent,
  };
}

export async function hasDeviceUsedTrial(deviceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .filter("device_imei", "eq", deviceId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function markTrialAsUsed(userId: string, deviceInfo: DeviceInfo): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update(
      {
        device_imei: deviceInfo.imei,
        device_os: deviceInfo.os,
        device_build: deviceInfo.build,
        first_trial_used_at: new Date().toISOString(),
      } as never,
    )
    .eq("id", userId);
  if (error) throw error;
}

export async function getFirstTrialUsedAt(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Record<string, unknown> | null)?.["first_trial_used_at"] as string | null;
}
