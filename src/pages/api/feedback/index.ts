import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { validateFeedback } from "@/lib/schemas";
import { sendError, allowMethod } from "@/utils/api-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { CreateFeedbackResponse, ApiErrorResponse } from "@/types/taply";

// Rate limit: 10 feedback submissions per minute per IP
const FEEDBACK_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateFeedbackResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "POST", res)) return;

  // ─── Rate Limiting ───
  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(ip, FEEDBACK_RATE_LIMIT);

  if (!rateLimitResult.allowed) {
    res.setHeader("Retry-After", "60");
    return sendError(
      res,
      429,
      "INTERNAL_ERROR",
      "Too many requests. Please wait before submitting more feedback.",
    );
  }

  try {
    const validation = validateFeedback(req.body);

    if (!validation.success) {
      return sendError(
        res,
        400,
        "VALIDATION_ERROR",
        validation.errors.join(", "),
      );
    }

    const { designId, comment, x, y, status } = validation.data;

    const designRef = adminDb.collection("designs").doc(designId);
    const designSnap = await designRef.get();

    if (!designSnap.exists) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        `Design with id "${designId}" not found`,
      );
    }

    const now = new Date().toISOString();
    const feedbackData = {
      comment,
      x,
      y,
      createdAt: now,
      status,
    };

    const feedbackRef = await designRef
      .collection("feedback")
      .add(feedbackData);

    return res.status(201).json({
      id: feedbackRef.id,
      comment,
      x,
      y,
      createdAt: now,
      status,
    });
  } catch (error) {
    console.error("Feedback creation error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to create feedback");
  }
}
