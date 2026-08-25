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
      className={`relative z-10 mx-auto pb-0 ${
        isWorkspace
          ? "mt-[116px] max-w-[1230px] px-0"
          : "w-full max-w-none px-0 sm:max-w-[1225px] sm:px-6 lg:px-0"
      }`}
    >
      <div className="relative overflow-hidden">
        <Image
          src={footerShape}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full pt-2"
          priority
        />
        <div
          className="relative z-10 px-4 pb-6 pt-10 text-center font-sans sm:px-8 sm:pb-12 sm:pt-24"
          style={{ color: "var(--bg-subtle)" }}
        >
          <div className="absolute left-1/2 top-[18px] -translate-x-1/2">
            <AssetIcon
              src={arrowUp}
              alt="scroll to top"
              className="h-[20px] w-[20px]"
            />
          </div>

          {/* Developed by */}
          <p className="text-[10px] font-normal sm:text-[16px]">Developed by Mlue Code</p>
          <nav className="mt-6 hidden flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[14px] sm:mt-8 sm:flex sm:gap-12 sm:text-[16px]">
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
          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] sm:mt-20 sm:gap-6 sm:text-[16px]">
            <a
              href="/terms"
              className="font-normal transition-opacity hover:opacity-80"
            >
              Terms &amp; Conditions
            </a>
            <span aria-hidden>•</span>
            <a
              href="/privacy"
              className="font-normal transition-opacity hover:opacity-80"
            >
              Privacy policy
            </a>
            <span aria-hidden>•</span>
            <a
              href="/licenses"
              className="font-normal transition-opacity hover:opacity-80"
            >
              Licenses
            </a>
          </nav>

          {/* Copyright */}
          <p className="mt-8 text-[10px] font-normal tracking-[0.04em] sm:mt-4 sm:text-[16px] sm:tracking-[0.07em]">
            © 2026 Taply All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
