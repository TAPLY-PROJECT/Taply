import AssetIcon from "../shared/AssetIcon";
import fluentCheckBox from "../../public/Icon-assets/fluent_checkbox.svg";

const designerSteps = [
  "Upload your designs",
  "Create a review session",
  "Share the link with clients",
  "Receive organized feedback",
  "Analyze insights and patterns",
  "Resolve issues efficiently",
];

const clientSteps = [
  "Open the review link",
  "Tap anywhere on the design",
  "Select sentiment",
  "Choose issue category",
  "Add optional comments",
  "Done! No signup required",
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 mx-auto mt-16 max-w-[1110px] px-4 pb-14 sm:mt-24 sm:px-6 sm:pb-24 lg:px-0"
    >
      <div className="rounded-[12px] border border-[#ece6ff] bg-bg-subtle px-5 py-10 sm:px-8 sm:py-16">
        <h2 className="text-center text-[32px] font-semibold leading-tight text-[#22202a] sm:text-[40px]">
          How it works
        </h2>

        <div className="mx-auto mt-9 grid max-w-[860px] gap-10 sm:mt-12 sm:gap-16 md:grid-cols-2">
          <div>
            <h3 className="text-[18px] font-semibold text-[#22202a]">
              For Designers
            </h3>
            <ol className="mt-5 space-y-4">
              {designerSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-[14px] leading-6 text-[#77737f] sm:text-[15px]"
                >
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-[4px] bg-primary text-[10px] font-semibold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-[18px] font-semibold text-[#22202a]">
              For Clients
            </h3>
            <ol className="mt-5 space-y-4">
              {clientSteps.map((step) => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-[14px] leading-6 text-[#77737f] sm:text-[15px]"
                >
                  <AssetIcon src={fluentCheckBox} className="h-5 w-5 shrink-0" />
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
