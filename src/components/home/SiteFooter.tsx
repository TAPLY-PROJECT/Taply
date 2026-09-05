import Image from "next/image";
import AssetIcon from "../shared/AssetIcon";
import arrowUp from "../../public/Icon-assets/arrow-up.svg";
import footerShape from "../../public/Icon-assets/footer-shape.svg";

type SiteFooterProps = {
  variant?: "home" | "workspace";
};

export default function SiteFooter({ variant = "home" }: SiteFooterProps) {
  const isWorkspace = variant === "workspace";

  return (
    <footer
      className={`relative z-10 mx-auto w-full pb-0 ${
        isWorkspace
          ? "mt-[80px] max-w-[1230px] px-4 sm:mt-[116px] sm:px-0"
          : "mt-[60px] max-w-[1225px] px-4 sm:mt-[80px] sm:px-6 lg:px-0"
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={footerShape}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 top-2 h-[calc(100%-8px)] w-full object-cover object-top"
          style={{ width: "100%", height: "auto", minHeight: "100%" }}
          priority
        />

        {/* Content sits above the shape */}
        <div
          className="relative z-10 px-4 pb-8 pt-16 text-center font-sans sm:px-8 sm:pb-12 sm:pt-24"
          style={{ color: "var(--bg-subtle)" }}
        >
          {/* Scroll affordance (same as Figma) */}
          <div className="absolute left-1/2 top-[14px] -translate-x-1/2 sm:top-[18px]">
            <AssetIcon
              src={arrowUp}
              alt="scroll to top"
              className="h-[18px] w-[18px] sm:h-[20px] sm:w-[20px]"
            />
          </div>

          {/* Developed by */}
          <p className="text-[14px] font-normal sm:text-[16px]">
            Developed by Mlue Code
          </p>

          {/* Main nav */}
          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[14px] sm:mt-8 sm:gap-12 sm:text-[16px]">
            <a
              href="#about"
              className="font-semibold transition-opacity hover:opacity-80"
            >
              About
            </a>
            <a
              href="#services"
              className="font-semibold transition-opacity hover:opacity-80"
            >
              Other services
            </a>
            <a
              href="#support"
              className="font-semibold transition-opacity hover:opacity-80"
            >
              Support
            </a>
            <a
              href="#contact"
              className="font-semibold transition-opacity hover:opacity-80"
            >
              Contact us
            </a>
          </nav>

          {/* Legal nav */}
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] sm:mt-20 sm:gap-6 sm:text-[16px]">
            <a
              href="/terms"
              className="font-normal transition-opacity hover:opacity-80"
            >
              Terms &amp; Conditions
            </a>
            <span aria-hidden className="opacity-80">
              |
            </span>
            <a
              href="/privacy"
              className="font-normal transition-opacity hover:opacity-80"
            >
              Privacy policy
            </a>
            <span aria-hidden className="opacity-80">
              |
            </span>
            <a
              href="/licenses"
              className="font-normal transition-opacity hover:opacity-80"
            >
              Licenses
            </a>
          </nav>

          {/* Copyright — keep visible, never clipped */}
          <p className="mt-4 pb-1 text-[12px] font-normal tracking-[0.07em] sm:text-[16px]">
            © 2026 Taply All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
