type DevTokenResponse =
  | {
      success: true;
      idToken: string;
      message?: string;
    }
  | {
      success?: false;
      message?: string;
      error?: unknown;
      customToken?: string;
      note?: string;
    };

export async function getDevIdToken(): Promise<string> {
  const storedIdToken = getStoredIdToken();
  if (storedIdToken) {
    return storedIdToken;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Please login with Firebase Auth.");
  }

  const secret = process.env.NEXT_PUBLIC_DEV_TOKEN_SECRET;

  if (!secret) {
    throw new Error(
      "NEXT_PUBLIC_DEV_TOKEN_SECRET is not configured. Add it to your .env.local so the frontend can request a dev token.",
    );
  }

  const response = await fetch(`/api/dev/get-token?secret=${encodeURIComponent(secret)}`);
  const result = (await response.json()) as DevTokenResponse;

  if (!response.ok) {
    const fallbackMessage = "message" in result ? result.message : undefined;
    throw new Error(
      fallbackMessage ||
        "Failed to get dev token. Check DEV_TOKEN_SECRET on the server and NEXT_PUBLIC_DEV_TOKEN_SECRET in the client.",
    );
  }

  if (!("idToken" in result) || !result.idToken) {
    throw new Error(
      "Dev token endpoint did not return an ID token. Set NEXT_PUBLIC_FIREBASE_API_KEY so the custom token can be exchanged.",
    );
  }

  return result.idToken;
}
import { getStoredIdToken } from "@/lib/firebase-client";
