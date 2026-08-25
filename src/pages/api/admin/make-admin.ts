import type { NextApiRequest, NextApiResponse } from "next";
import { sendError, allowMethod } from "@/utils/api-helpers";
import { setAdminClaim, removeAdminClaim } from "@/lib/admin-auth";
import type { ApiErrorResponse, MakeAdminResponse } from "@/types/taply";

/**
 * This endpoint is used ONCE to set up the first admin.
 * After that, admins can promote other users from the admin panel.
 *
 * IMPORTANT: Protect this with ADMIN_SETUP_SECRET environment variable.
 * After setting up your first admin, you should disable or delete this endpoint.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MakeAdminResponse | ApiErrorResponse>,
) {
  if (!allowMethod(req.method, "POST", res)) return;

  // ─── Block in Production Unless Secret is Provided ───
  const setupSecret = req.headers["x-admin-setup-secret"];
  const expectedSecret = process.env.ADMIN_SETUP_SECRET;

  if (!expectedSecret) {
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "ADMIN_SETUP_SECRET not configured",
    );
  }

  if (setupSecret !== expectedSecret) {
    return sendError(res, 403, "FORBIDDEN", "Invalid setup secret");
  }

  try {
    const { uid, action } = req.body as {
      uid: string;
      action?: "grant" | "revoke";
    };

    if (!uid || typeof uid !== "string") {
      return sendError(res, 400, "VALIDATION_ERROR", "uid is required");
    }

    const shouldGrant = action !== "revoke";

    if (shouldGrant) {
      await setAdminClaim(uid);
      return res.status(200).json({
        success: true,
        message: `User ${uid} is now an admin`,
        uid,
      });
    } else {
      await removeAdminClaim(uid);
      return res.status(200).json({
        success: true,
        message: `Admin privileges removed from user ${uid}`,
        uid,
      });
    }
  } catch (error) {
    console.error("Make admin error:", error);
    return sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "Failed to update admin status",
    );
  }
}
