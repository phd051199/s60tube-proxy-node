import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { storeHandler } from "./handlers/kv-handler";
import { proxyHandler } from "./handlers/proxy-handler";
import { streamHandler } from "./handlers/watch-handler";

const app = new Hono();

app.use(cors());
app.post("/kv", storeHandler);
app.get("/videoplayback", streamHandler);
app.all("*", proxyHandler);

serve({ fetch: app.fetch });
