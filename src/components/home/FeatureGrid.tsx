import AssetIcon from "../shared/AssetIcon";
import profileUser from "../../public/Icon-assets/profile-2user.svg";
import diagram from "../../public/Icon-assets/diagram.svg";
import link from "../../public/Icon-assets/link.svg";

const features = [
  {
    title: "Direct Interaction",
    description:
      "Clients tap directly on designs to leave feedback. No more vague comments or confusing screenshots.",
    icon: profileUser,
    iconAlt: "",
    tone: "violet",
  },
  {
    title: "Smart Analytics",
    description:
      "Automatically categorize feedback, identify patterns, and spot the most critical issues.",
    icon: diagram,
    iconAlt: "",
    tone: "lime",
  },
  {
    title: "Simple Sharing",
    description:
      "Generate review links in seconds. No login required for clients. Works on any device.",
    icon: link,
    iconAlt: "",
    tone: "yellow",
  },
] as const;

export default function FeatureGrid() {
  return (
    <section className="relative z-10 mx-auto grid max-w-[1110px] gap-4 px-4 sm:gap-5 sm:px-6 md:grid-cols-3 lg:px-0">
      {features.map((feature) => {
        const iconClass =
          feature.tone === "violet"
            ? "bg-violet-100 text-primary"
            : feature.tone === "lime"
              ? "bg-lime-200 text-lime-900"
              : "bg-[#ffd200] text-[#7a5a00]";

        return (
          <article
            key={feature.title}
            className="rounded-[14px] border border-[#e5dbff] bg-[#fcfbff] p-5 shadow-[0_10px_22px_rgba(67,40,130,0.045)] sm:p-6"
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-[8px] ${iconClass}`}
            >
              <AssetIcon
                src={feature.icon}
                alt={feature.iconAlt}
                className="h-[21px] w-[21px]"
              />
            </span>
            <h2 className="mt-5 text-[21px] font-semibold leading-tight text-[#22202a] sm:text-[23px]">
              {feature.title}
            </h2>
            <p className="mt-3 max-w-none text-[14px] leading-[1.45] text-[#77737f] sm:max-w-[280px] sm:text-[15px]">
              {feature.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
