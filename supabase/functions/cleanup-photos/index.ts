// Deployed to Supabase as the edge function "cleanup-photos" (verify_jwt: false).
// Runs every hour at :07 from pg_cron (job "cleanup-customer-photos").
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Deletes expired customer photos. The rules live in the database function
// public.customer_photo_status(): a photo expires when its order's bill is settled on the worker page
// (or, if nobody settles it, at the end of the day after the visit), or when it was never booked and
// has not been used for 7 days.
// It is safe to call at any time: it only removes photos that the rules say have expired,
// so no authentication is needed to trigger it.

const BUCKET = "customer-photos";

function secretKey(): string {
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, string>;
  return keys["default"] ?? Object.values(keys)[0] ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("customer_photo_status");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const expired = (data as { file: string; status: string }[])
    .filter((r) => r.status === "session_over" || r.status === "abandoned")
    .map((r) => r.file);

  let deleted = 0;
  for (let i = 0; i < expired.length; i += 100) {
    const names = expired.slice(i, i + 100);
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(names);
    if (removeError) return Response.json({ error: removeError.message, deleted }, { status: 500 });
    await supabase.from("customer_photos").delete().in("file", names);
    deleted += names.length;
  }

  return Response.json({ ok: true, deleted, checked: (data as unknown[]).length });
});
