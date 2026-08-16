import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type { ApiErrorResponse, FeedbackStatus } from "@/types/taply";

type UpdateFeedbackResponse = {
  id: string;
  status: FeedbackStatus;
  updatedAt: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateFeedbackResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "PATCH", res)) return;

  const feedbackId = typeof req.query.id === "string" ? req.query.id : undefined;
  const { designId, status } = (req.body || {}) as {
    designId?: string;
    status?: FeedbackStatus;
  };

  if (!feedbackId || !designId || !["positive", "needs_change", "resolved"].includes(status || "")) {
    return sendError(res, 400, "VALIDATION_ERROR", "designId, feedback id and a valid status are required");
  }
  const nextStatus = status as FeedbackStatus;

  const designRef = adminDb.collection("designs").doc(designId);
  const designSnapshot = await designRef.get();
  if (!designSnapshot.exists) {
    return sendError(res, 404, "NOT_FOUND", "Design not found");
  }

  if (nextStatus === "resolved") {
    const auth = await verifyAuth(req);
    if (!auth.success || auth.uid !== designSnapshot.data()?.creatorUid) {
      return sendError(res, 403, "FORBIDDEN", "Only the design owner can resolve feedback");
    }
  }

  const feedbackRef = designRef.collection("feedback").doc(feedbackId);
  if (!(await feedbackRef.get()).exists) {
    return sendError(res, 404, "NOT_FOUND", "Feedback not found");
  }

  const updatedAt = new Date().toISOString();
  await feedbackRef.update({ status: nextStatus, updatedAt });
  return res.status(200).json({ id: feedbackId, status: nextStatus, updatedAt });
}
