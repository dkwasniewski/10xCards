import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/logout
 * Logs out the current user by invalidating their session
 * 
 * This implementation directly clears cookies without calling Supabase's signOut()
 * to avoid potential network requests that can hang the response.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  // Parse cookies from the request header to find all Supabase auth cookies
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookiePairs = cookieHeader.split(";").map((c) => c.trim());
  
  // Delete all Supabase auth cookies
  for (const pair of cookiePairs) {
    const [name] = pair.split("=");
    if (name && (name.includes("sb-") || name.includes("auth"))) {
      cookies.delete(name, { path: "/" });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

