export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sage-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export function json(body: unknown, status = 200): Response {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  );
}

export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }
  return null;
}
