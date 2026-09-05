import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type {
  GetDesignResponse,
  ApiErrorResponse,
  Feedback,
} from "@/types/taply";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetDesignResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "GET", res)) return;

  const { shareableId } = req.query;

  if (!shareableId || typeof shareableId !== "string") {
    return sendError(res, 400, "VALIDATION_ERROR", "shareableId is required");
  }

  try {
    const snapshot = await adminDb
      .collection("designs")
      .where("shareableId", "==", shareableId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        `Design with shareableId "${shareableId}" not found`,
      );
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    const feedbackSnapshot = await doc.ref
      .collection("feedback")
      .orderBy("createdAt", "desc")
      .get();

    const feedback: Feedback[] = feedbackSnapshot.docs.map((fbDoc) => {
      const fbData = fbDoc.data();
      return {
        id: fbDoc.id,
        comment: fbData.comment,
        x: fbData.x,
        y: fbData.y,
        createdAt: fbData.createdAt,
        status: fbData.status,
      };
    });

    return res.status(200).json({
      design: {
        id: doc.id,
        shareableId: data.shareableId,
        name: data.name || "Untitled Design",
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        creatorUid: data.creatorUid,
        createdAt: data.createdAt,
      },
      feedback,
    });
  } catch (error) {
    console.error("Get design error:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch design");
  }
}
