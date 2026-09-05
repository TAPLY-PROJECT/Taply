const AUTH_STORAGE_KEY = "taply-auth-session";

export type FirebaseAuthResponse = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email?: string;
  expiresIn?: string;
};

type FirebaseErrorResponse = {
  error?: { message?: string };
};

function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_API_KEY to .env.local.",
    );
  }
  return apiKey;
}

async function requestFirebase(path: string, body: Record<string, string>) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${getApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    },
  );

  const result = (await response.json()) as FirebaseAuthResponse &
    FirebaseErrorResponse;

  if (!response.ok || !result.idToken) {
    const code = result.error?.message || "AUTHENTICATION_FAILED";
    const messages: Record<string, string> = {
      EMAIL_EXISTS: "An account with this email already exists.",
      INVALID_LOGIN_CREDENTIALS: "Incorrect email or password.",
      INVALID_PASSWORD: "Incorrect email or password.",
      USER_DISABLED: "This account has been disabled.",
      TOO_MANY_ATTEMPTS_TRY_LATER: "Too many attempts. Please try again later.",
      EMAIL_NOT_FOUND: "No account exists with this email.",
    };
    throw new Error(
      messages[code] || "Authentication failed. Please try again.",
    );
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result));
    window.dispatchEvent(new Event("taply:auth-change"));
  }
  return result;
}

export function signUp(email: string, password: string) {
  return requestFirebase("accounts:signUp", { email, password });
}

export function signIn(email: string, password: string) {
  return requestFirebase("accounts:signInWithPassword", { email, password });
}

export async function sendPasswordReset(email: string) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${getApiKey()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    },
  );
  const result = (await response.json()) as FirebaseErrorResponse;
  if (!response.ok) {
    throw new Error(
      result.error?.message === "EMAIL_NOT_FOUND"
        ? "No account exists for this email."
        : "Could not send reset email.",
    );
  }
}

export function getStoredSession(): FirebaseAuthResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FirebaseAuthResponse) : null;
  } catch {
    return null;
  }
}

export function getStoredIdToken(): string | null {
  return getStoredSession()?.idToken || null;
}

/**
 * Returns a valid token, refreshing it automatically if expired.
 */
export async function getValidIdToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session) return null;

  // Attempt refresh if refresh token exists
  if (session.refreshToken) {
    try {
      const response = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${getApiKey()}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
            session.refreshToken,
          )}`,
        },
      );

      const data = await response.json();
      if (response.ok && data.id_token) {
        const updatedSession: FirebaseAuthResponse = {
          ...session,
          idToken: data.id_token,
          refreshToken: data.refresh_token || session.refreshToken,
        };
        window.localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify(updatedSession),
        );
        return data.id_token;
      }
    } catch {
      // Return fallback cached token if refresh network fails
    }
  }

  return session.idToken;
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event("taply:auth-change"));
  }
}
