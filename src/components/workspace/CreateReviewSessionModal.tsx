"use client";

import type { StoredReviewDesign } from "@/lib/review-session-storage";

type CreateReviewSessionModalProps = {
  open: boolean;
  onClose: () => void;
  designs: StoredReviewDesign[];
  sessionName: string;
  selectedDesignIds: string[];
  onSessionNameChange: (value: string) => void;
  onSelectedDesignIdsChange: (value: string[]) => void;
  onCreate: (payload: { sessionName: string; selectedDesignIds: string[] }) => void;
};

function SelectedBadge() {
  return (
    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#6f2cf6] text-[13px] font-bold leading-none text-white shadow-[0_8px_20px_rgba(111,44,246,0.26)]">
      ✓
    </span>
  );
}

function SessionDesignCard({
  design,
  selected,
  onToggle,
}: {
  design: StoredReviewDesign;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative overflow-hidden rounded-[14px] border-2 text-left transition ${
        selected
          ? "border-[#6f2cf6] shadow-[0_10px_24px_rgba(111,44,246,0.18)]"
          : "border-[#d9d1ea] hover:border-[#bfa5ff]"
      }`}
    >
      <div className="relative h-[124px] w-full bg-[#f7f2ff]">
        {/* We render uploaded previews with a plain img because the source is a runtime object URL. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={design.previewUrl} alt={design.name} className="h-full w-full object-cover" />

        {selected ? (
          <div className="absolute right-2 top-2">
            <SelectedBadge />
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#efe9fa] bg-white px-3 py-2">
        <div className="truncate text-[13px] font-medium text-[#121212]">{design.name}</div>
      </div>
    </button>
  );
}

export default function CreateReviewSessionModal({
  open,
  onClose,
  designs,
  sessionName,
  selectedDesignIds,
  onSessionNameChange,
  onSelectedDesignIdsChange,
  onCreate,
}: CreateReviewSessionModalProps) {
  if (!open) {
    return null;
  }

  const toggleDesign = (designId: string) => {
    onSelectedDesignIdsChange(
      selectedDesignIds.includes(designId)
        ? selectedDesignIds.filter((id) => id !== designId)
        : [...selectedDesignIds, designId],
    );
  };

  const handleCreate = () => {
    if (selectedDesignIds.length === 0) {
      return;
    }

    onCreate({
      sessionName: sessionName.trim(),
      selectedDesignIds,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(45,43,58,0.46)] px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-review-session-title"
        className="w-full max-w-[640px] overflow-hidden rounded-[14px] bg-white shadow-[0_20px_70px_rgba(14,8,32,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[#e9e3f4] px-8 py-7">
          <h3 id="create-review-session-title" className="text-[28px] font-semibold leading-none text-[#121212]">
            Create Review Session
          </h3>
        </div>

        <div className="px-8 py-7">
          <label className="block">
            <span className="mb-2 block text-[16px] font-medium text-[#141414]">Session Name</span>
            <input
              type="text"
              value={sessionName}
              onChange={(event) => onSessionNameChange(event.target.value)}
              placeholder="Client Review - round 1"
              className="h-[63px] w-full rounded-[13px] border border-[#d8c5ff] bg-[#f8f4ff] px-4 text-[15px] text-[#1a1722] outline-none placeholder:text-[#9a94a7] focus:border-[#b997ff]"
            />
          </label>

          <div className="mt-6">
            <div className="mb-3 text-[16px] font-medium text-[#141414]">
              Select Designs ({selectedDesignIds.length} selected)
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {designs.map((design) => (
                <SessionDesignCard
                  key={design.id}
                  design={design}
                  selected={selectedDesignIds.includes(design.id)}
                  onToggle={() => toggleDesign(design.id)}
                />
              ))}
            </div>

            {designs.length === 0 ? (
              <p className="mt-4 text-[12px] text-[#818181]">Upload at least one design to create a session.</p>
            ) : null}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-[49px] rounded-[11px] border border-[#e3dfe8] bg-white text-[21px] font-medium text-[#6f6b78] shadow-[0_1px_0_rgba(0,0,0,0.03)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={selectedDesignIds.length === 0}
              className="h-[49px] rounded-[11px] bg-[linear-gradient(180deg,#7d2df8_0%,#6c20f4_100%)] text-[21px] font-medium text-white shadow-[0_14px_24px_rgba(112,33,248,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
