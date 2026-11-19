import { adminDb } from "@/lib/firebase/admin";
import { clientIp, errorResponse, json, rateLimit } from "@/lib/server/http";
import { loadShare } from "@/lib/server/shares";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public endpoint used by the patient page. The optional PIN travels in a header, never in the URL. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    rateLimit(`portal:${clientIp(req)}`, 60, 60_000);
    const share = await loadShare(token, req.headers.get("x-share-pin"));
    const snap = await adminDb().collection("programCompletions").where("shareId", "==", share.id).limit(3000).get();
    const completions = snap.docs.map((d) => ({ exerciseKey: d.get("exerciseKey") as string, day: d.get("day") as string }));
    return json({ plan: share.plan, completions });
  } catch (e) {
    return errorResponse(e);
  }
}
