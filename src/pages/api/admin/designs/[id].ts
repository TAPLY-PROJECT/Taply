import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { deleteImage } from "@/lib/cloudinary";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type { AdminDesign, ApiErrorResponse } from "@/types/taply";

interface DeleteDesignResponse {
  success: boolean;
  message: string;
  id: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminDesign | DeleteDesignResponse | ApiErrorResponse>,
) {
  // ─── Verify Admin ───
  const auth = await verifyAdminAuth(req);
  if (!auth.success) {
    return sendError(res, 401, "UNAUTHORIZED", auth.error || "Unauthorized");
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return sendError(res, 400, "VALIDATION_ERROR", "Design id is required");
  }

  // ─── GET Single Design ───
  if (req.method === "GET") {
    try {
      const designDoc = await adminDb.collection("designs").doc(id).get();

      if (!designDoc.exists) {
        return sendError(res, 404, "NOT_FOUND", `Design "${id}" not found`);
      }

      const data = designDoc.data()!;
      const feedbackSnapshot = await designDoc.ref.collection("feedback").get();

      return res.status(200).json({
        id: designDoc.id,
        shareableId: data.shareableId,
        name: data.name || "Untitled Design",
        imageUrl: data.imageUrl,
        publicId: data.publicId,
        creatorUid: data.creatorUid,
        createdAt: data.createdAt,
        feedbackCount: feedbackSnapshot.size,
      });
    } catch (error) {
      console.error("Admin get design error:", error);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch design");
    }
  }

  // ─── DELETE Design ───
  if (req.method === "DELETE") {
    try {
      const designDoc = await adminDb.collection("designs").doc(id).get();

      if (!designDoc.exists) {
        return sendError(res, 404, "NOT_FOUND", `Design "${id}" not found`);
      }

      const data = designDoc.data()!;

      // ─── Delete all feedback sub-collection first ───
      const feedbackSnapshot = await designDoc.ref.collection("feedback").get();
      const deletePromises = feedbackSnapshot.docs.map((doc) =>
        doc.ref.delete(),
      );
      await Promise.all(deletePromises);

      // ─── Delete from Cloudinary ───
      if (data.publicId) {
        try {
          await deleteImage(data.publicId);
        } catch (cloudinaryError) {
          // Log but don't fail - Firestore delete is more important
          console.error("Cloudinary delete failed:", cloudinaryError);
        }
      }

      // ─── Delete from Firestore ───
      await designDoc.ref.delete();

      return res.status(200).json({
        success: true,
        message: `Design "${id}" and all its feedback deleted successfully`,
        id,
      });
    } catch (error) {
      console.error("Admin delete design error:", error);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to delete design");
    }
  }

  return sendError(res, 405, "VALIDATION_ERROR", "Method not allowed");
}
