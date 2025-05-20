(() => {
  "use strict";
  var e = {
    876: (e, t, r) => {
      var s = Object.create;
      var n = Object.defineProperty;
      var o = Object.getOwnPropertyDescriptor;
      var a = Object.getOwnPropertyNames;
      var i = Object.getPrototypeOf;
      var c = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) n(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, s) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let i of a(t)) {
            if (!c.call(e, i) && i !== r) {
              n(e, i, {
                get: () => t[i],
                enumerable: !(s = o(t, i)) || s.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toESM = (
        e,
        t,
        r,
      ) => (r = e != null ? s(i(e)) : {},
        __copyProps(
          t || !e || !e.__esModule
            ? n(r, "default", { value: e, enumerable: true })
            : r,
          e,
        ));
      var __toCommonJS = (e) =>
        __copyProps(n({}, "__esModule", { value: true }), e);
      var l = {};
      __export(l, {
        RequestError: () => d,
        createAdaptorServer: () => createAdaptorServer,
        getRequestListener: () => getRequestListener,
        serve: () => serve,
      });
      e.exports = __toCommonJS(l);
      var u = r(611);
      var h = r(675);
      var f = r(203);
      var d = class extends Error {
        static name = "RequestError";
        constructor(e, t) {
          super(e, t);
        }
      };
      var toRequestError = (e) => {
        if (e instanceof d) return e;
        return new d(e.message, { cause: e });
      };
      var p = global.Request;
      var y = class extends p {
        constructor(e, t) {
          if (typeof e === "object" && b in e) e = e[b]();
          if (typeof t?.body?.getReader !== "undefined") t.duplex ??= "half";
          super(e, t);
        }
      };
      var newRequestFromIncoming = (e, t, r, s) => {
        const n = [];
        const o = r.rawHeaders;
        for (let e = 0; e < o.length; e += 2) {
          const { [e]: t, [e + 1]: r } = o;
          if (t.charCodeAt(0) !== 58) n.push([t, r]);
        }
        const a = { method: e, headers: n, signal: s.signal };
        if (e === "TRACE") {
          a.method = "GET";
          const e = new y(t, a);
          Object.defineProperty(e, "method", {
            get() {
              return "TRACE";
            },
          });
          return e;
        }
        if (!(e === "GET" || e === "HEAD")) {
          if ("rawBody" in r && r.rawBody instanceof Buffer) {
            a.body = new ReadableStream({
              start(e) {
                e.enqueue(r.rawBody);
                e.close();
              },
            });
          } else a.body = f.Readable.toWeb(r);
        }
        return new y(t, a);
      };
      var b = Symbol("getRequestCache");
      var v = Symbol("requestCache");
      var g = Symbol("incomingKey");
      var m = Symbol("urlKey");
      var w = Symbol("abortControllerKey");
      var O = Symbol("getAbortController");
      var j = {
        get method() {
          return this[g].method || "GET";
        },
        get url() {
          return this[m];
        },
        [O]() {
          this[b]();
          return this[w];
        },
        [b]() {
          this[w] ||= new AbortController();
          return this[v] ||= newRequestFromIncoming(
            this.method,
            this[m],
            this[g],
            this[w],
          );
        },
      };
      [
        "body",
        "bodyUsed",
        "cache",
        "credentials",
        "destination",
        "headers",
        "integrity",
        "mode",
        "redirect",
        "referrer",
        "referrerPolicy",
        "signal",
        "keepalive",
      ].forEach((e) => {
        Object.defineProperty(j, e, {
          get() {
            return this[b]()[e];
          },
        });
      });
      ["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach(
        (e) => {
          Object.defineProperty(j, e, {
            value: function () {
              return this[b]()[e]();
            },
          });
        },
      );
      Object.setPrototypeOf(j, y.prototype);
      var newRequest = (e, t) => {
        const r = Object.create(j);
        r[g] = e;
        const s = e.url || "";
        if (
          s[0] !== "/" && (s.startsWith("http://") || s.startsWith("https://"))
        ) {
          if (e instanceof h.Http2ServerRequest) {
            throw new d("Absolute URL for :path is not allowed in HTTP/2");
          }
          try {
            const e = new URL(s);
            r[m] = e.href;
          } catch (e) {
            throw new d("Invalid absolute URL", { cause: e });
          }
          return r;
        }
        const n =
          (e instanceof h.Http2ServerRequest ? e.authority : e.headers.host) ||
          t;
        if (!n) throw new d("Missing host header");
        let o;
        if (e instanceof h.Http2ServerRequest) {
          o = e.scheme;
          if (!(o === "http" || o === "https")) {
            throw new d("Unsupported scheme");
          }
        } else o = e.socket && e.socket.encrypted ? "https" : "http";
        const a = new URL(`${o}://${n}${s}`);
        if (
          a.hostname.length !== n.length &&
          a.hostname !== n.replace(/:\d+$/, "")
        ) throw new d("Invalid host header");
        r[m] = a.href;
        return r;
      };
      function writeFromReadableStream(e, t) {
        if (e.locked) throw new TypeError("ReadableStream is locked.");
        else if (t.destroyed) {
          e.cancel();
          return;
        }
        const r = e.getReader();
        t.on("close", cancel);
        t.on("error", cancel);
        r.read().then(flow, cancel);
        return r.closed.finally(() => {
          t.off("close", cancel);
          t.off("error", cancel);
        });
        function cancel(e) {
          r.cancel(e).catch(() => {});
          if (e) t.destroy(e);
        }
        function onDrain() {
          r.read().then(flow, cancel);
        }
        function flow({ done: e, value: s }) {
          try {
            if (e) t.end();
            else if (!t.write(s)) t.once("drain", onDrain);
            else return r.read().then(flow, cancel);
          } catch (e) {
            cancel(e);
          }
        }
      }
      var buildOutgoingHttpHeaders = (e) => {
        const t = {};
        if (!(e instanceof Headers)) e = new Headers(e ?? void 0);
        const r = [];
        for (const [s, n] of e) {
          if (s === "set-cookie") r.push(n);
          else t[s] = n;
        }
        if (r.length > 0) t["set-cookie"] = r;
        t["content-type"] ??= "text/plain; charset=UTF-8";
        return t;
      };
      var E = Symbol("responseCache");
      var _ = Symbol("getResponseCache");
      var P = Symbol("cache");
      var R = global.Response;
      var x = class _Response {
        #e;
        #t;
        [_]() {
          delete this[P];
          return this[E] ||= new R(this.#e, this.#t);
        }
        constructor(e, t) {
          this.#e = e;
          if (t instanceof _Response) {
            const e = t[E];
            if (e) {
              this.#t = e;
              this[_]();
              return;
            } else this.#t = t.#t;
          } else this.#t = t;
          if (typeof e === "string" || typeof e?.getReader !== "undefined") {
            let r = t?.headers ||
              { "content-type": "text/plain; charset=UTF-8" };
            if (r instanceof Headers) r = buildOutgoingHttpHeaders(r);
            this[P] = [t?.status || 200, e, r];
          }
        }
      };
      [
        "body",
        "bodyUsed",
        "headers",
        "ok",
        "redirected",
        "status",
        "statusText",
        "trailers",
        "type",
        "url",
      ].forEach((e) => {
        Object.defineProperty(x.prototype, e, {
          get() {
            return this[_]()[e];
          },
        });
      });
      ["arrayBuffer", "blob", "clone", "formData", "json", "text"].forEach(
        (e) => {
          Object.defineProperty(x.prototype, e, {
            value: function () {
              return this[_]()[e]();
            },
          });
        },
      );
      Object.setPrototypeOf(x, R);
      Object.setPrototypeOf(x.prototype, R.prototype);
      var H = Reflect.ownKeys(new R()).find(
        (e) => typeof e === "symbol" && e.toString() === "Symbol(state)",
      );
      if (!H) console.warn("Failed to find Response internal state key");
      function getInternalBody(e) {
        if (!H) return;
        if (e instanceof x) e = e[_]();
        const t = e[H];
        return t && t.body || void 0;
      }
      var A = "x-hono-already-sent";
      var M = __toESM(r(982));
      var T = global.fetch;
      if (typeof global.crypto === "undefined") global.crypto = M.default;
      global.fetch = (e, t) => {
        t = { compress: false, ...t };
        return T(e, t);
      };
      var S = /^no$/i;
      var D = /^(application\/json\b|text\/(?!event-stream\b))/i;
      var handleRequestError = () => new Response(null, { status: 400 });
      var handleFetchError = (e) =>
        new Response(null, {
          status: e instanceof Error &&
              (e.name === "TimeoutError" ||
                e.constructor.name === "TimeoutError")
            ? 504
            : 500,
        });
      var handleResponseError = (e, t) => {
        const r = e instanceof Error
          ? e
          : new Error("unknown error", { cause: e });
        if (r.code === "ERR_STREAM_PREMATURE_CLOSE") {
          console.info("The user aborted a request.");
        } else {
          console.error(e);
          if (!t.headersSent) {
            t.writeHead(500, { "Content-Type": "text/plain" });
          }
          t.end(`Error: ${r.message}`);
          t.destroy(r);
        }
      };
      var responseViaCache = (e, t) => {
        const [r, s, n] = e[P];
        if (typeof s === "string") {
          n["Content-Length"] = Buffer.byteLength(s);
          t.writeHead(r, n);
          t.end(s);
        } else {
          t.writeHead(r, n);
          return writeFromReadableStream(s, t)?.catch(
            (e) => handleResponseError(e, t),
          );
        }
      };
      var responseViaResponseObject = async (e, t, r = {}) => {
        if (e instanceof Promise) {
          if (r.errorHandler) {
            try {
              e = await e;
            } catch (t) {
              const s = await r.errorHandler(t);
              if (!s) return;
              e = s;
            }
          } else e = await e.catch(handleFetchError);
        }
        if (P in e) return responseViaCache(e, t);
        const s = buildOutgoingHttpHeaders(e.headers);
        const n = getInternalBody(e);
        if (n) {
          const { length: r, source: o, stream: a } = n;
          if (o instanceof Uint8Array && o.byteLength !== r) {}
          else {
            if (r) s["content-length"] = r;
            t.writeHead(e.status, s);
            if (typeof o === "string" || o instanceof Uint8Array) t.end(o);
            else if (o instanceof Blob) {
              t.end(new Uint8Array(await o.arrayBuffer()));
            } else await writeFromReadableStream(a, t);
            return;
          }
        }
        if (e.body) {
          const {
            "transfer-encoding": r,
            "content-encoding": n,
            "content-length": o,
            "x-accel-buffering": a,
            "content-type": i,
          } = s;
          if (r || n || o || a && S.test(a) || !D.test(i)) {
            t.writeHead(e.status, s);
            await writeFromReadableStream(e.body, t);
          } else {
            const r = await e.arrayBuffer();
            s["content-length"] = r.byteLength;
            t.writeHead(e.status, s);
            t.end(new Uint8Array(r));
          }
        } else if (s[A]) {}
        else {
          t.writeHead(e.status, s);
          t.end();
        }
      };
      var getRequestListener = (e, t = {}) => {
        if (t.overrideGlobalObjects !== false && global.Request !== y) {
          Object.defineProperty(global, "Request", { value: y });
          Object.defineProperty(global, "Response", { value: x });
        }
        return async (r, s) => {
          let n, o;
          try {
            o = newRequest(r, t.hostname);
            s.on("close", () => {
              const e = o[w];
              if (!e) return;
              if (r.errored) o[w].abort(r.errored.toString());
              else if (!s.writableFinished) {
                o[w].abort("Client connection prematurely closed.");
              }
            });
            n = e(o, { incoming: r, outgoing: s });
            if (P in n) return responseViaCache(n, s);
          } catch (e) {
            if (!n) {
              if (t.errorHandler) {
                n = await t.errorHandler(o ? e : toRequestError(e));
                if (!n) return;
              } else if (!o) n = handleRequestError();
              else n = handleFetchError(e);
            } else return handleResponseError(e, s);
          }
          try {
            return await responseViaResponseObject(n, s, t);
          } catch (e) {
            return handleResponseError(e, s);
          }
        };
      };
      var createAdaptorServer = (e) => {
        const t = e.fetch;
        const r = getRequestListener(t, {
          hostname: e.hostname,
          overrideGlobalObjects: e.overrideGlobalObjects,
        });
        const s = e.createServer || u.createServer;
        const n = s(e.serverOptions || {}, r);
        return n;
      };
      var serve = (e, t) => {
        const r = createAdaptorServer(e);
        r.listen(e?.port ?? 3e3, e.hostname, () => {
          const e = r.address();
          t && t(e);
        });
        return r;
      };
      0 && 0;
    },
    341: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: true });
      t.storeHandler = storeHandler;
      const s = r(836);
      async function storeHandler(e) {
        try {
          const t = await e.req.json();
          if (!t.key) return e.json({ error: "Missing key parameter" }, 400);
          s.kvStore.set(t.key, t.value);
          return e.json({ success: true, key: t.key, value: t.value }, 200);
        } catch (e) {
          console.error("KV Store error:", e);
          throw e;
        }
      }
    },
    224: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: true });
      t.proxyHandler = proxyHandler;
      const s = r(537);
      const n = r(778);
      async function proxyHandler(e) {
        const t = new URL(e.req.url);
        const r = e.req.header("origin");
        if (!t.searchParams.has("__host")) {
          return e.json({ error: "Missing host parameter" }, 400);
        }
        try {
          const s = t.searchParams.get("__host") || "";
          if (!s) return e.json({ error: "Invalid host parameter" }, 400);
          const o = e.req.method !== "GET" && e.req.method !== "HEAD"
            ? await e.req.raw.arrayBuffer()
            : undefined;
          const a = await fetch(s, {
            method: e.req.method,
            headers: e.req.header(),
            body: o,
          });
          const i = (0, n.createSafeHeaders)(a.headers, r);
          const c = await a.arrayBuffer();
          return new Response(c, {
            status: a.status,
            statusText: a.statusText,
            headers: i,
          });
        } catch (e) {
          console.error("Proxy error:", e);
          throw new s.HTTPException(502, { message: "Error proxying request" });
        }
      }
    },
    491: (e, t, r) => {
      Object.defineProperty(t, "__esModule", { value: true });
      t.streamHandler = streamHandler;
      const s = r(537);
      const n = r(836);
      async function streamHandler(e) {
        const t = e.req.query("v");
        if (!t) return e.json({ error: "Missing video ID" }, 400);
        const r = n.kvStore.get(t);
        if (!r) throw new s.HTTPException(404, { message: "Video not found" });
        const o = e.req.header("range");
        console.log("Range header from client:", o);
        if (o) {
          try {
            const t = o.match(/bytes=(\d+)-(\d*)/i);
            if (!t) throw new Error("Invalid range format");
            const s = parseInt(t[1], 10);
            const n = t[2] ? parseInt(t[2], 10) : undefined;
            console.log(
              `Requesting bytes ${s} to ${n || "end"} from origin server`,
            );
            let a;
            try {
              const e = await fetch(r, { method: "HEAD" });
              a = e.headers.get("content-length");
              console.log("Total content size:", a);
            } catch (e) {
              console.error("Error getting content length:", e);
            }
            const i = new Headers();
            const c = [
              "accept",
              "accept-encoding",
              "cache-control",
              "user-agent",
            ];
            for (const t of c) {
              const r = e.req.header(t);
              if (r) i.set(t, r);
            }
            i.set("Range", o);
            console.log("Sending range header to origin:", o);
            const l = await fetch(r, { method: "GET", headers: i });
            console.log("Origin server response status:", l.status);
            console.log("Origin server response headers:", [
              ...l.headers.entries(),
            ]);
            if (l.status === 200 && l.body) {
              console.log(
                "Origin server returned 200 for range request, handling manually",
              );
              try {
                const e = l.headers.get("content-length");
                if (!e) throw new Error("Missing content length in response");
                const t = await l.arrayBuffer();
                console.log(`Total response size: ${t.byteLength} bytes`);
                const r = t.byteLength;
                const o = n || r - 1;
                if (s >= r) {
                  const e = new Headers();
                  e.set("content-range", `bytes */${r}`);
                  return new Response(null, { status: 416, headers: e });
                }
                const a = Math.min(o, r - 1);
                const i = a - s + 1;
                console.log(`Slicing content from ${s} to ${a} (${i} bytes)`);
                const c = t.slice(s, a + 1);
                const u = new Headers();
                for (const [e, t] of l.headers.entries()) {
                  if (e !== "content-length" && e !== "content-range") {
                    u.set(e, t);
                  }
                }
                u.set("content-range", `bytes ${s}-${a}/${r}`);
                u.set("content-length", `${i}`);
                u.set("accept-ranges", "bytes");
                console.log(`Returning 206 response with ${i} bytes`);
                console.log(`Content-Range: ${u.get("content-range")}`);
                return new Response(c, { status: 206, headers: u });
              } catch (e) {
                console.error("Error processing range request manually:", e);
                return l;
              }
            }
            if (l.status === 206) {
              const e = new Headers(l.headers);
              if (!e.has("content-range") && a) {
                const t = parseInt(a, 10);
                e.set("content-range", `bytes ${s}-${n || t - 1}/${t}`);
              }
              return new Response(l.body, { status: 206, headers: e });
            }
            console.log("Unexpected response from origin:", l.status);
            return l;
          } catch (t) {
            console.error("Error handling range request:", t);
            return fetch(r, { method: e.req.method, headers: e.req.header() });
          }
        }
        return fetch(r, { headers: e.req.header(), method: e.req.method });
      }
    },
    778: (e, t) => {
      Object.defineProperty(t, "__esModule", { value: true });
      t.setCorsHeaders = setCorsHeaders;
      t.createSafeHeaders = createSafeHeaders;
      t.copyHeader = copyHeader;
      function setCorsHeaders(e, t) {
        e.set("Access-Control-Allow-Origin", t || "*");
        e.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS",
        );
        e.set("Access-Control-Allow-Headers", "*");
        e.set("Access-Control-Allow-Credentials", "true");
        e.set("Access-Control-Max-Age", "86400");
      }
      function createSafeHeaders(e, t) {
        const r = new Headers();
        e.forEach((e, t) => {
          if (t.toLowerCase() !== "content-encoding") r.set(t, e);
        });
        setCorsHeaders(r, t);
        return r;
      }
      function copyHeader(e, t, r) {
        const s = r.get(e);
        if (s) t.set(e, s);
      }
    },
    836: (e, t) => {
      Object.defineProperty(t, "__esModule", { value: true });
      t.kvStore = void 0;
      class Store {
        constructor() {
          this.store = new Map();
          this.DEFAULT_TTL_MS = 86400 * 1e3;
        }
        set(e, t, r = this.DEFAULT_TTL_MS) {
          this.store.set(e, { value: t, expiresAt: Date.now() + r });
        }
        get(e) {
          const t = this.store.get(e);
          const r = Date.now();
          if (!t || t.expiresAt < r) {
            if (t) this.store.delete(e);
            return undefined;
          }
          return t.value;
        }
        has(e) {
          const t = this.store.get(e);
          return !!t && t.expiresAt >= Date.now();
        }
        delete(e) {
          return this.store.delete(e);
        }
        clear() {
          this.store.clear();
        }
        size() {
          return this.store.size;
        }
      }
      t.kvStore = new Store();
    },
    982: (e) => {
      e.exports = require("crypto");
    },
    611: (e) => {
      e.exports = require("http");
    },
    675: (e) => {
      e.exports = require("http2");
    },
    203: (e) => {
      e.exports = require("stream");
    },
    117: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, { compose: () => compose });
      e.exports = __toCommonJS(o);
      const compose = (e, t, r) => (s, n) => {
        let o = -1;
        return dispatch(0);
        async function dispatch(a) {
          if (a <= o) throw new Error("next() called multiple times");
          o = a;
          let i;
          let c = false;
          let l;
          if (e[a]) {
            l = e[a][0][0];
            s.req.routeIndex = a;
          } else l = a === e.length && n || void 0;
          if (l) {
            try {
              i = await l(s, () => dispatch(a + 1));
            } catch (e) {
              if (e instanceof Error && t) {
                s.error = e;
                i = await t(e, s);
                c = true;
              } else throw e;
            }
          } else if (s.finalized === false && r) i = await r(s);
          if (i && (s.finalized === false || c)) s.res = i;
          return s;
        }
      };
      0 && 0;
    },
    286: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { Context: () => Context, TEXT_PLAIN: () => u });
      e.exports = __toCommonJS(i);
      var c = r(588);
      var l = r(206);
      const u = "text/plain; charset=UTF-8";
      const setHeaders = (e, t = {}) => {
        for (const r of Object.keys(t)) e.set(r, t[r]);
        return e;
      };
      class Context {
        #r;
        #s;
        env = {};
        #n;
        finalized = false;
        error;
        #o = 200;
        #a;
        #i;
        #c;
        #l;
        #u = true;
        #h;
        #f;
        #d;
        #p;
        #y;
        constructor(e, t) {
          this.#r = e;
          if (t) {
            this.#a = t.executionCtx;
            this.env = t.env;
            this.#d = t.notFoundHandler;
            this.#y = t.path;
            this.#p = t.matchResult;
          }
        }
        get req() {
          this.#s ??= new c.HonoRequest(this.#r, this.#y, this.#p);
          return this.#s;
        }
        get event() {
          if (this.#a && "respondWith" in this.#a) return this.#a;
          else throw Error("This context has no FetchEvent");
        }
        get executionCtx() {
          if (this.#a) return this.#a;
          else throw Error("This context has no ExecutionContext");
        }
        get res() {
          this.#u = false;
          return this.#l ||= new Response("404 Not Found", { status: 404 });
        }
        set res(e) {
          this.#u = false;
          if (this.#l && e) {
            e = new Response(e.body, e);
            for (const [t, r] of this.#l.headers.entries()) {
              if (t === "content-type") continue;
              if (t === "set-cookie") {
                const t = this.#l.headers.getSetCookie();
                e.headers.delete("set-cookie");
                for (const r of t) e.headers.append("set-cookie", r);
              } else e.headers.set(t, r);
            }
          }
          this.#l = e;
          this.finalized = true;
        }
        render = (...e) => {
          this.#f ??= (e) => this.html(e);
          return this.#f(...e);
        };
        setLayout = (e) => this.#h = e;
        getLayout = () => this.#h;
        setRenderer = (e) => {
          this.#f = e;
        };
        header = (e, t, r) => {
          if (this.finalized) this.#l = new Response(this.#l.body, this.#l);
          if (t === void 0) {
            if (this.#i) this.#i.delete(e);
            else if (this.#c) delete this.#c[e.toLocaleLowerCase()];
            if (this.finalized) this.res.headers.delete(e);
            return;
          }
          if (r?.append) {
            if (!this.#i) {
              this.#u = false;
              this.#i = new Headers(this.#c);
              this.#c = {};
            }
            this.#i.append(e, t);
          } else {if (this.#i) this.#i.set(e, t);
            else {
              this.#c ??= {};
              this.#c[e.toLowerCase()] = t;
            }}
          if (this.finalized) {
            if (r?.append) this.res.headers.append(e, t);
            else this.res.headers.set(e, t);
          }
        };
        status = (e) => {
          this.#u = false;
          this.#o = e;
        };
        set = (e, t) => {
          this.#n ??= new Map();
          this.#n.set(e, t);
        };
        get = (e) => this.#n ? this.#n.get(e) : void 0;
        get var() {
          if (!this.#n) return {};
          return Object.fromEntries(this.#n);
        }
        #b(e, t, r) {
          if (this.#u && !r && !t && this.#o === 200) {
            return new Response(e, { headers: this.#c });
          }
          if (t && typeof t !== "number") {
            const r = new Headers(t.headers);
            if (this.#i) {
              this.#i.forEach((e, t) => {
                if (t === "set-cookie") r.append(t, e);
                else r.set(t, e);
              });
            }
            const s = setHeaders(r, this.#c);
            return new Response(e, { headers: s, status: t.status ?? this.#o });
          }
          const s = typeof t === "number" ? t : this.#o;
          this.#c ??= {};
          this.#i ??= new Headers();
          setHeaders(this.#i, this.#c);
          if (this.#l) {
            this.#l.headers.forEach((e, t) => {
              if (t === "set-cookie") this.#i?.append(t, e);
              else this.#i?.set(t, e);
            });
            setHeaders(this.#i, this.#c);
          }
          r ??= {};
          for (const [e, t] of Object.entries(r)) {
            if (typeof t === "string") this.#i.set(e, t);
            else {
              this.#i.delete(e);
              for (const r of t) this.#i.append(e, r);
            }
          }
          return new Response(e, { status: s, headers: this.#i });
        }
        newResponse = (...e) => this.#b(...e);
        body = (e, t, r) =>
          typeof t === "number" ? this.#b(e, t, r) : this.#b(e, t);
        text = (e, t, r) => {
          if (!this.#c) {
            if (this.#u && !r && !t) return new Response(e);
            this.#c = {};
          }
          this.#c["content-type"] = u;
          if (typeof t === "number") return this.#b(e, t, r);
          return this.#b(e, t);
        };
        json = (e, t, r) => {
          const s = JSON.stringify(e);
          this.#c ??= {};
          this.#c["content-type"] = "application/json";
          return typeof t === "number" ? this.#b(s, t, r) : this.#b(s, t);
        };
        html = (e, t, r) => {
          this.#c ??= {};
          this.#c["content-type"] = "text/html; charset=UTF-8";
          if (typeof e === "object") {
            return (0, l.resolveCallback)(
              e,
              l.HtmlEscapedCallbackPhase.Stringify,
              false,
              {},
            ).then(
              (e) => typeof t === "number" ? this.#b(e, t, r) : this.#b(e, t),
            );
          }
          return typeof t === "number" ? this.#b(e, t, r) : this.#b(e, t);
        };
        redirect = (e, t) => {
          this.#i ??= new Headers();
          this.#i.set("Location", String(e));
          return this.newResponse(null, t ?? 302);
        };
        notFound = () => {
          this.#d ??= () => new Response();
          return this.#d(this);
        };
      }
      0 && 0;
    },
    453: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { HonoBase: () => Hono });
      e.exports = __toCommonJS(i);
      var c = r(117);
      var l = r(286);
      var u = r(768);
      var h = r(702);
      var f = r(226);
      const notFoundHandler = (e) => e.text("404 Not Found", 404);
      const errorHandler = (e, t) => {
        if ("getResponse" in e) return e.getResponse();
        console.error(e);
        return t.text("Internal Server Error", 500);
      };
      class Hono {
        get;
        post;
        put;
        delete;
        options;
        patch;
        all;
        on;
        use;
        router;
        getPath;
        _basePath = "/";
        #y = "/";
        routes = [];
        constructor(e = {}) {
          const t = [...u.METHODS, u.METHOD_NAME_ALL_LOWERCASE];
          t.forEach((e) => {
            this[e] = (t, ...r) => {
              if (typeof t === "string") this.#y = t;
              else this.#v(e, this.#y, t);
              r.forEach((t) => {
                this.#v(e, this.#y, t);
              });
              return this;
            };
          });
          this.on = (e, t, ...r) => {
            for (const s of [t].flat()) {
              this.#y = s;
              for (const t of [e].flat()) {
                r.map((e) => {
                  this.#v(t.toUpperCase(), this.#y, e);
                });
              }
            }
            return this;
          };
          this.use = (e, ...t) => {
            if (typeof e === "string") this.#y = e;
            else {
              this.#y = "*";
              t.unshift(e);
            }
            t.forEach((e) => {
              this.#v(u.METHOD_NAME_ALL, this.#y, e);
            });
            return this;
          };
          const { strict: r, ...s } = e;
          Object.assign(this, s);
          this.getPath = r ?? true ? e.getPath ?? f.getPath : f.getPathNoStrict;
        }
        #g() {
          const e = new Hono({ router: this.router, getPath: this.getPath });
          e.errorHandler = this.errorHandler;
          e.#d = this.#d;
          e.routes = this.routes;
          return e;
        }
        #d = notFoundHandler;
        errorHandler = errorHandler;
        route(e, t) {
          const r = this.basePath(e);
          t.routes.map((e) => {
            let s;
            if (t.errorHandler === errorHandler) s = e.handler;
            else {
              s = async (r, s) =>
                (await (0, c.compose)([], t.errorHandler)(
                  r,
                  () => e.handler(r, s),
                )).res;
              s[h.COMPOSED_HANDLER] = e.handler;
            }
            r.#v(e.method, e.path, s);
          });
          return this;
        }
        basePath(e) {
          const t = this.#g();
          t._basePath = (0, f.mergePath)(this._basePath, e);
          return t;
        }
        onError = (e) => {
          this.errorHandler = e;
          return this;
        };
        notFound = (e) => {
          this.#d = e;
          return this;
        };
        mount(e, t, r) {
          let s;
          let n;
          if (r) {
            if (typeof r === "function") n = r;
            else {
              n = r.optionHandler;
              if (r.replaceRequest === false) s = (e) => e;
              else s = r.replaceRequest;
            }
          }
          const o = n
            ? (e) => {
              const t = n(e);
              return Array.isArray(t) ? t : [t];
            }
            : (e) => {
              let t = void 0;
              try {
                t = e.executionCtx;
              } catch {}
              return [e.env, t];
            };
          s ||= (() => {
            const t = (0, f.mergePath)(this._basePath, e);
            const r = t === "/" ? 0 : t.length;
            return (e) => {
              const t = new URL(e.url);
              t.pathname = t.pathname.slice(r) || "/";
              return new Request(t, e);
            };
          })();
          const handler = async (e, r) => {
            const n = await t(s(e.req.raw), ...o(e));
            if (n) return n;
            await r();
          };
          this.#v(u.METHOD_NAME_ALL, (0, f.mergePath)(e, "*"), handler);
          return this;
        }
        #v(e, t, r) {
          e = e.toUpperCase();
          t = (0, f.mergePath)(this._basePath, t);
          const s = { path: t, method: e, handler: r };
          this.router.add(e, t, [r, s]);
          this.routes.push(s);
        }
        #m(e, t) {
          if (e instanceof Error) return this.errorHandler(e, t);
          throw e;
        }
        #w(e, t, r, s) {
          if (s === "HEAD") {
            return (async () =>
              new Response(null, await this.#w(e, t, r, "GET")))();
          }
          const n = this.getPath(e, { env: r });
          const o = this.router.match(s, n);
          const a = new l.Context(e, {
            path: n,
            matchResult: o,
            env: r,
            executionCtx: t,
            notFoundHandler: this.#d,
          });
          if (o[0].length === 1) {
            let e;
            try {
              e = o[0][0][0][0](a, async () => {
                a.res = await this.#d(a);
              });
            } catch (e) {
              return this.#m(e, a);
            }
            return e instanceof Promise
              ? e.then((e) => e || (a.finalized ? a.res : this.#d(a))).catch(
                (e) => this.#m(e, a),
              )
              : e ?? this.#d(a);
          }
          const i = (0, c.compose)(o[0], this.errorHandler, this.#d);
          return (async () => {
            try {
              const e = await i(a);
              if (!e.finalized) {
                throw new Error(
                  "Context is not finalized. Did you forget to return a Response object or `await next()`?",
                );
              }
              return e.res;
            } catch (e) {
              return this.#m(e, a);
            }
          })();
        }
        fetch = (e, ...t) => this.#w(e, t[1], t[0], e.method);
        request = (e, t, r, s) => {
          if (e instanceof Request) {
            return this.fetch(t ? new Request(e, t) : e, r, s);
          }
          e = e.toString();
          return this.fetch(
            new Request(
              /^https?:\/\//.test(e)
                ? e
                : `http://localhost${(0, f.mergePath)("/", e)}`,
              t,
            ),
            r,
            s,
          );
        };
        fire = () => {
          addEventListener("fetch", (e) => {
            e.respondWith(this.#w(e.request, e, void 0, e.request.method));
          });
        };
      }
      0 && 0;
    },
    943: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { Hono: () => Hono });
      e.exports = __toCommonJS(i);
      var c = r(453);
      var l = r(842);
      var u = r(997);
      var h = r(590);
      class Hono extends c.HonoBase {
        constructor(e = {}) {
          super(e);
          this.router = e.router ??
            new u.SmartRouter({
              routers: [new l.RegExpRouter(), new h.TrieRouter()],
            });
        }
      }
      0 && 0;
    },
    537: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, { HTTPException: () => HTTPException });
      e.exports = __toCommonJS(o);
      class HTTPException extends Error {
        res;
        status;
        constructor(e = 500, t) {
          super(t?.message, { cause: t?.cause });
          this.res = t?.res;
          this.status = e;
        }
        getResponse() {
          if (this.res) {
            const e = new Response(this.res.body, {
              status: this.status,
              headers: this.res.headers,
            });
            return e;
          }
          return new Response(this.message, { status: this.status });
        }
      }
      0 && 0;
    },
    465: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { Hono: () => c.Hono });
      e.exports = __toCommonJS(i);
      var c = r(943);
      0 && 0;
    },
    698: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, { cors: () => cors });
      e.exports = __toCommonJS(o);
      const cors = (e) => {
        const t = {
          origin: "*",
          allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
          allowHeaders: [],
          exposeHeaders: [],
        };
        const r = { ...t, ...e };
        const s = ((e) => {
          if (typeof e === "string") {
            if (e === "*") return () => e;
            else return (t) => e === t ? t : null;
          } else if (typeof e === "function") return e;
          else return (t) => e.includes(t) ? t : null;
        })(r.origin);
        return async function cors2(e, t) {
          function set(t, r) {
            e.res.headers.set(t, r);
          }
          const n = s(e.req.header("origin") || "", e);
          if (n) set("Access-Control-Allow-Origin", n);
          if (r.origin !== "*") {
            const t = e.req.header("Vary");
            if (t) set("Vary", t);
            else set("Vary", "Origin");
          }
          if (r.credentials) set("Access-Control-Allow-Credentials", "true");
          if (r.exposeHeaders?.length) {
            set("Access-Control-Expose-Headers", r.exposeHeaders.join(","));
          }
          if (e.req.method === "OPTIONS") {
            if (r.maxAge != null) {
              set("Access-Control-Max-Age", r.maxAge.toString());
            }
            if (r.allowMethods?.length) {
              set("Access-Control-Allow-Methods", r.allowMethods.join(","));
            }
            let t = r.allowHeaders;
            if (!t?.length) {
              const r = e.req.header("Access-Control-Request-Headers");
              if (r) t = r.split(/\s*,\s*/);
            }
            if (t?.length) {
              set("Access-Control-Allow-Headers", t.join(","));
              e.res.headers.append("Vary", "Access-Control-Request-Headers");
            }
            e.res.headers.delete("Content-Length");
            e.res.headers.delete("Content-Type");
            return new Response(null, {
              headers: e.res.headers,
              status: 204,
              statusText: "No Content",
            });
          }
          await t();
        };
      };
      0 && 0;
    },
    588: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { HonoRequest: () => HonoRequest });
      e.exports = __toCommonJS(i);
      var c = r(195);
      var l = r(226);
      const tryDecodeURIComponent = (e) =>
        (0, l.tryDecode)(e, l.decodeURIComponent_);
      class HonoRequest {
        raw;
        #O;
        #p;
        routeIndex = 0;
        path;
        bodyCache = {};
        constructor(e, t = "/", r = [[]]) {
          this.raw = e;
          this.path = t;
          this.#p = r;
          this.#O = {};
        }
        param(e) {
          return e ? this.#j(e) : this.#E();
        }
        #j(e) {
          const t = this.#p[0][this.routeIndex][1][e];
          const r = this.#_(t);
          return r ? /\%/.test(r) ? tryDecodeURIComponent(r) : r : void 0;
        }
        #E() {
          const e = {};
          const t = Object.keys(this.#p[0][this.routeIndex][1]);
          for (const r of t) {
            const t = this.#_(this.#p[0][this.routeIndex][1][r]);
            if (t && typeof t === "string") {
              e[r] = /\%/.test(t) ? tryDecodeURIComponent(t) : t;
            }
          }
          return e;
        }
        #_(e) {
          return this.#p[1] ? this.#p[1][e] : e;
        }
        query(e) {
          return (0, l.getQueryParam)(this.url, e);
        }
        queries(e) {
          return (0, l.getQueryParams)(this.url, e);
        }
        header(e) {
          if (e) return this.raw.headers.get(e) ?? void 0;
          const t = {};
          this.raw.headers.forEach((e, r) => {
            t[r] = e;
          });
          return t;
        }
        async parseBody(e) {
          return this.bodyCache.parsedBody ??= await (0, c.parseBody)(this, e);
        }
        #P = (e) => {
          const { bodyCache: t, raw: r } = this;
          const s = t[e];
          if (s) return s;
          const n = Object.keys(t)[0];
          if (n) {
            return t[n].then((t) => {
              if (n === "json") t = JSON.stringify(t);
              return new Response(t)[e]();
            });
          }
          return t[e] = r[e]();
        };
        json() {
          return this.#P("json");
        }
        text() {
          return this.#P("text");
        }
        arrayBuffer() {
          return this.#P("arrayBuffer");
        }
        blob() {
          return this.#P("blob");
        }
        formData() {
          return this.#P("formData");
        }
        addValidatedData(e, t) {
          this.#O[e] = t;
        }
        valid(e) {
          return this.#O[e];
        }
        get url() {
          return this.raw.url;
        }
        get method() {
          return this.raw.method;
        }
        get matchedRoutes() {
          return this.#p[0].map(([[, e]]) => e);
        }
        get routePath() {
          return this.#p[0].map(([[, e]]) => e)[this.routeIndex].path;
        }
      }
      0 && 0;
    },
    768: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, {
        MESSAGE_MATCHER_IS_ALREADY_BUILT: () => l,
        METHODS: () => c,
        METHOD_NAME_ALL: () => a,
        METHOD_NAME_ALL_LOWERCASE: () => i,
        UnsupportedPathError: () => UnsupportedPathError,
      });
      e.exports = __toCommonJS(o);
      const a = "ALL";
      const i = "all";
      const c = ["get", "post", "put", "delete", "options", "patch"];
      const l = "Can not add a route since the matcher is already built.";
      class UnsupportedPathError extends Error {}
      0 && 0;
    },
    842: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { RegExpRouter: () => c.RegExpRouter });
      e.exports = __toCommonJS(i);
      var c = r(873);
      0 && 0;
    },
    616: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, { Node: () => Node, PATH_ERROR: () => l });
      e.exports = __toCommonJS(o);
      const a = "[^/]+";
      const i = ".*";
      const c = "(?:|/.*)";
      const l = Symbol();
      const u = new Set(".\\+*[^]$()");
      function compareKey(e, t) {
        if (e.length === 1) return t.length === 1 ? e < t ? -1 : 1 : -1;
        if (t.length === 1) return 1;
        if (e === i || e === c) return 1;
        else if (t === i || t === c) return -1;
        if (e === a) return 1;
        else if (t === a) return -1;
        return e.length === t.length ? e < t ? -1 : 1 : t.length - e.length;
      }
      class Node {
        #R;
        #x;
        #H = Object.create(null);
        insert(e, t, r, s, n) {
          if (e.length === 0) {
            if (this.#R !== void 0) throw l;
            if (n) return;
            this.#R = t;
            return;
          }
          const [o, ...u] = e;
          const h = o === "*"
            ? u.length === 0 ? ["", "", i] : ["", "", a]
            : o === "/*"
            ? ["", "", c]
            : o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
          let f;
          if (h) {
            const e = h[1];
            let t = h[2] || a;
            if (e && h[2]) {
              t = t.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
              if (/\((?!\?:)/.test(t)) throw l;
            }
            f = this.#H[t];
            if (!f) {
              if (Object.keys(this.#H).some((e) => e !== i && e !== c)) throw l;
              if (n) return;
              f = this.#H[t] = new Node();
              if (e !== "") f.#x = s.varIndex++;
            }
            if (!n && e !== "") r.push([e, f.#x]);
          } else {
            f = this.#H[o];
            if (!f) {
              if (
                Object.keys(this.#H).some(
                  (e) => e.length > 1 && e !== i && e !== c,
                )
              ) throw l;
              if (n) return;
              f = this.#H[o] = new Node();
            }
          }
          f.insert(u, t, r, s, n);
        }
        buildRegExpStr() {
          const e = Object.keys(this.#H).sort(compareKey);
          const t = e.map((e) => {
            const t = this.#H[e];
            return (typeof t.#x === "number"
              ? `(${e})@${t.#x}`
              : u.has(e)
              ? `\\${e}`
              : e) + t.buildRegExpStr();
          });
          if (typeof this.#R === "number") t.unshift(`#${this.#R}`);
          if (t.length === 0) return "";
          if (t.length === 1) return t[0];
          return "(?:" + t.join("|") + ")";
        }
      }
      0 && 0;
    },
    873: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { RegExpRouter: () => RegExpRouter });
      e.exports = __toCommonJS(i);
      var c = r(768);
      var l = r(226);
      var u = r(616);
      var h = r(864);
      const f = [];
      const d = [/^$/, [], Object.create(null)];
      let p = Object.create(null);
      function buildWildcardRegExp(e) {
        return p[e] ??= new RegExp(
          e === "*" ? "" : `^${
            e.replace(
              /\/\*$|([.\\+*[^\]$()])/g,
              (e, t) => t ? `\\${t}` : "(?:|/.*)",
            )
          }$`,
        );
      }
      function clearWildcardRegExpCache() {
        p = Object.create(null);
      }
      function buildMatcherFromPreprocessedRoutes(e) {
        const t = new h.Trie();
        const r = [];
        if (e.length === 0) return d;
        const s = e.map((e) => [!/\*|\/:/.test(e[0]), ...e]).sort(
          ([e, t], [r, s]) => e ? 1 : r ? -1 : t.length - s.length,
        );
        const n = Object.create(null);
        for (let e = 0, o = -1, a = s.length; e < a; e++) {
          const [a, i, l] = s[e];
          if (a) n[i] = [l.map(([e]) => [e, Object.create(null)]), f];
          else o++;
          let h;
          try {
            h = t.insert(i, o, a);
          } catch (e) {
            throw e === u.PATH_ERROR ? new c.UnsupportedPathError(i) : e;
          }
          if (a) continue;
          r[o] = l.map(([e, t]) => {
            const r = Object.create(null);
            t -= 1;
            for (; t >= 0; t--) {
              const [e, s] = h[t];
              r[e] = s;
            }
            return [e, r];
          });
        }
        const [o, a, i] = t.buildRegExp();
        for (let e = 0, t = r.length; e < t; e++) {
          for (let t = 0, s = r[e].length; t < s; t++) {
            const s = r[e][t]?.[1];
            if (!s) {
              continue;
            }
            const n = Object.keys(s);
            for (let e = 0, t = n.length; e < t; e++) s[n[e]] = i[s[n[e]]];
          }
        }
        const l = [];
        for (const e in a) l[e] = r[a[e]];
        return [o, l, n];
      }
      function findMiddleware(e, t) {
        if (!e) return void 0;
        for (const r of Object.keys(e).sort((e, t) => t.length - e.length)) {
          if (buildWildcardRegExp(r).test(t)) return [...e[r]];
        }
        return void 0;
      }
      class RegExpRouter {
        name = "RegExpRouter";
        #A;
        #M;
        constructor() {
          this.#A = { [c.METHOD_NAME_ALL]: Object.create(null) };
          this.#M = { [c.METHOD_NAME_ALL]: Object.create(null) };
        }
        add(e, t, r) {
          const s = this.#A;
          const n = this.#M;
          if (!s || !n) throw new Error(c.MESSAGE_MATCHER_IS_ALREADY_BUILT);
          if (!s[e]) {
            [s, n].forEach((t) => {
              t[e] = Object.create(null);
              Object.keys(t[c.METHOD_NAME_ALL]).forEach((r) => {
                t[e][r] = [...t[c.METHOD_NAME_ALL][r]];
              });
            });
          }
          if (t === "/*") t = "*";
          const o = (t.match(/\/:/g) || []).length;
          if (/\*$/.test(t)) {
            const a = buildWildcardRegExp(t);
            if (e === c.METHOD_NAME_ALL) {
              Object.keys(s).forEach((e) => {
                s[e][t] ||= findMiddleware(s[e], t) ||
                  findMiddleware(s[c.METHOD_NAME_ALL], t) || [];
              });
            } else {s[e][t] ||= findMiddleware(s[e], t) ||
                findMiddleware(s[c.METHOD_NAME_ALL], t) || [];}
            Object.keys(s).forEach((t) => {
              if (e === c.METHOD_NAME_ALL || e === t) {
                Object.keys(s[t]).forEach((e) => {
                  a.test(e) && s[t][e].push([r, o]);
                });
              }
            });
            Object.keys(n).forEach((t) => {
              if (e === c.METHOD_NAME_ALL || e === t) {
                Object.keys(n[t]).forEach(
                  (e) => a.test(e) && n[t][e].push([r, o]),
                );
              }
            });
            return;
          }
          const a = (0, l.checkOptionalParameter)(t) || [t];
          for (let t = 0, i = a.length; t < i; t++) {
            const l = a[t];
            Object.keys(n).forEach((a) => {
              if (e === c.METHOD_NAME_ALL || e === a) {
                n[a][l] ||= [
                  ...findMiddleware(s[a], l) ||
                    findMiddleware(s[c.METHOD_NAME_ALL], l) || [],
                ];
                n[a][l].push([r, o - i + t + 1]);
              }
            });
          }
        }
        match(e, t) {
          clearWildcardRegExpCache();
          const r = this.#T();
          this.match = (e, t) => {
            const s = r[e] || r[c.METHOD_NAME_ALL];
            const n = s[2][t];
            if (n) return n;
            const o = t.match(s[0]);
            if (!o) return [[], f];
            const a = o.indexOf("", 1);
            return [s[1][a], o];
          };
          return this.match(e, t);
        }
        #T() {
          const e = Object.create(null);
          Object.keys(this.#M).concat(Object.keys(this.#A)).forEach((t) => {
            e[t] ||= this.#S(t);
          });
          this.#A = this.#M = void 0;
          return e;
        }
        #S(e) {
          const t = [];
          let r = e === c.METHOD_NAME_ALL;
          [this.#A, this.#M].forEach((s) => {
            const n = s[e] ? Object.keys(s[e]).map((t) => [t, s[e][t]]) : [];
            if (n.length !== 0) {
              r ||= true;
              t.push(...n);
            } else if (e !== c.METHOD_NAME_ALL) {
              t.push(
                ...Object.keys(s[c.METHOD_NAME_ALL]).map(
                  (e) => [e, s[c.METHOD_NAME_ALL][e]],
                ),
              );
            }
          });
          if (!r) return null;
          else return buildMatcherFromPreprocessedRoutes(t);
        }
      }
      0 && 0;
    },
    864: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { Trie: () => Trie });
      e.exports = __toCommonJS(i);
      var c = r(616);
      class Trie {
        #D = { varIndex: 0 };
        #C = new c.Node();
        insert(e, t, r) {
          const s = [];
          const n = [];
          for (let t = 0;;) {
            let r = false;
            e = e.replace(/\{[^}]+\}/g, (e) => {
              const s = `@\\${t}`;
              n[t] = [s, e];
              t++;
              r = true;
              return s;
            });
            if (!r) break;
          }
          const o = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
          for (let e = n.length - 1; e >= 0; e--) {
            const [t] = n[e];
            for (let r = o.length - 1; r >= 0; r--) {
              if (o[r].indexOf(t) !== -1) {
                o[r] = o[r].replace(t, n[e][1]);
                break;
              }
            }
          }
          this.#C.insert(o, t, s, this.#D, r);
          return s;
        }
        buildRegExp() {
          let e = this.#C.buildRegExpStr();
          if (e === "") return [/^$/, [], []];
          let t = 0;
          const r = [];
          const s = [];
          e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (e, n, o) => {
            if (n !== void 0) {
              r[++t] = Number(n);
              return "$()";
            }
            if (o !== void 0) {
              s[Number(o)] = ++t;
              return "";
            }
            return "";
          });
          return [new RegExp(`^${e}`), r, s];
        }
      }
      0 && 0;
    },
    997: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { SmartRouter: () => c.SmartRouter });
      e.exports = __toCommonJS(i);
      var c = r(276);
      0 && 0;
    },
    276: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { SmartRouter: () => SmartRouter });
      e.exports = __toCommonJS(i);
      var c = r(768);
      class SmartRouter {
        name = "SmartRouter";
        #L = [];
        #M = [];
        constructor(e) {
          this.#L = e.routers;
        }
        add(e, t, r) {
          if (!this.#M) throw new Error(c.MESSAGE_MATCHER_IS_ALREADY_BUILT);
          this.#M.push([e, t, r]);
        }
        match(e, t) {
          if (!this.#M) throw new Error("Fatal error");
          const r = this.#L;
          const s = this.#M;
          const n = r.length;
          let o = 0;
          let a;
          for (; o < n; o++) {
            const n = r[o];
            try {
              for (let e = 0, t = s.length; e < t; e++) n.add(...s[e]);
              a = n.match(e, t);
            } catch (e) {
              if (e instanceof c.UnsupportedPathError) continue;
              throw e;
            }
            this.match = n.match.bind(n);
            this.#L = [n];
            this.#M = void 0;
            break;
          }
          if (o === n) throw new Error("Fatal error");
          this.name = `SmartRouter + ${this.activeRouter.name}`;
          return a;
        }
        get activeRouter() {
          if (this.#M || this.#L.length !== 1) {
            throw new Error("No active router has been determined yet.");
          }
          return this.#L[0];
        }
      }
      0 && 0;
    },
    590: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { TrieRouter: () => c.TrieRouter });
      e.exports = __toCommonJS(i);
      var c = r(725);
      0 && 0;
    },
    668: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { Node: () => Node });
      e.exports = __toCommonJS(i);
      var c = r(768);
      var l = r(226);
      const u = Object.create(null);
      class Node {
        #k;
        #H;
        #q;
        #N = 0;
        #$ = u;
        constructor(e, t, r) {
          this.#H = r || Object.create(null);
          this.#k = [];
          if (e && t) {
            const r = Object.create(null);
            r[e] = { handler: t, possibleKeys: [], score: 0 };
            this.#k = [r];
          }
          this.#q = [];
        }
        insert(e, t, r) {
          this.#N = ++this.#N;
          let s = this;
          const n = (0, l.splitRoutingPath)(t);
          const o = [];
          for (let e = 0, t = n.length; e < t; e++) {
            const t = n[e];
            const r = n[e + 1];
            const a = (0, l.getPattern)(t, r);
            const i = Array.isArray(a) ? a[0] : t;
            if (Object.keys(s.#H).includes(i)) {
              s = s.#H[i];
              const e = (0, l.getPattern)(t, r);
              if (e) o.push(e[1]);
              continue;
            }
            s.#H[i] = new Node();
            if (a) {
              s.#q.push(a);
              o.push(a[1]);
            }
            s = s.#H[i];
          }
          const a = Object.create(null);
          const i = {
            handler: r,
            possibleKeys: o.filter((e, t, r) => r.indexOf(e) === t),
            score: this.#N,
          };
          a[e] = i;
          s.#k.push(a);
          return s;
        }
        #F(e, t, r, s) {
          const n = [];
          for (let o = 0, a = e.#k.length; o < a; o++) {
            const a = e.#k[o];
            const i = a[t] || a[c.METHOD_NAME_ALL];
            const l = {};
            if (i !== void 0) {
              i.params = Object.create(null);
              n.push(i);
              if (r !== u || s && s !== u) {
                for (let e = 0, t = i.possibleKeys.length; e < t; e++) {
                  const t = i.possibleKeys[e];
                  const n = l[i.score];
                  i.params[t] = s?.[t] && !n ? s[t] : r[t] ?? s?.[t];
                  l[i.score] = true;
                }
              }
            }
          }
          return n;
        }
        search(e, t) {
          const r = [];
          this.#$ = u;
          const s = this;
          let n = [s];
          const o = (0, l.splitPath)(t);
          const a = [];
          for (let t = 0, s = o.length; t < s; t++) {
            const i = o[t];
            const c = t === s - 1;
            const l = [];
            for (let s = 0, h = n.length; s < h; s++) {
              const h = n[s];
              const f = h.#H[i];
              if (f) {
                f.#$ = h.#$;
                if (c) {
                  if (f.#H["*"]) r.push(...this.#F(f.#H["*"], e, h.#$));
                  r.push(...this.#F(f, e, h.#$));
                } else l.push(f);
              }
              for (let s = 0, n = h.#q.length; s < n; s++) {
                const n = h.#q[s];
                const f = h.#$ === u ? {} : { ...h.#$ };
                if (n === "*") {
                  const t = h.#H["*"];
                  if (t) {
                    r.push(...this.#F(t, e, h.#$));
                    t.#$ = f;
                    l.push(t);
                  }
                  continue;
                }
                if (i === "") continue;
                const [d, p, y] = n;
                const b = h.#H[d];
                const v = o.slice(t).join("/");
                if (y instanceof RegExp) {
                  const t = y.exec(v);
                  if (t) {
                    f[p] = t[0];
                    r.push(...this.#F(b, e, h.#$, f));
                    if (Object.keys(b.#H).length) {
                      b.#$ = f;
                      const e = t[0].match(/\//)?.length ?? 0;
                      const r = a[e] ||= [];
                      r.push(b);
                    }
                    continue;
                  }
                }
                if (y === true || y.test(i)) {
                  f[p] = i;
                  if (c) {
                    r.push(...this.#F(b, e, f, h.#$));
                    if (b.#H["*"]) r.push(...this.#F(b.#H["*"], e, f, h.#$));
                  } else {
                    b.#$ = f;
                    l.push(b);
                  }
                }
              }
            }
            n = l.concat(a.shift() ?? []);
          }
          if (r.length > 1) r.sort((e, t) => e.score - t.score);
          return [r.map(({ handler: e, params: t }) => [e, t])];
        }
      }
      0 && 0;
    },
    725: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { TrieRouter: () => TrieRouter });
      e.exports = __toCommonJS(i);
      var c = r(226);
      var l = r(668);
      class TrieRouter {
        name = "TrieRouter";
        #B;
        constructor() {
          this.#B = new l.Node();
        }
        add(e, t, r) {
          const s = (0, c.checkOptionalParameter)(t);
          if (s) {
            for (let t = 0, n = s.length; t < n; t++) {
              this.#B.insert(e, s[t], r);
            }
            return;
          }
          this.#B.insert(e, t, r);
        }
        match(e, t) {
          return this.#B.search(e, t);
        }
      }
      0 && 0;
    },
    195: (e, t, r) => {
      var s = Object.defineProperty;
      var n = Object.getOwnPropertyDescriptor;
      var o = Object.getOwnPropertyNames;
      var a = Object.prototype.hasOwnProperty;
      var __export = (e, t) => {
        for (var r in t) s(e, r, { get: t[r], enumerable: true });
      };
      var __copyProps = (e, t, r, i) => {
        if (t && typeof t === "object" || typeof t === "function") {
          for (let c of o(t)) {
            if (!a.call(e, c) && c !== r) {
              s(e, c, {
                get: () => t[c],
                enumerable: !(i = n(t, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(s({}, "__esModule", { value: true }), e);
      var i = {};
      __export(i, { parseBody: () => parseBody });
      e.exports = __toCommonJS(i);
      var c = r(588);
      const parseBody = async (e, t = Object.create(null)) => {
        const { all: r = false, dot: s = false } = t;
        const n = e instanceof c.HonoRequest ? e.raw.headers : e.headers;
        const o = n.get("Content-Type");
        if (
          o?.startsWith("multipart/form-data") ||
          o?.startsWith("application/x-www-form-urlencoded")
        ) return parseFormData(e, { all: r, dot: s });
        return {};
      };
      async function parseFormData(e, t) {
        const r = await e.formData();
        if (r) return convertFormDataToBodyData(r, t);
        return {};
      }
      function convertFormDataToBodyData(e, t) {
        const r = Object.create(null);
        e.forEach((e, s) => {
          const n = t.all || s.endsWith("[]");
          if (!n) r[s] = e;
          else handleParsingAllValues(r, s, e);
        });
        if (t.dot) {
          Object.entries(r).forEach(([e, t]) => {
            const s = e.includes(".");
            if (s) {
              handleParsingNestedValues(r, e, t);
              delete r[e];
            }
          });
        }
        return r;
      }
      const handleParsingAllValues = (e, t, r) => {
        if (e[t] !== void 0) {
          if (Array.isArray(e[t])) e[t].push(r);
          else e[t] = [e[t], r];
        } else e[t] = r;
      };
      const handleParsingNestedValues = (e, t, r) => {
        let s = e;
        const n = t.split(".");
        n.forEach((e, t) => {
          if (t === n.length - 1) s[e] = r;
          else {
            if (
              !s[e] || typeof s[e] !== "object" || Array.isArray(s[e]) ||
              s[e] instanceof File
            ) s[e] = Object.create(null);
            s = s[e];
          }
        });
      };
      0 && 0;
    },
    702: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, { COMPOSED_HANDLER: () => a });
      e.exports = __toCommonJS(o);
      const a = "__COMPOSED_HANDLER";
      0 && 0;
    },
    206: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, {
        HtmlEscapedCallbackPhase: () => a,
        escapeToBuffer: () => escapeToBuffer,
        raw: () => raw,
        resolveCallback: () => resolveCallback,
        resolveCallbackSync: () => resolveCallbackSync,
        stringBufferToString: () => stringBufferToString,
      });
      e.exports = __toCommonJS(o);
      const a = { Stringify: 1, BeforeStream: 2, Stream: 3 };
      const raw = (e, t) => {
        const r = new String(e);
        r.isEscaped = true;
        r.callbacks = t;
        return r;
      };
      const i = /[&<>'"]/;
      const stringBufferToString = async (e, t) => {
        let r = "";
        t ||= [];
        const s = await Promise.all(e);
        for (let e = s.length - 1;; e--) {
          r += s[e];
          e--;
          if (e < 0) break;
          let n = s[e];
          if (typeof n === "object") t.push(...n.callbacks || []);
          const o = n.isEscaped;
          n = await (typeof n === "object" ? n.toString() : n);
          if (typeof n === "object") t.push(...n.callbacks || []);
          if (n.isEscaped ?? o) r += n;
          else {
            const e = [r];
            escapeToBuffer(n, e);
            r = e[0];
          }
        }
        return raw(r, t);
      };
      const escapeToBuffer = (e, t) => {
        const r = e.search(i);
        if (r === -1) {
          t[0] += e;
          return;
        }
        let s;
        let n;
        let o = 0;
        for (n = r; n < e.length; n++) {
          switch (e.charCodeAt(n)) {
            case 34:
              s = "&quot;";
              break;
            case 39:
              s = "&#39;";
              break;
            case 38:
              s = "&amp;";
              break;
            case 60:
              s = "&lt;";
              break;
            case 62:
              s = "&gt;";
              break;
            default:
              continue;
          }
          t[0] += e.substring(o, n) + s;
          o = n + 1;
        }
        t[0] += e.substring(o, n);
      };
      const resolveCallbackSync = (e) => {
        const t = e.callbacks;
        if (!t?.length) return e;
        const r = [e];
        const s = {};
        t.forEach((e) => e({ phase: a.Stringify, buffer: r, context: s }));
        return r[0];
      };
      const resolveCallback = async (e, t, r, s, n) => {
        if (typeof e === "object" && !(e instanceof String)) {
          if (!(e instanceof Promise)) e = e.toString();
          if (e instanceof Promise) e = await e;
        }
        const o = e.callbacks;
        if (!o?.length) return Promise.resolve(e);
        if (n) n[0] += e;
        else n = [e];
        const a = Promise.all(
          o.map((e) => e({ phase: t, buffer: n, context: s })),
        ).then(
          (e) =>
            Promise.all(
              e.filter(Boolean).map((e) => resolveCallback(e, t, false, s, n)),
            ).then(() => n[0]),
        );
        if (r) return raw(await a, o);
        else return a;
      };
      0 && 0;
    },
    226: (e) => {
      var t = Object.defineProperty;
      var r = Object.getOwnPropertyDescriptor;
      var s = Object.getOwnPropertyNames;
      var n = Object.prototype.hasOwnProperty;
      var __export = (e, r) => {
        for (var s in r) t(e, s, { get: r[s], enumerable: true });
      };
      var __copyProps = (e, o, a, i) => {
        if (o && typeof o === "object" || typeof o === "function") {
          for (let c of s(o)) {
            if (!n.call(e, c) && c !== a) {
              t(e, c, {
                get: () => o[c],
                enumerable: !(i = r(o, c)) || i.enumerable,
              });
            }
          }
        }
        return e;
      };
      var __toCommonJS = (e) =>
        __copyProps(t({}, "__esModule", { value: true }), e);
      var o = {};
      __export(o, {
        checkOptionalParameter: () => checkOptionalParameter,
        decodeURIComponent_: () => c,
        getPath: () => getPath,
        getPathNoStrict: () => getPathNoStrict,
        getPattern: () => getPattern,
        getQueryParam: () => i,
        getQueryParams: () => getQueryParams,
        getQueryStrings: () => getQueryStrings,
        mergePath: () => mergePath,
        splitPath: () => splitPath,
        splitRoutingPath: () => splitRoutingPath,
        tryDecode: () => tryDecode,
      });
      e.exports = __toCommonJS(o);
      const splitPath = (e) => {
        const t = e.split("/");
        if (t[0] === "") t.shift();
        return t;
      };
      const splitRoutingPath = (e) => {
        const { groups: t, path: r } = extractGroupsFromPath(e);
        const s = splitPath(r);
        return replaceGroupMarks(s, t);
      };
      const extractGroupsFromPath = (e) => {
        const t = [];
        e = e.replace(/\{[^}]+\}/g, (e, r) => {
          const s = `@${r}`;
          t.push([s, e]);
          return s;
        });
        return { groups: t, path: e };
      };
      const replaceGroupMarks = (e, t) => {
        for (let r = t.length - 1; r >= 0; r--) {
          const [s] = t[r];
          for (let n = e.length - 1; n >= 0; n--) {
            if (e[n].includes(s)) {
              e[n] = e[n].replace(s, t[r][1]);
              break;
            }
          }
        }
        return e;
      };
      const a = {};
      const getPattern = (e, t) => {
        if (e === "*") return "*";
        const r = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
        if (r) {
          const s = `${e}#${t}`;
          if (!a[s]) {
            if (r[2]) {
              a[s] = t && t[0] !== ":" && t[0] !== "*"
                ? [s, r[1], new RegExp(`^${r[2]}(?=/${t})`)]
                : [e, r[1], new RegExp(`^${r[2]}$`)];
            } else a[s] = [e, r[1], true];
          }
          return a[s];
        }
        return null;
      };
      const tryDecode = (e, t) => {
        try {
          return t(e);
        } catch {
          return e.replace(/(?:%[0-9A-Fa-f]{2})+/g, (e) => {
            try {
              return t(e);
            } catch {
              return e;
            }
          });
        }
      };
      const tryDecodeURI = (e) => tryDecode(e, decodeURI);
      const getPath = (e) => {
        const t = e.url;
        const r = t.indexOf("/", 8);
        let s = r;
        for (; s < t.length; s++) {
          const e = t.charCodeAt(s);
          if (e === 37) {
            const e = t.indexOf("?", s);
            const n = t.slice(r, e === -1 ? void 0 : e);
            return tryDecodeURI(
              n.includes("%25") ? n.replace(/%25/g, "%2525") : n,
            );
          } else if (e === 63) break;
        }
        return t.slice(r, s);
      };
      const getQueryStrings = (e) => {
        const t = e.indexOf("?", 8);
        return t === -1 ? "" : "?" + e.slice(t + 1);
      };
      const getPathNoStrict = (e) => {
        const t = getPath(e);
        return t.length > 1 && t.at(-1) === "/" ? t.slice(0, -1) : t;
      };
      const mergePath = (e, t, ...r) => {
        if (r.length) t = mergePath(t, ...r);
        return `${e?.[0] === "/" ? "" : "/"}${e}${
          t === "/"
            ? ""
            : `${e?.at(-1) === "/" ? "" : "/"}${
              t?.[0] === "/" ? t.slice(1) : t
            }`
        }`;
      };
      const checkOptionalParameter = (e) => {
        if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":")) return null;
        const t = e.split("/");
        const r = [];
        let s = "";
        t.forEach((e) => {
          if (e !== "" && !/\:/.test(e)) s += "/" + e;
          else if (/\:/.test(e)) {
            if (/\?/.test(e)) {
              if (r.length === 0 && s === "") r.push("/");
              else r.push(s);
              const t = e.replace("?", "");
              s += "/" + t;
              r.push(s);
            } else s += "/" + e;
          }
        });
        return r.filter((e, t, r) => r.indexOf(e) === t);
      };
      const _decodeURI = (e) => {
        if (!/[%+]/.test(e)) return e;
        if (e.indexOf("+") !== -1) e = e.replace(/\+/g, " ");
        return e.indexOf("%") !== -1 ? c(e) : e;
      };
      const _getQueryParam = (e, t, r) => {
        let s;
        if (!r && t && !/[%+]/.test(t)) {
          let r = e.indexOf(`?${t}`, 8);
          if (r === -1) r = e.indexOf(`&${t}`, 8);
          while (r !== -1) {
            const s = e.charCodeAt(r + t.length + 1);
            if (s === 61) {
              const s = r + t.length + 2;
              const n = e.indexOf("&", s);
              return _decodeURI(e.slice(s, n === -1 ? void 0 : n));
            } else if (s == 38 || isNaN(s)) return "";
            r = e.indexOf(`&${t}`, r + 1);
          }
          s = /[%+]/.test(e);
          if (!s) return void 0;
        }
        const n = {};
        s ??= /[%+]/.test(e);
        let o = e.indexOf("?", 8);
        while (o !== -1) {
          const t = e.indexOf("&", o + 1);
          let a = e.indexOf("=", o);
          if (a > t && t !== -1) a = -1;
          let i = e.slice(o + 1, a === -1 ? t === -1 ? void 0 : t : a);
          if (s) i = _decodeURI(i);
          o = t;
          if (i === "") continue;
          let c;
          if (a === -1) c = "";
          else {
            c = e.slice(a + 1, t === -1 ? void 0 : t);
            if (s) c = _decodeURI(c);
          }
          if (r) {
            if (!(n[i] && Array.isArray(n[i]))) n[i] = [];
            n[i].push(c);
          } else n[i] ??= c;
        }
        return t ? n[t] : n;
      };
      const i = _getQueryParam;
      const getQueryParams = (e, t) => _getQueryParam(e, t, true);
      const c = decodeURIComponent;
      0 && 0;
    },
  };
  var t = {};
  function __nccwpck_require__(r) {
    var s = t[r];
    if (s !== undefined) return s.exports;
    var n = t[r] = { exports: {} };
    var o = true;
    try {
      e[r](n, n.exports, __nccwpck_require__);
      o = false;
    } finally {
      if (o) delete t[r];
    }
    return n.exports;
  }
  if (typeof __nccwpck_require__ !== "undefined") {
    __nccwpck_require__.ab = __dirname + "/";
  }
  var r = {};
  (() => {
    var e = r;
    Object.defineProperty(e, "__esModule", { value: true });
    const t = __nccwpck_require__(876);
    const s = __nccwpck_require__(465);
    const n = __nccwpck_require__(698);
    const o = __nccwpck_require__(341);
    const a = __nccwpck_require__(224);
    const i = __nccwpck_require__(491);
    const c = new s.Hono();
    c.use((0, n.cors)());
    c.post("/kv", o.storeHandler);
    c.get("/videoplayback", i.streamHandler);
    c.all("*", a.proxyHandler);
    (0, t.serve)({ fetch: c.fetch });
  })();
  module.exports = r;
})();
