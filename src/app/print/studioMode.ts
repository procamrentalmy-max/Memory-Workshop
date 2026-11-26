"use client";

import { useSyncExternalStore } from "react";

// "At the studio" mode: turned on by the QR code on the studio's tables (/collage?studio=CODE).
// In this mode customers send their photo pages straight to print instead of booking a visit.
// It lasts 12 hours from the last time the photo pages were opened, so a phone doesn't stay in it.
const KEY = "pm-studio-v1";
const HOURS = 12;
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) ?? "null") as { code?: string; until?: number } | null;
    return v?.code && (v.until ?? 0) > Date.now() ? v.code : null;
  } catch {
    return null;
  }
}

function write(code: string | null) {
  try {
    if (code) window.localStorage.setItem(KEY, JSON.stringify({ code, until: Date.now() + HOURS * 3600_000 }));
    else window.localStorage.removeItem(KEY);
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export const enterStudioMode = (code: string) => write(code.trim().toUpperCase().slice(0, 20));
export const leaveStudioMode = () => write(null);
/** Keeps studio mode on while the customer is still using it. */
export function refreshStudioMode() {
  const code = read();
  if (code) write(code);
}

/** The studio code while this device is in "at the studio" mode, otherwise null. */
export function useStudioCode(): string | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => null,
  );
}
