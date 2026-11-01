import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MFA System — Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: Form panel */}
      <div className="flex-1 flex flex-col min-h-screen lg:max-w-[520px] border-r border-zinc-100">
        {/* Top bar */}
        <div className="px-10 pt-8 pb-0">
          <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-zinc-400 select-none">
            MFA System
          </span>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-10 py-16">
          <div className="w-full max-w-[360px]">{children}</div>
        </div>

        {/* Bottom bar */}
        <div className="px-10 pb-8 pt-0">
          <p className="text-[11px] text-zinc-300 tracking-wide">
            Built with IBM Bob
          </p>
        </div>
      </div>

      {/* Right: Visual panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-zinc-950 p-14 relative overflow-hidden">
        {/* Background image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-transparent to-zinc-950/90" />

        {/* Content */}
        <div className="relative z-10">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/60" />
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[13px] font-medium text-white/30 tracking-[0.08em] uppercase mb-6">
            Enterprise Security
          </p>
          <blockquote className="text-white text-[32px] font-light leading-[1.25] tracking-[-0.02em] max-w-md">
            Security is not a product,<br />
            but a process.
          </blockquote>
          <p className="mt-5 text-white/35 text-[13px]">
            — Bruce Schneier
          </p>
        </div>
      </div>
    </div>
  );
}
