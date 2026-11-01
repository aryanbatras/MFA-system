import Image from "next/image";
import { getAuthPhoto } from "@/lib/pexels";
import { Logo } from "@/components/logo";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const photo = await getAuthPhoto();

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[minmax(0,600px)_1fr]">
      <div className="flex min-h-dvh flex-col lg:border-r lg:border-zinc-200">
        <header className="px-6 pt-8 sm:px-12 lg:px-14">
          <Logo />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:justify-start lg:px-14">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>

        <footer className="flex items-center justify-between gap-4 px-6 pb-8 sm:px-12 lg:px-14">
          <p className="text-[12px] text-zinc-500">Built with IBM Bob</p>
          <p className="text-[12px] text-zinc-400">
            Email code + authenticator app
          </p>
        </footer>
      </div>

      <aside className="relative hidden min-h-dvh overflow-hidden bg-zinc-100 lg:block">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover grayscale"
        />

        <div className="absolute left-8 top-8 border border-zinc-200 bg-white px-3 py-2 text-[12px] font-medium text-zinc-950">
          Passwordless access. TOTP protected.
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-white px-8 py-6">
          <div className="flex items-end justify-between gap-8">
            <div>
              <p className="text-[13px] font-medium text-zinc-950">
                Spiral staircase, Nuremberg
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">
                Photograph by{" "}
                <a
                  href={photo.photographerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {photo.photographer}
                </a>{" "}
                on{" "}
                <a
                  href={photo.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Pexels
                </a>
              </p>
            </div>
            <p className="shrink-0 text-[12px] text-zinc-400">MFA System</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
