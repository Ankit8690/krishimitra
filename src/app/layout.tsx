import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/i18n/I18nProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoDev = Noto_Sans_Devanagari({
  variable: "--font-noto-dev",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KrishiMitra — Smart farming for every farmer",
  description:
    "Weather, mandi prices, disease detection and AI advice in Hindi, Punjabi and English.",
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#2e7d32",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoDev.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-ink">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
