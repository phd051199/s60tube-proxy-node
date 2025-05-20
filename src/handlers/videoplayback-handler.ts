import { Context } from "hono";
import { proxy } from "hono/proxy";
import { kvStore } from "../store";

export async function videoPlaybackHandler(c: Context) {
  const v = c.req.query("v");
  if (!v) {
    return c.json({ error: "Missing video parameter" }, 400);
  }

  const value = await kvStore.get(v);
  if (!value) {
    return c.json({ error: "Video not found" }, 404);
  }

  return proxy(value, {
    ...c.req,
    headers: c.req.header(),
  });
}
