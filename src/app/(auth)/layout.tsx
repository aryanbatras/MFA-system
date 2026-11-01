import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "MFA System — Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-between px-8 py-10 sm:px-12 lg:px-16 xl:px-20 max-w-[560px]">
        {/* Logo / Wordmark */}
        <div>
          <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-zinc-400 select-none">
            MFA System
          </span>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        {/* Footer */}
        <p className="text-[12px] text-zinc-400">
          Built with IBM Bob &mdash; Enterprise Authentication
        </p>
      </div>

      {/* Right panel — photo */}
      <div className="hidden lg:block flex-1 relative bg-zinc-900">
        <Image
          src="https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Secure enterprise workspace"
          fill
          className="object-cover opacity-60"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 via-zinc-900/40 to-zinc-900/70" />
        <div className="absolute bottom-10 left-10 right-10">
          <blockquote className="text-white/90 text-[28px] font-light leading-[1.3] tracking-[-0.02em]">
            Security is not a product,<br />
            but a process.
          </blockquote>
          <p className="mt-4 text-white/40 text-[13px] tracking-wide uppercase">
            Bruce Schneier
          </p>
        </div>
      </div>
    </div>
  );
}
