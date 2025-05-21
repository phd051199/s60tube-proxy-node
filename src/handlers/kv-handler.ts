import { Context } from "hono";
import { kvStore } from "../store";

interface StoreRequest {
  key: string;
  value: string;
}

export async function createHandler(c: Context) {
  try {
    const data = (await c.req.json()) as StoreRequest;

    if (!data.key) {
      return c.json({ error: "Missing key parameter" }, 400);
    }

    kvStore.set(data.key, data.value);

    return c.json(
      {
        success: true,
        key: data.key,
        value: data.value,
      },
      200,
    );
  } catch (error) {
    console.error("KV Store error:", error);
    throw error;
  }
}

export async function readHandler(c: Context) {
  const key = c.req.param("key");

  try {
    const value = kvStore.get(key);

    if (!value) {
      return c.json({ error: "Key not found" }, 404);
    }

    return c.json(value);
  } catch (error) {
    console.error("KV Store error:", error);
    throw error;
  }
}
