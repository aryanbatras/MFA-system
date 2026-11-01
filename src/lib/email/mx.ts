import { resolve4, resolve6, resolveMx } from "node:dns/promises";
import { domainToASCII } from "node:url";

export type EmailDomainStatus = "deliverable" | "undeliverable" | "unknown";

const DNS_TIMEOUT_MS = 2500;
const CACHE_LIMIT = 500;
const CACHE_TTL_MS: Record<EmailDomainStatus, number> = {
  deliverable: 10 * 60 * 1000,
  undeliverable: 5 * 60 * 1000,
  unknown: 60 * 1000,
};

type CacheEntry = {
  status: EmailDomainStatus;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const NO_RECORD_CODES = new Set(["ENODATA", "ENOTFOUND"]);

/**
 * Check whether a recipient domain can accept mail.
 *
 * MX records are authoritative. Per RFC 5321, a domain with no MX records may
 * still accept mail through an A/AAAA record, so that fallback is checked
 * before declaring the domain undeliverable. A null MX (`0 .`) explicitly
 * refuses mail.
 *
 * Transient DNS failures return `unknown` so the caller can fail open. The
 * check is a deliverability aid, not a security boundary.
 */
export async function checkEmailDomain(
  email: string,
): Promise<EmailDomainStatus> {
  const domain = extractDomain(email);
  if (!domain) return "undeliverable";

  const cached = cache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.status;
  }

  const status = await resolveDomain(domain);

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  cache.set(domain, {
    status,
    expiresAt: Date.now() + CACHE_TTL_MS[status],
  });

  return status;
}

function extractDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;

  const raw = email
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  if (!raw) return null;

  const ascii = domainToASCII(raw);
  if (!ascii || ascii.length > 253 || !ascii.includes(".")) return null;

  return ascii;
}

async function resolveDomain(domain: string): Promise<EmailDomainStatus> {
  const mx = await settle(resolveMx(domain));

  if (mx === "timeout") return "unknown";

  if (mx.ok) {
    if (mx.value.length === 0) return checkAddressFallback(domain);

    const hasUsableExchange = mx.value.some(({ exchange }) => {
      const host = exchange.trim();
      return host.length > 0 && host !== ".";
    });

    return hasUsableExchange ? "deliverable" : "undeliverable";
  }

  if (isDnsCode(mx.error, NO_RECORD_CODES)) {
    return checkAddressFallback(domain);
  }

  return "unknown";
}

async function checkAddressFallback(
  domain: string,
): Promise<EmailDomainStatus> {
  const [a, aaaa] = await Promise.all([
    settle(resolve4(domain)),
    settle(resolve6(domain)),
  ]);

  if (a === "timeout" || aaaa === "timeout") return "unknown";

  if (a.ok && a.value.length > 0) return "deliverable";
  if (aaaa.ok && aaaa.value.length > 0) return "deliverable";

  const aMissing =
    (a.ok && a.value.length === 0) ||
    (!a.ok && isDnsCode(a.error, NO_RECORD_CODES));
  const aaaaMissing =
    (aaaa.ok && aaaa.value.length === 0) ||
    (!aaaa.ok && isDnsCode(aaaa.error, NO_RECORD_CODES));

  if (aMissing && aaaaMissing) return "undeliverable";

  return "unknown";
}

type Settled<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown }
  | "timeout";

async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), DNS_TIMEOUT_MS);
  });

  try {
    return await Promise.race([
      promise
        .then((value) => ({ ok: true as const, value }))
        .catch((error) => ({ ok: false as const, error })),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isDnsCode(error: unknown, codes: Set<string>): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    typeof (error as { code?: unknown }).code !== "string"
  ) {
    return false;
  }

  return codes.has((error as { code: string }).code);
}
