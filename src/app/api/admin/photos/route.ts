import { revalidatePath } from "next/cache";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { deleteUnusedPhotos, getPhotoCleanupReport } from "@/lib/store";

const unauthorised = () => Response.json({ error: "Not authorised" }, { status: 401 });

/** How many customer photos could be cleaned up. */
export async function GET(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) return unauthorised();
  try {
    const r = await getPhotoCleanupReport();
    return Response.json({ total: r.total, inBookings: r.inBookings, recent: r.recent, unused: r.unused.length, unusedBytes: r.unusedBytes });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** Delete photos that aren't in any booking and are older than the keep period (re-checked on the server). */
export async function POST(request: Request) {
  if (!isAdminAuthorized(request.headers.get("authorization"))) return unauthorised();
  try {
    const result = await deleteUnusedPhotos();
    revalidatePath("/admin");
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
