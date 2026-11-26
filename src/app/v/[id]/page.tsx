import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after, connection } from "next/server";
import { Suspense } from "react";
import { countTagView, getTag } from "@/lib/tags";
import { TAG_ID_RE } from "@/lib/tagFormat";
import { tagStorage } from "@/lib/tagStorage";
import { TagPlayer } from "./TagPlayer";
import { TagSetup } from "./TagSetup";

export const metadata: Metadata = { title: "A video for you", robots: { index: false, follow: false } };

/** The link inside an NFC video tag. Shows the tag's video, or lets the buyer add one. */
export default function TagPage(props: PageProps<"/v/[id]">) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-10 sm:px-6">
      <Suspense fallback={<p className="text-ink-soft">Loading…</p>}>
        <Tag {...props} />
      </Suspense>
    </div>
  );
}

async function Tag({ params, searchParams }: PageProps<"/v/[id]">) {
  await connection();
  const { id } = await params;
  const edit = (await searchParams).edit === "1";
  if (!TAG_ID_RE.test(id)) notFound();
  const tag = await getTag(id);
  if (!tag) notFound();
  if (tag.disabled) {
    return <p className="rounded-xl bg-card p-6 text-ink-soft">This tag isn&apos;t active. Please contact the studio.</p>;
  }
  const storage = tagStorage();
  if (tag.videoFile && storage && !edit) {
    after(() => countTagView(id).catch(() => {}));
    return <TagPlayer tagId={id} src={storage.publicUrl(tag.videoFile)} poster={tag.posterFile ? storage.publicUrl(tag.posterFile) : null} />;
  }
  return (
    <>
      <p className="font-hand text-2xl text-accent">your memory, one tap away</p>
      <h1 className="font-display text-4xl font-semibold">{tag.videoFile ? "Change your video" : "Add your video"}</h1>
      <p className="mt-2 text-ink-soft">
        Put a short video on this tag. Anyone who taps it with their phone will see it, no app needed.
      </p>
      <TagSetup tagId={id} hasVideo={!!tag.videoFile} ready={!!storage} />
    </>
  );
}
