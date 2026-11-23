"use client";

import { useRef } from "react";
import type { Rect } from "@/lib/types";

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** Drag on the image to mark the rectangle where a customer's photo goes (stored as % of the image). */
export function FrameWindowPicker({ src, value, onChange }: { src: string; value: Rect; onChange: (r: Rect) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; prev: Rect } | null>(null);

  const point = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) };
  };
  const rectFrom = (a: { x: number; y: number }, b: { x: number; y: number }): Rect => ({
    x: Math.round(Math.min(a.x, b.x) * 100) / 100,
    y: Math.round(Math.min(a.y, b.y) * 100) / 100,
    w: Math.round(Math.abs(a.x - b.x) * 100) / 100,
    h: Math.round(Math.abs(a.y - b.y) * 100) / 100,
  });

  return (
    <div
      ref={ref}
      className="relative inline-block cursor-crosshair touch-none select-none bg-[repeating-conic-gradient(#f2ebdf_0_25%,#fff_0_50%)] bg-[length:16px_16px]"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        start.current = { ...point(e), prev: value };
      }}
      onPointerMove={(e) => start.current && onChange(rectFrom(start.current, point(e)))}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const r = rectFrom(s, point(e));
        onChange(r.w < 3 || r.h < 3 ? s.prev : r); // a click without dragging keeps the old box
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Frame" draggable={false} className="pointer-events-none block max-h-64 w-auto max-w-full" />
      <div
        className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/25"
        style={{ left: `${value.x}%`, top: `${value.y}%`, width: `${value.w}%`, height: `${value.h}%` }}
      >
        <span className="absolute left-1 top-1 rounded bg-accent px-1 text-[10px] font-bold text-white">Photo</span>
      </div>
    </div>
  );
}
