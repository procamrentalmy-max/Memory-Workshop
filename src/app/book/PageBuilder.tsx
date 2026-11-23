"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES, PRICING, TEMPLATES, formatRM } from "@/lib/data";
import { PAGE, elementBox, sizeLabel } from "@/lib/pageSize";
import { customPagePrice, orderTotals } from "@/lib/pricing";
import { elementSrc, type CanvasItem, type Element, type ImageItem, type Order, type OrderPage, type PhotoFill, type TextItem } from "@/lib/types";
import { CanvasView, ItemContent, boxStyle } from "@/components/CanvasView";
import { LAYOUT_SLOTS, TemplatePreview } from "@/components/TemplatePreview";
import { ActionBar, nextBtn } from "./ActionBar";
import { PhotoEditor } from "./PhotoEditor";
import { newId, setOrder, useOrder } from "./orderStore";

type Mode = "preset" | "custom";
type Draft = { items: CanvasItem[]; background: string; editingId: string | null };
/** A preset page from the order being re-opened to change its photos. */
type PresetEdit = { pageId: string; templateId: string; photos: Record<string, PhotoFill> };

const SWATCHES = ["#ffffff", "#faf6ef", "#f2ebdf", "#fbe4e4", "#e0fbfc", "#eef4e6", "#fff3b0", "#b8492f", "#e0a93b", "#7d9a7e", "#33658a", "#2a2420"];
const EMPTY_DRAFT: Draft = { items: [], background: "#ffffff", editingId: null };
const DRAFT_KEY = "pm-draft-v1";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const nowMs = () => Date.now(); // only called from event handlers

/** Same size for the preset preview and the drag & drop page, so switching modes feels like one workspace. */
const PAGE_FRAME = "relative mx-auto aspect-[210/297] w-full max-w-[440px] overflow-hidden rounded-md shadow-xl"; // A4

export function PageBuilder({ elements, elementsUnavailable = false }: { elements: Element[]; elementsUnavailable?: boolean }) {
  const order = useOrder();
  const params = useSearchParams();
  if (!order) return <p className="text-ink-soft">Loading…</p>;
  return <Builder key={params.toString()} order={order} elements={elements} elementsUnavailable={elementsUnavailable} />;
}

function Builder({ order, elements, elementsUnavailable }: { order: Order; elements: Element[]; elementsUnavailable: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const fromLink = params.get("template");
  const [mode, setMode] = useState<Mode>(params.get("mode") === "custom" ? "custom" : "preset");
  const [presetEdit, setPresetEdit] = useState<PresetEdit | null>(null);
  const [lastTemplate, setLastTemplate] = useState<string | null>(null);

  const toggle = (
    <div role="tablist" aria-label="How to choose pages" className="flex rounded-full border border-line bg-card p-1 shadow-sm">
      {([["preset", "Preset pages"], ["custom", "Drag & drop"]] as const).map(([m, label]) => (
        <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${mode === m ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <p className="font-hand text-2xl text-accent">step one</p>
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Choose your pages</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        {mode === "preset"
          ? `Pick a ready-made page from the list, ${formatRM(PRICING.perPage)} each.`
          : "Design your own page: drag elements onto it and arrange them. Sections and text boxes are free; you only pay for the elements you use."}
      </p>

      <div className="mt-6">
        {mode === "preset"
          ? <PresetMode key={presetEdit?.pageId ?? "new"} order={order} initial={lastTemplate ?? fromLink} toggle={toggle}
              edit={presetEdit} onEditDone={(templateId) => { setLastTemplate(templateId); setPresetEdit(null); }} />
          : <CustomMode elements={elements} unavailable={elementsUnavailable} toggle={toggle} />}
      </div>

      <YourPages
        order={order}
        onEdit={() => setMode("custom")}
        onEditPreset={(p) => {
          setPresetEdit({ pageId: p.id, templateId: p.templateId, photos: p.photos ?? {} });
          setMode("preset");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <ActionBar
        sticky={false}
        summary={<>{order.pages.length} page{order.pages.length === 1 ? "" : "s"} · <strong className="font-display text-xl">{formatRM(orderTotals(order).total)}</strong><span className="block text-xs text-paper/70">estimated total so far</span></>}
      >
        <button type="button" onClick={() => router.push("/book/time")} className={nextBtn}>
          Next<span className="hidden sm:inline">: choose your time</span> →
        </button>
      </ActionBar>
    </div>
  );
}

/**
 * The shared layout: the page on the LEFT; on the RIGHT the Preset / Drag & drop switch with,
 * below it, either the preset list or the editor. On phones: switch, page, then list/editor.
 */
function Workspace({ toggle, page, panel, pageRef }: {
  toggle: React.ReactNode; page: React.ReactNode; panel: React.ReactNode; pageRef?: React.Ref<HTMLElement>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px] lg:grid-rows-[auto_1fr] lg:gap-x-6">
      <div className="lg:col-start-2 lg:row-start-1">{toggle}</div>
      <section ref={pageRef} aria-label="Page" className="scroll-mt-24 rounded-2xl bg-paper-2 p-4 sm:p-8 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        {page}
      </section>
      <section aria-label="Pages and tools" className="flex min-w-0 flex-col rounded-2xl bg-card p-4 shadow-sm lg:col-start-2 lg:row-start-2">
        {panel}
      </section>
    </div>
  );
}

/* ───────────────────────── Preset mode ───────────────────────── */

function PresetMode({ order, initial, toggle, edit, onEditDone }: {
  order: Order; initial: string | null; toggle: React.ReactNode;
  edit: PresetEdit | null; onEditDone: (templateId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(
    edit?.templateId ?? (initial && TEMPLATES.some((t) => t.id === initial) ? initial : TEMPLATES[0].id),
  );
  const [category, setCategory] = useState("All");
  // Photos the customer has put in each template's frames, kept until the page is added.
  const [drafts, setDrafts] = useState<Record<string, Record<string, PhotoFill>>>(edit ? { [edit.templateId]: edit.photos } : {});
  const [frame, setFrame] = useState<{ slot: number; aspect: number } | null>(null);
  const selected = TEMPLATES.find((t) => t.id === selectedId)!;
  const count = (id: string) => order.pages.filter((p) => p.kind === "preset" && p.templateId === id).length;
  const list = TEMPLATES.filter((t) => category === "All" || t.category === category);
  const pageRef = useRef<HTMLElement>(null);
  const editing = edit && edit.templateId === selectedId ? edit : null;
  const photos = drafts[selectedId] ?? {};
  const slots = LAYOUT_SLOTS[selected.layout];
  const filled = Object.keys(photos).length;

  const add = () => {
    const page: OrderPage = { kind: "preset", id: editing?.pageId ?? newId(), templateId: selectedId, ...(filled ? { photos } : {}) };
    setOrder((o) => ({
      ...o,
      pages: editing && o.pages.some((p) => p.id === editing.pageId)
        ? o.pages.map((p) => (p.id === editing.pageId ? page : p))
        : [...o.pages, page],
    }));
    setDrafts((d) => {
      const next = { ...d };
      delete next[selectedId];
      return next;
    });
    if (editing) onEditDone(selectedId);
  };
  const savePhoto = (fill: PhotoFill | null) => {
    const key = String(frame!.slot);
    setDrafts((d) => {
      const cur = { ...(d[selectedId] ?? {}) };
      if (fill) cur[key] = fill;
      else delete cur[key];
      return { ...d, [selectedId]: cur };
    });
    setFrame(null);
  };
  const select = (id: string) => {
    setSelectedId(id);
    // On phones the preview sits above the list: bring it into view.
    if (window.innerWidth < 1024) pageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Workspace
      toggle={toggle}
      pageRef={pageRef}
      page={
        <>
          <div className={PAGE_FRAME}>
            <TemplatePreview
              template={selected}
              className="!rounded-none"
              photos={photos}
              onSlotClick={(slot, el) => setFrame({ slot, aspect: el.offsetWidth / el.offsetHeight })}
            />
          </div>
          {slots > 0 && (
            <p className="mx-auto mt-3 max-w-[440px] text-center text-sm text-ink-soft">
              Tap a photo frame to add your photo · <strong className="text-ink">{filled} of {slots}</strong> added
            </p>
          )}
          <div className="mx-auto mt-4 flex max-w-[440px] flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-semibold leading-tight">{selected.name}</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {selected.category} · {selected.difficulty} · ~{selected.minutes} min · {selected.photos} photo{selected.photos === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-ink-soft">{selected.features.join(" · ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-display text-2xl font-semibold">{formatRM(PRICING.perPage)}</span>
              <button type="button" onClick={add} className="btn btn-primary">
                {editing ? "Save changes" : count(selectedId) ? "Add another" : "Add this page"}
              </button>
            </div>
            {editing ? (
              <button type="button" onClick={() => onEditDone(selectedId)} className="w-full text-right text-sm text-ink-soft hover:text-accent">
                Cancel changes
              </button>
            ) : (
              count(selectedId) > 0 && <p className="w-full text-right text-sm text-[#3f5e41]">✓ {count(selectedId)} in your order</p>
            )}
          </div>
          {frame && (
            <PhotoEditor
              aspect={frame.aspect}
              fill={photos[String(frame.slot)]}
              label={`Photo ${frame.slot + 1}`}
              onClose={() => setFrame(null)}
              onSave={savePhoto}
            />
          )}
        </>
      }
      panel={
        <>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...CATEGORIES].map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} aria-pressed={category === c}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${category === c ? "border-ink bg-ink text-paper" : "border-line"}`}>
                {c}
              </button>
            ))}
          </div>
          <ul className="mt-3 max-h-[440px] space-y-1 overflow-y-auto pr-1 lg:max-h-[620px]">
            {list.map((t) => (
              <li key={t.id}>
                <button type="button" onClick={() => select(t.id)} aria-current={t.id === selectedId}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left text-sm transition-colors ${t.id === selectedId ? "border-accent bg-accent/5" : "border-transparent hover:bg-paper-2"}`}>
                  <TemplatePreview template={t} className="w-10 shrink-0 !rounded-sm shadow-sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{t.name}</span>
                    <span className="text-xs text-ink-soft">{t.category} · {t.difficulty}</span>
                  </span>
                  {count(t.id) > 0 && <span className="rounded-full bg-sage/20 px-2 py-0.5 text-xs font-bold text-[#3f5e41]">×{count(t.id)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </>
      }
    />
  );
}

/* ───────────────────────── Drag & drop mode ───────────────────────── */

function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

/** Uploaded elements are placed at the printed size the admin entered, and can't be resized. */
function imageItem(el: Element, cx = 50, cy = 45): CanvasItem {
  const { w, h } = elementBox(el.widthCm, el.heightCm);
  return {
    id: newId(), type: "image", elementId: el.id, file: el.file, name: el.name, price: el.price, aspect: el.height / el.width,
    w, h, x: clamp(cx - w / 2, 0, Math.max(0, 100 - w)), y: clamp(cy - h / 2, 0, Math.max(0, 100 - h)),
    ...(el.photoWindow ? { window: el.photoWindow } : {}),
  };
}

function sectionItem(cx = 50, cy = 30): CanvasItem {
  return { id: newId(), type: "section", color: "#e0a93b", w: 60, h: 25, x: clamp(cx - 30, 0, 40), y: clamp(cy - 12.5, 0, 75) };
}

function textItem(cx = 50, cy = 80): CanvasItem {
  return { id: newId(), type: "text", text: "Your text here", color: "#2a2420", size: 6, font: "hand", w: 60, h: 10, x: clamp(cx - 30, 0, 40), y: clamp(cy - 5, 0, 90) };
}

function CustomMode({ elements, unavailable, toggle }: { elements: Element[]; unavailable: boolean; toggle: React.ReactNode }) {
  const [draft, setDraftState] = useState<Draft>(loadDraft);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: string; mode: "move" | "resize"; sx: number; sy: number; box: CanvasItem; rect: DOMRect;
    moved: boolean; photoTap: boolean;
  } | null>(null);
  const [photoFor, setPhotoFor] = useState<string | null>(null); // frame item whose photo is being edited

  // Undo history: snapshots of the page before each change (similar quick edits are merged).
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  const history = useRef<Draft[]>([]);
  const lastSnap = useRef({ key: "", t: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const snapshot = (key = "") => {
    const now = nowMs();
    if (key && lastSnap.current.key === key && now - lastSnap.current.t < 1000) {
      lastSnap.current.t = now;
      return;
    }
    history.current = [...history.current.slice(-49), draftRef.current];
    lastSnap.current = { key, t: now };
    setCanUndo(true);
  };
  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    setDraft(() => prev);
    setSelectedId(null);
    setCanUndo(history.current.length > 0);
  };

  const setDraft = (fn: (d: Draft) => Draft) =>
    setDraftState((d) => {
      const next = fn(d);
      try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  // Pick up a page sent here by "Edit" in the "Your pages" list.
  useEffect(() => {
    const onEdit = () => setDraftState(loadDraft());
    window.addEventListener("pm-draft", onEdit);
    return () => window.removeEventListener("pm-draft", onEdit);
  }, []);

  const items = draft.items;
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const price = customPagePrice(items);

  const addItem = (it: CanvasItem) => {
    snapshot();
    setDraft((d) => ({ ...d, items: [...d.items, it] }));
    setSelectedId(it.id);
  };
  const patch = (id: string, p: Partial<CanvasItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? ({ ...i, ...p } as CanvasItem) : i)) }));
  /** A change from the side panel (colour, text…): recorded for undo. */
  const edit = (id: string, p: Partial<CanvasItem>) => {
    snapshot(`${id}:${Object.keys(p).join()}`);
    patch(id, p);
  };
  const remove = (id: string) => {
    snapshot();
    setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
    setSelectedId(null);
  };
  const reorder = (id: string, dir: "front" | "back") => {
    snapshot();
    setDraft((d) => {
      const it = d.items.find((i) => i.id === id)!;
      const rest = d.items.filter((i) => i.id !== id);
      return { ...d, items: dir === "front" ? [...rest, it] : [it, ...rest] };
    });
  };
  const duplicate = (it: CanvasItem) => addItem({ ...it, id: newId(), x: clamp(it.x + 4, 0, Math.max(0, 100 - it.w)), y: clamp(it.y + 4, 0, Math.max(0, 100 - it.h)) });

  // Keyboard: Ctrl/Cmd+Z undo, Delete removes, arrow keys nudge (Shift = bigger steps).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(selectedId);
        return;
      }
      const step = e.shiftKey ? 5 : 1;
      const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (move) {
        e.preventDefault();
        snapshot(`nudge:${selectedId}`);
        setDraft((d) => ({
          ...d,
          items: d.items.map((i) => (i.id === selectedId ? { ...i, x: clamp(i.x + move[0], 0, Math.max(0, 100 - i.w)), y: clamp(i.y + move[1], 0, Math.max(0, 100 - i.h)) } : i)),
        }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* Pointer dragging on the canvas (works with mouse and touch). */
  const startDrag = (e: React.PointerEvent, it: CanvasItem, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    // A tap (no drag) on the photo window of an already-selected frame opens the photo editor.
    const photoTap = mode === "move" && it.id === selectedId && it.type === "image" && Boolean(it.window)
      && Boolean((e.target as HTMLElement).closest("[data-photo-window]"));
    setSelectedId(it.id);
    snapshot();
    drag.current = { id: it.id, mode, sx: e.clientX, sy: e.clientY, box: it, rect: canvasRef.current!.getBoundingClientRect(), moved: false, photoTap };
    canvasRef.current!.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return; // ignore tiny wobbles on a tap
    d.moved = true;
    const dx = ((e.clientX - d.sx) / d.rect.width) * 100;
    const dy = ((e.clientY - d.sy) / d.rect.height) * 100;
    const b = d.box;
    if (d.mode === "move") {
      // Items stay fully on the page so nothing gets cut off.
      patch(d.id, { x: clamp(b.x + dx, 0, Math.max(0, 100 - b.w)), y: clamp(b.y + dy, 0, Math.max(0, 100 - b.h)) });
    } else if (b.type !== "image") {
      // Only text boxes and sections can be resized; uploaded elements keep their own size.
      patch(d.id, { w: clamp(b.w + dx, 4, 100 - b.x), h: clamp(b.h + dy, 3, 100 - b.y) });
    }
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved && d.photoTap) setPhotoFor(d.id);
  };
  const photoItem = items.find((i): i is ImageItem => i.id === photoFor && i.type === "image" && Boolean(i.window));
  /** Width ÷ height of a frame's photo window on the A4 page. */
  const windowAspect = (it: ImageItem) =>
    ((it.window!.w / 100) * (it.w / 100) * PAGE.widthCm) / ((it.window!.h / 100) * (it.h / 100) * PAGE.heightCm);

  /* Dropping from the editor panel (desktop drag & drop). */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-pm");
    if (!raw) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 100;
    const cy = ((e.clientY - rect.top) / rect.height) * 100;
    const { kind, id } = JSON.parse(raw) as { kind: string; id?: string };
    if (kind === "section") addItem(sectionItem(cx, cy));
    else if (kind === "text") addItem(textItem(cx, cy));
    else {
      const el = elements.find((x) => x.id === id);
      if (el) addItem(imageItem(el, cx, cy));
    }
  };
  const dragData = (data: object) => (e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-pm", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "copy";
  };

  const saveToOrder = () => {
    const page = { kind: "custom" as const, id: draft.editingId ?? newId(), items: draft.items, background: draft.background };
    setOrder((o) => ({
      ...o,
      pages: draft.editingId && o.pages.some((p) => p.id === draft.editingId)
        ? o.pages.map((p) => (p.id === draft.editingId ? page : p))
        : [...o.pages, page],
    }));
    setDraft(() => EMPTY_DRAFT);
    setSelectedId(null);
    history.current = [];
    setCanUndo(false);
  };

  const page = (
    <>
      <div
        ref={canvasRef}
        onPointerDown={() => setSelectedId(null)}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`${PAGE_FRAME} select-none`}
        style={{ background: draft.background, containerType: "inline-size" }}
      >
        {items.length === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center p-8 text-center text-ink-soft">
            Drag elements, sections or text boxes here
            <br />(or tap them to add)
          </p>
        )}
        {items.map((it) => {
          const isSel = it.id === selectedId;
          return (
            <div
              key={it.id}
              style={boxStyle(it)}
              onPointerDown={(e) => startDrag(e, it, "move")}
              className={`cursor-move touch-none ${isSel ? "outline-2 outline-offset-1 outline-accent outline-dashed" : "hover:outline-1 hover:outline-dashed hover:outline-ink/40"}`}
            >
              <ItemContent item={it} editing />
              {isSel && it.type !== "image" && (
                <span
                  onPointerDown={(e) => startDrag(e, it, "resize")}
                  className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-accent shadow after:absolute after:-inset-2.5 after:content-[''] lg:-bottom-2 lg:-right-2 lg:h-4 lg:w-4"
                  aria-label="Resize"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-3 flex max-w-[440px] flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-soft">
          Drag to move · text boxes and sections resize from the corner dot
        </p>
        <div className="flex gap-2 text-xs font-semibold">
          <button type="button" onClick={undo} disabled={!canUndo} className="rounded-full border border-line bg-white px-3 py-1.5 disabled:opacity-40">↶ Undo</button>
          {selected && (
            <button type="button" onClick={() => remove(selected.id)} className="rounded-full border border-accent/40 bg-white px-3 py-1.5 text-accent lg:hidden">Delete</button>
          )}
        </div>
      </div>
    </>
  );

  const panel = (
    <div className="flex flex-col gap-4">
      {selected && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {selected.type === "image" ? selected.name : selected.type === "section" ? "Section" : "Text box"}
            </p>
            <button type="button" onClick={() => setSelectedId(null)} className="text-xs text-ink-soft">Done</button>
          </div>
          {selected.type === "image" && (
            <p className="mt-1 text-xs text-ink-soft">
              Fixed size: {sizeLabel((selected.w * PAGE.widthCm) / 100, (selected.h * PAGE.heightCm) / 100)}. Drag it to position it on the page.
            </p>
          )}
          {selected.type === "image" && selected.window && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <button type="button" onClick={() => setPhotoFor(selected.id)} className="btn btn-primary !px-3 !py-1.5 text-xs">
                {selected.photo ? "Change / move photo" : "＋ Add photo"}
              </button>
              {selected.photo && (
                <button type="button" onClick={() => edit(selected.id, { photo: undefined })} className="rounded-md border border-accent/40 bg-white px-2 py-1 text-accent">Remove photo</button>
              )}
              <span className="w-full font-normal text-ink-soft">Tip: tap the frame&apos;s photo area to add or change the photo.</span>
            </div>
          )}
          {selected.type === "section" && (
            <ColourPicker value={selected.color} onChange={(c) => edit(selected.id, { color: c })} />
          )}
          {selected.type === "text" && <TextControls item={selected} onChange={(p) => edit(selected.id, p)} />}
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
            <button type="button" onClick={() => reorder(selected.id, "front")} className="rounded-md border border-line bg-white px-2 py-1">Bring to front</button>
            <button type="button" onClick={() => reorder(selected.id, "back")} className="rounded-md border border-line bg-white px-2 py-1">Send to back</button>
            <button type="button" onClick={() => duplicate(selected)} className="rounded-md border border-line bg-white px-2 py-1">Duplicate</button>
            <button type="button" onClick={() => remove(selected.id)} className="rounded-md border border-accent/40 bg-white px-2 py-1 text-accent">Delete</button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">Free</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" draggable onDragStart={dragData({ kind: "section" })} onClick={() => addItem(sectionItem())}
            className="flex cursor-grab items-center gap-2 rounded-lg border border-line p-2 text-left text-sm hover:border-ink">
            <span className="h-7 w-9 rounded-sm bg-mustard" aria-hidden />
            <span><span className="block font-semibold">Section</span><span className="text-xs text-ink-soft">Free</span></span>
          </button>
          <button type="button" draggable onDragStart={dragData({ kind: "text" })} onClick={() => addItem(textItem())}
            className="flex cursor-grab items-center gap-2 rounded-lg border border-line p-2 text-left text-sm hover:border-ink">
            <span className="grid h-7 w-9 place-items-center rounded-sm border border-line font-display font-bold" aria-hidden>T</span>
            <span><span className="block font-semibold">Text box</span><span className="text-xs text-ink-soft">Free</span></span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Page colour</h3>
        <ColourPicker value={draft.background} onChange={(c) => { snapshot("bg"); setDraft((d) => ({ ...d, background: c })); }} />
      </div>

      <div>
        <h3 className="text-sm font-semibold">Elements</h3>
        {elements.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">{unavailable ? "Elements couldn't be loaded right now. Please refresh in a moment." : "No elements available yet. Check back soon."}</p>
        ) : (
          <ul className="mt-2 grid max-h-[360px] grid-cols-3 gap-2 overflow-y-auto pr-1">
            {elements.map((el) => (
              <li key={el.id}>
                <button type="button" draggable onDragStart={dragData({ kind: "image", id: el.id })} onClick={() => addItem(imageItem(el))}
                  title={`${el.name} · ${formatRM(el.price)} · ${sizeLabel(el.widthCm, el.heightCm)}`}
                  className="flex w-full cursor-grab flex-col items-center rounded-lg border border-line p-1.5 hover:border-ink">
                  <span className="grid h-16 w-full place-items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={elementSrc(el.file)} alt="" draggable={false} className="max-h-16 max-w-full object-contain" />
                  </span>
                  <span className="mt-1 w-full truncate text-center text-[11px] leading-tight">{el.name}</span>
                  <span className="text-[11px] font-bold">{formatRM(el.price)}</span>
                  <span className="text-[10px] text-ink-soft">{sizeLabel(el.widthCm, el.heightCm)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line pt-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">This page</span>
          <span className="font-display text-2xl font-semibold">{formatRM(price)}</span>
        </div>
        <button type="button" disabled={items.length === 0} onClick={saveToOrder} className="btn btn-primary mt-3 w-full disabled:opacity-50">
          {draft.editingId ? "Save changes to my order" : "Add this design to my order"}
        </button>
        {items.length > 0 && (
          <button type="button" onClick={() => { snapshot(); setDraft(() => EMPTY_DRAFT); setSelectedId(null); }} className="mt-2 w-full text-sm text-ink-soft hover:text-accent">
            {draft.editingId ? "Cancel editing" : "Clear page"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Workspace toggle={toggle} page={page} panel={panel} />
      {photoItem && (
        <PhotoEditor
          aspect={windowAspect(photoItem)}
          fill={photoItem.photo}
          label={`Photo for ${photoItem.name}`}
          onClose={() => setPhotoFor(null)}
          onSave={(fill) => {
            edit(photoItem.id, { photo: fill ?? undefined });
            setPhotoFor(null);
          }}
        />
      )}
    </>
  );
}

function ColourPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {SWATCHES.map((c) => (
        <button key={c} type="button" onClick={() => onChange(c)} aria-label={`Colour ${c}`} aria-pressed={value === c}
          className={`h-6 w-6 rounded-full border ${value === c ? "ring-2 ring-accent ring-offset-1" : "border-line"}`} style={{ background: c }} />
      ))}
      <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-line" title="Custom colour"
        style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Custom colour" />
      </label>
    </div>
  );
}

function TextControls({ item, onChange }: { item: TextItem; onChange: (p: Partial<TextItem>) => void }) {
  return (
    <div className="mt-2 space-y-2">
      <textarea value={item.text} onChange={(e) => onChange({ text: e.target.value })} rows={2} maxLength={300}
        className="w-full rounded-md border border-line bg-white px-2 py-1 text-sm" aria-label="Text" />
      <div className="flex items-center gap-2 text-xs">
        <select value={item.font} onChange={(e) => onChange({ font: e.target.value as TextItem["font"] })} className="rounded-md border border-line bg-white px-1 py-1" aria-label="Font">
          <option value="hand">Handwritten</option>
          <option value="display">Serif</option>
          <option value="sans">Simple</option>
        </select>
        <label className="flex flex-1 items-center gap-1">
          Size
          <input type="range" min={2} max={16} step={0.5} value={item.size} onChange={(e) => onChange({ size: Number(e.target.value) })} className="flex-1 accent-[var(--accent)]" />
        </label>
      </div>
      <ColourPicker value={item.color} onChange={(c) => onChange({ color: c })} />
    </div>
  );
}

/* ───────────────────────── Pages in the order ───────────────────────── */

function YourPages({ order, onEdit, onEditPreset }: {
  order: Order; onEdit: () => void; onEditPreset: (p: Extract<OrderPage, { kind: "preset" }>) => void;
}) {
  if (order.pages.length === 0) return null;
  const remove = (id: string) => setOrder((o) => ({ ...o, pages: o.pages.filter((p) => p.id !== id) }));
  const edit = (id: string) => {
    const p = order.pages.find((x) => x.id === id);
    if (!p || p.kind !== "custom") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ items: p.items, background: p.background, editingId: p.id }));
    } catch { /* ignore */ }
    onEdit();
    window.dispatchEvent(new Event("pm-draft"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">Your pages</h2>
      <ul className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {order.pages.map((p) => {
          const tpl = p.kind === "preset" ? TEMPLATES.find((t) => t.id === p.templateId) : null;
          return (
            <li key={p.id} className="w-36 shrink-0 rounded-xl border border-line bg-card p-2">
              {p.kind === "preset" && tpl ? <TemplatePreview template={tpl} photos={p.photos} /> : p.kind === "custom" ? <CanvasView items={p.items} background={p.background} /> : null}
              <p className="mt-2 truncate text-sm font-semibold">{tpl ? tpl.name : "Your design"}</p>
              <p className="text-xs text-ink-soft">
                {formatRM(p.kind === "preset" ? PRICING.perPage : customPagePrice(p.items))}
                {p.kind === "preset" && tpl && LAYOUT_SLOTS[tpl.layout] > 0 && ` · ${Object.keys(p.photos ?? {}).length}/${LAYOUT_SLOTS[tpl.layout]} photos`}
              </p>
              <div className="mt-1 flex gap-3 text-xs font-semibold">
                {p.kind === "custom" && <button type="button" onClick={() => edit(p.id)} className="text-ink hover:underline">Edit</button>}
                {p.kind === "preset" && tpl && LAYOUT_SLOTS[tpl.layout] > 0 && (
                  <button type="button" onClick={() => onEditPreset(p)} className="text-ink hover:underline">Photos</button>
                )}
                <button type="button" onClick={() => remove(p.id)} className="text-accent hover:underline">Remove</button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
