"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Mode = "unknown" | "app" | "iphone" | "android" | "computer";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function detect(): Mode {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia("(display-mode: standalone)").matches || nav.standalone) return "app";
  const ua = nav.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && nav.maxTouchPoints > 1)) return "iphone";
  if (/Android/i.test(ua)) return "android";
  return "computer";
}
const noSubscribe = () => () => {};

/** How to add the customer's page to their phone's home screen. Hidden inside the home screen app. */
export function HomeScreenSteps({ welcome }: { welcome: boolean }) {
  const mode = useSyncExternalStore(noSubscribe, detect, () => "unknown" as Mode);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setAdded(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "unknown" || mode === "app") return null;

  return (
    <section className={`relative mt-6 rounded-2xl p-6 ${welcome ? "bg-card shadow-sm ring-2 ring-accent/40" : "bg-paper-2"}`}>
      <h2 className="font-display text-xl font-semibold">{welcome ? "Last step: add this page to your home screen" : "Add this page to your home screen"}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Then tap the {"“"}P{"”"} icon any time to open your page, already logged in.
      </p>
      {added ? (
        <p className="mt-4 font-semibold text-[#3f5e41]">Added! Look for the icon on your home screen.</p>
      ) : mode === "iphone" ? (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>
            Tap the <strong>Share</strong> button <ShareIcon /> in Safari (at the bottom of the screen, or at the top on an iPad).
          </li>
          <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>.</li>
        </ol>
      ) : mode === "android" ? (
        prompt ? (
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={async () => {
              await prompt.prompt();
              if ((await prompt.userChoice).outcome === "accepted") setAdded(true);
              setPrompt(null);
            }}
          >
            Add to home screen
          </button>
        ) : (
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
            <li>Tap the <strong>⋮</strong> menu at the top right of Chrome.</li>
            <li>Tap <strong>Add to home screen</strong> (or <strong>Install app</strong>), then <strong>Add</strong>.</li>
          </ol>
        )
      ) : (
        <p className="mt-4 text-sm">Open this page on your phone and log in, then add it to your home screen.</p>
      )}
    </section>
  );
}

function ShareIcon() {
  return (
    <svg aria-label="(the square with an arrow pointing up)" className="inline-block align-[-3px]" width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 11V1M4.5 4.5 8 1l3.5 3.5M5 7H2.5v10h11V7H11" />
    </svg>
  );
}
