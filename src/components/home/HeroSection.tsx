"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import AssetIcon from "../shared/AssetIcon";
import arrowRight from "../../public/Icon-assets/arrow-right.svg";
import ghost from "../../public/Icon-assets/ghost.svg";
import SocialLinks from "./SocialLinks";

export default function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative z-10 mx-auto flex max-w-[940px] flex-col items-center px-4 pb-12 pt-10 text-center sm:px-6 sm:pb-16 sm:pt-14">
      <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-[11px] font-semibold text-text-primary shadow-[0_0_0_1px_rgba(112,33,248,0.03)] sm:px-5 sm:text-[12px]">
        <AssetIcon src={ghost} className="h-[14px] w-[14px]" />
        For Designers
      </span>

      <h1 className="mt-8 max-w-[680px] text-[36px] font-semibold leading-[1.08] text-[#1f1d25] sm:mt-10 sm:text-[46px] md:text-[56px]">
        <span className="block">
          <span className="text-primary">Get clear feedback</span> without
        </span>
        <span className="block">long explanations</span>
      </h1>

      <p className="mt-6 max-w-[640px] text-[14px] leading-[1.5] text-[#85828b] sm:mt-7 sm:text-[16px]">
        Let your clients simply tap on your design and show exactly what they
        like or want to change - no confusion, no endless revisions.
      </p>

      <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-primary px-5 text-[13px] font-semibold !text-white shadow-[0_10px_24px_rgba(112,33,248,0.26)] transition hover:bg-primary-strong sm:h-[34px]"
          style={{ color: "#ffffff" }}
        >
          Get Started
          <AssetIcon src={arrowRight} className="h-[12px] w-[12px]" />
        </Link>
        <button
          type="button"
          onClick={() => router.push("/how-it-works")}
          className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[#d8d6de] bg-white px-5 text-[13px] font-semibold text-[#2a2830] transition hover:border-border-strong sm:h-[34px]"
        >
          See How it works
        </button>
      </div>

      <SocialLinks />
    </section>
  );
}
