import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type { AdminFeedback, ApiErrorResponse } from "@/types/taply";

interface AdminFeedbackResponse {
  feedback: AdminFeedback[];
  total: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminFeedbackResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "GET", res)) return;

  // ─── Verify Admin ───
  const auth = await verifyAdminAuth(req);
  if (!auth.success) {
    return sendError(res, 401, "UNAUTHORIZED", auth.error || "Unauthorized");
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    // ─── Get All Designs ───
    const designsSnapshot = await adminDb
      .collection("designs")
      .orderBy("createdAt", "desc")
      .get();

    // ─── Collect All Feedback ───
    const allFeedback: AdminFeedback[] = [];

    for (const designDoc of designsSnapshot.docs) {
      const feedbackSnapshot = await designDoc.ref
        .collection("feedback")
        .orderBy("createdAt", "desc")
        .get();

      for (const feedbackDoc of feedbackSnapshot.docs) {
        const data = feedbackDoc.data();
        allFeedback.push({
          id: feedbackDoc.id,
          designId: designDoc.id,
          comment: data.comment,
          x: data.x,
          y: data.y,
          createdAt: data.createdAt,
        });
      }
    }

    // ─── Sort by createdAt descending ───
    allFeedback.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = allFeedback.length;
    const paginatedFeedback = allFeedback.slice(0, limit);

    return res.status(200).json({
      feedback: paginatedFeedback,
      total,
    });
  } catch (error) {
    console.error("Admin feedback list error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch feedback");
  }
}
