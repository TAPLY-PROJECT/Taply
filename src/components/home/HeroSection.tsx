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
    <section className="relative z-10 mx-auto flex max-w-[940px] flex-col items-center px-6 pb-16 pt-14 text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-5 py-2 text-[12px] font-semibold text-text-primary shadow-[0_0_0_1px_rgba(112,33,248,0.03)]">
        <AssetIcon src={ghost} className="h-[14px] w-[14px]" />
        For Designers
      </span>

      <h1 className="mt-10 max-w-[680px] text-[42px] font-semibold leading-[1.04] text-[#1f1d25] md:text-[56px]">
        <span className="block whitespace-nowrap">
          <span className="text-primary">Get clear feedback</span> without
        </span>
        <span className="block whitespace-nowrap">long explanations</span>
      </h1>

      <p className="mt-7 max-w-[640px] text-[15px] leading-[1.38] text-[#85828b] md:text-[16px]">
        Let your clients simply tap on your design and show exactly what they
        like or want to change - no confusion, no endless revisions.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/login"
          className="inline-flex h-[34px] items-center gap-2 rounded-[8px] bg-primary px-5 text-[13px] font-semibold !text-white shadow-[0_10px_24px_rgba(112,33,248,0.26)] transition hover:bg-primary-strong"
          style={{ color: "#ffffff" }}
        >
          Get Started
          <AssetIcon src={arrowRight} className="h-[12px] w-[12px]" />
        </Link>
        <button
          type="button"
          onClick={() => router.push("/how-it-works")}
          className="inline-flex h-[34px] items-center rounded-[8px] border border-[#d8d6de] bg-white px-5 text-[13px] font-semibold text-[#2a2830] transition hover:border-border-strong"
        >
          See How it works
        </button>
      </div>

      <SocialLinks />
    </section>
  );
}
