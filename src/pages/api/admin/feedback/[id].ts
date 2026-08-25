import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { sendError } from "@/utils/api-helpers";
import type { ApiErrorResponse } from "@/types/taply";

interface DeleteFeedbackResponse {
  success: boolean;
  message: string;
  id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeleteFeedbackResponse | ApiErrorResponse>,
) {
  // ─── Only DELETE allowed ───
  if (req.method !== "DELETE") {
    return sendError(res, 405, "VALIDATION_ERROR", "Method not allowed");
  }

  // ─── Verify Admin ───
  const auth = await verifyAdminAuth(req);
  if (!auth.success) {
    return sendError(res, 401, "UNAUTHORIZED", auth.error || "Unauthorized");
  }

  const { id } = req.query;
  const { designId } = req.body as { designId: string };

  if (!id || typeof id !== "string") {
    return sendError(res, 400, "VALIDATION_ERROR", "Feedback id is required");
  }

  if (!designId || typeof designId !== "string") {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "designId is required in body",
    );
  }

  try {
    // ─── Find and Delete Feedback ───
    const feedbackRef = adminDb
      .collection("designs")
      .doc(designId)
      .collection("feedback")
      .doc(id);

    const feedbackDoc = await feedbackRef.get();

    if (!feedbackDoc.exists) {
      return sendError(res, 404, "NOT_FOUND", `Feedback "${id}" not found`);
    }

    await feedbackRef.delete();

    return res.status(200).json({
      success: true,
      message: `Feedback "${id}" deleted successfully`,
      id,
    });
  } catch (error) {
    console.error("Admin delete feedback error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to delete feedback");
  }
}
