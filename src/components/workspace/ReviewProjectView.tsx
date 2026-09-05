"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import Navbar from "@/components/layout/Navbar";
import AssetIcon from "@/components/shared/AssetIcon";
import ProjectHeaderBar from "@/components/workspace/ProjectHeaderBar";
import ProjectStats from "@/components/workspace/ProjectStats";
import CreateReviewSessionModal from "@/components/workspace/CreateReviewSessionModal";
import UploadDesignModal from "@/components/workspace/UploadDesignModal";
import { usePersistentState } from "@/hooks/usePersistentState";
import { getValidIdToken } from "@/lib/firebase-client";
import { getDevIdToken } from "@/lib/dev-auth";
import { writeStoredReviewSession } from "@/lib/review-session-storage";
import { useWorkspaceProjects } from "@/hooks/useWorkspaceProjects";
import { useWorkspaceSessions } from "@/hooks/useWorkspaceSessions";
import { useStoredReviewSessions } from "@/hooks/useStoredReviewSessions";

import imageIcon from "../../public/Icon-assets/image.svg";
import clipboardTextIcon from "../../public/Icon-assets/clipboard-text.svg";
import directSendIcon from "../../public/Icon-assets/direct-send.svg";
import sendIcon from "../../public/Icon-assets/send.svg";
import messageRemoveIcon from "../../public/Icon-assets/message-remove.svg";
import reviewSessionIcon from "../../public/Icon-assets/review session.svg";

type ReviewProjectViewProps = {
  projectId: string;
  projectName: string;
  projectDescription: string;
};

export type DesignItem = {
  id: string;
  shareableId: string;
  name: string;
  uploadedAt: string;
  previewUrl: string;
  imageUrl: string;
};

function formatUploadedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `session-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function DesignCard({
  design,
  onRemove,
}: {
  design: DesignItem;
  onRemove: () => void;
}) {
  return (
    <article className="flex h-[304px] w-[392px] flex-col overflow-hidden rounded-[13px] border border-[#ece6f7] bg-white shadow-[0_16px_34px_rgba(26,15,54,0.12)]">
      <div className="relative h-[232px] overflow-hidden bg-[#f7f2ff]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={design.previewUrl}
          alt={design.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold text-[#121212]">
            {design.name}
          </h3>
          <p className="mt-1 text-[12px] text-[#8a8494]">
            Uploaded {design.uploadedAt}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex shrink-0 items-center gap-0.5 text-[#ff3a32] transition hover:opacity-80"
        >
          <IconTrash size={12} stroke={2} />
          <span style={{ fontSize: "11px", fontWeight: 500 }}>Remove</span>
        </button>
      </div>
    </article>
  );
}

export default function ReviewProjectView({
  projectId,
  projectName,
  projectDescription,
}: ReviewProjectViewProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [uploadModalKey, setUploadModalKey] = useState(0);
  const [sessionName, setSessionName] = useState("");
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>([]);
  const { value: designs, setValue: setDesigns } = usePersistentState<
    DesignItem[]
  >(`taply-project-designs:${projectId}`, []);
  const router = useRouter();
  const { addSession, sessions } = useWorkspaceSessions();
  const { sessions: storedReviewSessions } = useStoredReviewSessions();
  const { removeProjectBySlug } = useWorkspaceProjects();
  const projectSessions = sessions.filter(
    (session) => session.projectName === projectName,
  );
  const projectFeedbackCount = storedReviewSessions
    .filter((session) => session.projectName === projectName)
    .reduce((count, session) => count + session.feedback.length, 0);

  const stats = [
    {
      label: "Designs",
      value: String(designs.length),
      icon: imageIcon,
    },
    {
      label: "Review Sessions",
      value: String(projectSessions.length),
      icon: clipboardTextIcon,
      iconClassName: "opacity-50 grayscale",
    },
    {
      label: "Unresolved Feedback",
      value: String(projectFeedbackCount),
      icon: messageRemoveIcon,
    },
  ];

  const openUploadModal = () => {
    setUploadModalKey((current) => current + 1);
    setIsUploadModalOpen(true);
  };

  const openSessionModal = () => {
    if (designs.length === 0) return;
    setSessionName("");
    setSelectedDesignIds([designs[0].id]);
    setIsSessionModalOpen(true);
  };

  const handleCreateSession = ({
    sessionName: nextSessionName,
    selectedDesignIds: nextSelectedDesignIds,
  }: {
    sessionName: string;
    selectedDesignIds: string[];
  }) => {
    const selectedDesigns = designs.filter((design) =>
      nextSelectedDesignIds.includes(design.id),
    );
    const primaryDesign = selectedDesigns[0];
    if (!primaryDesign) return;

    const shareableId = primaryDesign.shareableId;
    const payload = {
      shareableId,
      sessionId: makeId(),
      sessionName: nextSessionName.trim() || "Client Review - round 1",
      projectName,
      projectDescription,
      selectedDesignIds: nextSelectedDesignIds,
      designs: selectedDesigns,
      feedback: [],
    };

    writeStoredReviewSession(payload);
    addSession({
      shareableId,
      sessionName: payload.sessionName,
      projectName,
      projectDescription,
      selectedDesignIds: nextSelectedDesignIds,
    });

    setIsSessionModalOpen(false);
    router.push(
      `/review/${shareableId}?view=session&name=${encodeURIComponent(
        payload.projectName,
      )}&description=${encodeURIComponent(
        payload.projectDescription,
      )}&sessionName=${encodeURIComponent(payload.sessionName)}`,
    );
  };

  const handleUploadDesign = async ({
    name,
    file,
  }: {
    name: string;
    file: File;
  }) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", name.trim() || stripExtension(file.name));

      let token = await getValidIdToken();
      if (!token && process.env.NODE_ENV !== "production") {
        token = await getDevIdToken();
      }

      if (!token) {
        throw new Error("Authentication session expired. Please log in again.");
      }

      const response = await fetch("/api/designs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || "Failed to upload design");
      }

      setDesigns((current) => [
        {
          id: result.id,
          shareableId: result.shareableId,
          name: name.trim() || stripExtension(file.name),
          uploadedAt: formatUploadedAt(new Date(result.createdAt)),
          previewUrl: result.imageUrl,
          imageUrl: result.imageUrl,
        },
        ...current,
      ]);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Upload failed. Please check your network and configuration.",
      );
    }
  };

  const handleRemoveDesign = (id: string) => {
    setDesigns((current) => current.filter((design) => design.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#fbfbff] text-[#1c1340]">
      <Navbar variant="project" />
      <ProjectHeaderBar
        title={projectName}
        description={projectDescription}
        onDelete={() => {
          const confirmed = window.confirm(
            `Delete project "${projectName}"? This will remove its saved designs and sessions.`,
          );
          if (!confirmed) return;

          removeProjectBySlug(projectId);
          router.push("/workspace");
        }}
      />

      <div className="mx-auto w-full max-w-[1110px] px-4 pt-[65px] pb-[120px] xl:px-0">
        <ProjectStats stats={stats} />

        <section className="mt-[72px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[20px] font-medium text-[#0f0f16]">Designs</h2>

            {designs.length > 0 ? (
              <button
                type="button"
                onClick={openUploadModal}
                className="inline-flex h-[44px] items-center gap-2 rounded-[11px] bg-[linear-gradient(180deg,#7a2bf8_0%,#6d20f5_100%)] px-[20px] text-[13px] font-semibold text-white transition hover:opacity-95"
              >
                <AssetIcon src={sendIcon} className="h-[20px] w-[20px]" />
                <span>Upload Design</span>
              </button>
            ) : null}
          </div>

          {designs.length === 0 ? (
            <div className="mt-[18px] rounded-[13px] border-[2px] border-dashed border-[#7c43ff]/90 bg-[linear-gradient(180deg,rgba(250,248,255,0.98),rgba(248,244,255,0.98))]">
              <div className="flex min-h-[302px] flex-col items-center justify-center rounded-[11px] text-center">
                <div className="mb-[10px] flex h-[58px] w-[58px] items-center justify-center rounded-[14px]">
                  <AssetIcon
                    src={directSendIcon}
                    className="h-[60px] w-[60px]"
                  />
                </div>
                <h3 className="m-0 text-[16px] font-medium text-[#121212]">
                  No designs yet
                </h3>
                <p className="mt-2.5 max-w-[290px] text-[11px] text-[#818181]">
                  Upload your first design to get started
                </p>
                <button
                  type="button"
                  onClick={openUploadModal}
                  className="mt-[27px] inline-flex h-[44px] items-center gap-2 rounded-[11px] bg-[linear-gradient(180deg,#7d2df8_0%,#6c20f4_100%)] px-[22px] text-[14px] font-semibold text-white"
                >
                  <AssetIcon src={sendIcon} className="h-[24px] w-[24px]" />
                  <span>Upload Design</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-[26px] grid gap-5 sm:grid-cols-2 xl:justify-start xl:[grid-template-columns:repeat(auto-fit,392px)]">
              {designs.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onRemove={() => handleRemoveDesign(design.id)}
                />
              ))}

              <button
                type="button"
                onClick={openUploadModal}
                className="flex h-[304px] w-[392px] items-center justify-center rounded-[13px] border-[2px] border-dashed border-[#b892ff] bg-[#f7f2ff] transition hover:border-[#8e57ff] hover:bg-[#f4edff]"
                aria-label="Add design"
              >
                <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#6c25f5] text-white">
                  <IconPlus size={34} stroke={2.2} />
                </span>
              </button>
            </div>
          )}
        </section>

        <section className="mt-[72px]">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[20px] font-medium text-[#0f0f16]">
              Review Sessions
            </h2>
            <button
              type="button"
              onClick={openSessionModal}
              disabled={designs.length === 0}
              className="inline-flex h-[44px] items-center gap-2 rounded-[11px] bg-[linear-gradient(180deg,#7a2bf8_0%,#6d20f5_100%)] px-[20px] text-[13px] font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconPlus size={16} stroke={2.2} />
              <span>Create Session</span>
            </button>
          </div>

          {projectSessions.length === 0 ? (
            <div className="mt-[18px] rounded-[13px] border-[2px] border-dashed border-[#7c43ff]/90 bg-[#faf8ff]">
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[11px] text-center">
                <AssetIcon
                  src={reviewSessionIcon}
                  className="h-[58px] w-[58px] opacity-70"
                />
                <h3 className="mt-3 text-[16px] font-medium text-[#121212]">
                  No review sessions
                </h3>
                <p className="mt-2.5 max-w-[290px] text-[11px] text-[#818181]">
                  Upload designs first to create a review session
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-[18px] grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projectSessions.map((session) => (
                <button
                  key={`${session.shareableId}-${session.createdAt}`}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/review/${session.shareableId}?view=session&name=${encodeURIComponent(
                        projectName,
                      )}&description=${encodeURIComponent(
                        projectDescription,
                      )}&sessionName=${encodeURIComponent(session.sessionName)}`,
                    )
                  }
                  className="rounded-[13px] border border-[#e5daf8] bg-white p-5 text-left shadow-[0_10px_24px_rgba(26,15,54,0.06)] transition hover:-translate-y-0.5 hover:border-[#b892ff]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate text-[16px] font-semibold text-[#17131f]">
                      {session.sessionName}
                    </h3>
                    <span className="shrink-0 rounded-full bg-[#f1eaff] px-2 py-1 text-[10px] font-medium text-[#6f2cf6]">
                      Open
                    </span>
                  </div>
                  <p className="mt-3 text-[12px] text-[#827896]">
                    {session.selectedDesignIds.length} design
                    {session.selectedDesignIds.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#aaa2b5]">
                    Created{" "}
                    {new Date(session.createdAt).toLocaleDateString("en-US")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <CreateReviewSessionModal
        open={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        designs={designs}
        sessionName={sessionName}
        selectedDesignIds={selectedDesignIds}
        onSessionNameChange={setSessionName}
        onSelectedDesignIdsChange={setSelectedDesignIds}
        onCreate={handleCreateSession}
      />

      <UploadDesignModal
        key={uploadModalKey}
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadDesign}
      />
    </main>
  );
}
