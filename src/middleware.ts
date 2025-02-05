import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const isAuthenticated = req.cookies.get("accessToken");
  const { pathname } = req.nextUrl;

  if (pathname === "/" && !isAuthenticated) return null;
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/onboarding/sign-in", req.url));
  }
  if (isAuthenticated && pathname === "/onboarding/sign-in") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
export const config = {
  matcher: ["/((?!api|onboarding|developers|security|about|privacy-policy|404|contact|terms-and-conditions|faq|static|.*\\..*|_next).*)"],
};

