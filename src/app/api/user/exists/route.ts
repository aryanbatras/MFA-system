import { createClient } from "@libsql/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ exists: false }, { status: 400 });
    }

    const db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });

    const result = await db.execute({
      sql: `SELECT id FROM "user" WHERE email = ? LIMIT 1`,
      args: [email.trim().toLowerCase()],
    });

    return NextResponse.json({ exists: result.rows.length > 0 });
  } catch {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
