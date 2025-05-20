import { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const errorHandler: MiddlewareHandler = async (c: Context, next) => {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    const status = error instanceof HTTPException ? error.status : 500;
    const message = error instanceof Error ? error.message : String(error);

    return c.json(
      {
        error: message,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
};
