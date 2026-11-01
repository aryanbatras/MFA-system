import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Read the current session in a server component. A database outage should
 * degrade to "signed out" rather than crashing the whole route. Next.js
 * control-flow errors (dynamic rendering, redirects) are rethrown.
 */
export async function getServerSession() {
  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] Could not read the server session:", error);
    return null;
  }
}
