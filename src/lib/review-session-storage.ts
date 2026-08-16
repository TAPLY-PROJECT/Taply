import type { Feedback } from "@/types/taply";
import { TAPLY_STORAGE_EVENT } from "@/hooks/usePersistentState";

export type StoredReviewDesign = {
  id: string;
  shareableId: string;
  name: string;
  uploadedAt: string;
  previewUrl: string;
  imageUrl: string;
};

export type StoredReviewSession = {
  shareableId: string;
  sessionId?: string;
  sessionName: string;
  projectName: string;
  projectDescription: string;
  selectedDesignIds: string[];
  designs: StoredReviewDesign[];
  feedback: Feedback[];
};

const REVIEW_SESSION_STORAGE_PREFIX = "taply-review-session:";

function getReviewSessionStorageKey(shareableId: string) {
  return `${REVIEW_SESSION_STORAGE_PREFIX}${shareableId}`;
}

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function normalizeReviewSession(value: Partial<StoredReviewSession>, shareableId: string) {
  const designs = Array.isArray(value.designs) ? value.designs : [];
  const selectedDesignIds = Array.isArray(value.selectedDesignIds) ? value.selectedDesignIds : [];
  const feedback = Array.isArray(value.feedback) ? value.feedback : [];

  return {
    shareableId: value.shareableId || shareableId,
    sessionId: value.sessionId,
    sessionName: value.sessionName || "Client Review - round 1",
    projectName: value.projectName || "Project name",
    projectDescription: value.projectDescription || "",
    selectedDesignIds,
    designs,
    feedback,
  };
}

export function readStoredReviewSession(shareableId: string): StoredReviewSession | null {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(getReviewSessionStorageKey(shareableId));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredReviewSession>;
    return normalizeReviewSession(parsed, shareableId);
  } catch {
    return null;
  }
}

export function writeStoredReviewSession(session: StoredReviewSession) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    getReviewSessionStorageKey(session.shareableId),
    JSON.stringify({
      ...session,
      feedback: session.feedback ?? [],
    }),
  );
  window.dispatchEvent(new Event(TAPLY_STORAGE_EVENT));
}

export function updateStoredReviewSession(
  shareableId: string,
  updater: (session: StoredReviewSession | null) => StoredReviewSession | null,
) {
  const currentSession = readStoredReviewSession(shareableId);
  const nextSession = updater(currentSession);

  if (!nextSession) {
    const storage = getLocalStorage();
    storage?.removeItem(getReviewSessionStorageKey(shareableId));
    return null;
  }

  writeStoredReviewSession(nextSession);
  return nextSession;
}

export function readStoredReviewSessions() {
  const storage = getLocalStorage();

  if (!storage) {
    return [];
  }

  const sessions: StoredReviewSession[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key || !key.startsWith(REVIEW_SESSION_STORAGE_PREFIX)) {
      continue;
    }

    const rawValue = storage.getItem(key);
    if (!rawValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<StoredReviewSession>;
      sessions.push(normalizeReviewSession(parsed, key.slice(REVIEW_SESSION_STORAGE_PREFIX.length)));
    } catch {
      // Ignore malformed entries and continue collecting the rest.
    }
  }

  return sessions;
}

export function removeStoredReviewSession(shareableId: string) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(getReviewSessionStorageKey(shareableId));
}

export function removeStoredReviewSessionsByProject(projectName: string, projectDescription: string) {
  const sessions = readStoredReviewSessions();
  const matchingSessions = sessions.filter(
    (session) =>
      session.projectName === projectName && session.projectDescription === projectDescription,
  );

  matchingSessions.forEach((session) => {
    removeStoredReviewSession(session.shareableId);
  });
}
