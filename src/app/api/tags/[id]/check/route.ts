import { tagCodeError } from "@/lib/tags";

/** Checks a tag's setup code before the customer picks their video. */
export async function POST(request: Request, ctx: RouteContext<"/api/tags/[id]/check">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  try {
    return (await tagCodeError(id, body?.code)) ?? Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
