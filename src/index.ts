import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";
import { storeHandler } from "./handlers/kv-handler";
import { kvStore } from "./store";

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
  return c.json({
    status: "ok",
  });
});

app.post("/kv", storeHandler);

app.get("/videoplayback", (c) => {
  const v = c.req.query("v");
  if (!v) {
    return c.json({ error: "Missing video parameter" }, 400);
  }

  const value = kvStore.get(v);
  if (!value) {
    return c.json({ error: "Video not found" }, 404);
  }

  return proxy(value, {
    ...c.req,
    headers: c.req.header(),
  });
});

app.all("/proxy", async (c) => {
  const href = c.req.query("__href");

  if (!href) {
    return c.json({ error: "Missing href parameter" }, 400);
  }

  return proxy(href, {
    ...c.req,
    headers: c.req.header(),
  });
});

serve({
  fetch: app.fetch,
});
