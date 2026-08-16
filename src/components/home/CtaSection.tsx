import Link from "next/link";
import AssetIcon from "../shared/AssetIcon";
import arrowRight from "../../public/Icon-assets/arrow-right.svg";
import logo from "../../public/Taply assets/main logo.svg";

export default function CtaSection() {
  return (
    <section className="relative z-10 mt-20 overflow-visible py-12 text-center sm:mt-32 sm:py-20">
      <div className="relative z-10 flex flex-col items-center px-6">
        <AssetIcon src={logo} alt="Taply" className="h-10 w-auto" />

        <h2 className="mt-6 max-w-[820px] text-[30px] font-semibold leading-tight text-[#1f1d25] sm:mt-7 sm:text-[42px]">
          Ready to collect better feedback?
        </h2>

        <p className="mt-4 max-w-[760px] text-[15px] leading-[1.5] text-[#7a7683] sm:text-[18px]">
          Join designers who are getting precise, actionable feedback from their
          clients
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex h-[34px] items-center gap-2 rounded-[8px] bg-primary px-6 text-[13px] font-semibold text-white"
          style={{ color: "#ffffff" }}
        >
          Start for free
          <AssetIcon src={arrowRight} className="h-[12px] w-[12px]" />
        </Link>
      </div>
    </section>
  );
}
