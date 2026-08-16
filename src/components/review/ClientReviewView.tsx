"use client";

import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { IconPlus } from "@tabler/icons-react";
import Navbar from "@/components/layout/Navbar";
import AssetIcon from "@/components/shared/AssetIcon";
import { usePersistentState } from "@/hooks/usePersistentState";
import { readStoredReviewSession, updateStoredReviewSession } from "@/lib/review-session-storage";
import type { Feedback, GetDesignResponse } from "@/types/taply";
import cursorIcon from "../../public/Icon-assets/cursor.svg";
import arrowDownIcon from "../../public/Icon-assets/arrow-down.svg";
import searchZoomInIcon from "../../public/Icon-assets/search-zoom-in.svg";
import locationIcon from "../../public/Icon-assets/location.svg";
import magicpenIcon from "../../public/Icon-assets/magicpen.svg";
import messageAdd22Icon from "../../public/Icon-assets/message-add22.svg";

type ClientReviewViewProps = {
  shareableId: string;
  sessionName?: string;
  designShareableIds?: string[];
};

type DraftFeedback = {
  x: number;
  y: number;
  comment: string;
};

type CanvasPoint = {
  x: number;
  y: number;
};

type QuickPin = {
  id: string;
  x: number;
  y: number;
};

type PenStroke = {
  id: string;
  points: CanvasPoint[];
};

type ReviewToolState = {
  pins: QuickPin[];
  strokes: PenStroke[];
};

type ToolbarTool = "cursor" | "add" | "pin" | "pen" | "comment";
type FeedbackStatus = "positive" | "needs_change";

type ReviewDesign = {
  id: string;
  shareableId: string;
  name: string;
  uploadedAt: string;
  previewUrl: string;
  imageUrl: string;
};

function ToolButton({
  icon,
  active,
  onClick,
  label,
  showChevron,
}: {
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  label: string;
  showChevron?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-[56px] items-center justify-center gap-1 rounded-[14px] px-4 transition ${
        active ? "bg-[#efe7ff] text-[#6f2cf6]" : "text-[#6f2cf6] hover:bg-[#f3edff]"
      }`}
      aria-label={label}
    >
      {icon}
      {showChevron ? <AssetIcon src={arrowDownIcon} className="h-[14px] w-[14px]" /> : null}
    </button>
  );
}

function clampToUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function strokePath(points: CanvasPoint[]) {
  if (points.length === 0) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x * 100} ${point.y * 100}`).join(" ");
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `tool-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ClientReviewView({ shareableId, sessionName, designShareableIds = [] }: ClientReviewViewProps) {
  const [designs, setDesigns] = useState<ReviewDesign[]>([]);
  const [selectedDesignIndex, setSelectedDesignIndex] = useState(0);
  const [feedbackByDesign, setFeedbackByDesign] = useState<Record<string, Feedback[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState(sessionName || "Session Name");
  const [activeTool, setActiveTool] = useState<ToolbarTool>("cursor");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<"add" | "comment">("add");
  const [draft, setDraft] = useState<DraftFeedback>({
    x: 0.5,
    y: 0.5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus>("needs_change");
  const { setValue: setToolState, value: toolState } = usePersistentState<ReviewToolState>(
    `taply-review-tools:${shareableId}`,
    { pins: [], strokes: [] },
  );
  const [draftStroke, setDraftStroke] = useState<PenStroke | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const safeSelectedDesignIndex =
    designs.length > 0 ? selectedDesignIndex % designs.length : 0;
  const currentDesign = designs[safeSelectedDesignIndex] ?? designs[0] ?? null;
  const currentDesignShareableId = currentDesign?.shareableId;
  const feedback = currentDesign ? feedbackByDesign[currentDesign.id] ?? [] : [];
  const orderedFeedback = [...feedback].reverse();

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const storedSession = readStoredReviewSession(shareableId);

        if (storedSession?.designs?.length) {
          setDesigns(
            storedSession.designs.map((item) => ({
              id: item.id,
              shareableId: item.shareableId,
              name: item.name,
              uploadedAt: item.uploadedAt,
              previewUrl: item.previewUrl,
              imageUrl: item.imageUrl,
            })),
          );
          setSelectedDesignIndex(0);
          const primaryDesignId = storedSession.designs[0]?.id;
          if (primaryDesignId) {
            setFeedbackByDesign((current) => ({
              ...current,
              [primaryDesignId]: storedSession.feedback ?? [],
            }));
          }
        }

        const idsToLoad = Array.from(new Set([shareableId, ...designShareableIds]));
        const results = await Promise.all(
          idsToLoad.map(async (designShareableId) => {
            const response = await fetch(`/api/designs/${encodeURIComponent(designShareableId)}`);
            const result = (await response.json()) as GetDesignResponse & { message?: string };
            if (!response.ok) {
              throw new Error(result.message || "Failed to load design");
            }
            return result;
          }),
        );
        const primaryResult = results.find((result) => result.design.shareableId === shareableId) ?? results[0];

        if (!active) {
          return;
        }

        if (!storedSession?.designs?.length) {
          setDesigns(
            results.map(({ design }) => ({
              id: design.id,
              shareableId: design.shareableId,
              name: design.name || design.shareableId,
              uploadedAt: design.createdAt,
              previewUrl: design.imageUrl,
              imageUrl: design.imageUrl,
            })),
          );
        }
        setFeedbackByDesign((current) =>
          results.reduce(
            (next, result) => ({ ...next, [result.design.id]: result.feedback }),
            current,
          ),
        );
        updateStoredReviewSession(shareableId, (current) =>
          current
            ? {
                ...current,
                feedback: primaryResult.feedback,
              }
            : current,
        );

        if (sessionName) {
          setSessionTitle(sessionName);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Design not found.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [designShareableIds, sessionName, shareableId]);

  useEffect(() => {
    if (!currentDesignShareableId) {
      return;
    }

    let active = true;

    const loadFeedback = async () => {
      try {
        const response = await fetch(`/api/designs/${encodeURIComponent(currentDesignShareableId)}`);
        const result = (await response.json()) as GetDesignResponse & { message?: string };

        if (!response.ok) {
          throw new Error(result.message || "Failed to load design");
        }

        if (active) {
          setFeedbackByDesign((current) => ({
            ...current,
            [currentDesign.id]: result.feedback,
          }));
        }
      } catch {
        if (active) {
          setFeedbackByDesign((current) => ({
            ...current,
            [currentDesign.id]: [],
          }));
        }
      }
    };

    void loadFeedback();
    const refreshInterval = window.setInterval(() => {
      void loadFeedback();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [currentDesign?.id, currentDesignShareableId]);

  const getRelativePoint = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clampToUnit((event.clientX - rect.left) / rect.width),
      y: clampToUnit((event.clientY - rect.top) / rect.height),
    };
  };

  const openComposer = (point: CanvasPoint, mode: "add" | "comment") => {
    setDraft((current) => ({ ...current, x: point.x, y: point.y }));
    setComposerMode(mode);
    setComposerOpen(true);
  };

  const goToPreviousDesign = () => {
    if (designs.length <= 1) {
      return;
    }

    setSelectedDesignIndex((current) => (current - 1 + designs.length) % designs.length);
    setSelectedFeedbackId(null);
  };

  const goToNextDesign = () => {
    if (designs.length <= 1) {
      return;
    }

    setSelectedDesignIndex((current) => (current + 1) % designs.length);
    setSelectedFeedbackId(null);
  };

  const commitDraftStroke = () => {
    setDraftStroke((current) => {
      if (!current || current.points.length < 2) {
        return null;
      }

      setToolState((state) => ({
        ...state,
        strokes: [current, ...state.strokes],
      }));

      return null;
    });
  };

  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!currentDesign || loading) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-feedback-marker='true']") || target.closest("[data-toolbar-root='true']")) {
      return;
    }

    const point = getRelativePoint(event);

    if (activeTool === "cursor") {
      return;
    }

    if (activeTool === "add" || activeTool === "comment") {
      openComposer(point, activeTool);
      return;
    }

    if (activeTool === "pin") {
      setToolState((current) => ({
        ...current,
        pins: [
          {
            id: makeId(),
            x: point.x,
            y: point.y,
          },
          ...current.pins,
        ],
      }));
      return;
    }

    if (activeTool === "pen") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraftStroke({
        id: makeId(),
        points: [point],
      });
    }
  };

  const handleCanvasPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (activeTool !== "pen" || !draftStroke) {
      return;
    }

    const point = getRelativePoint(event);

    setDraftStroke((current) =>
      current
        ? {
            ...current,
            points: [...current.points, point],
          }
        : current,
    );
  };

  const handleCanvasPointerUp = () => {
    if (activeTool === "pen") {
      commitDraftStroke();
    }
  };

  const handleSubmit = async () => {
    if (!currentDesign || !draft.comment.trim() || submitting) {
      return;
    }

    const optimisticFeedback = {
      id: makeId(),
      comment: draft.comment.trim(),
      x: draft.x,
      y: draft.y,
      createdAt: new Date().toISOString(),
      status: feedbackStatus,
    };

    setSubmitting(true);
    setError(null);

    setFeedbackByDesign((current) => ({
      ...current,
      [currentDesign.id]: [optimisticFeedback, ...(current[currentDesign.id] ?? [])],
    }));
    updateStoredReviewSession(shareableId, (current) =>
      current
        ? {
            ...current,
            feedback: [optimisticFeedback, ...current.feedback],
          }
        : current,
    );
    setDraft((current) => ({ ...current, comment: "" }));
    setComposerOpen(false);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: currentDesign.id,
          comment: draft.comment.trim(),
          x: draft.x,
          y: draft.y,
          status: feedbackStatus,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "Failed to submit feedback");
      }

      const createdFeedback = {
        id: result.id,
        comment: result.comment,
        x: result.x,
        y: result.y,
        createdAt: result.createdAt,
        status: result.status || feedbackStatus,
      };

      setFeedbackByDesign((current) => ({
        ...current,
        [currentDesign.id]: (current[currentDesign.id] ?? []).map((item) =>
          item.id === optimisticFeedback.id ? createdFeedback : item,
        ),
      }));
      updateStoredReviewSession(shareableId, (current) =>
        current
          ? {
              ...current,
              feedback: current.feedback.map((item) =>
                item.id === optimisticFeedback.id ? createdFeedback : item,
              ),
            }
          : current,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? `${submitError.message} (saved locally for now)`
          : "Failed to submit feedback (saved locally for now)",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopSubmit = () => {
    if (composerOpen && draft.comment.trim()) {
      void handleSubmit();
      return;
    }

    setComposerOpen(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbfbff]">
        <Navbar variant="home" actionLabel="Submit" actionOnClick={handleTopSubmit} actionIcon={null} />
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-4">
          <p className="text-[15px] text-[#6f6b78]">Loading review...</p>
        </div>
      </main>
    );
  }

  if (error || !currentDesign) {
    return (
      <main className="min-h-screen bg-[#fbfbff]">
        <Navbar variant="home" actionLabel="Submit" actionOnClick={handleTopSubmit} actionIcon={null} />
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-4">
          <p className="text-[15px] text-[#d92d20]">{error || "Design not found."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbff] text-[#1c1340]">
      <Navbar variant="home" actionLabel="Submit" actionOnClick={handleTopSubmit} actionIcon={null} />

      <div className="mx-auto w-full max-w-[1110px] px-4 pb-20 pt-8 xl:px-0">
        <div className="relative mx-auto w-full max-w-[1020px]">
          <div className="relative overflow-hidden rounded-[14px] bg-white shadow-[0_18px_40px_rgba(24,18,47,0.1)]">
            <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-white px-5 py-3 text-[15px] font-medium text-[#13121a] shadow-[0_8px_24px_rgba(24,18,47,0.12)]">
              <span className="inline-flex items-center gap-2">
                <IconPlus size={16} stroke={2.4} className="text-[#6f2cf6]" />
                {sessionTitle}
              </span>
            </div>

            <div className="absolute right-5 top-10 z-10 rounded-[14px] bg-[#f5f2ff] px-5 py-4 shadow-[0_12px_26px_rgba(24,18,47,0.12)]">
              <div className="flex items-center gap-10 text-[#6f2cf6]">
                <div className="inline-flex items-center gap-1.5 text-[18px] font-medium">
                  50%
                  <AssetIcon src={arrowDownIcon} className="h-[14px] w-[14px]" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <span className="h-3 w-3 rounded-[4px] bg-[#6f2cf6]" />
                  <span className="h-3 w-3 rounded-[4px] bg-[#b787ff]" />
                  <span className="h-3 w-3 rounded-[4px] bg-[#b787ff]" />
                  <span className="h-3 w-3 rounded-[4px] bg-[#6f2cf6]" />
                </div>
              </div>
            </div>

            {designs.length > 1 ? (
              <div className="absolute left-5 top-1/2 z-30 -translate-y-1/2">
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={goToPreviousDesign}
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6f2cf6] shadow-[0_10px_20px_rgba(24,18,47,0.12)]"
                  aria-label="Previous design"
                >
                  <span className="text-[28px] leading-none">&lsaquo;</span>
                </button>
              </div>
            ) : null}

            {designs.length > 1 ? (
              <div className="absolute right-5 top-1/2 z-30 -translate-y-1/2">
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={goToNextDesign}
                  className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6f2cf6] shadow-[0_10px_20px_rgba(24,18,47,0.12)]"
                  aria-label="Next design"
                >
                  <span className="text-[28px] leading-none">&rsaquo;</span>
                </button>
              </div>
            ) : null}

            <div
              className="relative h-[792px] w-full touch-none bg-white"
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerUp}
              onPointerLeave={handleCanvasPointerUp}
            >
              <Image
                src={currentDesign.imageUrl}
                alt={currentDesign.shareableId}
                fill
                sizes="(max-width: 1020px) 100vw, 1020px"
                priority
                className="object-cover"
              />

              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {toolState.strokes.map((stroke) => (
                  <path
                    key={stroke.id}
                    d={strokePath(stroke.points)}
                    fill="none"
                    stroke="#6f2cf6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {draftStroke ? (
                  <path
                    d={strokePath(draftStroke.points)}
                    fill="none"
                    stroke="#6f2cf6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </svg>

              {toolState.pins.map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  data-feedback-marker="true"
                  className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#6f2cf6] shadow-[0_10px_22px_rgba(111,44,246,0.22)] ring-2 ring-[#6f2cf6]/20"
                  style={{
                    left: percent(pin.x),
                    top: percent(pin.y),
                  }}
                  title="Pin marker"
                >
                  <AssetIcon src={locationIcon} className="h-[20px] w-[20px]" />
                </button>
              ))}

              {orderedFeedback.map((item, index) => (
                <div key={item.id}>
                  <button
                    type="button"
                    data-feedback-marker="true"
                    className={`absolute flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(111,44,246,0.28)] ${
                      selectedFeedbackId === item.id ? "bg-[#4f1bd4] ring-4 ring-[#6f2cf6]/20" : "bg-[#6f2cf6]"
                    }`}
                    style={{
                      left: percent(item.x),
                      top: percent(item.y),
                      transform: "translate(-50%, -50%)",
                    }}
                    title={item.comment}
                    onClick={() => setSelectedFeedbackId((current) => (current === item.id ? null : item.id))}
                  >
                    {index + 1}
                  </button>

                  {selectedFeedbackId === item.id ? (
                    <div
                      className="absolute z-20 max-w-[240px] rounded-[12px] border border-[#e2d3ff] bg-white px-4 py-3 text-left shadow-[0_14px_28px_rgba(24,18,47,0.16)]"
                      style={{
                        left: `calc(${percent(item.x)} + 16px)`,
                        top: `calc(${percent(item.y)} - 12px)`,
                      }}
                    >
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#6f2cf6]">
                        Comment {index + 1}
                        <span className="rounded-full bg-[#f3f0f7] px-2 py-0.5 text-[10px] text-[#6f2cf6]">{item.status || "needs_change"}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-[#1a1722]">{item.comment}</p>
                    </div>
                  ) : null}
                </div>
              ))}

              <div
                data-toolbar-root="true"
                className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-[14px] bg-[#f2ebff] px-5 py-4 shadow-[0_12px_24px_rgba(24,18,47,0.14)]"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <ToolButton
                  label="Cursor"
                  icon={<AssetIcon src={cursorIcon} className="h-[34px] w-[34px]" />}
                  active={activeTool === "cursor"}
                  onClick={() => {
                    setActiveTool("cursor");
                    setComposerOpen(false);
                    setSelectedFeedbackId(null);
                  }}
                  showChevron
                />
                <ToolButton
                  label="Add"
                  icon={<AssetIcon src={messageAdd22Icon} className="h-[34px] w-[34px]" />}
                  active={activeTool === "add"}
                  onClick={() => {
                    setActiveTool("add");
                    setComposerOpen(false);
                    setSelectedFeedbackId(null);
                  }}
                />
                <ToolButton
                  label="Pin"
                  icon={<AssetIcon src={locationIcon} className="h-[34px] w-[34px]" />}
                  active={activeTool === "pin"}
                  onClick={() => {
                    setActiveTool("pin");
                    setComposerOpen(false);
                    setSelectedFeedbackId(null);
                  }}
                />
                <ToolButton
                  label="Pen"
                  icon={<AssetIcon src={magicpenIcon} className="h-[34px] w-[34px]" />}
                  active={activeTool === "pen"}
                  onClick={() => {
                    setActiveTool("pen");
                    setComposerOpen(false);
                    setSelectedFeedbackId(null);
                  }}
                  showChevron
                />
                <ToolButton
                  label="Comment"
                  icon={<AssetIcon src={searchZoomInIcon} className="h-[34px] w-[34px]" />}
                  active={activeTool === "comment"}
                  onClick={() => {
                    setActiveTool("comment");
                    setComposerOpen(false);
                    setSelectedFeedbackId(null);
                  }}
                  showChevron
                />
              </div>

              <div className="absolute right-5 bottom-[88px] z-10 rounded-[14px] border border-[#e4d9ff] bg-white/95 px-4 py-3 shadow-[0_14px_28px_rgba(24,18,47,0.12)] backdrop-blur-sm">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8b7da8]">Active tool</div>
                <div className="mt-1 text-[16px] font-semibold text-[#6f2cf6]">
                  {activeTool === "cursor"
                    ? "Cursor"
                    : activeTool === "add"
                      ? "Add"
                      : activeTool === "pin"
                        ? "Pin"
                        : activeTool === "pen"
                          ? "Pen"
                          : "Comment"}
                </div>
                <div className="mt-1 max-w-[170px] text-[12px] leading-5 text-[#7e748f]">
                  Cursor selects, Add and Comment open feedback, Pin drops a marker, Pen draws.
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mx-auto mt-8 max-w-[1020px] rounded-[16px] border border-[#e8dcff] bg-white px-5 py-5 shadow-[0_12px_24px_rgba(24,18,47,0.06)]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[18px] font-semibold text-[#111111]">Comments</h2>
            <span className="text-[13px] text-[#7f7397]">
              {orderedFeedback.length} comment{orderedFeedback.length === 1 ? "" : "s"}
            </span>
          </div>

          {orderedFeedback.length === 0 ? (
            <p className="mt-4 text-[13px] text-[#7f7397]">
              No comments yet. Use any tool and click on the design to leave a comment.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              {orderedFeedback.map((item, index) => (
                <article
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-[14px] bg-[#faf7ff] px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#6f2cf6]">
                      Comment {index + 1}
                      <span className="rounded-full bg-[#f3f0f7] px-2 py-0.5 text-[10px] text-[#6f2cf6]">{item.status || "needs_change"}</span>
                    </div>
                    <p className="mt-1 text-[14px] leading-6 text-[#1a1722]">{item.comment}</p>
                  </div>
                  <div className="shrink-0 text-right text-[11px] text-[#827896]">
                    <div>{Math.round(item.x * 100)}% x</div>
                    <div>{Math.round(item.y * 100)}% y</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {composerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,43,58,0.45)] px-4"
          role="presentation"
          onClick={() => setComposerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave feedback"
            className="w-full max-w-[520px] rounded-[16px] bg-white p-6 shadow-[0_20px_70px_rgba(14,8,32,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] font-semibold text-[#121212]">
                {composerMode === "comment" ? "Leave comment" : "Leave feedback"}
              </h3>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="text-[14px] text-[#6f6b78]"
              >
                Close
              </button>
            </div>

            <p className="mt-2 text-[12px] text-[#818181]">
              {Math.round(draft.x * 100)}% x, {Math.round(draft.y * 100)}% y
            </p>

            <div className="mt-4 flex gap-2" role="group" aria-label="Feedback status">
              <button
                type="button"
                onClick={() => setFeedbackStatus("positive")}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${feedbackStatus === "positive" ? "bg-[#d9eee7] text-[#16845b]" : "bg-[#f3f0f7] text-[#7f7397]"}`}
              >
                Positive
              </button>
              <button
                type="button"
                onClick={() => setFeedbackStatus("needs_change")}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium ${feedbackStatus === "needs_change" ? "bg-[#f8dfe4] text-[#b42318]" : "bg-[#f3f0f7] text-[#7f7397]"}`}
              >
                Needs change
              </button>
            </div>

            <textarea
              value={draft.comment}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
              }
              rows={5}
              className="mt-4 w-full resize-none rounded-[13px] border border-[#d8c5ff] bg-[#f8f4ff] px-4 py-3 text-[15px] text-[#1a1722] outline-none placeholder:text-[#9a94a7] focus:border-[#b997ff]"
              placeholder={composerMode === "comment" ? "Write a comment about this area..." : "Write your feedback..."}
              maxLength={500}
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="h-[42px] rounded-[11px] border border-[#e3dfe8] bg-white px-5 text-[14px] font-medium text-[#6f6b78]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!draft.comment.trim() || submitting}
                className="h-[42px] rounded-[11px] bg-[linear-gradient(180deg,#7d2df8_0%,#6c20f4_100%)] px-5 text-[14px] font-semibold text-white shadow-[0_14px_24px_rgba(112,33,248,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
