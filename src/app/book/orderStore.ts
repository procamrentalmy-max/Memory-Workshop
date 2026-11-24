"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_ORDER, type Order } from "@/lib/types";

// The in-progress order is kept in the browser so it survives moving between booking steps.
const KEY = "pm-order-v1";
let state: Order = EMPTY_ORDER;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY_ORDER, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable: start empty */
  }
}

export function setOrder(fn: (o: Order) => Order) {
  load();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export const resetOrder = () => setOrder(() => EMPTY_ORDER);

/** Returns null until the stored order has loaded in the browser. */
export function useOrder(): Order | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return state;
    },
    () => null,
  );
}

export const newId = () => Math.random().toString(36).slice(2, 10);

/** The current order, read outside React (e.g. to check which photos are still in use). */
export function getOrder(): Order {
  load();
  return state;
}
