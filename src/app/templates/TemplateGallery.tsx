"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, type Difficulty, type Template } from "@/lib/data";
import { TemplateCard } from "@/components/TemplateCard";

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Detailed"];

export function TemplateGallery({ templates }: { templates: Template[] }) {
  const [category, setCategory] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("Any");
  const [query, setQuery] = useState("");

  const shown = useMemo(
    () =>
      templates.filter(
        (t) =>
          (category === "All" || t.category === category) &&
          (difficulty === "Any" || t.difficulty === difficulty) &&
          (query === "" ||
            `${t.name} ${t.features.join(" ")}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [templates, category, difficulty, query],
  );

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"
    }`;

  return (
    <>
      <div className="mt-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} type="button" className={chip(category === c)} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-lg border border-line bg-card px-3 py-1.5"
            >
              <option>Any</option>
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <input
            type="search"
            placeholder="Search pages, e.g. pop-up"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-sm sm:w-64"
            aria-label="Search templates"
          />
          <span className="text-sm text-ink-soft">{shown.length} pages</span>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-16 text-center text-ink-soft">No pages match those filters.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
    </>
  );
}
