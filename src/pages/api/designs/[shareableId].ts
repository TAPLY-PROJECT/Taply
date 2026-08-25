import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type {
  Design,
  Feedback,
  GetDesignResponse,
  ApiErrorResponse,
} from "@/types/taply";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetDesignResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "GET", res)) return;

  try {
    const { shareableId } = req.query;

    if (!shareableId || typeof shareableId !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "shareableId is required");
    }
    const designsRef = adminDb.collection("designs");
    const querySnapshot = await designsRef
      .where("shareableId", "==", shareableId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return sendError(
        res,
        404,
        "NOT_FOUND",
        `Design with shareableId "${shareableId}" not found`,
      );
    }

    const designDoc = querySnapshot.docs[0];
    const designData = designDoc.data();
    const design: Design = {
      id: designDoc.id,
      shareableId: designData.shareableId,
      name: designData.name || "Untitled Design",
      imageUrl: designData.imageUrl,
      publicId: designData.publicId,
      creatorUid: designData.creatorUid,
      createdAt: designData.createdAt,
    };

    const feedbackSnapshot = await designDoc.ref
      .collection("feedback")
      .orderBy("createdAt", "desc")
      .get();
    const feedback: Feedback[] = feedbackSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        comment: data.comment,
        x: data.x,
        y: data.y,
        createdAt: data.createdAt,
        status: data.status || "needs_change",
      };
    });

    return res.status(200).json({
      design,
      feedback,
    });
  } catch (error) {
    console.error("Error fetching design:", error);
    return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch design");
  }
}
