import type { NextApiRequest } from "next";
import { adminAuth } from "./firebase-admin";

export interface AdminAuthResult {
  success: boolean;
  uid?: string;
  email?: string;
  error?: string;
}

/**
 * Verifies that the request comes from an authenticated admin user.
 * Uses Firebase Custom Claims to check admin role.
 * This is more secure than checking a database because
 * custom claims are verified cryptographically by Firebase.
 *
 * @param req - Next.js API request
 * @returns AdminAuthResult
 */
export async function verifyAdminAuth(
  req: NextApiRequest,
): Promise<AdminAuthResult> {
  try {
    // ─── Step 1: Check Authorization Header ───
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return {
        success: false,
        error: "Authorization header missing",
      };
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return {
        success: false,
        error: "Invalid authorization format. Use: Bearer <token>",
      };
    }

    const token = parts[1];

    // ─── Step 2: Verify Firebase Token ───
    const decodedToken = await adminAuth.verifyIdToken(token);

    // ─── Step 3: Check Admin Custom Claim ───
    // This is the key security check
    // Custom claims are set server-side and cannot be faked
    if (!decodedToken.admin) {
      return {
        success: false,
        error: "Access denied. Admin privileges required.",
      };
    }

    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error("Admin auth verification failed:", error);
    return {
      success: false,
      error: "Invalid or expired token",
    };
  }
}

/**
 * Sets admin custom claim on a Firebase user.
 * Only call this from trusted server-side code.
 *
 * @param uid - Firebase user UID to make admin
 */
export async function setAdminClaim(uid: string): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { admin: true });
}

/**
 * Removes admin custom claim from a Firebase user.
 *
 * @param uid - Firebase user UID to remove admin from
 */
export async function removeAdminClaim(uid: string): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { admin: false });
}

/**
 * Checks if a user has admin claim.
 *
 * @param uid - Firebase user UID to check
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  const user = await adminAuth.getUser(uid);
  return user.customClaims?.admin === true;
}
