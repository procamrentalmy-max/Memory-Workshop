"use client";

import { useEffect } from "react";
import { orderPhotoFiles } from "@/lib/orderPhotos";
import { draftPhotoFiles } from "./devicePhotos";
import { useOrder } from "./orderStore";

const THROTTLE_MS = 60 * 60 * 1000; // tell the server at most once an hour for the same photos

/**
 * While a customer has the booking pages open, keeps their photos from being cleaned up:
 * unbooked photos are deleted only after 7 days without use.
 */
export function PhotoKeepAlive() {
  const order = useOrder();
  const files = order ? [...new Set([...orderPhotoFiles(order), ...draftPhotoFiles()])].sort() : [];
  const key = files.join(",");

  useEffect(() => {
    if (!key) return;
    try {
      const last = JSON.parse(window.sessionStorage.getItem("pm-photo-touch") ?? "null");
      if (last?.key === key && Date.now() - last.at < THROTTLE_MS) return;
      window.sessionStorage.setItem("pm-photo-touch", JSON.stringify({ key, at: Date.now() }));
    } catch {
      /* storage unavailable: just send */
    }
    fetch("/api/photos/touch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: key.split(",") }),
      keepalive: true,
    }).catch(() => {});
  }, [key]);

  return null;
}
