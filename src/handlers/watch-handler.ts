import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { kvStore } from "../utils/store";

export async function streamHandler(c: Context) {
  const videoId = c.req.query("v");

  if (!videoId) {
    return c.json({ error: "Missing video ID" }, 400);
  }

  const videoUrl = kvStore.get(videoId);

  if (!videoUrl) {
    throw new HTTPException(404, { message: "Video not found" });
  }

  return fetch(videoUrl, {
    headers: c.req.header(),
  });
}
