import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MFA System — Secure Authentication",
  description:
    "Enterprise-grade multi-factor authentication built with Next.js, Better Auth, and Turso Cloud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body
        style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
        className="antialiased bg-white text-zinc-900"
      >
        {children}
      </body>
    </html>
  );
}
