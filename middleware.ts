import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function handles redirects before auth middleware runs
function handleRedirects(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  
  // Redirect from root to store page
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/store", request.url));
  }
  
  // Redirect from old auth routes to new Clerk auth routes
  if (pathname.startsWith("/auth/login")) {
    const returnUrl = nextUrl.searchParams.get("returnUrl");
    const redirectUrl = new URL("/sign-in", request.url);
    if (returnUrl) {
      redirectUrl.searchParams.set("redirect_url", returnUrl);
    }
    return NextResponse.redirect(redirectUrl);
  }
  
  if (pathname.startsWith("/auth/register")) {
    const returnUrl = nextUrl.searchParams.get("returnUrl");
    const redirectUrl = new URL("/sign-up", request.url);
    if (returnUrl) {
      redirectUrl.searchParams.set("redirect_url", returnUrl);
    }
    return NextResponse.redirect(redirectUrl);
  }
  
  return null; // No redirect needed
}

// This runs before the Clerk auth middleware
export function middleware(request: NextRequest) {
  // Check for redirects first
  const redirectResponse = handleRedirects(request);
  if (redirectResponse) return redirectResponse;
  
  // Continue to the next middleware
  return NextResponse.next();
}

// Apply Clerk middleware to all routes
export const config = {
  matcher: [
    "/((?!.*\..*|_next/static|_next/image|favicon.ico).*)",
    "/",
    "/api/:path*",
  ],
};
