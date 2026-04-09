import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// No auth required — all routes are public.
// Clerk and Supabase are not configured; this middleware is a simple passthrough.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
