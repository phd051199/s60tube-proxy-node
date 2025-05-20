import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { createSafeHeaders } from "../utils/response";

export async function proxyHandler(c: Context) {
  const url = new URL(c.req.url);
  const origin = c.req.header("origin");

  if (!url.searchParams.has("__host")) {
    return c.json({ error: "Missing host parameter" }, 400);
  }

  try {
    const targetUrl = url.searchParams.get("__host") || "";
    if (!targetUrl) {
      return c.json({ error: "Invalid host parameter" }, 400);
    }

    const body = c.req.method !== "GET" && c.req.method !== "HEAD"
      ? await c.req.raw.arrayBuffer()
      : undefined;

    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: c.req.header(),
      body,
    });

    const headers = createSafeHeaders(response.headers, origin);
    const responseData = await response.arrayBuffer();

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    throw new HTTPException(502, { message: "Error proxying request" });
  }
}
