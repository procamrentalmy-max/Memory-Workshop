"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { STUDIO } from "@/lib/data";

/** Full-screen player for a tag's video. Phones only autoplay muted videos, so sound starts with a tap. */
export function TagPlayer({ src, poster, tagId }: { src: string; poster: string | null; tagId: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [failed, setFailed] = useState(false);
  const soundOn = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    v.play().catch(() => {});
    setMuted(false);
  };
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="relative min-h-0 flex-1" onClick={muted ? soundOn : undefined}>
        <video
          ref={ref}
          src={src}
          poster={poster ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          controls={!muted}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-contain"
        />
        {muted && !failed && (
          <button type="button" onClick={soundOn}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-semibold text-black shadow-lg">
            🔊 Tap for sound
          </button>
        )}
        {failed && (
          <p className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-sm">This video couldn&apos;t be played. Please try again in a moment.</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-white/70">
        <Link href="/" className="hover:text-white">Made at {STUDIO.name}</Link>
        <Link href={`/v/${tagId}?edit=1`} className="hover:text-white">Change video</Link>
      </div>
    </div>
  );
}
