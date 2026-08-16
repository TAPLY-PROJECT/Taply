import { useEffect, useMemo, useState } from "react";
import type { Feedback, GetDesignResponse } from "@/types/taply";
import type { StoredReviewDesign } from "@/lib/review-session-storage";
import { readStoredReviewSession } from "@/lib/review-session-storage";

export type ReviewSessionData = {
  shareableId: string;
  sessionName: string;
  projectName: string;
  projectDescription: string;
  selectedDesignIds: string[];
  designs: StoredReviewDesign[];
  feedback: Feedback[];
  feedbackByDesign: Record<string, Feedback[]>;
};

type ReviewSessionDefaults = {
  sessionName?: string;
  projectName?: string;
  projectDescription?: string;
};

export function useReviewSession(shareableId: string, defaults: ReviewSessionDefaults = {}) {
  const [session, setSession] = useState<ReviewSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const storedSession = readStoredReviewSession(shareableId);

      try {
        const response = await fetch(`/api/designs/${encodeURIComponent(shareableId)}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as GetDesignResponse & { message?: string };

        if (!response.ok) {
          throw new Error(result.message || "Failed to load design");
        }

        if (!active) {
          return;
        }

        const designs = storedSession?.designs?.length
          ? storedSession.designs
          : [
              {
                id: result.design.id,
                shareableId: result.design.shareableId,
                name: result.design.name || result.design.shareableId,
                uploadedAt: result.design.createdAt,
                previewUrl: result.design.imageUrl,
                imageUrl: result.design.imageUrl,
              },
            ];
        const feedbackEntries = await Promise.all(
          designs.map(async (design) => {
            if (design.shareableId === result.design.shareableId) {
              return [design.id, result.feedback] as const;
            }

            try {
              const designResponse = await fetch(`/api/designs/${encodeURIComponent(design.shareableId)}`, {
                cache: "no-store",
              });
              const designResult = (await designResponse.json()) as GetDesignResponse;
              return [design.id, designResponse.ok ? designResult.feedback : []] as const;
            } catch {
              return [design.id, []] as const;
            }
          }),
        );

        const feedbackByDesign = Object.fromEntries(feedbackEntries);
        const fallbackSession: ReviewSessionData = {
          shareableId,
          sessionName: defaults.sessionName || storedSession?.sessionName || "Client Review - round 1",
          projectName: defaults.projectName || storedSession?.projectName || "Project name",
          projectDescription: defaults.projectDescription || storedSession?.projectDescription || "",
          selectedDesignIds: storedSession?.selectedDesignIds || [result.design.id],
          designs,
          feedback: result.feedback,
          feedbackByDesign,
        };

        if (active) {
          setSession(fallbackSession);
        }
      } catch {
        if (active) {
          setSession(
            storedSession
              ? {
                  ...storedSession,
                  feedbackByDesign: {
                    [storedSession.designs[0]?.id || shareableId]: storedSession.feedback,
                  },
                }
              : null,
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    const refreshInterval = window.setInterval(() => {
      void loadSession();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [defaults.projectDescription, defaults.projectName, defaults.sessionName, shareableId]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/review/${shareableId}?view=client`;
    }

    const title = session?.sessionName ?? defaults.sessionName ?? "Session Name";
    const designIds = session?.designs.map((design) => design.shareableId).join(",") || shareableId;
    return `${window.location.origin}/review/${shareableId}?view=client&sessionName=${encodeURIComponent(title)}&designs=${encodeURIComponent(designIds)}`;
  }, [defaults.sessionName, session?.designs, session?.sessionName, shareableId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // Ignore clipboard failures.
    }
  };

  return {
    copied,
    handleCopy,
    loading,
    session,
    shareUrl,
  };
}
