export function setCorsHeaders(headers: Headers, origin?: string | null): void {
  headers.set("Access-Control-Allow-Origin", origin || "*");
  headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400");
}

export function createSafeHeaders(
  originalHeaders: Headers,
  origin?: string | null,
): Headers {
  const headers = new Headers();

  originalHeaders.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding") {
      headers.set(key, value);
    }
  });

  setCorsHeaders(headers, origin);

  return headers;
}

export interface FetchOptions {
  method: string;
  headers: Headers;
  body?: ArrayBuffer;
  agent?: any;
}

export function copyHeader(headerName: string, to: Headers, from: Headers) {
  const value = from.get(headerName);
  if (value) to.set(headerName, value);
}
