import type { NextApiRequest, NextApiResponse } from "next";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  verifyAdminAuth,
  setAdminClaim,
  removeAdminClaim,
} from "@/lib/admin-auth";
import { sendError, allowMethod } from "@/utils/api-helpers";
import type { AdminUser, ApiErrorResponse } from "@/types/taply";

interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminUsersResponse | ApiErrorResponse>,
) {
  // ─── Verify Admin ───
  const auth = await verifyAdminAuth(req);
  if (!auth.success) {
    return sendError(res, 401, "UNAUTHORIZED", auth.error || "Unauthorized");
  }

  // ─── GET All Users ───
  if (req.method === "GET") {
    try {
      // ─── List users from Firebase Auth ───
      const listUsersResult = await adminAuth.listUsers(100);

      // ─── Get design counts per user ───
      const designsSnapshot = await adminDb.collection("designs").get();

      const designCountMap = new Map<string, number>();
      designsSnapshot.docs.forEach((doc) => {
        const uid = doc.data().creatorUid;
        designCountMap.set(uid, (designCountMap.get(uid) || 0) + 1);
      });

      // ─── Build User List ───
      const users: AdminUser[] = listUsersResult.users.map((user) => ({
        uid: user.uid,
        email: user.email || "No email",
        displayName: user.displayName || "Anonymous",
        isAdmin: user.customClaims?.admin === true,
        createdAt: user.metadata.creationTime || new Date().toISOString(),
        designCount: designCountMap.get(user.uid) || 0,
      }));

      return res.status(200).json({
        users,
        total: users.length,
      });
    } catch (error) {
      console.error("Admin users list error:", error);
      return sendError(res, 500, "INTERNAL_ERROR", "Failed to fetch users");
    }
  }

  // ─── POST - Toggle Admin Role ───
  if (req.method === "POST") {
    try {
      const { uid, action } = req.body as {
        uid: string;
        action: "grant" | "revoke";
      };

      if (!uid || typeof uid !== "string") {
        return sendError(res, 400, "VALIDATION_ERROR", "uid is required");
      }

      if (action !== "grant" && action !== "revoke") {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "action must be grant or revoke",
        );
      }

      // ─── Prevent self-demotion ───
      if (uid === auth.uid && action === "revoke") {
        return sendError(
          res,
          400,
          "VALIDATION_ERROR",
          "You cannot revoke your own admin privileges",
        );
      }

      if (action === "grant") {
        await setAdminClaim(uid);
      } else {
        await removeAdminClaim(uid);
      }

      return res.status(200).json({
        users: [],
        total: 0,
      });
    } catch (error) {
      console.error("Admin toggle role error:", error);
      return sendError(
        res,
        500,
        "INTERNAL_ERROR",
        "Failed to update user role",
      );
    }
  }

  return sendError(res, 405, "VALIDATION_ERROR", "Method not allowed");
}
