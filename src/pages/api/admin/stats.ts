import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type {
  AdminStats,
  AdminDesign,
  AdminFeedback,
  ApiErrorResponse,
} from "@/types/taply";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminStats | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "GET", res)) return;

  // ─── Verify Admin ───
  const auth = await verifyAdminAuth(req);
  if (!auth.success) {
    return sendError(res, 401, "UNAUTHORIZED", auth.error || "Unauthorized");
  }

  try {
    // ─── Get All Designs ───
    const designsSnapshot = await adminDb
      .collection("designs")
      .orderBy("createdAt", "desc")
      .get();

    const totalDesigns = designsSnapshot.size;

    // ─── Get Recent Designs (last 5) ───
    const recentDesigns: AdminDesign[] = [];
    let totalFeedback = 0;

    for (const doc of designsSnapshot.docs) {
      const data = doc.data();

      // Count feedback for this design
      const feedbackSnapshot = await doc.ref.collection("feedback").get();
      const feedbackCount = feedbackSnapshot.size;
      totalFeedback += feedbackCount;

      if (recentDesigns.length < 5) {
        recentDesigns.push({
          id: doc.id,
          shareableId: data.shareableId,
          name: data.name || "Untitled Design",
          imageUrl: data.imageUrl,
          publicId: data.publicId,
          creatorUid: data.creatorUid,
          createdAt: data.createdAt,
          feedbackCount,
        });
      }
    }

    // ─── Get Recent Feedback (last 5 across all designs) ───
    const recentFeedback: AdminFeedback[] = [];

    for (const doc of designsSnapshot.docs.slice(0, 10)) {
      if (recentFeedback.length >= 5) break;

      const feedbackSnapshot = await doc.ref
        .collection("feedback")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      for (const feedbackDoc of feedbackSnapshot.docs) {
        if (recentFeedback.length >= 5) break;
        const feedbackData = feedbackDoc.data();
        recentFeedback.push({
          id: feedbackDoc.id,
          designId: doc.id,
          comment: feedbackData.comment,
          x: feedbackData.x,
          y: feedbackData.y,
          createdAt: feedbackData.createdAt,
        });
      }
    }

    // ─── Get Total Users ───
    // Firebase Auth does not support count directly
    // We estimate from designs collection unique UIDs
    const uniqueUids = new Set(
      designsSnapshot.docs.map((doc) => doc.data().creatorUid),
    );
    const totalUsers = uniqueUids.size;

    return res.status(200).json({
      totalDesigns,
      totalFeedback,
      totalUsers,
      recentDesigns,
      recentFeedback,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch stats");
  }
}
