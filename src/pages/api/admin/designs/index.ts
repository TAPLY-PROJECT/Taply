import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type { AdminDesign, ApiErrorResponse } from "@/types/taply";

interface AdminDesignsResponse {
  designs: AdminDesign[];
  total: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminDesignsResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "GET", res)) return;

  // ─── Verify Admin ───
  const auth = await verifyAdminAuth(req);
  if (!auth.success) {
    return sendError(res, 401, "UNAUTHORIZED", auth.error || "Unauthorized");
  }

  try {
    // ─── Pagination ───
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    // ─── Get All Designs ───
    const designsSnapshot = await adminDb
      .collection("designs")
      .orderBy("createdAt", "desc")
      .get();

    const total = designsSnapshot.size;

    // ─── Apply Pagination ───
    const start = (page - 1) * limit;
    const paginatedDocs = designsSnapshot.docs.slice(start, start + limit);

    // ─── Build Response with Feedback Count ───
    const designs: AdminDesign[] = await Promise.all(
      paginatedDocs.map(async (doc) => {
        const data = doc.data();
        const feedbackSnapshot = await doc.ref.collection("feedback").get();

        return {
          id: doc.id,
          shareableId: data.shareableId,
          name: data.name || "Untitled Design",
          imageUrl: data.imageUrl,
          publicId: data.publicId,
          creatorUid: data.creatorUid,
          createdAt: data.createdAt,
          feedbackCount: feedbackSnapshot.size,
        };
      }),
    );

    return res.status(200).json({ designs, total });
  } catch (error) {
    console.error("Admin designs list error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch designs");
  }
}
