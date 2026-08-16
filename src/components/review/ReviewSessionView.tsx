"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { IconChevronLeft, IconCopy, IconPlus } from "@tabler/icons-react";
import Navbar from "@/components/layout/Navbar";
import AssetIcon from "@/components/shared/AssetIcon";
import { useReviewSession } from "@/hooks/useReviewSession";
import { getDevIdToken } from "@/lib/dev-auth";
import type { FeedbackStatus } from "@/types/taply";
import messages3Icon from "../../public/Icon-assets/messages-3.svg";
import likeIcon from "../../public/Icon-assets/like.svg";
import dangerIcon from "../../public/Icon-assets/danger.svg";
import tickCircleIcon from "../../public/Icon-assets/tick-circle.svg";
import infoCircleIcon from "../../public/Icon-assets/info-circle.svg";

type ReviewSessionViewProps = {
  shareableId: string;
  sessionName?: string;
  projectName?: string;
  projectDescription?: string;
};

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className={`flex h-[130px] min-h-[130px] w-full flex-col justify-between rounded-[12px] px-5 py-4 ${tone}`}>
      <div className="text-[17px] font-medium text-[#6a6a6a]">{title}</div>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[46px] font-medium leading-none text-[#6c25f5]">{value}</div>
        <div className="-mt-4 text-[#6c25f5]">{icon}</div>
      </div>
    </div>
  );
}

function FeedbackBadge({
  index,
  x,
  y,
}: {
  index: number;
  x: number;
  y: number;
}) {
  return (
    <button
      type="button"
      className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-[#6f2cf6] text-[12px] font-semibold text-white shadow-[0_10px_18px_rgba(111,44,246,0.28)]"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      title={`Feedback ${index + 1}`}
    >
      {index + 1}
    </button>
  );
}

export default function ReviewSessionView({
  shareableId,
  sessionName,
  projectName,
  projectDescription,
}: ReviewSessionViewProps) {
  const { copied, handleCopy, loading, session, shareUrl } = useReviewSession(shareableId, {
    sessionName,
    projectName,
    projectDescription,
  });
  const [statusOverrides, setStatusOverrides] = useState<Record<string, FeedbackStatus>>({});
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);
  const getFeedbackStatus = (status?: FeedbackStatus, id?: string): FeedbackStatus =>
    (id && statusOverrides[id]) || status || "needs_change";
  const feedbackItems = session
    ? session.designs.flatMap((item) => session.feedbackByDesign?.[item.id] ?? (item.id === session.designs[0]?.id ? session.feedback : []))
    : [];
  const orderedFeedbackItems = [...feedbackItems].reverse();
  const totalFeedback = String(feedbackItems.length);
  const positiveCount = feedbackItems.filter((item) => getFeedbackStatus(item.status, item.id) === "positive").length;
  const needsChangeCount = feedbackItems.filter((item) => getFeedbackStatus(item.status, item.id) === "needs_change").length;
  const resolvedCount = feedbackItems.filter((item) => getFeedbackStatus(item.status, item.id) === "resolved").length;

  const updateFeedbackStatus = async (designId: string, feedbackId: string, status: FeedbackStatus) => {
    setUpdatingFeedbackId(feedbackId);
    try {
      const token = await getDevIdToken();
      const response = await fetch(`/api/feedback/${encodeURIComponent(feedbackId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ designId, status }),
      });
      if (!response.ok) throw new Error("Failed to update feedback status");
      setStatusOverrides((current) => ({ ...current, [feedbackId]: status }));
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbfbff]">
        <Navbar
          variant="home"
          actionLabel="New Session"
          actionHref={`/review/${shareableId}`}
          actionIcon={<IconPlus size={12} stroke={2.4} />}
        />
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-4">
          <p className="text-[15px] text-[#6f6b78]">Loading review...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#fbfbff]">
        <Navbar
          variant="home"
          actionLabel="New Session"
          actionHref={`/review/${shareableId}`}
          actionIcon={<IconPlus size={12} stroke={2.4} />}
        />
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-4">
          <p className="text-[15px] text-[#d92d20]">Design not found.</p>
        </div>
      </main>
    );
  }

  const design = session.designs[0] ?? null;

  if (!design) {
    return (
      <main className="min-h-screen bg-[#fbfbff]">
        <Navbar
          variant="home"
          actionLabel="New Session"
          actionHref={`/review/${shareableId}`}
          actionIcon={<IconPlus size={12} stroke={2.4} />}
        />
        <div className="mx-auto flex min-h-[60vh] max-w-[1240px] items-center justify-center px-4">
          <p className="text-[15px] text-[#d92d20]">Design not found.</p>
        </div>
      </main>
    );
  }

  const feedbackStats = [
    {
      title: "Total Feedback",
      value: totalFeedback,
      icon: <AssetIcon src={messages3Icon} className="h-[42px] w-[42px]" />,
      tone: "bg-[#f5f0ff]",
    },
    {
      title: "Positive",
      value: String(positiveCount),
      icon: <AssetIcon src={likeIcon} className="h-[42px] w-[42px]" />,
      tone: "bg-[#dbe7ff]",
    },
    {
      title: "Needs Change",
      value: String(needsChangeCount),
      icon: <AssetIcon src={dangerIcon} className="h-[42px] w-[42px]" />,
      tone: "bg-[#f8dfe4]",
    },
    {
      title: "Resolved",
      value: String(resolvedCount),
      icon: <AssetIcon src={tickCircleIcon} className="h-[42px] w-[42px]" />,
      tone: "bg-[#d9eee7]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#fbfbff] text-[#13121a]">
      <Navbar
        variant="home"
        actionLabel="New Session"
        actionHref={`/review/${shareableId}`}
        actionIcon={<IconPlus size={12} stroke={2.4} />}
      />

      <section className="border-b border-[#e9e5f0] bg-white">
        <div className="mx-auto flex h-[76px] w-full max-w-[1240px] items-center justify-between px-4 xl:px-0">
          <div className="flex items-center gap-4">
            <Link
              href={`/review/${shareableId}`}
              aria-label="Back"
              className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-[8px] text-[#111111]"
            >
              <IconChevronLeft size={34} stroke={1.8} />
            </Link>

            <div className="pt-[1px]">
              <h1 className="text-[27px] font-semibold leading-none text-[#111111]">{session.sessionName}</h1>
              <p className="mt-[4px] text-[14px] font-normal leading-none text-[#9a9a9a]">
                {session.projectName}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f9d8] px-4 py-2 text-[18px] font-medium text-[#90c500]">
            <span className="h-3 w-3 rounded-full bg-[#b9dd0b]" />
            active
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1240px] px-4 pb-[80px] pt-[41px] xl:px-0">
        <section className="rounded-[12px] bg-[#6f22f6] px-6 py-6 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-[22px] font-medium">Share this review</h2>
              <p className="mt-2 text-[14px] text-white/90">Send this link to clients to collect feedback</p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-[40px] items-center gap-2 rounded-[12px] bg-white px-4 text-[14px] font-medium text-[#6f22f6] transition hover:opacity-95"
            >
              <IconCopy size={18} stroke={1.8} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-5 rounded-[12px] bg-[#b787ff] px-6 py-4 text-[14px] text-white/90">
            {shareUrl}
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
          {feedbackStats.map((item) => (
            <StatCard key={item.title} title={item.title} value={item.value} icon={item.icon} tone={item.tone} />
          ))}
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium text-[#111111]">Selected Designs</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,392px)]">
            {session.designs.map((item, designIndex) => (
              <article
                key={item.id}
                className="flex h-[304px] w-full flex-col overflow-hidden rounded-[13px] border border-[#ece6f7] bg-white shadow-[0_16px_34px_rgba(26,15,54,0.12)]"
              >
                <div className="relative h-[232px] overflow-hidden bg-[#f7f2ff]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                  {(session.feedbackByDesign?.[item.id] ?? (designIndex === 0 ? session.feedback : [])).map((feedback, index) => (
                        <FeedbackBadge
                          key={feedback.id}
                          index={index}
                          x={feedback.x}
                          y={feedback.y}
                        />
                    ))}
                </div>
                <div className="px-4 py-4">
                  <h3 className="truncate text-[16px] font-semibold text-[#121212]">{item.name}</h3>
                  <p className="mt-1 text-[12px] text-[#8a8494]">Uploaded {item.uploadedAt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium text-[#111111]">Design Feedback</h2>
          <div className="mt-5 grid gap-5">
            {session.designs.map((item) => {
              const designFeedback = session.feedbackByDesign?.[item.id] ?? (item.id === design.id ? session.feedback : []);
              const orderedDesignFeedback = [...designFeedback].reverse();
              return (
                <article key={item.id} className="rounded-[16px] border border-[#e3d6ff] bg-white px-5 py-5 shadow-[0_8px_20px_rgba(26,15,54,0.06)]">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="truncate text-[18px] font-semibold text-[#111111]">{item.name}</h3>
                    <span className="text-[13px] text-[#7f7397]">{designFeedback.length} item{designFeedback.length === 1 ? "" : "s"}</span>
                  </div>
                  {orderedDesignFeedback.length === 0 ? (
                    <p className="mt-4 text-[13px] text-[#7f7397]">No feedback has been submitted for this design yet.</p>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {orderedDesignFeedback.map((itemFeedback, index) => (
                        <article key={itemFeedback.id} className="flex items-start justify-between gap-4 rounded-[14px] bg-[#faf7ff] px-4 py-3">
                          <div className="min-w-0"><div className="text-[13px] font-semibold text-[#6f2cf6]">Comment {index + 1}</div><p className="mt-1 text-[14px] leading-6 text-[#1a1722]">{itemFeedback.comment}</p></div>
                          <div className="shrink-0 text-right text-[11px] text-[#827896]"><div>{Math.round(itemFeedback.x * 100)}% x</div><div>{Math.round(itemFeedback.y * 100)}% y</div></div>
                        </article>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium text-[#111111]">Feedback Details</h2>

          {feedbackItems.length === 0 ? (
            <div className="mt-5 flex min-h-[335px] flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[#dccfff] bg-[#faf7ff] text-center">
              <AssetIcon src={infoCircleIcon} className="h-[52px] w-[52px]" />
              <h3 className="mt-5 text-[18px] font-medium text-[#111111]">No feedback yet</h3>
              <p className="mt-2 text-[12px] text-[#777]">Share the review link to start collecting feedback</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {feedbackItems.map((feedback, index) => (
                <article
                  key={feedback.id}
                  className="flex items-start justify-between gap-4 rounded-[16px] border border-[#e3d6ff] bg-[#faf7ff] px-5 py-4 shadow-[0_8px_20px_rgba(26,15,54,0.06)]"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium text-[#111111]">Feedback {index + 1}</div>
                    <p className="mt-1 text-[13px] leading-6 text-[#4d4d58]">{feedback.comment}</p>
                  </div>
                  <div className="shrink-0 text-right text-[12px] text-[#7b6f9b]">
                    <div>{Math.round(feedback.x * 100)}% x</div>
                    <div>{Math.round(feedback.y * 100)}% y</div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] font-medium text-[#111111]">Insights</h2>

          <div className="mt-5 rounded-[14px] border-2 border-[#d7c4ff] bg-[#faf7ff] px-8 py-6">
            <h3 className="text-[18px] font-semibold text-[#6f22f6]">Top Issues</h3>
            <p className="mt-4 text-[20px] font-normal text-[#8c8c8c]">No categorized feedback yet</p>
          </div>
        </section>
      </div>
    </main>
  );
}
