import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { deleteExpiredPhotos, getPhotoCleanupReport } from "@/lib/store";

const unauthorised = () => Response.json({ error: "Not authorised" }, { status: 401 });

/** How many customer photos are kept and how many have expired. */
export async function GET(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) return unauthorised();
  try {
    const r = await getPhotoCleanupReport();
    return Response.json({ total: r.total, booked: r.booked, drafts: r.drafts, expired: r.expired.length, expiredBytes: r.expiredBytes });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Delete expired photos: sessions that are over, and drafts untouched for 7 days (re-checked on the server). */
export async function POST(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) return unauthorised();
  try {
    const result = await deleteExpiredPhotos();
    revalidatePath("/admin");
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
