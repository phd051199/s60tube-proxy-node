import { Context } from "hono";
import { kvStore } from "../utils/store";

interface StoreRequest {
  key: string;
  value: string;
}

export async function storeHandler(c: Context) {
  try {
    const data = await c.req.json() as StoreRequest;

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
