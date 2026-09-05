import type { NextApiRequest, NextApiResponse } from "next";
import { createId } from "@paralleldrive/cuid2";
import { adminDb } from "@/lib/firebase-admin";
import { uploadImage } from "@/lib/cloudinary";
import { verifyAuth } from "@/lib/auth";
import { parseFormFile } from "@/lib/parse-form";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type { UploadDesignResponse, ApiErrorResponse } from "@/types/taply";

// Disable Next.js body parser to allow formidable to handle multipart stream
export const config = {
  api: {
    bodyParser: false,
  },
};

const DESIGN_UPLOAD_LIMIT = {
  maxRequests: 20,
  windowMs: 60 * 60 * 1000, // 20 designs per hour per IP
};

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadDesignResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "POST", res)) return;

  // Rate Limiting
  const ip = getClientIp(req);
  const rateLimit = checkRateLimit(ip, DESIGN_UPLOAD_LIMIT);

  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", "3600");
    return sendError(
      res,
      429,
      "INTERNAL_ERROR",
      "Upload rate limit exceeded. Please try again later.",
    );
  }

  // Authentication
  const auth = await verifyAuth(req);
  if (!auth.success || !auth.uid) {
    return sendError(
      res,
      401,
      "UNAUTHORIZED",
      auth.error || "Authentication required to upload designs.",
    );
  }

  try {
    const { file, fields } = await parseFormFile(req);
    const { url, publicId } = await uploadImage(file.buffer);

    const shareableId = createId();
    const name =
      fields.name?.trim() || stripExtension(file.fileName) || "Untitled Design";
    const now = new Date().toISOString();

    const docRef = await adminDb.collection("designs").add({
      shareableId,
      name,
      imageUrl: url,
      publicId,
      creatorUid: auth.uid,
      createdAt: now,
    });

    return res.status(201).json({
      id: docRef.id,
      shareableId,
      name,
      imageUrl: url,
      createdAt: now,
    });
  } catch (error) {
    console.error("Design upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to upload design";

    if (
      message.includes("No image file") ||
      message.includes("Only image files") ||
      message.includes("maxFileSize")
    ) {
      return sendError(res, 400, "VALIDATION_ERROR", message);
    }

    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "An unexpected error occurred during upload.",
    );
  }
}
