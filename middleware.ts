import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { jwtVerify } from "jose";

const CUSTOMER_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-dev-only"
);

async function getCustomerFromCookie(req: NextRequest) {
  const token = req.cookies.get("customer-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, CUSTOMER_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginPage = pathname === "/login";
  const isCustomerProtected = ["/carrinho", "/checkout", "/minha-conta"].some((p) => pathname.startsWith(p));
  const isCustomerAuthPage = ["/conta/login", "/conta/cadastro"].includes(pathname);

  // --- ADMIN AUTH (NextAuth) ---
  if (isAdminRoute || isAdminLoginPage) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });
    const tokenFallback =
      token ??
      (await getToken({
        req,
        secret: process.env.AUTH_SECRET,
        cookieName: "authjs.session-token",
      }));

    const isLoggedIn = !!tokenFallback;

    if (isAdminRoute && !isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminLoginPage && isLoggedIn) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // --- CUSTOMER AUTH (JWT custom) ---
  if (isCustomerProtected) {
    const customer = await getCustomerFromCookie(req);
    if (!customer) {
      const loginUrl = new URL("/conta/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isCustomerAuthPage) {
    const customer = await getCustomerFromCookie(req);
    if (customer) {
      return NextResponse.redirect(new URL("/produtos", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/carrinho",
    "/checkout/:path*",
    "/minha-conta/:path*",
    "/conta/login",
    "/conta/cadastro",
  ],
};
