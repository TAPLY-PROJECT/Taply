import type { Metadata } from "next";
import { DM_Mono, Inter } from "next/font/google";
import "./globals.css";
import appIcon from "../public/Taply assets/logotype.svg";
const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Taply",
  description: "Design feedback tool for fast client review sessions.",
  icons: {
    icon: appIcon.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
