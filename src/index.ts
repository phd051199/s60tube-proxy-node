import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { storeHandler } from "./handlers/kv-handler";
import { proxyHandler } from "./handlers/proxy-handler";
import { videoPlaybackHandler } from "./handlers/videoplayback-handler";

const app = new Hono();

app.use(cors());

app.post("/kv", storeHandler);
app.get("/videoplayback", videoPlaybackHandler);
app.all("/proxy", proxyHandler);

serve({
  fetch: app.fetch,
});
