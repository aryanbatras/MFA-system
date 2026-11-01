import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MFA System — Secure Authentication",
  description: "Enterprise-grade multi-factor authentication built with Next.js, Better Auth, and Turso Cloud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
