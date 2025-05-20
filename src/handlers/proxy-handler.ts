import { Context } from "hono";
import { proxy } from "hono/proxy";

export async function proxyHandler(c: Context) {
  const href = c.req.query("__href");

  if (!href) {
    return c.json({ error: "Missing href parameter" }, 400);
  }

  return proxy(href, {
    ...c.req,
    headers: c.req.header(),
  });
}
