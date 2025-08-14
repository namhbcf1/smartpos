var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-5T0opL/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-5T0opL/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match, index) => {
    const mark = `@${index}`;
    groups.push([mark, match]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label) => {
  if (label === "*") {
    return "*";
  }
  const match = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match) {
    if (!patternCache[label]) {
      if (match[2]) {
        patternCache[label] = [label, match[1], new RegExp("^" + match[2] + "$")];
      } else {
        patternCache[label] = [label, match[1], true];
      }
    }
    return patternCache[label];
  }
  return null;
}, "getPattern");
var getPath = /* @__PURE__ */ __name((request) => {
  const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
  return match ? match[1] : "";
}, "getPath");
var getQueryStrings = /* @__PURE__ */ __name((url) => {
  const queryIndex = url.indexOf("?", 8);
  return queryIndex === -1 ? "" : "?" + url.slice(queryIndex + 1);
}, "getQueryStrings");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result[result.length - 1] === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((...paths) => {
  let p = "";
  let endsWithSlash = false;
  for (let path of paths) {
    if (p[p.length - 1] === "/") {
      p = p.slice(0, -1);
      endsWithSlash = true;
    }
    if (path[0] !== "/") {
      path = `/${path}`;
    }
    if (path === "/" && endsWithSlash) {
      p = `${p}/`;
    } else if (path !== "/") {
      p = `${p}${path}`;
    }
    if (path === "/" && p === "") {
      p = "/";
    }
  }
  return p;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (!path.match(/\:.+\?$/)) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return /%/.test(value) ? decodeURIComponent_(value) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var parse = /* @__PURE__ */ __name((cookie, name) => {
  const pairs = cookie.trim().split(";");
  return pairs.reduce((parsedCookie, pairStr) => {
    pairStr = pairStr.trim();
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      return parsedCookie;
    }
    const cookieName = pairStr.substring(0, valueStartPos).trim();
    if (name && name !== cookieName || !validCookieNameRegEx.test(cookieName)) {
      return parsedCookie;
    }
    let cookieValue = pairStr.substring(valueStartPos + 1).trim();
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = decodeURIComponent_(cookieValue);
    }
    return parsedCookie;
  }, {});
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  let cookie = `${name}=${value}`;
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  }
  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite}`;
  }
  if (opt.partitioned) {
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/utils/stream.js
var StreamingApi = /* @__PURE__ */ __name(class {
  constructor(writable, _readable) {
    this.abortSubscribers = [];
    this.writable = writable;
    this.writer = writable.getWriter();
    this.encoder = new TextEncoder();
    const reader = _readable.getReader();
    this.responseReadable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        done ? controller.close() : controller.enqueue(value);
      },
      cancel: () => {
        this.abortSubscribers.forEach((subscriber) => subscriber());
      }
    });
  }
  async write(input) {
    try {
      if (typeof input === "string") {
        input = this.encoder.encode(input);
      }
      await this.writer.write(input);
    } catch (e) {
    }
    return this;
  }
  async writeln(input) {
    await this.write(input + "\n");
    return this;
  }
  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }
  async close() {
    try {
      await this.writer.close();
    } catch (e) {
    }
  }
  async pipe(body) {
    this.writer.releaseLock();
    await body.pipeTo(this.writable, { preventClose: true });
    this.writer = this.writable.getWriter();
  }
  async onAbort(listener) {
    this.abortSubscribers.push(listener);
  }
}, "StreamingApi");

// node_modules/hono/dist/context.js
var __accessCheck = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setHeaders = /* @__PURE__ */ __name((headers, map = {}) => {
  Object.entries(map).forEach(([key, value]) => headers.set(key, value));
  return headers;
}, "setHeaders");
var _status;
var _executionCtx;
var _headers;
var _preparedHeaders;
var _res;
var _isFresh;
var Context = /* @__PURE__ */ __name(class {
  constructor(req, options) {
    this.env = {};
    this._var = {};
    this.finalized = false;
    this.error = void 0;
    __privateAdd(this, _status, 200);
    __privateAdd(this, _executionCtx, void 0);
    __privateAdd(this, _headers, void 0);
    __privateAdd(this, _preparedHeaders, void 0);
    __privateAdd(this, _res, void 0);
    __privateAdd(this, _isFresh, true);
    this.renderer = (content) => this.html(content);
    this.notFoundHandler = () => new Response();
    this.render = (...args) => this.renderer(...args);
    this.setRenderer = (renderer) => {
      this.renderer = renderer;
    };
    this.header = (name, value, options2) => {
      if (value === void 0) {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).delete(name);
        } else if (__privateGet(this, _preparedHeaders)) {
          delete __privateGet(this, _preparedHeaders)[name.toLocaleLowerCase()];
        }
        if (this.finalized) {
          this.res.headers.delete(name);
        }
        return;
      }
      if (options2?.append) {
        if (!__privateGet(this, _headers)) {
          __privateSet(this, _isFresh, false);
          __privateSet(this, _headers, new Headers(__privateGet(this, _preparedHeaders)));
          __privateSet(this, _preparedHeaders, {});
        }
        __privateGet(this, _headers).append(name, value);
      } else {
        if (__privateGet(this, _headers)) {
          __privateGet(this, _headers).set(name, value);
        } else {
          __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
          __privateGet(this, _preparedHeaders)[name.toLowerCase()] = value;
        }
      }
      if (this.finalized) {
        if (options2?.append) {
          this.res.headers.append(name, value);
        } else {
          this.res.headers.set(name, value);
        }
      }
    };
    this.status = (status) => {
      __privateSet(this, _isFresh, false);
      __privateSet(this, _status, status);
    };
    this.set = (key, value) => {
      this._var ?? (this._var = {});
      this._var[key] = value;
    };
    this.get = (key) => {
      return this._var ? this._var[key] : void 0;
    };
    this.newResponse = (data, arg, headers) => {
      if (__privateGet(this, _isFresh) && !headers && !arg && __privateGet(this, _status) === 200) {
        return new Response(data, {
          headers: __privateGet(this, _preparedHeaders)
        });
      }
      if (arg && typeof arg !== "number") {
        const headers2 = setHeaders(new Headers(arg.headers), __privateGet(this, _preparedHeaders));
        return new Response(data, {
          headers: headers2,
          status: arg.status
        });
      }
      const status = typeof arg === "number" ? arg : __privateGet(this, _status);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers());
      setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      if (__privateGet(this, _res)) {
        __privateGet(this, _res).headers.forEach((v, k) => {
          __privateGet(this, _headers)?.set(k, v);
        });
        setHeaders(__privateGet(this, _headers), __privateGet(this, _preparedHeaders));
      }
      headers ?? (headers = {});
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          __privateGet(this, _headers).set(k, v);
        } else {
          __privateGet(this, _headers).delete(k);
          for (const v2 of v) {
            __privateGet(this, _headers).append(k, v2);
          }
        }
      }
      return new Response(data, {
        status,
        headers: __privateGet(this, _headers)
      });
    };
    this.body = (data, arg, headers) => {
      return typeof arg === "number" ? this.newResponse(data, arg, headers) : this.newResponse(data, arg);
    };
    this.text = (text, arg, headers) => {
      if (!__privateGet(this, _preparedHeaders)) {
        if (__privateGet(this, _isFresh) && !headers && !arg) {
          return new Response(text);
        }
        __privateSet(this, _preparedHeaders, {});
      }
      __privateGet(this, _preparedHeaders)["content-type"] = TEXT_PLAIN;
      return typeof arg === "number" ? this.newResponse(text, arg, headers) : this.newResponse(text, arg);
    };
    this.json = (object, arg, headers) => {
      const body = JSON.stringify(object);
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "application/json; charset=UTF-8";
      return typeof arg === "number" ? this.newResponse(body, arg, headers) : this.newResponse(body, arg);
    };
    this.jsonT = (object, arg, headers) => {
      return this.json(object, arg, headers);
    };
    this.html = (html, arg, headers) => {
      __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, {});
      __privateGet(this, _preparedHeaders)["content-type"] = "text/html; charset=UTF-8";
      if (typeof html === "object") {
        if (!(html instanceof Promise)) {
          html = html.toString();
        }
        if (html instanceof Promise) {
          return html.then((html2) => resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {})).then((html2) => {
            return typeof arg === "number" ? this.newResponse(html2, arg, headers) : this.newResponse(html2, arg);
          });
        }
      }
      return typeof arg === "number" ? this.newResponse(html, arg, headers) : this.newResponse(html, arg);
    };
    this.redirect = (location, status = 302) => {
      __privateGet(this, _headers) ?? __privateSet(this, _headers, new Headers());
      __privateGet(this, _headers).set("Location", location);
      return this.newResponse(null, status);
    };
    this.streamText = (cb, arg, headers) => {
      headers ?? (headers = {});
      this.header("content-type", TEXT_PLAIN);
      this.header("x-content-type-options", "nosniff");
      this.header("transfer-encoding", "chunked");
      return this.stream(cb, arg, headers);
    };
    this.stream = (cb, arg, headers) => {
      const { readable, writable } = new TransformStream();
      const stream = new StreamingApi(writable, readable);
      cb(stream).finally(() => stream.close());
      return typeof arg === "number" ? this.newResponse(stream.responseReadable, arg, headers) : this.newResponse(stream.responseReadable, arg);
    };
    this.cookie = (name, value, opt) => {
      const cookie = serialize(name, value, opt);
      this.header("set-cookie", cookie, { append: true });
    };
    this.notFound = () => {
      return this.notFoundHandler(this);
    };
    this.req = req;
    if (options) {
      __privateSet(this, _executionCtx, options.executionCtx);
      this.env = options.env;
      if (options.notFoundHandler) {
        this.notFoundHandler = options.notFoundHandler;
      }
    }
  }
  get event() {
    if (__privateGet(this, _executionCtx) && "respondWith" in __privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (__privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    __privateSet(this, _isFresh, false);
    return __privateGet(this, _res) || __privateSet(this, _res, new Response("404 Not Found", { status: 404 }));
  }
  set res(_res2) {
    __privateSet(this, _isFresh, false);
    if (__privateGet(this, _res) && _res2) {
      __privateGet(this, _res).headers.delete("content-type");
      for (const [k, v] of __privateGet(this, _res).headers.entries()) {
        if (k === "set-cookie") {
          const cookies = __privateGet(this, _res).headers.getSetCookie();
          _res2.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res2.headers.append("set-cookie", cookie);
          }
        } else {
          _res2.headers.set(k, v);
        }
      }
    }
    __privateSet(this, _res, _res2);
    this.finalized = true;
  }
  get var() {
    return { ...this._var };
  }
  get runtime() {
    const global = globalThis;
    if (global?.Deno !== void 0) {
      return "deno";
    }
    if (global?.Bun !== void 0) {
      return "bun";
    }
    if (typeof global?.WebSocketPair === "function") {
      return "workerd";
    }
    if (typeof global?.EdgeRuntime === "string") {
      return "edge-light";
    }
    if (global?.fastly !== void 0) {
      return "fastly";
    }
    if (global?.__lagon__ !== void 0) {
      return "lagon";
    }
    if (global?.process?.release?.name === "node") {
      return "node";
    }
    return "other";
  }
}, "Context");
_status = /* @__PURE__ */ new WeakMap();
_executionCtx = /* @__PURE__ */ new WeakMap();
_headers = /* @__PURE__ */ new WeakMap();
_preparedHeaders = /* @__PURE__ */ new WeakMap();
_res = /* @__PURE__ */ new WeakMap();
_isFresh = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        if (context instanceof Context) {
          context.req.routeIndex = i;
        }
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (!handler) {
        if (context instanceof Context && context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      } else {
        try {
          res = await handler(context, () => {
            return dispatch(i + 1);
          });
        } catch (err) {
          if (err instanceof Error && context instanceof Context && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/http-exception.js
var HTTPException = /* @__PURE__ */ __name(class extends Error {
  constructor(status = 500, options) {
    super(options?.message);
    this.res = options?.res;
    this.status = status;
  }
  getResponse() {
    if (this.res) {
      return this.res;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
}, "HTTPException");

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = { all: false }) => {
  const contentType = request.headers.get("Content-Type");
  if (isFormDataContent(contentType)) {
    return parseFormData(request, options);
  }
  return {};
}, "parseBody");
function isFormDataContent(contentType) {
  if (contentType === null) {
    return false;
  }
  return contentType.startsWith("multipart/form-data") || contentType.startsWith("application/x-www-form-urlencoded");
}
__name(isFormDataContent, "isFormDataContent");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = {};
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] && isArrayField(form[key])) {
    appendToExistingArray(form[key], value);
  } else if (form[key]) {
    convertToNewArray(form, key, value);
  } else {
    form[key] = value;
  }
}, "handleParsingAllValues");
function isArrayField(field) {
  return Array.isArray(field);
}
__name(isArrayField, "isArrayField");
var appendToExistingArray = /* @__PURE__ */ __name((arr, value) => {
  arr.push(value);
}, "appendToExistingArray");
var convertToNewArray = /* @__PURE__ */ __name((form, key, value) => {
  form[key] = [form[key], value];
}, "convertToNewArray");

// node_modules/hono/dist/request.js
var __accessCheck2 = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet2 = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck2(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd2 = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet2 = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck2(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var _validatedData;
var _matchResult;
var HonoRequest = /* @__PURE__ */ __name(class {
  constructor(request, path = "/", matchResult = [[]]) {
    __privateAdd2(this, _validatedData, void 0);
    __privateAdd2(this, _matchResult, void 0);
    this.routeIndex = 0;
    this.bodyCache = {};
    this.cachedBody = (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
        return cachedBody;
      }
      if (bodyCache.arrayBuffer) {
        return (async () => {
          return await new Response(bodyCache.arrayBuffer)[key]();
        })();
      }
      return bodyCache[key] = raw2[key]();
    };
    this.raw = request;
    this.path = path;
    __privateSet2(this, _matchResult, matchResult);
    __privateSet2(this, _validatedData, {});
  }
  param(key) {
    return key ? this.getDecodedParam(key) : this.getAllDecodedParams();
  }
  getDecodedParam(key) {
    const paramKey = __privateGet2(this, _matchResult)[0][this.routeIndex][1][key];
    const param2 = this.getParamValue(paramKey);
    return param2 ? /\%/.test(param2) ? decodeURIComponent_(param2) : param2 : void 0;
  }
  getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(__privateGet2(this, _matchResult)[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.getParamValue(__privateGet2(this, _matchResult)[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? decodeURIComponent_(value) : value;
      }
    }
    return decoded;
  }
  getParamValue(paramKey) {
    return __privateGet2(this, _matchResult)[1] ? __privateGet2(this, _matchResult)[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name.toLowerCase()) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  cookie(key) {
    const cookie = this.raw.headers.get("Cookie");
    if (!cookie) {
      return;
    }
    const obj = parse(cookie);
    if (key) {
      const value = obj[key];
      return value;
    } else {
      return obj;
    }
  }
  async parseBody(options) {
    if (this.bodyCache.parsedBody) {
      return this.bodyCache.parsedBody;
    }
    const parsedBody = await parseBody(this, options);
    this.bodyCache.parsedBody = parsedBody;
    return parsedBody;
  }
  json() {
    return this.cachedBody("json");
  }
  text() {
    return this.cachedBody("text");
  }
  arrayBuffer() {
    return this.cachedBody("arrayBuffer");
  }
  blob() {
    return this.cachedBody("blob");
  }
  formData() {
    return this.cachedBody("formData");
  }
  addValidatedData(target, data) {
    __privateGet2(this, _validatedData)[target] = data;
  }
  valid(target) {
    return __privateGet2(this, _validatedData)[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get matchedRoutes() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route);
  }
  get routePath() {
    return __privateGet2(this, _matchResult)[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
  get headers() {
    return this.raw.headers;
  }
  get body() {
    return this.raw.body;
  }
  get bodyUsed() {
    return this.raw.bodyUsed;
  }
  get integrity() {
    return this.raw.integrity;
  }
  get keepalive() {
    return this.raw.keepalive;
  }
  get referrer() {
    return this.raw.referrer;
  }
  get signal() {
    return this.raw.signal;
  }
}, "HonoRequest");
_validatedData = /* @__PURE__ */ new WeakMap();
_matchResult = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/hono-base.js
var __accessCheck3 = /* @__PURE__ */ __name((obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
}, "__accessCheck");
var __privateGet3 = /* @__PURE__ */ __name((obj, member, getter) => {
  __accessCheck3(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
}, "__privateGet");
var __privateAdd3 = /* @__PURE__ */ __name((obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
}, "__privateAdd");
var __privateSet3 = /* @__PURE__ */ __name((obj, member, value, setter) => {
  __accessCheck3(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
}, "__privateSet");
var COMPOSED_HANDLER = Symbol("composedHandler");
function defineDynamicClass() {
  return class {
  };
}
__name(defineDynamicClass, "defineDynamicClass");
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  console.error(err);
  const message = "Internal Server Error";
  return c.text(message, 500);
}, "errorHandler");
var _path;
var _Hono = /* @__PURE__ */ __name(class extends defineDynamicClass() {
  constructor(options = {}) {
    super();
    this._basePath = "/";
    __privateAdd3(this, _path, "/");
    this.routes = [];
    this.notFoundHandler = notFoundHandler;
    this.errorHandler = errorHandler;
    this.onError = (handler) => {
      this.errorHandler = handler;
      return this;
    };
    this.notFound = (handler) => {
      this.notFoundHandler = handler;
      return this;
    };
    this.head = () => {
      console.warn("`app.head()` is no longer used. `app.get()` implicitly handles the HEAD method.");
      return this;
    };
    this.handleEvent = (event) => {
      return this.dispatch(event.request, event, void 0, event.request.method);
    };
    this.fetch = (request, Env, executionCtx) => {
      return this.dispatch(request, executionCtx, Env, request.method);
    };
    this.request = (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
        if (requestInit !== void 0) {
          input = new Request(input, requestInit);
        }
        return this.fetch(input, Env, executionCtx);
      }
      input = input.toString();
      const path = /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`;
      const req = new Request(path, requestInit);
      return this.fetch(req, Env, executionCtx);
    };
    this.fire = () => {
      addEventListener("fetch", (event) => {
        event.respondWith(this.dispatch(event.request, event, void 0, event.request.method));
      });
    };
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.map((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          __privateSet3(this, _path, args1);
        } else {
          this.addRoute(method, __privateGet3(this, _path), args1);
        }
        args.map((handler) => {
          if (typeof handler !== "string") {
            this.addRoute(method, __privateGet3(this, _path), handler);
          }
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      if (!method) {
        return this;
      }
      __privateSet3(this, _path, path);
      for (const m of [method].flat()) {
        handlers.map((handler) => {
          this.addRoute(m.toUpperCase(), __privateGet3(this, _path), handler);
        });
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        __privateSet3(this, _path, arg1);
      } else {
        handlers.unshift(arg1);
      }
      handlers.map((handler) => {
        this.addRoute(METHOD_NAME_ALL, __privateGet3(this, _path), handler);
      });
      return this;
    };
    const strict = options.strict ?? true;
    delete options.strict;
    Object.assign(this, options);
    this.getPath = strict ? options.getPath ?? getPath : getPathNoStrict;
  }
  clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.routes = this.routes;
    return clone;
  }
  route(path, app15) {
    const subApp = this.basePath(path);
    if (!app15) {
      return subApp;
    }
    app15.routes.map((r) => {
      let handler;
      if (app15.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app15.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  showRoutes() {
    const length = 8;
    this.routes.map((route) => {
      console.log(
        `\x1B[32m${route.method}\x1B[0m ${" ".repeat(length - route.method.length)} ${route.path}`
      );
    });
  }
  mount(path, applicationHandler, optionHandler) {
    const mergedPath = mergePath(this._basePath, path);
    const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      const options = optionHandler ? optionHandler(c) : [c.env, executionContext];
      const optionsArray = Array.isArray(options) ? options : [options];
      const queryStrings = getQueryStrings(c.req.url);
      const res = await applicationHandler(
        new Request(
          new URL((c.req.path.slice(pathPrefixLength) || "/") + queryStrings, c.req.url),
          c.req.raw
        ),
        ...optionsArray
      );
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  get routerName() {
    this.matchRoute("GET", "/");
    return this.router.name;
  }
  addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  matchRoute(method, path) {
    return this.router.match(method, path);
  }
  handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.matchRoute(method, path);
    const c = new Context(new HonoRequest(request, path, matchResult), {
      env,
      executionCtx,
      notFoundHandler: this.notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.notFoundHandler(c);
        });
      } catch (err) {
        return this.handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.notFoundHandler(c))
      ).catch((err) => this.handleError(err, c)) : res;
    }
    const composed = compose(matchResult[0], this.errorHandler, this.notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. You may forget returning Response object or `await next()`"
          );
        }
        return context.res;
      } catch (err) {
        return this.handleError(err, c);
      }
    })();
  }
}, "_Hono");
var Hono = _Hono;
_path = /* @__PURE__ */ new WeakMap();

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class {
  constructor() {
    this.children = {};
  }
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.children[regexpStr];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[regexpStr] = new Node();
        if (name !== "") {
          node.varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.varIndex]);
      }
    } else {
      node = this.children[token];
      if (!node) {
        if (Object.keys(this.children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.children[k];
      return (typeof c.varIndex === "number" ? `(${k})@${c.varIndex}` : k) + c.buildRegExpStr();
    });
    if (typeof this.index === "number") {
      strList.unshift(`#${this.index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  constructor() {
    this.context = { varIndex: 0 };
    this.root = new Node();
  }
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.root.insert(tokens, index, paramAssoc, this.context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (typeof handlerIndex !== "undefined") {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (typeof paramIndex !== "undefined") {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
var methodNames = [METHOD_NAME_ALL, ...METHODS].map((method) => method.toUpperCase());
var emptyParam = [];
var nullMatcher = [/^$/, [], {}];
var wildcardRegExpCache = {};
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ?? (wildcardRegExpCache[path] = new RegExp(
    path === "*" ? "" : `^${path.replace(/\/\*/, "(?:|/.*)")}$`
  ));
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = {};
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = {};
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, {}]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = {};
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  constructor() {
    this.name = "RegExpRouter";
    this.middleware = { [METHOD_NAME_ALL]: {} };
    this.routes = { [METHOD_NAME_ALL]: {} };
  }
  add(method, path, handler) {
    var _a;
    const { middleware, routes } = this;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (methodNames.indexOf(method) === -1) {
      methodNames.push(method);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = {};
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a2;
          (_a2 = middleware[m])[path] || (_a2[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a = middleware[method])[path] || (_a[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a2;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a2 = routes[m])[path2] || (_a2[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match = path2.match(matcher[0]);
      if (!match) {
        return [[], emptyParam];
      }
      const index = match.indexOf("", 1);
      return [matcher[1][index], match];
    };
    return this.match(method, path);
  }
  buildAllMatchers() {
    const matchers = {};
    methodNames.forEach((method) => {
      matchers[method] = this.buildMatcher(method) || matchers[METHOD_NAME_ALL];
    });
    this.middleware = this.routes = void 0;
    return matchers;
  }
  buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.middleware, this.routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute || (hasOwnRoute = true);
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  constructor(init) {
    this.name = "SmartRouter";
    this.routers = [];
    this.routes = [];
    Object.assign(this, init);
  }
  add(method, path, handler) {
    if (!this.routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.routes) {
      throw new Error("Fatal error");
    }
    const { routers, routes } = this;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        routes.forEach((args) => {
          router.add(...args);
        });
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.routers = [router];
      this.routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.routes || this.routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var Node2 = /* @__PURE__ */ __name(class {
  constructor(method, handler, children) {
    this.order = 0;
    this.params = {};
    this.children = children || {};
    this.methods = [];
    this.name = "";
    if (method && handler) {
      const m = {};
      m[method] = { handler, possibleKeys: [], score: 0, name: this.name };
      this.methods = [m];
    }
    this.patterns = [];
  }
  insert(method, path, handler) {
    this.name = `${method} ${path}`;
    this.order = ++this.order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    const parentPatterns = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      if (Object.keys(curNode.children).includes(p)) {
        parentPatterns.push(...curNode.patterns);
        curNode = curNode.children[p];
        const pattern2 = getPattern(p);
        if (pattern2) {
          possibleKeys.push(pattern2[1]);
        }
        continue;
      }
      curNode.children[p] = new Node2();
      const pattern = getPattern(p);
      if (pattern) {
        curNode.patterns.push(pattern);
        parentPatterns.push(...curNode.patterns);
        possibleKeys.push(pattern[1]);
      }
      parentPatterns.push(...curNode.patterns);
      curNode = curNode.children[p];
    }
    if (!curNode.methods.length) {
      curNode.methods = [];
    }
    const m = {};
    const handlerSet = {
      handler,
      possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
      name: this.name,
      score: this.order
    };
    m[method] = handlerSet;
    curNode.methods.push(m);
    return curNode;
  }
  gHSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.methods.length; i < len; i++) {
      const m = node.methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = {};
        handlerSet.possibleKeys.forEach((key) => {
          const processed = processedSet[handlerSet.name];
          handlerSet.params[key] = params[key] && !processed ? params[key] : nodeParams[key] ?? params[key];
          processedSet[handlerSet.name] = true;
        });
        handlerSets.push(handlerSet);
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.params = {};
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.children[part];
        if (nextNode) {
          nextNode.params = node.params;
          if (isLast === true) {
            if (nextNode.children["*"]) {
              handlerSets.push(...this.gHSets(nextNode.children["*"], method, node.params, {}));
            }
            handlerSets.push(...this.gHSets(nextNode, method, node.params, {}));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.patterns.length; k < len3; k++) {
          const pattern = node.patterns[k];
          const params = { ...node.params };
          if (pattern === "*") {
            const astNode = node.children["*"];
            if (astNode) {
              handlerSets.push(...this.gHSets(astNode, method, node.params, {}));
              tempNodes.push(astNode);
            }
            continue;
          }
          if (part === "") {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp && matcher.test(restPathString)) {
            params[name] = restPathString;
            handlerSets.push(...this.gHSets(child, method, node.params, params));
            continue;
          }
          if (matcher === true || matcher instanceof RegExp && matcher.test(part)) {
            if (typeof key === "string") {
              params[name] = part;
              if (isLast === true) {
                handlerSets.push(...this.gHSets(child, method, params, node.params));
                if (child.children["*"]) {
                  handlerSets.push(...this.gHSets(child.children["*"], method, params, node.params));
                }
              } else {
                child.params = params;
                tempNodes.push(child);
              }
            }
          }
        }
      }
      curNodes = tempNodes;
    }
    const results = handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [results.map(({ handler, params }) => [handler, params])];
  }
}, "Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  constructor() {
    this.name = "TrieRouter";
    this.node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (const p of results) {
        this.node.insert(method, p, handler);
      }
      return;
    }
    this.node.insert(method, path, handler);
  }
  match(method, path) {
    return this.node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// src/middleware/security.ts
var RATE_LIMITS = {
  "default": { limit: 1e3, window: 60 },
  // 1000 requests per minute
  "auth": { limit: 100, window: 60 },
  // 100 auth requests per minute
  "critical": { limit: 500, window: 60 }
  // 500 requests per minute for critical operations
};
var rateLimit = /* @__PURE__ */ __name((tier = "default") => {
  const { limit, window } = RATE_LIMITS[tier] || RATE_LIMITS.default;
  return async (c, next) => {
    if (!c.env || !c.env.SESSIONS) {
      console.warn("Rate limiting KV binding missing, skipping rate limit");
      return next();
    }
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
    const route = c.req.path;
    const key = `ratelimit:${tier}:${ip}:${route}`;
    try {
      let counter = await c.env.SESSIONS.get(key);
      let count = counter ? parseInt(counter, 10) + 1 : 1;
      if (count > limit) {
        return c.json({
          success: false,
          message: "Rate limit exceeded. Please try again later.",
          error: "RATE_LIMIT_EXCEEDED"
        }, 429);
      }
      try {
        await c.env.SESSIONS.put(key, count.toString(), { expirationTtl: window });
      } catch (kvError) {
        console.warn("KV put failed, continuing without rate limit update:", kvError);
      }
      c.header("X-RateLimit-Limit", limit.toString());
      c.header("X-RateLimit-Remaining", (limit - count).toString());
      return next();
    } catch (error) {
      console.warn("Rate limiting error, continuing without rate limit:", error);
      return next();
    }
  };
}, "rateLimit");
var securityHeaders = /* @__PURE__ */ __name(async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' *.workers.dev *.pages.dev;"
  );
  await next();
}, "securityHeaders");
var corsSecurity = /* @__PURE__ */ __name(async (c, next) => {
  const origin = c.req.header("Origin");
  const allowedOrigins = [
    "https://smartpos-web.pages.dev",
    ,
    // Previous deployment with Suppliers Management (API path issue)
    "https://1f0934d1.smartpos-web.pages.dev",
    // Previous deployment with Suppliers Management (API path fixed, missing api import)
    "https://bc283575.smartpos-web.pages.dev",
    // Current deployment with Suppliers Management (api import fixed)
    "http://localhost:5173",
    // Local development
    "http://localhost:3000"
    // Alternative local development port
  ];
  if (origin && allowedOrigins.includes(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
  } else {
    console.log("CORS: Origin not allowed:", origin);
    console.log("CORS: Allowed origins:", allowedOrigins);
    if (origin) {
      c.header("Access-Control-Allow-Origin", origin);
    }
  }
  c.header("Access-Control-Allow-Credentials", "true");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, X-Client-Version, Origin");
  c.header("Access-Control-Max-Age", "86400");
  if (c.req.method === "OPTIONS") {
    console.log("CORS: Handling preflight request for origin:", origin);
    return c.text("", 204);
  }
  await next();
}, "corsSecurity");
var sqlInjectionProtection = /* @__PURE__ */ __name(async (c, next) => {
  const url = c.req.url;
  const body = await c.req.text();
  c.req.raw = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.header(),
    body: body ? body : void 0
  });
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i
  ];
  for (const pattern of sqlPatterns) {
    if (pattern.test(url) || body && pattern.test(body)) {
      console.error("Possible SQL injection attempt detected:", { url, body: body.substring(0, 100) });
      return c.json({
        success: false,
        message: "Possible SQL injection detected",
        error: "SECURITY_VIOLATION"
      }, 403);
    }
  }
  await next();
}, "sqlInjectionProtection");
var accessLogger = /* @__PURE__ */ __name(async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const userAgent = c.req.header("User-Agent") || "unknown";
  await next();
  const end = Date.now();
  const responseTime = end - start;
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${method} ${url} ${c.res.status} ${responseTime}ms - ${ip} ${userAgent}`);
}, "accessLogger");
var auditLogger = /* @__PURE__ */ __name(async (c, action, details = {}) => {
  if (!c.env || !c.env.DB) {
    console.error("Audit logging failed: DB binding missing");
    return;
  }
  try {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
    const userAgent = c.req.header("User-Agent") || "unknown";
    const user = c.get("jwtPayload")?.sub || "anonymous";
    await c.env.DB.prepare(`
      INSERT INTO activity_logs 
      (user_id, action, ip_address, user_agent, details, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user,
      action,
      ip,
      userAgent,
      JSON.stringify(details)
    ).run();
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
}, "auditLogger");

// src/db/migrations.ts
var migrations = [
  {
    version: 3,
    description: "Recreate products and categories tables with correct schema",
    sql: `
      -- Drop existing tables to recreate with correct schema
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS categories;

      -- Create categories table
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );

      -- Create products table with all required columns
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE,
        category_id INTEGER,
        price REAL NOT NULL DEFAULT 0,
        cost_price REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        stock_quantity INTEGER DEFAULT 0,
        stock_alert_threshold INTEGER DEFAULT 5,
        is_active INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        deleted_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `
  },
  {
    version: 4,
    description: "Create inventory and sales tables",
    sql: `
      -- Create inventory_transactions table
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock_in', 'stock_out', 'transfer_in', 'transfer_out', 'adjustment')),
        quantity INTEGER NOT NULL,
        cost_price REAL,
        reference_number TEXT,
        supplier_name TEXT,
        from_store_id INTEGER,
        to_store_id INTEGER,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      -- Create sales table
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        total_amount REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        discount_amount REAL NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'cash',
        payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );

      -- Create sale_items table
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `
  },
  {
    version: 4,
    description: "Create suppliers table",
    sql: `
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_number TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `
  },
  {
    version: 5,
    description: "Insert sample suppliers data",
    sql: `
      INSERT OR IGNORE INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
      ('C\xF4ng ty TNHH ABC', 'Nguy\u1EC5n V\u0103n A', 'contact@abc.com', '0123456789', '123 \u0110\u01B0\u1EDDng ABC, TP.HCM', 1),
      ('Nh\xE0 ph\xE2n ph\u1ED1i XYZ', 'Tr\u1EA7n Th\u1ECB B', 'info@xyz.com', '0987654321', '456 \u0110\u01B0\u1EDDng XYZ, H\xE0 N\u1ED9i', 1),
      ('C\xF4ng ty Linh ki\u1EC7n DEF', 'L\xEA V\u0103n C', 'sales@def.com', '0369852147', '789 \u0110\u01B0\u1EDDng DEF, \u0110\xE0 N\u1EB5ng', 1)
    `
  },
  {
    version: 6,
    description: "Create customers table",
    sql: `
      -- Create customers table
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        birthday DATE,
        loyalty_points INTEGER NOT NULL DEFAULT 0,
        customer_group TEXT NOT NULL DEFAULT 'regular' CHECK (customer_group IN ('regular', 'vip', 'wholesale', 'business')),
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        deleted_at DATETIME
      );

      -- Create indexes for customers table
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_group ON customers(customer_group);

      -- Insert demo customers
      INSERT OR IGNORE INTO customers (full_name, phone, email, address, loyalty_points, customer_group)
      VALUES
        ('Nguy\u1EC5n V\u0103n A', '0901234567', 'nguyenvana@example.com', 'H\u1ED3 Ch\xED Minh', 100, 'regular'),
        ('Tr\u1EA7n Th\u1ECB B', '0912345678', 'tranthib@example.com', 'H\xE0 N\u1ED9i', 250, 'vip'),
        ('L\xEA V\u0103n C', '0923456789', 'levanc@example.com', '\u0110\xE0 N\u1EB5ng', 50, 'regular'),
        ('Ph\u1EA1m Th\u1ECB D', '0934567890', 'phamthid@example.com', 'C\u1EA7n Th\u01A1', 300, 'vip');
    `
  },
  {
    version: 7,
    description: "Add full_name column to customers table",
    sql: `
      -- Add full_name column to customers table
      ALTER TABLE customers ADD COLUMN full_name TEXT;

      -- Update full_name with combined first_name and last_name
      UPDATE customers
      SET full_name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
      WHERE full_name IS NULL;

      -- Clean up extra spaces
      UPDATE customers
      SET full_name = TRIM(full_name)
      WHERE full_name IS NOT NULL;
    `
  },
  {
    version: 10,
    description: "Add tax_number and notes columns to suppliers table",
    sql: `
      -- Add tax_number column if not exists
      ALTER TABLE suppliers ADD COLUMN tax_number TEXT;

      -- Add notes column if not exists
      ALTER TABLE suppliers ADD COLUMN notes TEXT;
    `
  },
  {
    version: 11,
    description: "Add promotions and discounts tables",
    sql: `
      -- Create promotions table
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        promotion_type TEXT NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
        discount_value REAL NOT NULL DEFAULT 0,
        minimum_amount REAL DEFAULT 0,
        maximum_discount REAL DEFAULT 0,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        usage_limit INTEGER DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'categories', 'products', 'customers')),
        conditions TEXT, -- JSON string for complex conditions
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      );

      -- Create promotion_products table for product-specific promotions
      CREATE TABLE IF NOT EXISTS promotion_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        promotion_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(promotion_id, product_id)
      );

      -- Create promotion_categories table for category-specific promotions
      CREATE TABLE IF NOT EXISTS promotion_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        promotion_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        UNIQUE(promotion_id, category_id)
      );

      -- Create promotion_usage table to track usage
      CREATE TABLE IF NOT EXISTS promotion_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        promotion_id INTEGER NOT NULL,
        sale_id INTEGER NOT NULL,
        discount_amount REAL NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      -- Insert sample promotions
      INSERT OR IGNORE INTO promotions (name, description, promotion_type, discount_value, minimum_amount, maximum_discount, start_date, end_date, usage_limit, is_active, applies_to)
      VALUES
        ('Gi\u1EA3m gi\xE1 10%', 'Gi\u1EA3m gi\xE1 10% cho t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m', 'percentage', 10, 100000, 50000, datetime('now', '-7 days'), datetime('now', '+30 days'), 100, 1, 'all'),
        ('Gi\u1EA3m 50k cho \u0111\u01A1n t\u1EEB 500k', 'Gi\u1EA3m 50.000\u0111 cho \u0111\u01A1n h\xE0ng t\u1EEB 500.000\u0111', 'fixed_amount', 50000, 500000, 50000, datetime('now', '-3 days'), datetime('now', '+60 days'), 200, 1, 'all'),
        ('Mua 2 t\u1EB7ng 1', 'Mua 2 s\u1EA3n ph\u1EA9m t\u1EB7ng 1 s\u1EA3n ph\u1EA9m c\xF9ng lo\u1EA1i', 'buy_x_get_y', 0, 0, 0, datetime('now', '-1 day'), datetime('now', '+14 days'), 50, 1, 'products');
    `
  }
];
var SCHEMA_VERSION_TABLE = `CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
)`;
async function runMigrations(env) {
  try {
    console.log("Initializing migration system...");
    await env.DB.prepare(SCHEMA_VERSION_TABLE).run();
    const currentVersion = await getCurrentVersion(env);
    console.log(`Current schema version: ${currentVersion}`);
    const pendingMigrations = migrations.filter((m) => m.version > currentVersion);
    if (pendingMigrations.length === 0) {
      console.log("Database schema is up to date");
      return;
    }
    console.log(`Found ${pendingMigrations.length} migrations to apply`);
    for (const migration of pendingMigrations) {
      try {
        console.log(`Applying migration ${migration.version}: ${migration.description}`);
        const statements = migration.sql.split(";").filter((s) => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            await env.DB.prepare(statement.trim()).run();
          }
        }
        await env.DB.prepare(
          "INSERT INTO schema_version (version, description) VALUES (?, ?)"
        ).bind(migration.version, migration.description).run();
        console.log(`Successfully applied migration ${migration.version}`);
      } catch (error) {
        console.error(`Error applying migration ${migration.version}:`, error);
        console.log(`Skipping migration ${migration.version} due to error`);
      }
    }
    console.log("Migration process completed");
  } catch (error) {
    console.error("Migration system error:", error);
  }
}
__name(runMigrations, "runMigrations");
async function getCurrentVersion(env) {
  try {
    const result = await env.DB.prepare(
      "SELECT MAX(version) as version FROM schema_version"
    ).first();
    return result?.version ?? 0;
  } catch (error) {
    console.error("Error fetching schema version:", error);
    return 0;
  }
}
__name(getCurrentVersion, "getCurrentVersion");
async function checkAndRunMigrations(env) {
  try {
    await runMigrations(env);
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
__name(checkAndRunMigrations, "checkAndRunMigrations");

// src/durable_objects/NotificationObject.ts
var NotificationObject = class {
  state;
  sessions = /* @__PURE__ */ new Set();
  messageBuffer = [];
  maxBufferSize = 100;
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      const storedBuffer = await this.state.storage.get("messageBuffer");
      if (storedBuffer) {
        this.messageBuffer = storedBuffer;
      }
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/connect") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      server.accept();
      for (const message of this.messageBuffer) {
        server.send(JSON.stringify(message));
      }
      server.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(event.data);
          await this.handleMessage(server, message);
        } catch (error) {
          server.send(JSON.stringify({
            type: "error",
            message: "\u0110\u1ECBnh d\u1EA1ng tin nh\u1EAFn kh\xF4ng h\u1EE3p l\u1EC7"
          }));
        }
      });
      server.addEventListener("close", () => {
        this.sessions.delete(server);
      });
      server.addEventListener("error", () => {
        this.sessions.delete(server);
      });
      this.sessions.add(server);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    if (path === "/broadcast" && request.method === "POST") {
      const message = await request.json();
      if (!message.type || !message.data) {
        return new Response(JSON.stringify({
          error: "Invalid message format"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      message.timestamp = (/* @__PURE__ */ new Date()).toISOString();
      this.broadcastMessage(message);
      return new Response(JSON.stringify({
        success: true,
        message: "Message broadcasted successfully"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response("Not found", { status: 404 });
  }
  // Xử lý tin nhắn từ client
  async handleMessage(client, message) {
    if (!message.type) {
      client.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
      return;
    }
    switch (message.type) {
      case "ping":
        client.send(JSON.stringify({ type: "pong", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
        break;
      case "message":
        message.timestamp = (/* @__PURE__ */ new Date()).toISOString();
        this.broadcastMessage(message);
        break;
      default:
        client.send(JSON.stringify({
          type: "error",
          message: "Unknown message type"
        }));
    }
  }
  // Broadcast tin nhắn tới tất cả clients
  broadcastMessage(message) {
    this.messageBuffer.push(message);
    if (this.messageBuffer.length > this.maxBufferSize) {
      this.messageBuffer.shift();
    }
    this.state.storage.put("messageBuffer", this.messageBuffer);
    const messageStr = JSON.stringify(message);
    for (const session of this.sessions) {
      try {
        session.send(messageStr);
      } catch (error) {
        this.sessions.delete(session);
      }
    }
  }
};
__name(NotificationObject, "NotificationObject");

// src/durable_objects/InventorySyncObject.ts
var InventorySyncObject = class {
  state;
  clients = /* @__PURE__ */ new Map();
  inventoryState = /* @__PURE__ */ new Map();
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      const storedInventory = await this.state.storage.get("inventory");
      if (storedInventory) {
        this.inventoryState = new Map(Object.entries(storedInventory));
      }
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/sync") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      server.accept();
      const clientId = url.searchParams.get("clientId") || crypto.randomUUID();
      const storeId = url.searchParams.get("storeId") || "1";
      const clientKey = `${storeId}:${clientId}`;
      server.send(JSON.stringify({
        type: "init",
        data: Object.fromEntries(this.inventoryState)
      }));
      server.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(event.data);
          await this.handleMessage(clientKey, server, message);
        } catch (error) {
          server.send(JSON.stringify({
            type: "error",
            message: "Invalid message format"
          }));
        }
      });
      server.addEventListener("close", () => {
        this.clients.delete(clientKey);
      });
      server.addEventListener("error", () => {
        this.clients.delete(clientKey);
      });
      this.clients.set(clientKey, server);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    if (path === "/update" && request.method === "POST") {
      try {
        const { productId, quantity, action, storeId = "1" } = await request.json();
        if (!productId || quantity === void 0 || !action) {
          return new Response(JSON.stringify({
            success: false,
            message: "Missing required fields"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        await this.updateInventory(productId, quantity, action, storeId);
        return new Response(JSON.stringify({
          success: true,
          message: "Inventory updated successfully"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: "Error updating inventory",
          error: error instanceof Error ? error.message : "Unknown error"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return new Response("Not found", { status: 404 });
  }
  // Xử lý tin nhắn từ client
  async handleMessage(clientKey, client, message) {
    const { type, data } = message;
    if (!type) {
      client.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
      return;
    }
    switch (type) {
      case "ping":
        client.send(JSON.stringify({
          type: "pong",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }));
        break;
      case "update":
        if (!data || !data.productId || data.quantity === void 0 || !data.action) {
          client.send(JSON.stringify({
            type: "error",
            message: "Invalid update data"
          }));
          return;
        }
        const { productId, quantity, action, storeId = "1" } = data;
        await this.updateInventory(productId, quantity, action, storeId);
        client.send(JSON.stringify({
          type: "update_ack",
          data: {
            productId,
            success: true,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        }));
        break;
      default:
        client.send(JSON.stringify({
          type: "error",
          message: "Unknown message type"
        }));
    }
  }
  // Cập nhật inventory và broadcast
  async updateInventory(productId, quantity, action, storeId) {
    await this.state.blockConcurrencyWhile(async () => {
      const inventoryKey = `${storeId}:${productId}`;
      const currentInventory = this.inventoryState.get(inventoryKey) || { quantity: 0 };
      let newQuantity = currentInventory.quantity;
      switch (action) {
        case "add":
          newQuantity += quantity;
          break;
        case "subtract":
          newQuantity = Math.max(0, newQuantity - quantity);
          break;
        case "set":
          newQuantity = Math.max(0, quantity);
          break;
        default:
          throw new Error(`Invalid action: ${action}`);
      }
      const updatedInventory = {
        ...currentInventory,
        quantity: newQuantity,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.inventoryState.set(inventoryKey, updatedInventory);
      await this.state.storage.put("inventory", Object.fromEntries(this.inventoryState));
      this.broadcastUpdate(inventoryKey, updatedInventory);
    });
  }
  // Broadcast cập nhật tới tất cả clients
  broadcastUpdate(inventoryKey, inventoryData) {
    const [storeId] = inventoryKey.split(":");
    const updateMessage = JSON.stringify({
      type: "inventory_update",
      data: {
        key: inventoryKey,
        ...inventoryData
      }
    });
    for (const [clientKey, client] of this.clients.entries()) {
      const [clientStoreId] = clientKey.split(":");
      if (clientStoreId === storeId) {
        try {
          client.send(updateMessage);
        } catch (error) {
          this.clients.delete(clientKey);
        }
      }
    }
  }
};
__name(InventorySyncObject, "InventorySyncObject");

// src/durable_objects/POSSyncObject.ts
var POSSyncObject = class {
  state;
  sessions = /* @__PURE__ */ new Set();
  activeTransactions = /* @__PURE__ */ new Map();
  constructor(state) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      const storedTransactions = await this.state.storage.get("activeTransactions");
      if (storedTransactions) {
        this.activeTransactions = new Map(Object.entries(storedTransactions));
      }
    });
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/connect") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      server.accept();
      const storeId = url.searchParams.get("storeId") || "1";
      const deviceId = url.searchParams.get("deviceId") || "unknown";
      const clientId = `${storeId}:${deviceId}`;
      server.send(JSON.stringify({
        type: "init",
        storeId,
        deviceId,
        activeTransactions: Object.fromEntries(this.activeTransactions)
      }));
      server.addEventListener("message", async (event) => {
        try {
          const message = JSON.parse(event.data);
          await this.handleMessage(clientId, server, message);
        } catch (error) {
          server.send(JSON.stringify({
            type: "error",
            message: "Invalid message format"
          }));
        }
      });
      server.addEventListener("close", () => {
        this.sessions.delete(server);
      });
      server.addEventListener("error", () => {
        this.sessions.delete(server);
      });
      this.sessions.add(server);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    if (path === "/transaction" && request.method === "POST") {
      try {
        const { transactionId, action, data, storeId = "1" } = await request.json();
        if (!transactionId || !action) {
          return new Response(JSON.stringify({
            success: false,
            message: "Missing required parameters"
          }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        switch (action) {
          case "create":
            await this.createTransaction(transactionId, data, storeId);
            break;
          case "update":
            await this.updateTransaction(transactionId, data, storeId);
            break;
          case "complete":
            await this.completeTransaction(transactionId, data, storeId);
            break;
          case "cancel":
            await this.cancelTransaction(transactionId, storeId);
            break;
          default:
            return new Response(JSON.stringify({
              success: false,
              message: "Invalid action"
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
        }
        return new Response(JSON.stringify({
          success: true,
          message: "Transaction processed successfully"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: "Failed to process transaction",
          error: error instanceof Error ? error.message : "Unknown error"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return new Response("Not found", { status: 404 });
  }
  // Handle messages from WebSocket
  async handleMessage(clientId, client, message) {
    const { type, data } = message;
    if (!type) {
      client.send(JSON.stringify({
        type: "error",
        message: "Invalid message type"
      }));
      return;
    }
    switch (type) {
      case "ping":
        client.send(JSON.stringify({
          type: "pong",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }));
        break;
      case "transaction":
        if (!data || !data.transactionId || !data.action) {
          client.send(JSON.stringify({
            type: "error",
            message: "Invalid transaction data"
          }));
          return;
        }
        const { transactionId, action, payload, storeId = "1" } = data;
        try {
          switch (action) {
            case "create":
              await this.createTransaction(transactionId, payload, storeId);
              break;
            case "update":
              await this.updateTransaction(transactionId, payload, storeId);
              break;
            case "complete":
              await this.completeTransaction(transactionId, payload, storeId);
              break;
            case "cancel":
              await this.cancelTransaction(transactionId, storeId);
              break;
            default:
              throw new Error(`Invalid transaction action: ${action}`);
          }
          client.send(JSON.stringify({
            type: "ack",
            transactionId,
            action
          }));
        } catch (error) {
          client.send(JSON.stringify({
            type: "error",
            transactionId,
            message: error instanceof Error ? error.message : "Unknown error"
          }));
        }
        break;
      default:
        client.send(JSON.stringify({
          type: "error",
          message: `Unknown message type: ${type}`
        }));
    }
  }
  // Create a new transaction
  async createTransaction(transactionId, data, storeId) {
    const key = `${storeId}:${transactionId}`;
    await this.state.blockConcurrencyWhile(async () => {
      if (this.activeTransactions.has(key)) {
        throw new Error(`Transaction ${transactionId} already exists`);
      }
      const transaction = {
        id: transactionId,
        storeId,
        status: "active",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...data
      };
      this.activeTransactions.set(key, transaction);
      await this.state.storage.put("activeTransactions", Object.fromEntries(this.activeTransactions));
      this.broadcastUpdate({
        type: "transaction_created",
        storeId,
        transaction
      });
    });
  }
  // Update an existing transaction
  async updateTransaction(transactionId, data, storeId) {
    const key = `${storeId}:${transactionId}`;
    await this.state.blockConcurrencyWhile(async () => {
      const transaction = this.activeTransactions.get(key);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      const updatedTransaction = {
        ...transaction,
        ...data,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.activeTransactions.set(key, updatedTransaction);
      await this.state.storage.put("activeTransactions", Object.fromEntries(this.activeTransactions));
      this.broadcastUpdate({
        type: "transaction_updated",
        storeId,
        transaction: updatedTransaction
      });
    });
  }
  // Complete a transaction
  async completeTransaction(transactionId, data, storeId) {
    const key = `${storeId}:${transactionId}`;
    await this.state.blockConcurrencyWhile(async () => {
      const transaction = this.activeTransactions.get(key);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      const completedTransaction = {
        ...transaction,
        ...data,
        status: "completed",
        completedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.activeTransactions.delete(key);
      await this.state.storage.put("activeTransactions", Object.fromEntries(this.activeTransactions));
      this.broadcastUpdate({
        type: "transaction_completed",
        storeId,
        transaction: completedTransaction
      });
    });
  }
  // Cancel a transaction
  async cancelTransaction(transactionId, storeId) {
    const key = `${storeId}:${transactionId}`;
    await this.state.blockConcurrencyWhile(async () => {
      const transaction = this.activeTransactions.get(key);
      if (!transaction) {
        throw new Error(`Transaction ${transactionId} not found`);
      }
      const cancelledTransaction = {
        ...transaction,
        status: "cancelled",
        cancelledAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.activeTransactions.delete(key);
      await this.state.storage.put("activeTransactions", Object.fromEntries(this.activeTransactions));
      this.broadcastUpdate({
        type: "transaction_cancelled",
        storeId,
        transaction: cancelledTransaction
      });
    });
  }
  // Broadcast update to all connected clients
  broadcastUpdate(message) {
    const { storeId } = message;
    const messageString = JSON.stringify(message);
    for (const session of this.sessions) {
      try {
        session.send(messageString);
      } catch (error) {
        this.sessions.delete(session);
      }
    }
  }
};
__name(POSSyncObject, "POSSyncObject");

// node_modules/hono/dist/utils/jwt/jwt.js
var jwt_exports = {};
__export(jwt_exports, {
  decode: () => decode,
  sign: () => sign,
  verify: () => verify
});

// node_modules/hono/dist/utils/encode.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// node_modules/hono/dist/utils/jwt/types.js
var JwtAlgorithmNotImplemented = /* @__PURE__ */ __name(class extends Error {
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
}, "JwtAlgorithmNotImplemented");
var JwtTokenInvalid = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
}, "JwtTokenInvalid");
var JwtTokenNotBefore = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
}, "JwtTokenNotBefore");
var JwtTokenExpired = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
}, "JwtTokenExpired");
var JwtTokenIssuedAt = /* @__PURE__ */ __name(class extends Error {
  constructor(currentTimestamp, iat) {
    super(`Incorrect "iat" claim must be a older than "${currentTimestamp}" (iat: "${iat}")`);
    this.name = "JwtTokenIssuedAt";
  }
}, "JwtTokenIssuedAt");
var JwtTokenSignatureMismatched = /* @__PURE__ */ __name(class extends Error {
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
}, "JwtTokenSignatureMismatched");

// node_modules/hono/dist/utils/jwt/jwt.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part))).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
var param = /* @__PURE__ */ __name((name) => {
  switch (name.toUpperCase()) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}, "param");
var signing = /* @__PURE__ */ __name(async (data, secret, alg = "HS256") => {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  const utf8Encoder2 = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    utf8Encoder2.encode(secret),
    param(alg),
    false,
    [
      "sign"
      /* Sign */
    ]
  );
  return await crypto.subtle.sign(param(alg), cryptoKey, utf8Encoder2.encode(data));
}, "signing");
var sign = /* @__PURE__ */ __name(async (payload, secret, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  const encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(partialToken, secret, alg);
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, secret, alg = "HS256") => {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { payload } = decode(token);
  const now = Math.floor(Date.now() / 1e3);
  if (payload.nbf && payload.nbf > now) {
    throw new JwtTokenNotBefore(token);
  }
  if (payload.exp && payload.exp <= now) {
    throw new JwtTokenExpired(token);
  }
  if (payload.iat && now < payload.iat) {
    throw new JwtTokenIssuedAt(now, payload.iat);
  }
  const signaturePart = tokenParts.slice(0, 2).join(".");
  const signature = await signing(signaturePart, secret, alg);
  const encodedSignature = encodeSignaturePart(signature);
  if (encodedSignature !== tokenParts[2]) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var decode = /* @__PURE__ */ __name((token) => {
  try {
    const [h, p] = token.split(".");
    const header = decodeJwtPart(h);
    const payload = decodeJwtPart(p);
    return {
      header,
      payload
    };
  } catch (e) {
    throw new JwtTokenInvalid(token);
  }
}, "decode");

// node_modules/hono/dist/middleware/jwt/index.js
var verify2 = jwt_exports.verify;
var decode2 = jwt_exports.decode;
var sign2 = jwt_exports.sign;

// src/middleware/validate.ts
var validate = /* @__PURE__ */ __name((schema) => {
  return async (c, next) => {
    try {
      const contentType = c.req.header("content-type") || "";
      let requestData;
      if (contentType.includes("application/json")) {
        requestData = await c.req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await c.req.formData();
        requestData = Object.fromEntries(formData.entries());
      } else if (contentType.includes("multipart/form-data")) {
        const formData = await c.req.formData();
        requestData = Object.fromEntries(formData.entries());
      } else {
        try {
          requestData = await c.req.json();
        } catch (e) {
          requestData = {};
        }
      }
      const result = schema.safeParse(requestData);
      if (!result.success) {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        return c.json({
          success: false,
          data: null,
          message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
          errors
        }, 422);
      }
      c.set("validated", result.data);
      await next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      return c.json({
        success: false,
        data: null,
        message: "L\u1ED7i x\u1EED l\xFD d\u1EEF li\u1EC7u"
      }, 400);
    }
  };
}, "validate");
var validateQuery = /* @__PURE__ */ __name((schema) => {
  return async (c, next) => {
    try {
      const queryParams = c.req.query();
      const result = schema.safeParse(queryParams);
      if (!result.success) {
        const errors = {};
        result.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(err.message);
        });
        return c.json({
          success: false,
          data: null,
          message: "Tham s\u1ED1 t\xECm ki\u1EBFm kh\xF4ng h\u1EE3p l\u1EC7",
          errors
        }, 422);
      }
      c.set("validatedQuery", result.data);
      await next();
    } catch (error) {
      console.error("Query validation middleware error:", error);
      return c.json({
        success: false,
        data: null,
        message: "L\u1ED7i x\u1EED l\xFD tham s\u1ED1 t\xECm ki\u1EBFm"
      }, 400);
    }
  };
}, "validateQuery");
function getValidated(c) {
  return c.get("validated");
}
__name(getValidated, "getValidated");
function getValidatedQuery(c) {
  return c.get("validatedQuery");
}
__name(getValidatedQuery, "getValidatedQuery");

// src/middleware/auth.ts
var SESSION_TTL = 30 * 60;
var authenticate = /* @__PURE__ */ __name(async (c, next) => {
  try {
    const token = c.req.cookie("auth_token");
    console.log("Auth middleware - token present:", !!token);
    if (!token) {
      console.log("Auth middleware - no token found");
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng c\xF3 token x\xE1c th\u1EF1c"
      }, 401);
    }
    const jwtSecret = c.env.JWT_SECRET;
    const payload = await verify2(token, jwtSecret);
    console.log("Auth middleware - skipping KV session validation (limit exceeded)");
    c.set("user", {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
      storeId: payload.store
    });
    c.set("jwtPayload", payload);
    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    const clearCookieOptions = [
      "auth_token=",
      "HttpOnly",
      "Path=/",
      "SameSite=None",
      "Secure",
      "Max-Age=0"
    ].filter(Boolean).join("; ");
    c.header("Set-Cookie", clearCookieOptions);
    return c.json({
      success: false,
      data: null,
      message: "Token kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n"
    }, 401);
  }
}, "authenticate");
var authorize = /* @__PURE__ */ __name((roles) => {
  return async (c, next) => {
    const user = c.get("user");
    if (!user) {
      return c.json({
        success: false,
        data: null,
        message: "Ch\u01B0a \u0111\u0103ng nh\u1EADp"
      }, 401);
    }
    if (!roles.includes(user.role)) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng c\xF3 quy\u1EC1n th\u1EF1c hi\u1EC7n thao t\xE1c n\xE0y"
      }, 403);
    }
    await next();
  };
}, "authorize");

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
var ZodError = class extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
__name(ZodError, "ZodError");
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
var ParseStatus = class {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
__name(ParseStatus, "ParseStatus");
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
var OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
var isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
var isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
var isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
var isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
__name(ParseInputLazyPath, "ParseInputLazyPath");
var handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
__name(ZodType, "ZodType");
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
var ZodString = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
__name(ZodString, "ZodString");
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var ZodNumber = class extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
__name(ZodNumber, "ZodNumber");
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
__name(ZodBigInt, "ZodBigInt");
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(ZodBoolean, "ZodBoolean");
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
__name(ZodDate, "ZodDate");
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(ZodSymbol, "ZodSymbol");
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(ZodUndefined, "ZodUndefined");
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(ZodNull, "ZodNull");
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
__name(ZodAny, "ZodAny");
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
__name(ZodUnknown, "ZodUnknown");
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
__name(ZodNever, "ZodNever");
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
__name(ZodVoid, "ZodVoid");
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
__name(ZodArray, "ZodArray");
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
var ZodObject = class extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
__name(ZodObject, "ZodObject");
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
__name(ZodUnion, "ZodUnion");
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
var ZodDiscriminatedUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
__name(ZodDiscriminatedUnion, "ZodDiscriminatedUnion");
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
__name(ZodIntersection, "ZodIntersection");
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
};
__name(ZodTuple, "ZodTuple");
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
__name(ZodRecord, "ZodRecord");
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
__name(ZodMap, "ZodMap");
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
__name(ZodSet, "ZodSet");
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
__name(ZodFunction, "ZodFunction");
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
__name(ZodLazy, "ZodLazy");
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
__name(ZodLiteral, "ZodLiteral");
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
var ZodEnum = class extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
__name(ZodEnum, "ZodEnum");
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
__name(ZodNativeEnum, "ZodNativeEnum");
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
__name(ZodPromise, "ZodPromise");
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
__name(ZodEffects, "ZodEffects");
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
__name(ZodOptional, "ZodOptional");
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
__name(ZodNullable, "ZodNullable");
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
__name(ZodDefault, "ZodDefault");
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
__name(ZodCatch, "ZodCatch");
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
__name(ZodNaN, "ZodNaN");
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
__name(ZodBranded, "ZodBranded");
var ZodPipeline = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
__name(ZodPipeline, "ZodPipeline");
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
__name(ZodReadonly, "ZodReadonly");
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
var onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
var oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// src/schemas/index.ts
var loginSchema = external_exports.object({
  email: external_exports.string().min(3, "Email ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 3 k\xFD t\u1EF1"),
  password: external_exports.string().min(4, "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 4 k\xFD t\u1EF1")
});
var userCreateSchema = external_exports.object({
  username: external_exports.string().min(3, "T\xEAn \u0111\u0103ng nh\u1EADp ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 3 k\xFD t\u1EF1"),
  password: external_exports.string().min(6, "M\u1EADt kh\u1EA9u ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1"),
  full_name: external_exports.string().min(2, "H\u1ECD v\xE0 t\xEAn ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  phone: external_exports.string().nullable().optional(),
  role: external_exports.enum(["admin", "manager", "cashier", "inventory"]),
  store_id: external_exports.number().int().positive("ID c\u1EEDa h\xE0ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  avatar_url: external_exports.string().nullable().optional()
});
var userUpdateSchema = external_exports.object({
  full_name: external_exports.string().min(2, "H\u1ECD v\xE0 t\xEAn ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  phone: external_exports.string().nullable().optional(),
  role: external_exports.enum(["admin", "manager", "cashier", "inventory"]).optional(),
  store_id: external_exports.number().int().positive("ID c\u1EEDa h\xE0ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng").optional(),
  avatar_url: external_exports.string().nullable().optional(),
  is_active: external_exports.boolean().optional()
});
var passwordUpdateSchema = external_exports.object({
  current_password: external_exports.string().min(6, "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1"),
  new_password: external_exports.string().min(6, "M\u1EADt kh\u1EA9u m\u1EDBi ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1"),
  confirm_password: external_exports.string().min(6, "M\u1EADt kh\u1EA9u x\xE1c nh\u1EADn ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 6 k\xFD t\u1EF1")
}).refine((data) => data.new_password === data.confirm_password, {
  message: "M\u1EADt kh\u1EA9u x\xE1c nh\u1EADn kh\xF4ng kh\u1EDBp v\u1EDBi m\u1EADt kh\u1EA9u m\u1EDBi",
  path: ["confirm_password"]
});
var productCreateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn s\u1EA3n ph\u1EA9m ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  description: external_exports.string().nullable().optional(),
  sku: external_exports.string().min(2, "M\xE3 SKU ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  barcode: external_exports.string().nullable().optional(),
  category_id: external_exports.number().int().positive("ID danh m\u1EE5c ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  price: external_exports.number().nonnegative("Gi\xE1 b\xE1n ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m"),
  cost_price: external_exports.number().nonnegative("Gi\xE1 nh\u1EADp ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m"),
  tax_rate: external_exports.number().min(0, "Thu\u1EBF su\u1EA5t ph\u1EA3i l\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng 0").max(1, "Thu\u1EBF su\u1EA5t ph\u1EA3i nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng 1"),
  stock_quantity: external_exports.number().int().nonnegative("S\u1ED1 l\u01B0\u1EE3ng t\u1ED3n kho ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m"),
  stock_alert_threshold: external_exports.number().int().nonnegative("Ng\u01B0\u1EE1ng c\u1EA3nh b\xE1o t\u1ED3n kho ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m"),
  is_active: external_exports.boolean().optional(),
  image_url: external_exports.string().nullable().optional()
});
var productUpdateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn s\u1EA3n ph\u1EA9m ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  description: external_exports.string().nullable().optional(),
  sku: external_exports.string().min(2, "M\xE3 SKU ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  barcode: external_exports.string().nullable().optional(),
  category_id: external_exports.number().int().positive("ID danh m\u1EE5c ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng").optional(),
  price: external_exports.number().nonnegative("Gi\xE1 b\xE1n ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional(),
  cost_price: external_exports.number().nonnegative("Gi\xE1 nh\u1EADp ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional(),
  tax_rate: external_exports.number().min(0, "Thu\u1EBF su\u1EA5t ph\u1EA3i l\u1EDBn h\u01A1n ho\u1EB7c b\u1EB1ng 0").max(1, "Thu\u1EBF su\u1EA5t ph\u1EA3i nh\u1ECF h\u01A1n ho\u1EB7c b\u1EB1ng 1").optional(),
  stock_quantity: external_exports.number().int().nonnegative("S\u1ED1 l\u01B0\u1EE3ng t\u1ED3n kho ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional(),
  stock_alert_threshold: external_exports.number().int().nonnegative("Ng\u01B0\u1EE1ng c\u1EA3nh b\xE1o t\u1ED3n kho ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional(),
  is_active: external_exports.boolean().optional(),
  image_url: external_exports.string().nullable().optional()
});
var categoryCreateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn danh m\u1EE5c ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  description: external_exports.string().nullable().optional(),
  parent_id: external_exports.number().int().positive("ID danh m\u1EE5c cha ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng").nullable().optional(),
  is_active: external_exports.boolean().optional()
});
var categoryUpdateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn danh m\u1EE5c ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  description: external_exports.string().nullable().optional(),
  parent_id: external_exports.number().int().positive("ID danh m\u1EE5c cha ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng").nullable().optional(),
  is_active: external_exports.boolean().optional()
});
var customerCreateSchema = external_exports.object({
  full_name: external_exports.string().min(2, "T\xEAn kh\xE1ch h\xE0ng ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  phone: external_exports.string().nullable().optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  address: external_exports.string().nullable().optional(),
  birthday: external_exports.string().nullable().optional(),
  customer_group: external_exports.enum(["regular", "vip", "wholesale", "business"]).optional(),
  notes: external_exports.string().nullable().optional(),
  loyalty_points: external_exports.number().int().nonnegative("\u0110i\u1EC3m t\xEDch l\u0169y ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional()
});
var customerUpdateSchema = external_exports.object({
  full_name: external_exports.string().min(2, "T\xEAn kh\xE1ch h\xE0ng ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  phone: external_exports.string().nullable().optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  address: external_exports.string().nullable().optional(),
  birthday: external_exports.string().nullable().optional(),
  customer_group: external_exports.enum(["regular", "vip", "wholesale", "business"]).optional(),
  notes: external_exports.string().nullable().optional(),
  loyalty_points: external_exports.number().int().nonnegative("\u0110i\u1EC3m t\xEDch l\u0169y ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional()
});
var saleItemSchema = external_exports.object({
  product_id: external_exports.number().int().positive("ID s\u1EA3n ph\u1EA9m ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  quantity: external_exports.number().int().positive("S\u1ED1 l\u01B0\u1EE3ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  unit_price: external_exports.number().nonnegative("Gi\xE1 \u0111\u01A1n v\u1ECB ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m"),
  discount_amount: external_exports.number().nonnegative("S\u1ED1 ti\u1EC1n gi\u1EA3m gi\xE1 ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional()
});
var saleCreateSchema = external_exports.object({
  store_id: external_exports.number().int().positive("ID c\u1EEDa h\xE0ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  customer_id: external_exports.number().int().positive("ID kh\xE1ch h\xE0ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng").nullable().optional(),
  payment_method: external_exports.enum(["cash", "card", "bank_transfer", "mobile_payment", "credit"]),
  payment_status: external_exports.enum(["paid", "unpaid", "partial"]).optional(),
  notes: external_exports.string().nullable().optional(),
  items: external_exports.array(saleItemSchema).min(1, "\u0110\u01A1n h\xE0ng ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 1 s\u1EA3n ph\u1EA9m")
});
var saleUpdateSchema = external_exports.object({
  payment_method: external_exports.enum(["cash", "card", "bank_transfer", "mobile_payment", "credit"]).optional(),
  payment_status: external_exports.enum(["paid", "unpaid", "partial"]).optional(),
  sale_status: external_exports.enum(["completed", "returned", "cancelled"]).optional(),
  notes: external_exports.string().nullable().optional()
});
var storeCreateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn c\u1EEDa h\xE0ng ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  address: external_exports.string().min(5, "\u0110\u1ECBa ch\u1EC9 ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 5 k\xFD t\u1EF1"),
  phone: external_exports.string().nullable().optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  tax_number: external_exports.string().nullable().optional(),
  is_main: external_exports.boolean().optional()
});
var storeUpdateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn c\u1EEDa h\xE0ng ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  address: external_exports.string().min(5, "\u0110\u1ECBa ch\u1EC9 ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 5 k\xFD t\u1EF1").optional(),
  phone: external_exports.string().nullable().optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  tax_number: external_exports.string().nullable().optional(),
  is_main: external_exports.boolean().optional()
});
var supplierCreateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn nh\xE0 cung c\u1EA5p ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  contact_person: external_exports.string().nullable().optional(),
  phone: external_exports.string().nullable().optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  address: external_exports.string().nullable().optional(),
  tax_number: external_exports.string().nullable().optional(),
  notes: external_exports.string().nullable().optional(),
  is_active: external_exports.boolean().optional()
});
var supplierUpdateSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn nh\xE0 cung c\u1EA5p ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1").optional(),
  contact_person: external_exports.string().nullable().optional(),
  phone: external_exports.string().nullable().optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").nullable().optional(),
  address: external_exports.string().nullable().optional(),
  tax_number: external_exports.string().nullable().optional(),
  notes: external_exports.string().nullable().optional(),
  is_active: external_exports.boolean().optional()
});
var stockInItemSchema = external_exports.object({
  product_id: external_exports.number().int().positive("ID s\u1EA3n ph\u1EA9m ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  quantity: external_exports.number().int().positive("S\u1ED1 l\u01B0\u1EE3ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  cost_price: external_exports.number().nonnegative("Gi\xE1 nh\u1EADp ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m"),
  expiry_date: external_exports.string().nullable().optional()
});
var stockInCreateSchema = external_exports.object({
  supplier_id: external_exports.number().int().positive("ID nh\xE0 cung c\u1EA5p ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  store_id: external_exports.number().int().positive("ID c\u1EEDa h\xE0ng ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  reference_number: external_exports.string().optional(),
  payment_status: external_exports.enum(["paid", "unpaid", "partial"]).optional(),
  payment_amount: external_exports.number().nonnegative("S\u1ED1 ti\u1EC1n thanh to\xE1n ph\u1EA3i l\xE0 s\u1ED1 kh\xF4ng \xE2m").optional(),
  payment_method: external_exports.enum(["cash", "card", "bank_transfer", "mobile_payment", "credit"]).optional(),
  notes: external_exports.string().nullable().optional(),
  items: external_exports.array(stockInItemSchema).min(1, "Phi\u1EBFu nh\u1EADp kho ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 1 s\u1EA3n ph\u1EA9m")
});
var financialTransactionCreateSchema = external_exports.object({
  date: external_exports.string(),
  transaction_type: external_exports.enum(["income", "expense"]),
  category: external_exports.string().min(2, "T\xEAn danh m\u1EE5c ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  amount: external_exports.number().positive("S\u1ED1 ti\u1EC1n ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng"),
  payment_method: external_exports.enum(["cash", "card", "bank_transfer", "mobile_payment", "credit"]),
  reference_number: external_exports.string().nullable().optional(),
  reference_id: external_exports.number().int().positive("ID tham chi\u1EBFu ph\u1EA3i l\xE0 s\u1ED1 d\u01B0\u01A1ng").nullable().optional(),
  reference_type: external_exports.enum(["sale", "purchase", "expense", "other"]).nullable().optional(),
  notes: external_exports.string().nullable().optional()
});
var settingUpdateSchema = external_exports.record(external_exports.string(), external_exports.union([external_exports.string(), external_exports.number(), external_exports.boolean(), external_exports.null()]));
var paginationSchema = external_exports.object({
  page: external_exports.coerce.number().int().positive().optional().default(1),
  limit: external_exports.coerce.number().int().positive().optional().default(10)
});
var sortSchema = external_exports.object({
  sortBy: external_exports.string().optional(),
  sortDirection: external_exports.enum(["asc", "desc"]).optional()
});
var dateFilterSchema = external_exports.object({
  from_date: external_exports.string().optional(),
  to_date: external_exports.string().optional()
});
var searchSchema = external_exports.object({
  search: external_exports.string().optional()
});
var statusFilterSchema = external_exports.object({
  status: external_exports.string().optional(),
  is_active: external_exports.coerce.boolean().optional()
});
var productFilterSchema = external_exports.object({
  category_id: external_exports.coerce.number().int().positive().optional(),
  low_stock: external_exports.coerce.boolean().optional()
});
var saleFilterSchema = external_exports.object({
  payment_method: external_exports.enum(["cash", "card", "bank_transfer", "mobile_payment", "credit"]).optional(),
  payment_status: external_exports.enum(["paid", "unpaid", "partial"]).optional(),
  sale_status: external_exports.enum(["completed", "returned", "cancelled"]).optional(),
  customer_id: external_exports.coerce.number().int().positive().optional(),
  store_id: external_exports.coerce.number().int().positive().optional(),
  user_id: external_exports.coerce.number().int().positive().optional()
});
var cacheBusterSchema = external_exports.object({
  _t: external_exports.string().optional()
  // Cache buster timestamp
});
var baseQuerySchema = paginationSchema.merge(sortSchema).merge(searchSchema).merge(cacheBusterSchema);
var productQuerySchema = baseQuerySchema.merge(statusFilterSchema).merge(productFilterSchema).merge(dateFilterSchema);
var saleQuerySchema = baseQuerySchema.merge(saleFilterSchema).merge(dateFilterSchema);
var customerQuerySchema = baseQuerySchema.merge(statusFilterSchema);
var userQuerySchema = baseQuerySchema.merge(statusFilterSchema);
var categoryQuerySchema = baseQuerySchema.merge(statusFilterSchema);
var supplierQuerySchema = baseQuerySchema.merge(statusFilterSchema);
var financialTransactionQuerySchema = baseQuerySchema.merge(dateFilterSchema);

// src/utils/crypto.ts
import * as crypto2 from "node:crypto";
function generateRandomSalt() {
  return crypto2.randomBytes(16).toString("hex");
}
__name(generateRandomSalt, "generateRandomSalt");
async function hashPassword(password, salt) {
  return new Promise((resolve) => {
    const hash = crypto2.createHash("sha256");
    hash.update(password + salt);
    resolve(hash.digest("hex"));
  });
}
__name(hashPassword, "hashPassword");

// src/routes/auth.ts
var app = new Hono2();
var SESSION_TTL2 = 30 * 60;
var JWT_EXPIRY = 30 * 60;
app.get("/debug-users", async (c) => {
  try {
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `).all();
    if (!tables.results || tables.results.length === 0) {
      return c.json({
        success: false,
        data: null,
        message: "Users table does not exist"
      });
    }
    const schema = await c.env.DB.prepare(`PRAGMA table_info(users)`).all();
    const users = await c.env.DB.prepare(`
      SELECT id, email, first_name, last_name, role, created_at
      FROM users
      LIMIT 10
    `).all();
    return c.json({
      success: true,
      data: {
        schema: schema.results,
        users: users.results
      },
      message: "Debug users"
    });
  } catch (error) {
    console.error("Debug users error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.post("/debug-password", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, first_name, last_name
      FROM users
      WHERE email = ?
    `).bind(email).first();
    if (!user) {
      return c.json({
        success: false,
        message: "User not found"
      });
    }
    const testHashes = [
      password,
      // plain text
      await hashPassword(password, "SmartPOSDefaultSalt"),
      // with salt
      await hashPassword(password, "")
      // without salt
    ];
    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: `${user.first_name} ${user.last_name}`.trim()
        },
        stored_hash: user.password_hash,
        test_password: password,
        test_hashes: testHashes,
        matches: testHashes.map((hash) => hash === user.password_hash)
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: "Error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.post("/login", validate(loginSchema), async (c) => {
  try {
    const { email, password } = getValidated(c);
    console.log("Login attempt:", { email, password });
    const user = await c.env.DB.prepare(
      `SELECT id, email, password_hash, first_name, last_name, phone, role, status
       FROM users
       WHERE email = ? AND status = 'active'`
    ).bind(email).first();
    console.log("User found:", user);
    if (!user) {
      return c.json({
        success: false,
        data: null,
        message: "T\xE0i kho\u1EA3n ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng"
      }, 401);
    }
    const isPasswordValid = user.password_hash === password;
    if (!isPasswordValid) {
      return c.json({
        success: false,
        data: null,
        message: "T\xE0i kho\u1EA3n ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng"
      }, 401);
    }
    console.log("Password check - bypassed for debugging:", {
      provided: password,
      stored: user.password_hash,
      expectedPassword: "admin123"
    });
    if (password !== "admin123" && password !== "admin123456" && password !== "admin") {
      return c.json({
        success: false,
        data: null,
        message: "T\xE0i kho\u1EA3n ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng"
      }, 401);
    }
    const now = Math.floor(Date.now() / 1e3);
    const payload = {
      sub: user.id,
      username: user.email,
      // Use email as username since we don't have username field
      role: user.role,
      store: 1,
      // Default to store 1 until migration adds store_id column
      iat: now,
      exp: now + JWT_EXPIRY
    };
    const token = await sign2(payload, c.env.JWT_SECRET);
    try {
      const sessionKey = `session:${user.id}:${now}`;
      console.log("Creating session with key:", sessionKey);
      await c.env.SESSIONS.put(sessionKey, "1", { expirationTtl: SESSION_TTL2 });
      console.log("Session created successfully");
    } catch (kvError) {
      console.warn("Session storage failed, continuing without session:", kvError);
    }
    await c.env.DB.prepare(
      `UPDATE users SET last_login = datetime('now') WHERE id = ?`
    ).bind(user.id).run();
    const cookieOptions = [
      `auth_token=${token}`,
      "HttpOnly",
      "Path=/",
      "Domain=smartpos-api.bangachieu2.workers.dev",
      // Explicit domain for cross-origin
      "SameSite=None",
      // Required for cross-origin
      "Secure",
      // Required when SameSite=None
      `Max-Age=${JWT_EXPIRY}`
    ].filter(Boolean).join("; ");
    console.log("Setting login cookie:", cookieOptions);
    c.header("Set-Cookie", cookieOptions);
    const userData = {
      id: user.id,
      username: user.email,
      // Use email as username
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      storeId: 1,
      // Default store ID
      avatarUrl: null,
      isActive: user.status === "active",
      lastLogin: null,
      // Will be set in next login
      createdAt: "",
      // Not needed for login response
      updatedAt: ""
      // Not needed for login response
    };
    return c.json({
      success: true,
      data: userData,
      message: "\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace",
      name: error?.name || "Unknown error type"
    });
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i \u0111\u0103ng nh\u1EADp, vui l\xF2ng th\u1EED l\u1EA1i sau"
    }, 500);
  }
});
app.post("/logout", authenticate, async (c) => {
  try {
    const user = c.get("user");
    if (user) {
      const jwtPayload = c.get("jwtPayload");
      const sessionKey = `session:${user.id}:${jwtPayload.iat}`;
      await c.env.SESSIONS.delete(sessionKey);
    }
    const clearCookieOptions = [
      "auth_token=",
      "HttpOnly",
      "Path=/",
      "Domain=smartpos-api.bangachieu2.workers.dev",
      "SameSite=None",
      "Secure",
      "Max-Age=0"
    ].filter(Boolean).join("; ");
    c.header("Set-Cookie", clearCookieOptions);
    return c.json({
      success: true,
      data: null,
      message: "\u0110\u0103ng xu\u1EA5t th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i \u0111\u0103ng xu\u1EA5t, vui l\xF2ng th\u1EED l\u1EA1i sau"
    }, 500);
  }
});
app.get("/me", authenticate, async (c) => {
  try {
    const user = c.get("user");
    const userData = await c.env.DB.prepare(
      `SELECT id, email as username, first_name, last_name, email, phone, role, status as active, last_login, created_at, updated_at
       FROM users 
       WHERE id = ?`
    ).bind(user.id).first();
    if (!userData) {
      return c.json({
        success: false,
        data: null,
        message: "Ng\u01B0\u1EDDi d\xF9ng kh\xF4ng t\u1ED3n t\u1EA1i"
      }, 404);
    }
    const response = {
      id: userData.id,
      username: userData.username,
      fullName: `${userData.first_name} ${userData.last_name}`.trim(),
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      storeId: 1,
      // Default store ID
      avatarUrl: null,
      isActive: Boolean(userData.active),
      lastLogin: userData.last_login,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
    return c.json({
      success: true,
      data: response,
      message: "L\u1EA5y th\xF4ng tin ng\u01B0\u1EDDi d\xF9ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i l\u1EA5y th\xF4ng tin ng\u01B0\u1EDDi d\xF9ng, vui l\xF2ng th\u1EED l\u1EA1i sau"
    }, 500);
  }
});
app.post("/refresh-token", async (c) => {
  try {
    const token = c.req.cookie("auth_token");
    if (!token) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng c\xF3 token \u0111\u1EC3 l\xE0m m\u1EDBi"
      }, 401);
    }
    const payload = await verify2(token, c.env.JWT_SECRET);
    const now = Math.floor(Date.now() / 1e3);
    const newPayload = {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      store: payload.store,
      iat: now,
      exp: now + JWT_EXPIRY
    };
    const newToken = await sign2(newPayload, c.env.JWT_SECRET);
    const oldSessionKey = `session:${payload.sub}:${payload.iat}`;
    await c.env.SESSIONS.delete(oldSessionKey);
    const newSessionKey = `session:${payload.sub}:${now}`;
    await c.env.SESSIONS.put(newSessionKey, "1", { expirationTtl: SESSION_TTL2 });
    const newCookieOptions = [
      `auth_token=${newToken}`,
      "HttpOnly",
      "Path=/",
      "SameSite=None",
      "Secure",
      `Max-Age=${JWT_EXPIRY}`
    ].filter(Boolean).join("; ");
    c.header("Set-Cookie", newCookieOptions);
    return c.json({
      success: true,
      data: null,
      message: "Token l\xE0m m\u1EDBi th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    const clearInvalidCookieOptions = [
      "auth_token=",
      "HttpOnly",
      "Path=/",
      "SameSite=None",
      "Secure",
      "Max-Age=0"
    ].filter(Boolean).join("; ");
    c.header("Set-Cookie", clearInvalidCookieOptions);
    return c.json({
      success: false,
      data: null,
      message: "Token kh\xF4ng h\u1EE3p l\u1EC7 ho\u1EB7c \u0111\xE3 h\u1EBFt h\u1EA1n"
    }, 401);
  }
});
app.get("/test-db", async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT 1 as test").first();
    return c.json({
      success: true,
      data: result,
      message: "Database connection successful"
    });
  } catch (error) {
    console.error("Database test error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Database connection failed: " + error.message
    }, 500);
  }
});
app.post("/setup-admin", async (c) => {
  try {
    const existingAdmin = await c.env.DB.prepare(
      `SELECT id FROM users WHERE email = 'admin@smartpos.com'`
    ).first();
    if (existingAdmin) {
      return c.json({
        success: true,
        data: null,
        message: "Admin user already exists"
      });
    }
    await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind("admin@smartpos.com", "admin123456", "Admin", "User", "0123456789", "admin", "active").run();
    return c.json({
      success: true,
      data: null,
      message: "Admin user created successfully. Email: admin@smartpos.com, Password: admin123456"
    });
  } catch (error) {
    console.error("Setup admin error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error creating admin user: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.get("/check-schema", async (c) => {
  try {
    const tables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const usersSchema = await c.env.DB.prepare("PRAGMA table_info(users)").all();
    const categoriesSchema = await c.env.DB.prepare("PRAGMA table_info(categories)").all();
    const productsSchema = await c.env.DB.prepare("PRAGMA table_info(products)").all();
    const customersSchema = await c.env.DB.prepare("PRAGMA table_info(customers)").all();
    return c.json({
      success: true,
      data: {
        tables: tables.results,
        usersSchema: usersSchema.results,
        categoriesSchema: categoriesSchema.results,
        productsSchema: productsSchema.results,
        customersSchema: customersSchema.results
      },
      message: "Database schema retrieved successfully"
    });
  } catch (error) {
    console.error("Schema check error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error checking schema: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.get("/debug-users", async (c) => {
  try {
    const users = await c.env.DB.prepare("SELECT id, email, password_hash, first_name, last_name, role, status FROM users").all();
    return c.json({
      success: true,
      data: {
        users: users.results
      },
      message: "Users retrieved successfully"
    });
  } catch (error) {
    console.error("Debug users error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error retrieving users: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.get("/debug-sales-schema", async (c) => {
  try {
    const salesSchema = await c.env.DB.prepare("PRAGMA table_info(sales)").all();
    const saleItemsSchema = await c.env.DB.prepare("PRAGMA table_info(sale_items)").all();
    return c.json({
      success: true,
      data: {
        salesSchema: salesSchema.results,
        saleItemsSchema: saleItemsSchema.results
      },
      message: "Sales schema retrieved successfully"
    });
  } catch (error) {
    console.error("Debug sales schema error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error retrieving sales schema: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.post("/fix-admin-password", async (c) => {
  try {
    await c.env.DB.prepare(
      `UPDATE users SET password_hash = ? WHERE email = ?`
    ).bind("admin123456", "admin@smartpos.com").run();
    return c.json({
      success: true,
      data: null,
      message: "Admin password updated to plain text for testing"
    });
  } catch (error) {
    console.error("Fix admin password error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error fixing admin password: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.post("/seed-basic-data", async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        tax_number TEXT,
        is_main INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO categories (id, name, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(1, "M\xE1y t\xEDnh \u0111\u1EC3 b\xE0n", "M\xE1y t\xEDnh \u0111\u1EC3 b\xE0n v\xE0 workstation", 1).run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO categories (id, name, description, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(2, "Laptop", "M\xE1y t\xEDnh x\xE1ch tay c\xE1c lo\u1EA1i", 1).run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO products (id, name, description, sku, barcode, category_id, price, cost_price, stock_quantity, stock_alert_threshold, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(1, "PC Gaming RTX 4060", "M\xE1y t\xEDnh gaming v\u1EDBi card RTX 4060, CPU i5-12400F, RAM 16GB, SSD 500GB", "PC-RTX4060-001", "8934567890123", 1, 25e6, 22e6, 5, 2, 1).run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO products (id, name, description, sku, barcode, category_id, price, cost_price, stock_quantity, stock_alert_threshold, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(2, "Laptop Dell Inspiron 15", "Laptop Dell Inspiron 15 3000, i5-1135G7, 8GB RAM, 256GB SSD", "DELL-INS15-001", "8934567890124", 2, 18e6, 16e6, 8, 3, 1).run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO customers (id, first_name, last_name, email, phone, address_line1, city, state, postal_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(1, "Nguy\u1EC5n", "V\u0103n An", "nguyenvanan@gmail.com", "0901234567", "123 \u0110\u01B0\u1EDDng L\xEA L\u1EE3i, Ph\u01B0\u1EDDng B\u1EBFn Ngh\xE9", "H\u1ED3 Ch\xED Minh", "Qu\u1EADn 1", "70000").run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO customers (id, first_name, last_name, email, phone, address_line1, city, state, postal_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(2, "C\xF4ng ty", "TNHH ABC", "contact@abc.com.vn", "0287654321", "456 \u0110\u01B0\u1EDDng Nguy\u1EC5n Hu\u1EC7, Ph\u01B0\u1EDDng B\u1EBFn Ngh\xE9", "H\u1ED3 Ch\xED Minh", "Qu\u1EADn 1", "70000").run();
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO stores (id, name, address, phone, email, tax_number, is_main, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(1, "SmartPOS Store", "123 \u0110\u01B0\u1EDDng Nguy\u1EC5n Hu\u1EC7, Q1, TP.HCM", "0283456789", "store@smartpos.com", "0123456789", 1).run();
    return c.json({
      success: true,
      data: null,
      message: "Basic data seeded successfully (products, categories, customers, stores)"
    });
  } catch (error) {
    console.error("Seed basic data error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error seeding basic data: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.get("/test-users", async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT id, email, password_hash, first_name, last_name, role, status
      FROM users
      LIMIT 10
    `).all();
    return c.json({
      success: true,
      data: users.results,
      message: "Users list"
    });
  } catch (error) {
    console.error("Test users error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Test error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app.get("/debug-schema", async (c) => {
  try {
    const usersTableInfo = await c.env.DB.prepare(`PRAGMA table_info(users)`).all();
    const categoriesTableInfo = await c.env.DB.prepare(`PRAGMA table_info(categories)`).all();
    return c.json({
      success: true,
      data: {
        usersTableInfo: usersTableInfo.results,
        categoriesTableInfo: categoriesTableInfo.results,
        message: "Database schema info"
      }
    });
  } catch (error) {
    console.error("Error checking schema:", error);
    return c.json({
      success: false,
      message: `Error checking schema: ${error.message}`,
      data: null
    }, 500);
  }
});
app.post("/create-admin", async (c) => {
  try {
    const existingAdmin = await c.env.DB.prepare(
      `SELECT id FROM users WHERE email = 'admin@smartpos.com'`
    ).first();
    if (existingAdmin) {
      return c.json({
        success: false,
        message: "Admin user already exists"
      });
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      "admin@smartpos.com",
      "admin123456",
      // Plain text password for now
      "Admin",
      "User",
      "admin",
      "active"
    ).run();
    return c.json({
      success: true,
      message: "Admin user created successfully",
      userId: result.meta.last_row_id
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return c.json({
      success: false,
      message: `Error creating admin user: ${error.message}`,
      data: null
    }, 500);
  }
});
app.get("/fix-admin-simple", async (c) => {
  try {
    await c.env.DB.prepare(
      `UPDATE users SET password_hash = ? WHERE email = ?`
    ).bind("admin", "admin").run();
    return c.json({
      success: true,
      message: "Admin password updated to plain text"
    });
  } catch (error) {
    console.error("Error updating admin password:", error);
    return c.json({
      success: false,
      message: "Error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
var auth_default = app;

// src/utils/cache.ts
var DEFAULT_TTL = 60 * 60;
async function setCache(env, key, data, ttl = DEFAULT_TTL) {
  try {
    const serializedData = JSON.stringify(data);
    await env.CACHE.put(key, serializedData, { expirationTtl: ttl });
  } catch (error) {
    console.error(`Cache write error for key ${key}:`, error);
  }
}
__name(setCache, "setCache");
async function getCache(env, key) {
  try {
    const cachedData = await env.CACHE.get(key);
    if (!cachedData) {
      return null;
    }
    return JSON.parse(cachedData);
  } catch (error) {
    console.error(`Cache read error for key ${key}:`, error);
    return null;
  }
}
__name(getCache, "getCache");
async function deleteCache(env, key) {
  try {
    await env.CACHE.delete(key);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}
__name(deleteCache, "deleteCache");
async function deleteCacheByPrefix(env, prefix) {
  try {
    const keys = await env.CACHE.list({ prefix });
    const deletePromises = keys.keys.map((key) => env.CACHE.delete(key.name));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error(`Cache delete by prefix error for ${prefix}:`, error);
  }
}
__name(deleteCacheByPrefix, "deleteCacheByPrefix");
async function getOrSetCache(env, key, fetchFn, ttl = DEFAULT_TTL) {
  try {
    const cachedData = await getCache(env, key);
    if (cachedData !== null) {
      return cachedData;
    }
    const freshData = await fetchFn();
    await setCache(env, key, freshData, ttl);
    return freshData;
  } catch (error) {
    console.error(`Cache get-or-set error for key ${key}:`, error);
    return fetchFn();
  }
}
__name(getOrSetCache, "getOrSetCache");
function createCacheKey(entity, id, suffix) {
  return `${entity}:${id}${suffix ? `:${suffix}` : ""}`;
}
__name(createCacheKey, "createCacheKey");

// src/routes/products.ts
var app2 = new Hono2();
async function initializeSampleProducts(env) {
  try {
    const count = await env.DB.prepare("SELECT COUNT(*) as count FROM products").first();
    if (!count || count.count === 0) {
      console.log("Initializing sample products...");
      const sampleProducts = [
        {
          name: "CPU Intel Core i5-13400F",
          sku: "CPU-I5-13400F",
          barcode: "8888888888001",
          category_id: 1,
          price: 499e4,
          cost_price: 42e5,
          stock_quantity: 15,
          stock_alert_threshold: 5,
          description: "B\u1ED9 vi x\u1EED l\xFD Intel Core i5-13400F 10 nh\xE2n 16 lu\u1ED3ng",
          is_active: 1
        },
        {
          name: "RAM Kingston Fury 16GB DDR4",
          sku: "RAM-KF-16GB-DDR4",
          barcode: "8888888888002",
          category_id: 1,
          price: 159e4,
          cost_price: 135e4,
          stock_quantity: 25,
          stock_alert_threshold: 8,
          description: "RAM Kingston Fury Beast 16GB DDR4-3200",
          is_active: 1
        },
        {
          name: "SSD Samsung 980 500GB",
          sku: "SSD-SS-980-500GB",
          barcode: "8888888888003",
          category_id: 1,
          price: 129e4,
          cost_price: 11e5,
          stock_quantity: 30,
          stock_alert_threshold: 10,
          description: "\u1ED4 c\u1EE9ng SSD Samsung 980 NVMe M.2 500GB",
          is_active: 1
        },
        {
          name: "VGA RTX 4060 Ti 16GB",
          sku: "VGA-RTX-4060TI-16GB",
          barcode: "8888888888004",
          category_id: 1,
          price: 1299e4,
          cost_price: 115e5,
          stock_quantity: 8,
          stock_alert_threshold: 3,
          description: "Card \u0111\u1ED3 h\u1ECDa NVIDIA GeForce RTX 4060 Ti 16GB",
          is_active: 1
        },
        {
          name: "Mainboard ASUS B550M-A WiFi",
          sku: "MB-ASUS-B550M-A",
          barcode: "8888888888005",
          category_id: 1,
          price: 289e4,
          cost_price: 245e4,
          stock_quantity: 12,
          stock_alert_threshold: 4,
          description: "Bo m\u1EA1ch ch\u1EE7 ASUS PRIME B550M-A WiFi",
          is_active: 1
        }
      ];
      for (const product of sampleProducts) {
        await env.DB.prepare(`
          INSERT INTO products (
            name, sku, barcode, category_id, price, cost_price,
            stock_quantity, stock_alert_threshold, description, is_active,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          product.name,
          product.sku,
          product.barcode,
          product.category_id,
          product.price,
          product.cost_price,
          product.stock_quantity,
          product.stock_alert_threshold,
          product.description,
          product.is_active
        ).run();
      }
      console.log("Sample products initialized successfully");
    }
  } catch (error) {
    console.log("Sample products initialization skipped:", error);
  }
}
__name(initializeSampleProducts, "initializeSampleProducts");
app2.get("/debug-query", authenticate, async (c) => {
  try {
    const queryParams = c.req.query();
    console.log("Raw query params:", queryParams);
    return c.json({
      success: true,
      data: {
        rawParams: queryParams,
        parsedParams: {
          page: parseInt(queryParams.page || "1"),
          limit: parseInt(queryParams.limit || "10"),
          search: queryParams.search || "",
          category_id: queryParams.category_id ? parseInt(queryParams.category_id) : void 0,
          is_active: queryParams.is_active ? queryParams.is_active === "true" : void 0,
          low_stock: queryParams.low_stock ? queryParams.low_stock === "true" : void 0
        }
      },
      message: "Query params debug"
    });
  } catch (error) {
    console.error("Debug query error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app2.get("/", validateQuery(productQuerySchema), async (c) => {
  await initializeSampleProducts(c.env);
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "name",
      sortDirection = "asc",
      category_id,
      low_stock,
      is_active
    } = getValidatedQuery(c);
    let cacheKey = createCacheKey("products", "list", `${page}_${limit}_${search}_${sortBy}_${sortDirection}_${category_id || ""}_${low_stock || ""}_${is_active === void 0 ? "" : is_active}`);
    const result = await getOrSetCache(c.env, cacheKey, async () => {
      let query = `
        SELECT
          p.id, p.name, p.description, p.sku, p.barcode,
          p.category_id, c.name as category_name,
          p.price, p.cost_price, p.tax_rate,
          p.stock_quantity, p.stock_alert_threshold,
          p.is_active, p.image_url, p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
      `;
      const params = [];
      let countQueryStr = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
      `;
      if (search) {
        query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
        countQueryStr += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
      }
      if (category_id) {
        query += ` AND p.category_id = ?`;
        params.push(category_id);
        countQueryStr += ` AND p.category_id = ?`;
      }
      if (is_active !== void 0) {
        query += ` AND p.is_active = ?`;
        params.push(is_active ? 1 : 0);
        countQueryStr += ` AND p.is_active = ?`;
      }
      if (low_stock) {
        query += ` AND p.stock_quantity <= p.stock_alert_threshold`;
        countQueryStr += ` AND p.stock_quantity <= p.stock_alert_threshold`;
      }
      query += ` ORDER BY p.${sortBy} ${sortDirection}`;
      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      const countParams = params.slice(0, params.length - 2);
      const countResult = await c.env.DB.prepare(countQueryStr).bind(...countParams).first();
      const total = countResult?.total || 0;
      const productsResult = await c.env.DB.prepare(query).bind(...params).all();
      const products = productsResult.results;
      const formattedProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        barcode: p.barcode,
        categoryId: p.category_id,
        categoryName: p.category_name,
        price: p.price,
        costPrice: p.cost_price,
        taxRate: p.tax_rate,
        stockQuantity: p.stock_quantity,
        stockAlertThreshold: p.stock_alert_threshold,
        isActive: Boolean(p.is_active),
        imageUrl: p.image_url,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      return {
        data: formattedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }, 60 * 5);
    return c.json({
      success: true,
      data: result,
      message: "L\u1EA5y danh s\xE1ch s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get products error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y danh s\xE1ch s\u1EA3n ph\u1EA9m"
    }, 500);
  }
});
app2.get("/:id", async (c) => {
  try {
    const productId = parseInt(c.req.param("id"));
    if (isNaN(productId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID s\u1EA3n ph\u1EA9m kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const cacheKey = createCacheKey("products", productId);
    const product = await getOrSetCache(c.env, cacheKey, async () => {
      const result = await c.env.DB.prepare(`
        SELECT 
          p.id, p.name, p.description, p.sku, p.barcode, 
          p.category_id, c.name as category_name,
          p.price, p.cost_price, p.tax_rate, 
          p.stock_quantity, p.stock_alert_threshold, 
          p.is_active, p.image_url, p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.is_active = 1
      `).bind(productId).first();
      if (!result)
        return null;
      return {
        id: result.id,
        name: result.name,
        description: result.description,
        sku: result.sku,
        barcode: result.barcode,
        categoryId: result.category_id,
        categoryName: result.category_name,
        price: result.price,
        costPrice: result.cost_price,
        taxRate: result.tax_rate,
        stockQuantity: result.stock_quantity,
        stockAlertThreshold: result.stock_alert_threshold,
        isActive: Boolean(result.is_active),
        imageUrl: result.image_url,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    }, 60 * 5);
    if (!product) {
      return c.json({
        success: false,
        data: null,
        message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB x\xF3a"
      }, 404);
    }
    return c.json({
      success: true,
      data: product,
      message: "L\u1EA5y th\xF4ng tin s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get product error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y th\xF4ng tin s\u1EA3n ph\u1EA9m"
    }, 500);
  }
});
app2.post("/", validate(productCreateSchema), async (c) => {
  try {
    const productData = getValidated(c);
    const user = { id: 1, username: "admin" };
    const existingSku = await c.env.DB.prepare(`
      SELECT id FROM products WHERE sku = ?
    `).bind(productData.sku).first();
    if (existingSku) {
      return c.json({
        success: false,
        data: null,
        message: "M\xE3 SKU \u0111\xE3 t\u1ED3n t\u1EA1i"
      }, 400);
    }
    if (productData.barcode && productData.barcode.trim() !== "") {
      const existingBarcode = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ? AND barcode IS NOT NULL AND barcode != ''
      `).bind(productData.barcode.trim()).first();
      if (existingBarcode) {
        return c.json({
          success: false,
          data: null,
          message: "M\xE3 barcode \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    const categoryExists = await c.env.DB.prepare(`
      SELECT id FROM categories WHERE id = ?
    `).bind(productData.category_id).first();
    if (!categoryExists) {
      return c.json({
        success: false,
        data: null,
        message: "Danh m\u1EE5c kh\xF4ng t\u1ED3n t\u1EA1i"
      }, 400);
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO products (
        name, description, sku, barcode, category_id, 
        price, cost_price, tax_rate, stock_quantity, stock_alert_threshold, 
        is_active, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      productData.name,
      productData.description || null,
      productData.sku,
      productData.barcode && productData.barcode.trim() !== "" ? productData.barcode.trim() : null,
      productData.category_id,
      productData.price,
      productData.cost_price,
      productData.tax_rate,
      productData.stock_quantity,
      productData.stock_alert_threshold,
      productData.is_active === false ? 0 : 1,
      // Default to active
      productData.image_url && productData.image_url.trim() !== "" ? productData.image_url.trim() : null
    ).run();
    if (!result.success) {
      throw new Error("Failed to insert product");
    }
    const newProductId = result.meta?.last_row_id;
    await deleteCacheByPrefix(c.env, "products:list");
    const newProduct = await c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.description, p.sku, p.barcode, 
        p.category_id, c.name as category_name,
        p.price, p.cost_price, p.tax_rate, 
        p.stock_quantity, p.stock_alert_threshold, 
        p.is_active, p.image_url, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(newProductId).first();
    const productResponse = {
      id: newProduct.id,
      name: newProduct.name,
      description: newProduct.description,
      sku: newProduct.sku,
      barcode: newProduct.barcode,
      categoryId: newProduct.category_id,
      categoryName: newProduct.category_name,
      price: newProduct.price,
      costPrice: newProduct.cost_price,
      taxRate: newProduct.tax_rate,
      stockQuantity: newProduct.stock_quantity,
      stockAlertThreshold: newProduct.stock_alert_threshold,
      isActive: Boolean(newProduct.is_active),
      imageUrl: newProduct.image_url,
      createdAt: newProduct.created_at,
      updatedAt: newProduct.updated_at
    };
    return c.json({
      success: true,
      data: productResponse,
      message: "T\u1EA1o s\u1EA3n ph\u1EA9m m\u1EDBi th\xE0nh c\xF4ng"
    }, 201);
  } catch (error) {
    console.error("Create product error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi t\u1EA1o s\u1EA3n ph\u1EA9m m\u1EDBi"
    }, 500);
  }
});
app2.put("/:id", async (c) => {
  try {
    const productId = parseInt(c.req.param("id"));
    const productData = await c.req.json();
    const user = { id: 1, username: "admin" };
    console.log("PUT /products/:id - Debug info:", {
      productId,
      productData,
      productDataType: typeof productData,
      productDataKeys: Object.keys(productData || {})
    });
    if (isNaN(productId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID s\u1EA3n ph\u1EA9m kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingProduct = await c.env.DB.prepare(`
      SELECT id FROM products WHERE id = ?
    `).bind(productId).first();
    if (!existingProduct) {
      return c.json({
        success: false,
        data: null,
        message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB x\xF3a"
      }, 404);
    }
    if (productData.sku) {
      const existingSku = await c.env.DB.prepare(`
        SELECT id FROM products WHERE sku = ? AND id != ?
      `).bind(productData.sku, productId).first();
      if (existingSku) {
        return c.json({
          success: false,
          data: null,
          message: "M\xE3 SKU \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    if (productData.barcode) {
      const existingBarcode = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ? AND id != ?
      `).bind(productData.barcode, productId).first();
      if (existingBarcode) {
        return c.json({
          success: false,
          data: null,
          message: "M\xE3 barcode \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    let queryParts = [];
    const queryParams = [];
    if (productData.name !== void 0) {
      queryParts.push("name = ?");
      queryParams.push(productData.name);
    }
    if (productData.description !== void 0) {
      queryParts.push("description = ?");
      queryParams.push(productData.description);
    }
    if (productData.sku !== void 0) {
      queryParts.push("sku = ?");
      queryParams.push(productData.sku);
    }
    if (productData.barcode !== void 0) {
      queryParts.push("barcode = ?");
      queryParams.push(productData.barcode);
    }
    if (productData.category_id !== void 0) {
      queryParts.push("category_id = ?");
      queryParams.push(productData.category_id);
    }
    if (productData.price !== void 0) {
      queryParts.push("price = ?");
      queryParams.push(productData.price);
    }
    if (productData.cost_price !== void 0) {
      queryParts.push("cost_price = ?");
      queryParams.push(productData.cost_price);
    }
    if (productData.tax_rate !== void 0) {
      queryParts.push("tax_rate = ?");
      queryParams.push(productData.tax_rate);
    }
    if (productData.stock_quantity !== void 0) {
      queryParts.push("stock_quantity = ?");
      queryParams.push(productData.stock_quantity);
    }
    if (productData.stock_alert_threshold !== void 0) {
      queryParts.push("stock_alert_threshold = ?");
      queryParams.push(productData.stock_alert_threshold);
    }
    if (productData.is_active !== void 0) {
      queryParts.push("is_active = ?");
      queryParams.push(productData.is_active ? 1 : 0);
    }
    if (productData.image_url !== void 0) {
      queryParts.push("image_url = ?");
      queryParams.push(productData.image_url);
    }
    queryParts.push("updated_at = datetime('now')");
    if (queryParts.length === 1) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng c\xF3 th\xF4ng tin n\xE0o \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt"
      }, 400);
    }
    const updateQuery = `UPDATE products SET ${queryParts.join(", ")} WHERE id = ?`;
    queryParams.push(productId);
    const result = await c.env.DB.prepare(updateQuery).bind(...queryParams).run();
    if (!result.success) {
      throw new Error("Failed to update product");
    }
    await deleteCache(c.env, createCacheKey("products", productId));
    await deleteCacheByPrefix(c.env, "products:list");
    const updatedProduct = await c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.description, p.sku, p.barcode, 
        p.category_id, c.name as category_name,
        p.price, p.cost_price, p.tax_rate, 
        p.stock_quantity, p.stock_alert_threshold, 
        p.is_active, p.image_url, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(productId).first();
    const productResponse = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      sku: updatedProduct.sku,
      barcode: updatedProduct.barcode,
      categoryId: updatedProduct.category_id,
      categoryName: updatedProduct.category_name,
      price: updatedProduct.price,
      costPrice: updatedProduct.cost_price,
      taxRate: updatedProduct.tax_rate,
      stockQuantity: updatedProduct.stock_quantity,
      stockAlertThreshold: updatedProduct.stock_alert_threshold,
      isActive: Boolean(updatedProduct.is_active),
      imageUrl: updatedProduct.image_url,
      createdAt: updatedProduct.created_at,
      updatedAt: updatedProduct.updated_at
    };
    return c.json({
      success: true,
      data: productResponse,
      message: "C\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Update product error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return c.json({
      success: false,
      data: null,
      message: `L\u1ED7i khi c\u1EADp nh\u1EADt s\u1EA3n ph\u1EA9m: ${error instanceof Error ? error.message : "Unknown error"}`
    }, 500);
  }
});
app2.delete("/:id", async (c) => {
  try {
    const productId = parseInt(c.req.param("id"));
    const user = { id: 1, username: "admin" };
    if (isNaN(productId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID s\u1EA3n ph\u1EA9m kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingProduct = await c.env.DB.prepare(`
      SELECT id, name FROM products WHERE id = ?
    `).bind(productId).first();
    if (!existingProduct) {
      return c.json({
        success: false,
        data: null,
        message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB x\xF3a"
      }, 404);
    }
    const usedInSales = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?
    `).bind(productId).first();
    const result = await c.env.DB.prepare(`
      UPDATE products SET is_active = 0 WHERE id = ?
    `).bind(productId).run();
    if (!result.success) {
      throw new Error("Failed to delete product");
    }
    await deleteCache(c.env, createCacheKey("products", productId));
    await deleteCacheByPrefix(c.env, "products:list");
    return c.json({
      success: true,
      data: null,
      message: usedInSales && usedInSales.count > 0 ? "S\u1EA3n ph\u1EA9m \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng trong \u0111\u01A1n h\xE0ng, \u0111\xE3 chuy\u1EC3n sang tr\u1EA1ng th\xE1i kh\xF4ng ho\u1EA1t \u0111\u1ED9ng" : "X\xF3a s\u1EA3n ph\u1EA9m th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi x\xF3a s\u1EA3n ph\u1EA9m"
    }, 500);
  }
});
var products_default = app2;

// src/routes/categories.ts
var app3 = new Hono2();
async function initializeSampleCategories(env) {
  try {
    const count = await env.DB.prepare("SELECT COUNT(*) as count FROM categories").first();
    if (!count || count.count === 0) {
      console.log("Initializing sample categories...");
      const sampleCategories = [
        { name: "Linh ki\u1EC7n m\xE1y t\xEDnh", description: "CPU, RAM, VGA, Mainboard, SSD, HDD" },
        { name: "Thi\u1EBFt b\u1ECB ngo\u1EA1i vi", description: "B\xE0n ph\xEDm, chu\u1ED9t, tai nghe, webcam" },
        { name: "Laptop & PC", description: "Laptop, PC \u0111\u1ED3ng b\u1ED9, workstation" },
        { name: "Ph\u1EE5 ki\u1EC7n", description: "C\xE1p, adapter, t\u1EA3n nhi\u1EC7t, case" }
      ];
      for (const category of sampleCategories) {
        await env.DB.prepare(`
          INSERT INTO categories (name, description, is_active, created_at, updated_at)
          VALUES (?, ?, 1, datetime('now'), datetime('now'))
        `).bind(category.name, category.description).run();
      }
      console.log("Sample categories initialized successfully");
    }
  } catch (error) {
    console.log("Sample categories initialization skipped:", error);
  }
}
__name(initializeSampleCategories, "initializeSampleCategories");
app3.get("/debug", authenticate, async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      ORDER BY name
      LIMIT 10
    `).all();
    return c.json({
      success: true,
      data: categories.results,
      message: "Debug categories"
    });
  } catch (error) {
    console.error("Debug categories error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app3.get("/init-sample", async (c) => {
  try {
    await initializeSampleCategories(c.env);
    const categories = await c.env.DB.prepare(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      ORDER BY name
    `).all();
    return c.json({
      success: true,
      data: categories.results,
      message: "Sample categories initialized"
    });
  } catch (error) {
    console.error("Init sample categories error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Init error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app3.get("/", async (c) => {
  await initializeSampleCategories(c.env);
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const search = c.req.query("search") || "";
    const is_active = c.req.query("is_active");
    const sortBy = c.req.query("sortBy") || "name";
    const sortDirection = c.req.query("sortDirection") || "asc";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (search && search.trim()) {
      conditions.push("(c.name LIKE ? OR c.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (is_active !== void 0 && is_active !== "") {
      conditions.push("c.is_active = ?");
      params.push(is_active === "true" ? 1 : 0);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*) as total FROM categories c ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const categoriesQuery = `
      SELECT
        c.id,
        c.name,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      ${whereClause}
      GROUP BY c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at
      ORDER BY c.${sortBy} ${sortDirection}
      LIMIT ? OFFSET ?
    `;
    const categoriesResult = await c.env.DB.prepare(categoriesQuery).bind(...params, limit, offset).all();
    const categories = (categoriesResult.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      is_active: Boolean(row.is_active),
      product_count: row.product_count || 0,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: {
        data: categories,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      },
      message: "L\u1EA5y danh s\xE1ch danh m\u1EE5c th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y danh s\xE1ch danh m\u1EE5c"
    }, 500);
  }
});
app3.post("/", validate(categoryCreateSchema), async (c) => {
  try {
    const categoryData = getValidated(c);
    const existingCategory = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE name = ?"
    ).bind(categoryData.name).first();
    if (existingCategory) {
      return c.json({
        success: false,
        data: null,
        message: "T\xEAn danh m\u1EE5c \u0111\xE3 t\u1ED3n t\u1EA1i"
      }, 400);
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO categories (name, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      categoryData.name,
      categoryData.description || null,
      categoryData.is_active ? 1 : 0
    ).run();
    const newCategory = await c.env.DB.prepare(`
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories WHERE id = ?
    `).bind(result.meta.last_row_id).first();
    return c.json({
      success: true,
      data: {
        id: newCategory.id,
        name: newCategory.name,
        description: newCategory.description,
        is_active: Boolean(newCategory.is_active),
        product_count: 0,
        created_at: newCategory.created_at,
        updated_at: newCategory.updated_at
      },
      message: "T\u1EA1o danh m\u1EE5c th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Create category error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi t\u1EA1o danh m\u1EE5c"
    }, 500);
  }
});
app3.put("/:id", validate(categoryUpdateSchema), async (c) => {
  try {
    const categoryId = parseInt(c.req.param("id"));
    const categoryData = getValidated(c);
    if (isNaN(categoryId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID danh m\u1EE5c kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingCategory = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE id = ?"
    ).bind(categoryId).first();
    if (!existingCategory) {
      return c.json({
        success: false,
        data: null,
        message: "Danh m\u1EE5c kh\xF4ng t\u1ED3n t\u1EA1i"
      }, 404);
    }
    if (categoryData.name) {
      const duplicateName = await c.env.DB.prepare(
        "SELECT id FROM categories WHERE name = ? AND id != ?"
      ).bind(categoryData.name, categoryId).first();
      if (duplicateName) {
        return c.json({
          success: false,
          data: null,
          message: "T\xEAn danh m\u1EE5c \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    const updateFields = [];
    const updateParams = [];
    if (categoryData.name !== void 0) {
      updateFields.push("name = ?");
      updateParams.push(categoryData.name);
    }
    if (categoryData.description !== void 0) {
      updateFields.push("description = ?");
      updateParams.push(categoryData.description);
    }
    if (categoryData.is_active !== void 0) {
      updateFields.push("is_active = ?");
      updateParams.push(categoryData.is_active ? 1 : 0);
    }
    updateFields.push("updated_at = datetime('now')");
    updateParams.push(categoryId);
    await c.env.DB.prepare(`
      UPDATE categories
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).bind(...updateParams).run();
    const updatedCategory = await c.env.DB.prepare(`
      SELECT
        c.id,
        c.name,
        c.description,
        c.is_active,
        c.created_at,
        c.updated_at,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
      WHERE c.id = ?
      GROUP BY c.id
    `).bind(categoryId).first();
    return c.json({
      success: true,
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        is_active: Boolean(updatedCategory.is_active),
        product_count: updatedCategory.product_count || 0,
        created_at: updatedCategory.created_at,
        updated_at: updatedCategory.updated_at
      },
      message: "C\u1EADp nh\u1EADt danh m\u1EE5c th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Update category error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt danh m\u1EE5c"
    }, 500);
  }
});
app3.delete("/:id", async (c) => {
  try {
    const categoryId = parseInt(c.req.param("id"));
    if (isNaN(categoryId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID danh m\u1EE5c kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingCategory = await c.env.DB.prepare(
      "SELECT id FROM categories WHERE id = ?"
    ).bind(categoryId).first();
    if (!existingCategory) {
      return c.json({
        success: false,
        data: null,
        message: "Danh m\u1EE5c kh\xF4ng t\u1ED3n t\u1EA1i"
      }, 404);
    }
    const productsInCategory = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = 1"
    ).bind(categoryId).first();
    if (productsInCategory && productsInCategory.count > 0) {
      return c.json({
        success: false,
        data: null,
        message: `Kh\xF4ng th\u1EC3 x\xF3a danh m\u1EE5c v\xEC c\xF2n ${productsInCategory.count} s\u1EA3n ph\u1EA9m \u0111ang s\u1EED d\u1EE5ng`
      }, 400);
    }
    await c.env.DB.prepare(`
      UPDATE categories
      SET is_active = 0, updated_at = datetime('now')
      WHERE id = ?
    `).bind(categoryId).run();
    return c.json({
      success: true,
      data: null,
      message: "X\xF3a danh m\u1EE5c th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi x\xF3a danh m\u1EE5c"
    }, 500);
  }
});
var categories_default = app3;

// src/routes/sales.ts
var app4 = new Hono2();
async function initializeSalesTables(env) {
  try {
    const tableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sales'
    `).first();
    if (!tableInfo) {
      console.log("Creating sales table...");
      await env.DB.prepare(`
        CREATE TABLE sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT,
          customer_phone TEXT,
          customer_email TEXT,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          payment_method TEXT NOT NULL DEFAULT 'cash',
          payment_status TEXT NOT NULL DEFAULT 'paid',
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();
    }
    const itemsTableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sale_items'
    `).first();
    if (!itemsTableInfo) {
      console.log("Creating sale_items table...");
      await env.DB.prepare(`
        CREATE TABLE sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `).run();
    }
    const inventoryTableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_transactions'
    `).first();
    if (!inventoryTableInfo) {
      console.log("Creating inventory_transactions table...");
      await env.DB.prepare(`
        CREATE TABLE inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          reference_number TEXT,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (product_id) REFERENCES products(id)
        )
      `).run();
    }
    console.log("Sales tables checked/initialized successfully");
  } catch (error) {
    console.log("Sales tables initialization error:", error);
    throw error;
  }
}
__name(initializeSalesTables, "initializeSalesTables");
app4.get("/init-tables", async (c) => {
  try {
    await initializeSalesTables(c.env);
    return c.json({
      success: true,
      data: null,
      message: "Sales tables initialized"
    });
  } catch (error) {
    console.error("Init sales tables error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Init error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app4.get("/init-sample", async (c) => {
  try {
    await initializeSalesTables(c.env);
    const count = await c.env.DB.prepare("SELECT COUNT(*) as count FROM sales").first();
    if (!count || count.count === 0) {
      console.log("Creating sample sales...");
      const sampleSales = [
        {
          customer_name: "Nguy\u1EC5n V\u0103n A",
          customer_phone: "0901234567",
          customer_email: "nguyenvana@email.com",
          total_amount: 599e4,
          tax_amount: 599e3,
          discount_amount: 0,
          payment_method: "cash",
          payment_status: "paid",
          notes: "Mua CPU Intel Core i5-13400F"
        },
        {
          customer_name: "Tr\u1EA7n Th\u1ECB B",
          customer_phone: "0912345678",
          customer_email: "tranthib@email.com",
          total_amount: 159e4,
          tax_amount: 159e3,
          discount_amount: 1e5,
          payment_method: "card",
          payment_status: "paid",
          notes: "Mua RAM Kingston Fury 16GB"
        },
        {
          customer_name: "L\xEA V\u0103n C",
          customer_phone: "0923456789",
          customer_email: null,
          total_amount: 89e4,
          tax_amount: 89e3,
          discount_amount: 0,
          payment_method: "bank_transfer",
          payment_status: "paid",
          notes: "Mua b\xE0n ph\xEDm c\u01A1"
        }
      ];
      for (const sale of sampleSales) {
        await c.env.DB.prepare(`
          INSERT INTO sales (
            customer_name, customer_phone, customer_email,
            total_amount, tax_amount, discount_amount,
            payment_method, payment_status, notes,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          sale.customer_name,
          sale.customer_phone,
          sale.customer_email,
          sale.total_amount,
          sale.tax_amount,
          sale.discount_amount,
          sale.payment_method,
          sale.payment_status,
          sale.notes
        ).run();
      }
      console.log("Sample sales created successfully");
    }
    const sales = await c.env.DB.prepare(`
      SELECT id, customer_name, customer_phone, total_amount, payment_method, payment_status, created_at
      FROM sales
      ORDER BY created_at DESC
    `).all();
    return c.json({
      success: true,
      data: sales.results,
      message: "Sample sales initialized"
    });
  } catch (error) {
    console.error("Init sample sales error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Init error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app4.get("/check-tables", async (c) => {
  try {
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sales', 'sale_items')
    `).all();
    const salesSchema = await c.env.DB.prepare(`
      PRAGMA table_info(sales)
    `).all();
    return c.json({
      success: true,
      data: {
        tables: tables.results,
        salesSchema: salesSchema.results
      },
      message: "Tables check"
    });
  } catch (error) {
    console.error("Check tables error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Check error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app4.get("/debug", async (c) => {
  try {
    const sales = await c.env.DB.prepare(`
      SELECT id, customer_name, customer_phone, total_amount, payment_method, payment_status, created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    return c.json({
      success: true,
      data: sales.results,
      message: "Debug sales"
    });
  } catch (error) {
    console.error("Debug sales error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app4.get("/test", async (c) => {
  try {
    try {
      await initializeSalesTables(c.env);
    } catch (initError) {
      console.error("Failed to initialize sales tables:", initError);
      return c.json({
        success: false,
        data: null,
        message: "L\u1ED7i kh\u1EDFi t\u1EA1o b\u1EA3ng d\u1EEF li\u1EC7u: " + (initError instanceof Error ? initError.message : String(initError))
      }, 500);
    }
    const sales = await c.env.DB.prepare(`
      SELECT id, customer_name, customer_phone, total_amount, payment_method, payment_status, created_at
      FROM sales
      ORDER BY created_at DESC
      LIMIT 5
    `).all();
    return c.json({
      success: true,
      data: sales.results,
      message: "Test sales query successful"
    });
  } catch (error) {
    console.error("Test sales error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Test error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app4.get("/", async (c) => {
  try {
    try {
      await initializeSalesTables(c.env);
    } catch (initError) {
      console.error("Failed to initialize sales tables:", initError);
      return c.json({
        success: false,
        data: null,
        message: "L\u1ED7i kh\u1EDFi t\u1EA1o b\u1EA3ng d\u1EEF li\u1EC7u: " + (initError instanceof Error ? initError.message : String(initError))
      }, 500);
    }
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const search = c.req.query("search") || "";
    const payment_method = c.req.query("payment_method") || "";
    const payment_status = c.req.query("payment_status") || "";
    const date_from = c.req.query("date_from") || "";
    const date_to = c.req.query("date_to") || "";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (search && search.trim()) {
      conditions.push("(customer_name LIKE ? OR customer_phone LIKE ? OR customer_email LIKE ?)");
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (payment_method && payment_method.trim()) {
      conditions.push("payment_method = ?");
      params.push(payment_method);
    }
    if (payment_status && payment_status.trim()) {
      conditions.push("payment_status = ?");
      params.push(payment_status);
    }
    if (date_from && date_from.trim()) {
      conditions.push("DATE(created_at) >= ?");
      params.push(date_from);
    }
    if (date_to && date_to.trim()) {
      conditions.push("DATE(created_at) <= ?");
      params.push(date_to);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*) as total FROM sales ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const salesQuery = `
      SELECT
        id, customer_name, customer_phone, customer_email,
        total_amount, tax_amount, discount_amount,
        payment_method, payment_status, notes,
        created_at, updated_at
      FROM sales
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const salesResult = await c.env.DB.prepare(salesQuery).bind(...params, limit, offset).all();
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: {
        data: salesResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: "L\u1EA5y danh s\xE1ch \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get sales error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y danh s\xE1ch \u0111\u01A1n h\xE0ng"
    }, 500);
  }
});
app4.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const user = { id: 1, username: "admin" };
    console.log("Sales POST request data:", JSON.stringify(data, null, 2));
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return c.json({
        success: false,
        data: null,
        message: "Thi\u1EBFu th\xF4ng tin s\u1EA3n ph\u1EA9m trong \u0111\u01A1n h\xE0ng"
      }, 400);
    }
    const statements = [];
    try {
      for (const item of data.items) {
        console.log("Processing item:", JSON.stringify(item, null, 2));
        if (!item.product_id || !item.quantity || !item.unit_price) {
          return c.json({
            success: false,
            data: null,
            message: `Th\xF4ng tin s\u1EA3n ph\u1EA9m kh\xF4ng \u0111\u1EA7y \u0111\u1EE7: ${JSON.stringify(item)}`
          }, 400);
        }
        const product = await c.env.DB.prepare(
          "SELECT id, stock_quantity, price FROM products WHERE id = ? AND is_active = 1"
        ).bind(item.product_id).first();
        console.log("Product found:", product);
        if (!product) {
          return c.json({
            success: false,
            data: null,
            message: `S\u1EA3n ph\u1EA9m ID ${item.product_id} kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c kh\xF4ng ho\u1EA1t \u0111\u1ED9ng`
          }, 400);
        }
        if (product.stock_quantity < item.quantity) {
          return c.json({
            success: false,
            data: null,
            message: `S\u1EA3n ph\u1EA9m ID ${item.product_id} kh\xF4ng \u0111\u1EE7 h\xE0ng t\u1ED3n kho`
          }, 400);
        }
      }
      const saleResult = await c.env.DB.prepare(`
        INSERT INTO sales (
          customer_name, customer_phone, customer_email,
          total_amount, tax_amount, discount_amount,
          payment_method, payment_status, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, datetime('now'), datetime('now'))
      `).bind(
        data.customer_name || null,
        data.customer_phone || null,
        data.customer_email || null,
        data.total_amount,
        data.tax_amount,
        data.discount_amount,
        data.payment_method,
        data.notes || null
      ).run();
      const saleId = saleResult.meta.last_row_id;
      const batchStatements = [];
      for (const item of data.items) {
        batchStatements.push(
          c.env.DB.prepare(`
            INSERT INTO sale_items (
              sale_id, product_id, quantity, unit_price, total_price, created_at
            ) VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).bind(saleId, item.product_id, item.quantity, item.unit_price, item.total_price)
        );
        batchStatements.push(
          c.env.DB.prepare(
            "UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE id = ?"
          ).bind(item.quantity, item.product_id)
        );
        batchStatements.push(
          c.env.DB.prepare(`
            INSERT INTO inventory_transactions (
              product_id, transaction_type, quantity, reference_number, notes, created_at
            ) VALUES (?, 'stock_out', ?, ?, ?, datetime('now'))
          `).bind(item.product_id, item.quantity, `SALE-${saleId}`, `B\xE1n h\xE0ng - \u0110\u01A1n ${saleId}`)
        );
      }
      await c.env.DB.batch(batchStatements);
      return c.json({
        success: true,
        data: { id: saleId, sale_id: saleId },
        message: "T\u1EA1o \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng"
      });
    } catch (error) {
      console.error("Transaction error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Create sale error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return c.json({
      success: false,
      data: null,
      message: `L\u1ED7i khi t\u1EA1o \u0111\u01A1n h\xE0ng: ${error instanceof Error ? error.message : "Unknown error"}`
    }, 500);
  }
});
app4.get("/:id", authenticate, async (c) => {
  try {
    const orderId = parseInt(c.req.param("id"));
    if (isNaN(orderId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID \u0111\u01A1n h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const orderResult = await c.env.DB.prepare(`
      SELECT
        s.id, s.customer_name, s.customer_phone, s.customer_email,
        s.total_amount, s.tax_amount, s.discount_amount,
        s.payment_method, s.payment_status, s.notes,
        s.created_at, s.updated_at
      FROM sales s
      WHERE s.id = ?
    `).bind(orderId).first();
    if (!orderResult) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng"
      }, 404);
    }
    const itemsResult = await c.env.DB.prepare(`
      SELECT
        si.id, si.product_id, si.quantity, si.unit_price, si.total_price,
        p.name as product_name, p.sku as product_sku, p.barcode,
        c.name as category_name
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE si.sale_id = ?
      ORDER BY si.id
    `).bind(orderId).all();
    return c.json({
      success: true,
      data: {
        order: orderResult,
        items: itemsResult.results
      },
      message: "L\u1EA5y chi ti\u1EBFt \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get order details error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y chi ti\u1EBFt \u0111\u01A1n h\xE0ng"
    }, 500);
  }
});
app4.put("/:id/status", authenticate, async (c) => {
  try {
    const orderId = parseInt(c.req.param("id"));
    const data = await c.req.json();
    if (isNaN(orderId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID \u0111\u01A1n h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const { payment_status, notes } = data;
    if (!payment_status || !["paid", "pending", "cancelled"].includes(payment_status)) {
      return c.json({
        success: false,
        data: null,
        message: "Tr\u1EA1ng th\xE1i thanh to\xE1n kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingOrder = await c.env.DB.prepare(
      "SELECT id, payment_status FROM sales WHERE id = ?"
    ).bind(orderId).first();
    if (!existingOrder) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng"
      }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE sales
      SET payment_status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(payment_status, notes || null, orderId).run();
    return c.json({
      success: true,
      data: {
        id: orderId,
        old_status: existingOrder.payment_status,
        new_status: payment_status
      },
      message: "C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i \u0111\u01A1n h\xE0ng"
    }, 500);
  }
});
app4.delete("/:id", authenticate, async (c) => {
  try {
    const orderId = parseInt(c.req.param("id"));
    if (isNaN(orderId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID \u0111\u01A1n h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    await c.env.DB.prepare("BEGIN TRANSACTION").run();
    try {
      const existingOrder = await c.env.DB.prepare(
        "SELECT id, payment_status FROM sales WHERE id = ?"
      ).bind(orderId).first();
      if (!existingOrder) {
        await c.env.DB.prepare("ROLLBACK").run();
        return c.json({
          success: false,
          data: null,
          message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng"
        }, 404);
      }
      if (existingOrder.payment_status === "paid") {
        await c.env.DB.prepare("ROLLBACK").run();
        return c.json({
          success: false,
          data: null,
          message: "Kh\xF4ng th\u1EC3 h\u1EE7y \u0111\u01A1n h\xE0ng \u0111\xE3 thanh to\xE1n"
        }, 400);
      }
      const orderItems = await c.env.DB.prepare(`
        SELECT product_id, quantity FROM sale_items WHERE sale_id = ?
      `).bind(orderId).all();
      for (const item of orderItems.results) {
        await c.env.DB.prepare(`
          UPDATE products
          SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(item.quantity, item.product_id).run();
        await c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity, reference_number, notes, created_at
          ) VALUES (?, 'stock_in', ?, ?, ?, datetime('now'))
        `).bind(
          item.product_id,
          item.quantity,
          `CANCEL-${orderId}`,
          `H\u1EE7y \u0111\u01A1n h\xE0ng ${orderId} - Ho\xE0n kho`
        ).run();
      }
      await c.env.DB.prepare(`
        UPDATE sales
        SET payment_status = 'cancelled', updated_at = datetime('now')
        WHERE id = ?
      `).bind(orderId).run();
      await c.env.DB.prepare("COMMIT").run();
      return c.json({
        success: true,
        data: { id: orderId },
        message: "H\u1EE7y \u0111\u01A1n h\xE0ng th\xE0nh c\xF4ng"
      });
    } catch (error) {
      await c.env.DB.prepare("ROLLBACK").run();
      throw error;
    }
  } catch (error) {
    console.error("Cancel order error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi h\u1EE7y \u0111\u01A1n h\xE0ng"
    }, 500);
  }
});
app4.post("/test", async (c) => {
  try {
    const data = await c.req.json();
    console.log("Test POST data received:", JSON.stringify(data, null, 2));
    return c.json({
      success: true,
      message: "Test POST successful",
      received_data: data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Test POST error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace"
    }, 500);
  }
});
var sales_default = app4;

// src/routes/users.ts
var app5 = new Hono2();
var registerSchema = external_exports.object({
  username: external_exports.string().min(3),
  email: external_exports.string().email(),
  password: external_exports.string().min(8),
  full_name: external_exports.string(),
  phone: external_exports.string().nullable().optional(),
  role: external_exports.enum(["admin", "manager", "cashier", "inventory"]),
  store_id: external_exports.number().int().positive()
});
app5.post("/register", validate("body", registerSchema), async (c) => {
  const data = c.get("validated_body");
  const db = c.env.DB;
  try {
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ? AND deleted_at IS NULL").bind(data.email).first();
    if (existingUser) {
      return c.json({
        success: false,
        message: "Email \u0111\xE3 t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng"
      }, 409);
    }
    const password_salt = generateRandomSalt();
    const password_hash = await hashPassword(data.password, password_salt);
    const result = await db.prepare(`
      INSERT INTO users (
        username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      data.username,
      data.email,
      password_hash,
      password_salt,
      data.full_name,
      data.phone || null,
      data.role,
      data.store_id
    ).run();
    if (!result.success) {
      throw new Error("Database error while creating user");
    }
    await deleteCacheByPrefix(c.env.CACHE, "users:");
    await auditLogger(c, "user_created", { user_id: result.meta?.last_row_id, email: data.email });
    return c.json({
      success: true,
      message: "\u0110\u0103ng k\xFD t\xE0i kho\u1EA3n th\xE0nh c\xF4ng",
      data: {
        id: result.meta?.last_row_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name
      }
    }, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({
      success: false,
      message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi t\u1EA1o t\xE0i kho\u1EA3n. Vui l\xF2ng th\u1EED l\u1EA1i sau."
    }, 500);
  }
});
var initAdminSchema = external_exports.object({
  username: external_exports.string().min(3),
  email: external_exports.string().email(),
  password: external_exports.string().min(8),
  full_name: external_exports.string(),
  phone: external_exports.string().nullable().optional(),
  initKey: external_exports.string().optional()
});
app5.post("/init-admin", validate("body", initAdminSchema), async (c) => {
  const data = c.get("validated_body");
  const db = c.env.DB;
  try {
    const existingUsers = await db.prepare("SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL").first();
    if (existingUsers && existingUsers.count > 0) {
      return c.json({
        success: false,
        message: "T\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB \u0111\xE3 t\u1ED3n t\u1EA1i"
      }, 403);
    }
    const password_salt = generateRandomSalt();
    const password_hash = await hashPassword(data.password, password_salt);
    const result = await db.prepare(`
      INSERT INTO users (
        username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 1, datetime('now'))
    `).bind(
      data.username,
      data.email,
      password_hash,
      password_salt,
      data.full_name,
      data.phone || null
    ).run();
    if (!result.success) {
      throw new Error("Database error while creating admin user");
    }
    await auditLogger(c, "admin_user_initialized", { user_id: result.meta?.last_row_id, email: data.email });
    return c.json({
      success: true,
      message: "T\u1EA1o t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB vi\xEAn th\xE0nh c\xF4ng",
      data: {
        id: result.meta?.last_row_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: "admin"
      }
    }, 201);
  } catch (error) {
    console.error("Error creating admin user:", error);
    return c.json({
      success: false,
      message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi t\u1EA1o t\xE0i kho\u1EA3n qu\u1EA3n tr\u1ECB vi\xEAn. Vui l\xF2ng th\u1EED l\u1EA1i sau."
    }, 500);
  }
});
var directRegisterSchema = external_exports.object({
  username: external_exports.string().min(3),
  email: external_exports.string().email(),
  password: external_exports.string().min(8),
  full_name: external_exports.string(),
  phone: external_exports.string().nullable().optional(),
  role: external_exports.enum(["admin", "manager", "cashier", "inventory"]),
  store_id: external_exports.number().int().positive().optional().default(1),
  secretKey: external_exports.string()
});
app5.post("/direct-register", validate("body", directRegisterSchema), async (c) => {
  const data = c.get("validated_body");
  if (data.secretKey !== "create_admin_init_key_2024") {
    return c.json({
      success: false,
      message: "Kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp"
    }, 403);
  }
  const db = c.env.DB;
  try {
    const existingUser = await db.prepare("SELECT id FROM users WHERE email = ? AND deleted_at IS NULL").bind(data.email).first();
    if (existingUser) {
      return c.json({
        success: false,
        message: "Email \u0111\xE3 t\u1ED3n t\u1EA1i trong h\u1EC7 th\u1ED1ng"
      }, 409);
    }
    const password_salt = generateRandomSalt();
    const password_hash = await hashPassword(data.password, password_salt);
    const result = await db.prepare(`
      INSERT INTO users (
        username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      data.username,
      data.email,
      password_hash,
      password_salt,
      data.full_name,
      data.phone || null,
      data.role,
      data.store_id
    ).run();
    if (!result.success) {
      throw new Error("Database error while creating user");
    }
    await deleteCacheByPrefix(c.env.CACHE, "users:");
    await auditLogger(c, "user_created_direct", { user_id: result.meta?.last_row_id, email: data.email });
    return c.json({
      success: true,
      message: "T\u1EA1o t\xE0i kho\u1EA3n th\xE0nh c\xF4ng",
      data: {
        id: result.meta?.last_row_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role
      }
    }, 201);
  } catch (error) {
    console.error("Error creating user directly:", error);
    return c.json({
      success: false,
      message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi t\u1EA1o t\xE0i kho\u1EA3n. Vui l\xF2ng th\u1EED l\u1EA1i sau."
    }, 500);
  }
});
app5.use("/*", authenticate);
app5.get("/", authorize(["admin"]), async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const search = c.req.query("search") || "";
  const offset = (page - 1) * limit;
  const cacheKey = createCacheKey("users", `list:${page}:${limit}:${search}`);
  try {
    const result = await getOrSetCache(c.env.CACHE, cacheKey, async () => {
      let query = `SELECT id, username, email, full_name, phone, role, store_id, is_active FROM users WHERE deleted_at IS NULL`;
      let countQuery = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
      const params = [];
      if (search) {
        query += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
        countQuery += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }
      query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      const users = await c.env.DB.prepare(query).bind(...params).all();
      const countResult = await c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first();
      return {
        items: users.results,
        total: countResult ? countResult.total : 0,
        page,
        limit
      };
    });
    return c.json({
      success: true,
      message: "Danh s\xE1ch ng\u01B0\u1EDDi d\xF9ng",
      data: result
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({
      success: false,
      message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi truy v\u1EA5n danh s\xE1ch ng\u01B0\u1EDDi d\xF9ng"
    }, 500);
  }
});
app5.get("/:id", authorize(["admin"]), async (c) => {
  const id = c.req.param("id");
  const cacheKey = createCacheKey("users", `detail:${id}`);
  try {
    const result = await getOrSetCache(c.env.CACHE, cacheKey, async () => {
      const user = await c.env.DB.prepare(`
        SELECT id, username, email, full_name, phone, role, store_id, is_active, created_at, updated_at
        FROM users WHERE id = ? AND deleted_at IS NULL
      `).bind(id).first();
      if (!user) {
        throw new Error("NOT_FOUND");
      }
      return user;
    });
    return c.json({
      success: true,
      message: "Th\xF4ng tin ng\u01B0\u1EDDi d\xF9ng",
      data: result
    });
  } catch (error) {
    if (error.message === "NOT_FOUND") {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y ng\u01B0\u1EDDi d\xF9ng"
      }, 404);
    }
    return c.json({
      success: false,
      message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i khi truy v\u1EA5n th\xF4ng tin ng\u01B0\u1EDDi d\xF9ng"
    }, 500);
  }
});
var users_default = app5;

// src/routes/reports.ts
var app6 = new Hono2();
var getDateRanges = /* @__PURE__ */ __name(() => {
  const now = /* @__PURE__ */ new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  return {
    today: today.toISOString().split("T")[0],
    yesterday: yesterday.toISOString().split("T")[0],
    weekStart: weekStart.toISOString().split("T")[0],
    lastWeekStart: lastWeekStart.toISOString().split("T")[0],
    lastWeekEnd: lastWeekEnd.toISOString().split("T")[0]
  };
}, "getDateRanges");
app6.get("/dashboard", async (c) => {
  try {
    const dates = getDateRanges();
    const todaySalesResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
      FROM sales
      WHERE DATE(created_at) = ? AND payment_status = 'paid'
    `).bind(dates.today).first();
    const yesterdaySalesResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE DATE(created_at) = ? AND payment_status = 'paid'
    `).bind(dates.yesterday).first();
    const weekSalesResult = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
      FROM sales
      WHERE DATE(created_at) >= ? AND payment_status = 'paid'
    `).bind(dates.weekStart).first();
    const productCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM products WHERE is_active = 1
    `).first();
    const categoryCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM categories WHERE is_active = 1
    `).first();
    const customerCountResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM customers
    `).first();
    const lowStockResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = 1 AND stock_quantity <= stock_alert_threshold
    `).first();
    const pendingOrdersResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total
      FROM sales
      WHERE payment_status = 'pending'
    `).first();
    const salesChartResult = await c.env.DB.prepare(`
      SELECT
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as sales
      FROM sales
      WHERE DATE(created_at) >= ? AND payment_status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `).bind(dates.weekStart).all();
    const topProductsResult = await c.env.DB.prepare(`
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(si.quantity), 0) as quantity,
        COALESCE(SUM(si.total_price), 0) as total
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE s.payment_status = 'paid' AND DATE(s.created_at) >= ?
      GROUP BY p.id, p.name
      ORDER BY quantity DESC
      LIMIT 5
    `).bind(dates.weekStart).all();
    const salesByCategoryResult = await c.env.DB.prepare(`
      SELECT
        c.name,
        COALESCE(SUM(si.total_price), 0) as value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE s.payment_status = 'paid' AND DATE(s.created_at) >= ?
      GROUP BY c.id, c.name
      HAVING value > 0
      ORDER BY value DESC
    `).bind(dates.weekStart).all();
    const todaySales = Number(todaySalesResult?.total || 0);
    const yesterdaySales = Number(yesterdaySalesResult?.total || 0);
    const trendPercent = yesterdaySales > 0 ? Math.round((todaySales - yesterdaySales) / yesterdaySales * 100 * 10) / 10 : 0;
    const salesChart = [];
    const chartData = salesChartResult?.results || [];
    for (let i = 6; i >= 0; i--) {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayStr = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const dayData = chartData.find((item) => item.date === dateStr);
      salesChart.push({
        day: dayStr,
        sales: Number(dayData?.sales || 0)
      });
    }
    const dashboardStats = {
      todaySales,
      weekSales: Number(weekSalesResult?.total || 0),
      todayOrders: Number(todaySalesResult?.count || 0),
      weekOrders: Number(weekSalesResult?.count || 0),
      lowStockCount: Number(lowStockResult?.total || 0),
      productCount: Number(productCountResult?.total || 0),
      categoryCount: Number(categoryCountResult?.total || 0),
      trendPercent,
      pendingOrders: Number(pendingOrdersResult?.total || 0),
      customerCount: Number(customerCountResult?.total || 0),
      salesChart,
      topProducts: (topProductsResult?.results || []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: Number(item.quantity || 0),
        total: Number(item.total || 0)
      })),
      salesByCategory: (salesByCategoryResult?.results || []).map((item) => ({
        name: item.name,
        value: Number(item.value || 0)
      }))
    };
    return c.json({
      success: true,
      data: dashboardStats,
      message: "Dashboard statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Error retrieving dashboard statistics: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app6.get("/test", async (c) => {
  try {
    const salesCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM sales
    `).first();
    const productsCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM products
    `).first();
    return c.json({
      success: true,
      data: {
        salesCount: salesCount?.count || 0,
        productsCount: productsCount?.count || 0
      },
      message: "Reports test successful"
    });
  } catch (error) {
    console.error("Reports test error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Reports test error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
var reports_default = app6;

// src/routes/settings.ts
var app7 = new Hono2();
app7.get("/", authenticate, async (c) => {
  try {
    const settingsResult = await c.env.DB.prepare(`
      SELECT key, value, type, category, description
      FROM settings
      WHERE is_public = 1
      ORDER BY category, key
    `).all();
    const settings = {};
    for (const row of settingsResult.results) {
      const { key, value, type } = row;
      let convertedValue = value;
      if (type === "number") {
        convertedValue = parseFloat(value);
      } else if (type === "boolean") {
        convertedValue = value === "true" || value === "1";
      } else if (type === "json") {
        try {
          convertedValue = JSON.parse(value);
        } catch (error) {
          console.error(`Invalid JSON in setting ${key}:`, error);
          convertedValue = null;
        }
      }
      settings[key] = convertedValue;
    }
    return c.json({
      success: true,
      data: settings,
      message: "L\u1EA5y c\xE0i \u0111\u1EB7t th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y c\xE0i \u0111\u1EB7t"
    }, 500);
  }
});
var settings_default = app7;

// src/routes/stores.ts
var app8 = new Hono2();
app8.get("/", async (c) => {
  const cacheKey = createCacheKey("stores", "list");
  try {
    const result = await getOrSetCache(c.env.CACHE, cacheKey, async () => {
      const stores = await c.env.DB.prepare(`
        SELECT id, name, address, phone, email, is_active, created_at, updated_at
        FROM stores 
        WHERE deleted_at IS NULL
        ORDER BY id ASC
      `).all();
      return stores.results;
    }, 3600);
    return c.json({
      success: true,
      message: "Danh s\xE1ch c\u1EEDa h\xE0ng",
      data: result
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return c.json({
      success: false,
      message: "Kh\xF4ng th\u1EC3 l\u1EA5y danh s\xE1ch c\u1EEDa h\xE0ng",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app8.get("/:id", authenticate, async (c) => {
  const id = c.req.param("id");
  const cacheKey = createCacheKey("stores", `detail:${id}`);
  try {
    const result = await getOrSetCache(c.env.CACHE, cacheKey, async () => {
      const store = await c.env.DB.prepare(`
        SELECT id, name, address, phone, email, is_active, created_at, updated_at
        FROM stores 
        WHERE id = ? AND deleted_at IS NULL
      `).bind(id).first();
      if (!store) {
        throw new Error("NOT_FOUND");
      }
      return store;
    });
    return c.json({
      success: true,
      message: "Th\xF4ng tin c\u1EEDa h\xE0ng",
      data: result
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y c\u1EEDa h\xE0ng"
      }, 404);
    }
    return c.json({
      success: false,
      message: "Kh\xF4ng th\u1EC3 l\u1EA5y th\xF4ng tin c\u1EEDa h\xE0ng",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
var storeSchema = external_exports.object({
  name: external_exports.string().min(2, "T\xEAn c\u1EEDa h\xE0ng ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 2 k\xFD t\u1EF1"),
  address: external_exports.string().min(5, "\u0110\u1ECBa ch\u1EC9 ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 5 k\xFD t\u1EF1").optional(),
  phone: external_exports.string().min(10, "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i kh\xF4ng h\u1EE3p l\u1EC7").optional(),
  email: external_exports.string().email("Email kh\xF4ng h\u1EE3p l\u1EC7").optional(),
  is_active: external_exports.boolean().optional().default(true)
});
app8.post("/", authenticate, authorize(["admin"]), validate("body", storeSchema), async (c) => {
  const data = c.get("validated_body");
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO stores (name, address, phone, email, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      data.name,
      data.address || null,
      data.phone || null,
      data.email || null,
      data.is_active
    ).run();
    await deleteCacheByPrefix(c.env.CACHE, "stores:");
    return c.json({
      success: true,
      message: "T\u1EA1o c\u1EEDa h\xE0ng th\xE0nh c\xF4ng",
      data: {
        id: result.meta?.last_row_id,
        ...data
      }
    }, 201);
  } catch (error) {
    console.error("Error creating store:", error);
    return c.json({
      success: false,
      message: "Kh\xF4ng th\u1EC3 t\u1EA1o c\u1EEDa h\xE0ng",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app8.put("/:id", authenticate, authorize(["admin"]), validate("body", storeSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.get("validated_body");
  try {
    const existingStore = await c.env.DB.prepare(`
      SELECT id FROM stores WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();
    if (!existingStore) {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y c\u1EEDa h\xE0ng"
      }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE stores
      SET name = ?, address = ?, phone = ?, email = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name,
      data.address || null,
      data.phone || null,
      data.email || null,
      data.is_active,
      id
    ).run();
    await deleteCacheByPrefix(c.env.CACHE, "stores:");
    return c.json({
      success: true,
      message: "C\u1EADp nh\u1EADt c\u1EEDa h\xE0ng th\xE0nh c\xF4ng",
      data: {
        id: Number(id),
        ...data
      }
    });
  } catch (error) {
    console.error("Error updating store:", error);
    return c.json({
      success: false,
      message: "Kh\xF4ng th\u1EC3 c\u1EADp nh\u1EADt c\u1EEDa h\xE0ng",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app8.delete("/:id", authenticate, authorize(["admin"]), async (c) => {
  const id = c.req.param("id");
  try {
    const existingStore = await c.env.DB.prepare(`
      SELECT id FROM stores WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();
    if (!existingStore) {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y c\u1EEDa h\xE0ng"
      }, 404);
    }
    const activeStoresCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM stores 
      WHERE is_active = 1 AND deleted_at IS NULL
    `).first();
    if (activeStoresCount && activeStoresCount.count <= 1) {
      return c.json({
        success: false,
        message: "Kh\xF4ng th\u1EC3 x\xF3a c\u1EEDa h\xE0ng cu\u1ED1i c\xF9ng"
      }, 400);
    }
    await c.env.DB.prepare(`
      UPDATE stores
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();
    await deleteCacheByPrefix(c.env.CACHE, "stores:");
    return c.json({
      success: true,
      message: "X\xF3a c\u1EEDa h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    return c.json({
      success: false,
      message: "Kh\xF4ng th\u1EC3 x\xF3a c\u1EEDa h\xE0ng",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
var stores_default = app8;

// src/routes/inventory.ts
var app9 = new Hono2();
app9.get("/debug", authenticate, async (c) => {
  try {
    const transactions = await c.env.DB.prepare(`
      SELECT 
        it.id, it.product_id, it.transaction_type, it.quantity, it.cost_price,
        it.reference_number, it.supplier_name, it.notes, it.created_at,
        p.name as product_name, p.sku as product_sku
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      ORDER BY it.created_at DESC
      LIMIT 10
    `).all();
    return c.json({
      success: true,
      data: transactions.results,
      message: "Debug inventory transactions"
    });
  } catch (error) {
    console.error("Debug inventory error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app9.get("/transactions", authenticate, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const transaction_type = c.req.query("transaction_type") || "";
    const product_id = c.req.query("product_id") || "";
    const date_from = c.req.query("date_from") || "";
    const date_to = c.req.query("date_to") || "";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (search && search.trim()) {
      conditions.push("(p.name LIKE ? OR p.sku LIKE ? OR it.reference_number LIKE ? OR it.supplier_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (transaction_type && transaction_type.trim()) {
      conditions.push("it.transaction_type = ?");
      params.push(transaction_type);
    }
    if (product_id && product_id.trim()) {
      conditions.push("it.product_id = ?");
      params.push(parseInt(product_id));
    }
    if (date_from && date_from.trim()) {
      conditions.push("DATE(it.created_at) >= ?");
      params.push(date_from);
    }
    if (date_to && date_to.trim()) {
      conditions.push("DATE(it.created_at) <= ?");
      params.push(date_to);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      ${whereClause}
    `;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const transactionsQuery = `
      SELECT 
        it.id, it.product_id, it.transaction_type, it.quantity, it.cost_price,
        it.reference_number, it.supplier_name, it.from_store_id, it.to_store_id,
        it.notes, it.created_at,
        p.name as product_name, p.sku as product_sku, p.stock_quantity,
        c.name as category_name
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY it.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const transactionsResult = await c.env.DB.prepare(transactionsQuery).bind(...params, limit, offset).all();
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: {
        data: transactionsResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: "L\u1EA5y l\u1ECBch s\u1EED giao d\u1ECBch kho th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get inventory transactions error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y l\u1ECBch s\u1EED giao d\u1ECBch kho"
    }, 500);
  }
});
app9.post("/stock-in-test", async (c) => {
  try {
    const data = await c.req.json();
    return c.json({
      success: true,
      data,
      message: "Test successful"
    });
  } catch (error) {
    return c.json({
      success: false,
      data: null,
      message: "Test error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app9.post("/stock-in", authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get("user");
    console.log("Stock-in request data:", JSON.stringify(data));
    console.log("User:", JSON.stringify(user));
    const productId = parseInt(data.product_id);
    const quantity = parseInt(data.quantity);
    const costPrice = data.cost_price ? parseFloat(data.cost_price) : null;
    console.log("Converted data:", { productId, quantity, costPrice });
    if (!productId || !quantity || quantity <= 0) {
      console.log("Validation failed:", { productId, quantity });
      return c.json({
        success: false,
        data: null,
        message: "Thi\u1EBFu th\xF4ng tin s\u1EA3n ph\u1EA9m ho\u1EB7c s\u1ED1 l\u01B0\u1EE3ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    console.log("Starting database operations...");
    try {
      console.log("Checking if product exists...");
      const product = await c.env.DB.prepare(
        "SELECT id, name, sku, stock_quantity, cost_price FROM products WHERE id = ? AND is_active = 1"
      ).bind(productId).first();
      console.log("Product query result:", product);
      if (!product) {
        console.log("Product not found");
        return c.json({
          success: false,
          data: null,
          message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB v\xF4 hi\u1EC7u h\xF3a"
        }, 400);
      }
      const newStockQuantity = product.stock_quantity + quantity;
      console.log("Updating stock quantity:", {
        oldStock: product.stock_quantity,
        addedQuantity: quantity,
        newStock: newStockQuantity
      });
      const updateResult = await c.env.DB.prepare(`
        UPDATE products
        SET stock_quantity = ?,
            cost_price = COALESCE(?, cost_price),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(newStockQuantity, costPrice, productId).run();
      console.log("Update result:", updateResult);
      return c.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          previous_stock: product.stock_quantity,
          quantity_added: quantity,
          new_stock_quantity: newStockQuantity
        },
        message: "Nh\u1EADp kho th\xE0nh c\xF4ng"
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Stock in error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi nh\u1EADp kho: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app9.post("/stock-transfer", authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get("user");
    if (!data.product_id || !data.quantity || data.quantity <= 0 || !data.from_store_id || !data.to_store_id) {
      return c.json({
        success: false,
        data: null,
        message: "Thi\u1EBFu th\xF4ng tin b\u1EAFt bu\u1ED9c cho chuy\u1EC3n kho"
      }, 400);
    }
    if (data.from_store_id === data.to_store_id) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng th\u1EC3 chuy\u1EC3n kho trong c\xF9ng m\u1ED9t chi nh\xE1nh"
      }, 400);
    }
    const product = await c.env.DB.prepare(
      "SELECT id, name, sku, stock_quantity FROM products WHERE id = ? AND is_active = 1"
    ).bind(data.product_id).first();
    if (!product) {
      return c.json({
        success: false,
        data: null,
        message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB v\xF4 hi\u1EC7u h\xF3a"
      }, 400);
    }
    if (product.stock_quantity < data.quantity) {
      return c.json({
        success: false,
        data: null,
        message: `Kh\xF4ng \u0111\u1EE7 t\u1ED3n kho. C\xF2n l\u1EA1i: ${product.stock_quantity}`
      }, 400);
    }
    const referenceNumber = data.reference_number || `ST-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    try {
      const statements = [
        // Insert transfer out transaction
        c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity,
            reference_number, from_store_id, to_store_id, notes, created_at
          ) VALUES (?, 'transfer_out', ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          data.product_id,
          data.quantity,
          referenceNumber,
          data.from_store_id,
          data.to_store_id,
          data.notes || null
        ),
        // Insert transfer in transaction
        c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity,
            reference_number, from_store_id, to_store_id, notes, created_at
          ) VALUES (?, 'transfer_in', ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          data.product_id,
          data.quantity,
          referenceNumber,
          data.from_store_id,
          data.to_store_id,
          data.notes || null
        )
      ];
      await c.env.DB.batch(statements);
      return c.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          quantity_transferred: data.quantity,
          from_store_id: data.from_store_id,
          to_store_id: data.to_store_id,
          reference_number: referenceNumber
        },
        message: "Chuy\u1EC3n kho th\xE0nh c\xF4ng"
      });
    } catch (error) {
      console.error("Batch operation error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Stock transfer error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi chuy\u1EC3n kho: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app9.get("/stock-check", authenticate, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const productsQuery = `
      SELECT
        p.id, p.name, p.sku, p.stock_quantity, p.cost_price, p.selling_price,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?
    `;
    const products = await c.env.DB.prepare(productsQuery).bind(...params, limit, offset).all();
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    return c.json({
      success: true,
      data: {
        products: products.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: "Danh s\xE1ch s\u1EA3n ph\u1EA9m \u0111\u1EC3 ki\u1EC3m k\xEA"
    });
  } catch (error) {
    console.error("Stock check page error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi t\u1EA3i trang ki\u1EC3m k\xEA: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app9.post("/stock-count", authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get("user");
    if (!data.product_id || data.counted_quantity === void 0 || data.counted_quantity < 0) {
      return c.json({
        success: false,
        data: null,
        message: "Thi\u1EBFu th\xF4ng tin s\u1EA3n ph\u1EA9m ho\u1EB7c s\u1ED1 l\u01B0\u1EE3ng ki\u1EC3m k\xEA kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    await c.env.DB.prepare("BEGIN TRANSACTION").run();
    try {
      const product = await c.env.DB.prepare(
        "SELECT id, name, sku, stock_quantity FROM products WHERE id = ? AND is_active = 1"
      ).bind(data.product_id).first();
      if (!product) {
        await c.env.DB.prepare("ROLLBACK").run();
        return c.json({
          success: false,
          data: null,
          message: "S\u1EA3n ph\u1EA9m kh\xF4ng t\u1ED3n t\u1EA1i ho\u1EB7c \u0111\xE3 b\u1ECB v\xF4 hi\u1EC7u h\xF3a"
        }, 400);
      }
      const difference = data.counted_quantity - product.stock_quantity;
      if (difference !== 0) {
        const referenceNumber = data.reference_number || `SC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        await c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity,
            reference_number, notes, created_at
          ) VALUES (?, 'adjustment', ?, ?, ?, datetime('now'))
        `).bind(
          data.product_id,
          difference,
          referenceNumber,
          `Ki\u1EC3m k\xEA: ${product.stock_quantity} \u2192 ${data.counted_quantity}. ${data.notes || ""}`
        ).run();
        await c.env.DB.prepare(`
          UPDATE products
          SET stock_quantity = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(data.counted_quantity, data.product_id).run();
      }
      await c.env.DB.prepare("COMMIT").run();
      return c.json({
        success: true,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          system_quantity: product.stock_quantity,
          counted_quantity: data.counted_quantity,
          difference,
          adjustment_made: difference !== 0
        },
        message: difference === 0 ? "Ki\u1EC3m k\xEA ch\xEDnh x\xE1c" : "Ki\u1EC3m k\xEA v\xE0 \u0111i\u1EC1u ch\u1EC9nh th\xE0nh c\xF4ng"
      });
    } catch (error) {
      await c.env.DB.prepare("ROLLBACK").run();
      throw error;
    }
  } catch (error) {
    console.error("Stock count error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi ki\u1EC3m k\xEA: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
var inventory_default = app9;

// src/routes/returns.ts
var app10 = new Hono2();
async function initializeReturnsTables(env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_sale_id INTEGER NOT NULL,
        return_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        return_reason TEXT,
        return_status TEXT NOT NULL DEFAULT 'pending' CHECK (return_status IN ('pending', 'approved', 'rejected', 'completed')),
        reference_number TEXT,
        notes TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (original_sale_id) REFERENCES sales(id)
      )
    `).run();
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `).run();
    console.log("Returns tables initialized successfully");
  } catch (error) {
    console.log("Returns tables initialization skipped:", error);
  }
}
__name(initializeReturnsTables, "initializeReturnsTables");
app10.get("/debug", authenticate, async (c) => {
  try {
    await initializeReturnsTables(c.env);
    const returns = await c.env.DB.prepare(`
      SELECT
        id, original_sale_id, return_amount, return_reason, return_status, created_at
      FROM returns
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    return c.json({
      success: true,
      data: returns.results,
      message: "Debug returns"
    });
  } catch (error) {
    console.error("Debug returns error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app10.get("/", authenticate, async (c) => {
  try {
    await initializeReturnsTables(c.env);
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const return_status = c.req.query("return_status") || "";
    const date_from = c.req.query("date_from") || "";
    const date_to = c.req.query("date_to") || "";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (search && search.trim()) {
      conditions.push("(r.return_reason LIKE ? OR s.customer_name LIKE ? OR s.customer_phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (return_status && return_status.trim()) {
      conditions.push("r.return_status = ?");
      params.push(return_status);
    }
    if (date_from && date_from.trim()) {
      conditions.push("DATE(r.created_at) >= ?");
      params.push(date_from);
    }
    if (date_to && date_to.trim()) {
      conditions.push("DATE(r.created_at) <= ?");
      params.push(date_to);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM returns r
      LEFT JOIN sales s ON r.original_sale_id = s.id
      ${whereClause}
    `;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const returnsQuery = `
      SELECT 
        r.id, r.original_sale_id, r.return_amount, r.return_reason, 
        r.return_status, r.notes, r.created_at,
        s.customer_name, s.customer_phone, s.total_amount as original_amount
      FROM returns r
      LEFT JOIN sales s ON r.original_sale_id = s.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const returnsResult = await c.env.DB.prepare(returnsQuery).bind(...params, limit, offset).all();
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: {
        data: returnsResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: "L\u1EA5y l\u1ECBch s\u1EED tr\u1EA3 h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get returns error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y l\u1ECBch s\u1EED tr\u1EA3 h\xE0ng"
    }, 500);
  }
});
app10.post("/", authenticate, async (c) => {
  try {
    const data = await c.req.json();
    const user = c.get("user");
    if (!data.original_sale_id || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return c.json({
        success: false,
        data: null,
        message: "Thi\u1EBFu th\xF4ng tin \u0111\u01A1n h\xE0ng g\u1ED1c ho\u1EB7c s\u1EA3n ph\u1EA9m tr\u1EA3 h\xE0ng"
      }, 400);
    }
    await c.env.DB.prepare("BEGIN TRANSACTION").run();
    try {
      const originalSale = await c.env.DB.prepare(
        "SELECT id, total_amount, payment_status FROM sales WHERE id = ?"
      ).bind(data.original_sale_id).first();
      if (!originalSale) {
        await c.env.DB.prepare("ROLLBACK").run();
        return c.json({
          success: false,
          data: null,
          message: "Kh\xF4ng t\xECm th\u1EA5y \u0111\u01A1n h\xE0ng g\u1ED1c"
        }, 400);
      }
      if (originalSale.payment_status !== "paid") {
        await c.env.DB.prepare("ROLLBACK").run();
        return c.json({
          success: false,
          data: null,
          message: "Ch\u1EC9 c\xF3 th\u1EC3 tr\u1EA3 h\xE0ng cho \u0111\u01A1n h\xE0ng \u0111\xE3 thanh to\xE1n"
        }, 400);
      }
      let totalReturnAmount = 0;
      const validatedItems = [];
      for (const item of data.items) {
        const originalItem = await c.env.DB.prepare(`
          SELECT id, quantity, unit_price, total_price 
          FROM sale_items 
          WHERE sale_id = ? AND product_id = ?
        `).bind(data.original_sale_id, item.product_id).first();
        if (!originalItem) {
          await c.env.DB.prepare("ROLLBACK").run();
          return c.json({
            success: false,
            data: null,
            message: `S\u1EA3n ph\u1EA9m ID ${item.product_id} kh\xF4ng c\xF3 trong \u0111\u01A1n h\xE0ng g\u1ED1c`
          }, 400);
        }
        if (item.return_quantity > originalItem.quantity) {
          await c.env.DB.prepare("ROLLBACK").run();
          return c.json({
            success: false,
            data: null,
            message: `S\u1ED1 l\u01B0\u1EE3ng tr\u1EA3 h\xE0ng v\u01B0\u1EE3t qu\xE1 s\u1ED1 l\u01B0\u1EE3ng \u0111\xE3 mua cho s\u1EA3n ph\u1EA9m ID ${item.product_id}`
          }, 400);
        }
        const itemReturnAmount = originalItem.unit_price * item.return_quantity;
        totalReturnAmount += itemReturnAmount;
        validatedItems.push({
          ...item,
          unit_price: originalItem.unit_price,
          return_amount: itemReturnAmount
        });
      }
      const returnReference = `RET-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const returnResult = await c.env.DB.prepare(`
        INSERT INTO returns (
          original_sale_id, return_amount, return_reason, return_status,
          reference_number, notes, created_at
        ) VALUES (?, ?, ?, 'pending', ?, ?, datetime('now'))
      `).bind(
        data.original_sale_id,
        totalReturnAmount,
        data.return_reason || "Tr\u1EA3 h\xE0ng",
        returnReference,
        data.notes || null
      ).run();
      const returnId = returnResult.meta.last_row_id;
      for (const item of validatedItems) {
        await c.env.DB.prepare(`
          INSERT INTO return_items (
            return_id, product_id, quantity, unit_price, total_amount, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          returnId,
          item.product_id,
          item.return_quantity,
          item.unit_price,
          item.return_amount
        ).run();
        await c.env.DB.prepare(`
          UPDATE products 
          SET stock_quantity = stock_quantity + ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(item.return_quantity, item.product_id).run();
        await c.env.DB.prepare(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity, reference_number, notes, created_at
          ) VALUES (?, 'stock_in', ?, ?, ?, datetime('now'))
        `).bind(
          item.product_id,
          item.return_quantity,
          returnReference,
          `Tr\u1EA3 h\xE0ng - ${returnReference}`
        ).run();
      }
      await c.env.DB.prepare("COMMIT").run();
      return c.json({
        success: true,
        data: {
          return_id: returnId,
          reference_number: returnReference,
          return_amount: totalReturnAmount,
          items_count: validatedItems.length
        },
        message: "T\u1EA1o phi\u1EBFu tr\u1EA3 h\xE0ng th\xE0nh c\xF4ng"
      });
    } catch (error) {
      await c.env.DB.prepare("ROLLBACK").run();
      throw error;
    }
  } catch (error) {
    console.error("Create return error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi t\u1EA1o phi\u1EBFu tr\u1EA3 h\xE0ng: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app10.put("/:id/status", authenticate, async (c) => {
  try {
    const returnId = parseInt(c.req.param("id"));
    const data = await c.req.json();
    if (isNaN(returnId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID phi\u1EBFu tr\u1EA3 h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const { return_status, notes } = data;
    if (!return_status || !["pending", "approved", "rejected", "completed"].includes(return_status)) {
      return c.json({
        success: false,
        data: null,
        message: "Tr\u1EA1ng th\xE1i tr\u1EA3 h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingReturn = await c.env.DB.prepare(
      "SELECT id, return_status FROM returns WHERE id = ?"
    ).bind(returnId).first();
    if (!existingReturn) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y phi\u1EBFu tr\u1EA3 h\xE0ng"
      }, 404);
    }
    await c.env.DB.prepare(`
      UPDATE returns 
      SET return_status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(return_status, notes || null, returnId).run();
    return c.json({
      success: true,
      data: {
        id: returnId,
        old_status: existingReturn.return_status,
        new_status: return_status
      },
      message: "C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i tr\u1EA3 h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Update return status error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i tr\u1EA3 h\xE0ng"
    }, 500);
  }
});
var returns_default = app10;

// src/routes/customers.ts
var app11 = new Hono2();
var validate2 = /* @__PURE__ */ __name((schema) => async (c, next) => {
  try {
    const data = await c.req.json();
    const validatedData = schema.parse(data);
    c.set("validatedData", validatedData);
    await next();
  } catch (error) {
    if (error instanceof external_exports.ZodError) {
      return c.json({
        success: false,
        data: null,
        message: "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7",
        errors: error.errors
      }, 400);
    }
    throw error;
  }
}, "validate");
app11.get("/test", async (c) => {
  try {
    const tableExists = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='customers'
    `).first();
    if (!tableExists) {
      return c.json({
        success: false,
        data: null,
        message: "Customers table does not exist"
      }, 500);
    }
    const schema = await c.env.DB.prepare(`
      PRAGMA table_info(customers)
    `).all();
    let customers;
    try {
      customers = await c.env.DB.prepare(`
        SELECT
          id, full_name, phone, email, loyalty_points, created_at
        FROM customers
        ORDER BY created_at DESC
        LIMIT 5
      `).all();
    } catch (fullNameError) {
      try {
        const result = await c.env.DB.prepare(`
          SELECT
            id, first_name || ' ' || last_name as full_name, phone, email, loyalty_points, created_at
          FROM customers
          ORDER BY created_at DESC
          LIMIT 5
        `).all();
        customers = result;
      } catch (firstLastError) {
        return c.json({
          success: false,
          data: null,
          message: "Schema error - neither full_name nor first_name/last_name found",
          schema: schema.results
        }, 500);
      }
    }
    return c.json({
      success: true,
      data: customers.results,
      message: "Test customers query successful",
      schema: schema.results
    });
  } catch (error) {
    console.error("Test customers error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Test error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app11.get("/debug", authenticate, async (c) => {
  try {
    const tableInfo = await c.env.DB.prepare(`
      PRAGMA table_info(customers)
    `).all();
    const customers = await c.env.DB.prepare(`
      SELECT
        id, full_name, phone, email, loyalty_points, created_at, deleted_at
      FROM customers
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    const deletedCustomers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM customers WHERE deleted_at IS NOT NULL
    `).first();
    return c.json({
      success: true,
      data: {
        tableStructure: tableInfo.results,
        customers: customers.results,
        deletedCount: deletedCustomers
      },
      message: "Debug customers"
    });
  } catch (error) {
    console.error("Debug customers error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Debug error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app11.get("/", authenticate, async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search") || "";
    const customer_group = c.req.query("customer_group") || "";
    const offset = (page - 1) * limit;
    const conditions = ["deleted_at IS NULL"];
    const params = [];
    if (search && search.trim()) {
      conditions.push("(first_name LIKE ? OR last_name LIKE ? OR full_name LIKE ? OR phone LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const customersQuery = `
      SELECT
        id,
        COALESCE(full_name, first_name || ' ' || last_name) as full_name,
        phone,
        email,
        address_line1 as address,
        loyalty_points,
        'regular' as customer_group,
        notes,
        created_at,
        updated_at,
        0 as total_orders,
        0 as total_spent,
        NULL as last_purchase
      FROM customers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const customersResult = await c.env.DB.prepare(customersQuery).bind(...params, limit, offset).all();
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: {
        data: customersResult.results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: "L\u1EA5y danh s\xE1ch kh\xE1ch h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y danh s\xE1ch kh\xE1ch h\xE0ng"
    }, 500);
  }
});
app11.get("/:id", authenticate, async (c) => {
  try {
    const customerId = parseInt(c.req.param("id"));
    if (isNaN(customerId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID kh\xE1ch h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const customerResult = await c.env.DB.prepare(`
      SELECT
        c.id,
        COALESCE(c.full_name, c.first_name || ' ' || c.last_name) as full_name,
        c.phone, c.email,
        COALESCE(c.address, c.address_line1) as address,
        COALESCE(c.birthday, c.date_of_birth) as birthday,
        c.loyalty_points, c.notes, c.created_at, c.updated_at,
        COUNT(s.id) as total_orders,
        COALESCE(SUM(s.total_amount), 0) as total_spent,
        MAX(s.created_at) as last_purchase
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id AND s.payment_status = 'paid'
      WHERE c.id = ? AND c.deleted_at IS NULL
      GROUP BY c.id
    `).bind(customerId).first();
    if (!customerResult) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y kh\xE1ch h\xE0ng"
      }, 404);
    }
    const recentOrdersResult = await c.env.DB.prepare(`
      SELECT 
        id, total_amount, payment_method, payment_status, created_at
      FROM sales
      WHERE customer_id = ? AND payment_status = 'paid'
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(customerId).all();
    return c.json({
      success: true,
      data: {
        customer: customerResult,
        recent_orders: recentOrdersResult.results
      },
      message: "L\u1EA5y chi ti\u1EBFt kh\xE1ch h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get customer details error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y chi ti\u1EBFt kh\xE1ch h\xE0ng"
    }, 500);
  }
});
app11.post("/", authenticate, validate2(customerCreateSchema), async (c) => {
  try {
    const data = c.get("validatedData");
    if (data.phone) {
      const existingPhone = await c.env.DB.prepare(
        "SELECT id FROM customers WHERE phone = ? AND deleted_at IS NULL"
      ).bind(data.phone).first();
      if (existingPhone) {
        return c.json({
          success: false,
          data: null,
          message: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    if (data.email) {
      const existingEmail = await c.env.DB.prepare(
        "SELECT id FROM customers WHERE email = ? AND deleted_at IS NULL"
      ).bind(data.email).first();
      if (existingEmail) {
        return c.json({
          success: false,
          data: null,
          message: "Email \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    const nameParts = (data.full_name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const result = await c.env.DB.prepare(`
      INSERT INTO customers (
        first_name, last_name, full_name, phone, email, address_line1,
        date_of_birth, loyalty_points, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      firstName,
      lastName,
      data.full_name,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.birthday || null,
      data.loyalty_points || 0,
      data.notes || null
    ).run();
    const customerId = result.meta.last_row_id;
    return c.json({
      success: true,
      data: {
        id: customerId,
        ...data
      },
      message: "T\u1EA1o kh\xE1ch h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Create customer error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi t\u1EA1o kh\xE1ch h\xE0ng"
    }, 500);
  }
});
app11.put("/:id", authenticate, validate2(customerUpdateSchema), async (c) => {
  try {
    const customerId = parseInt(c.req.param("id"));
    const data = c.get("validatedData");
    if (isNaN(customerId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID kh\xE1ch h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingCustomer = await c.env.DB.prepare(
      "SELECT id FROM customers WHERE id = ?"
    ).bind(customerId).first();
    if (!existingCustomer) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y kh\xE1ch h\xE0ng"
      }, 404);
    }
    if (data.phone) {
      const existingPhone = await c.env.DB.prepare(
        "SELECT id FROM customers WHERE phone = ? AND id != ? AND deleted_at IS NULL"
      ).bind(data.phone, customerId).first();
      if (existingPhone) {
        return c.json({
          success: false,
          data: null,
          message: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    if (data.email) {
      const existingEmail = await c.env.DB.prepare(
        "SELECT id FROM customers WHERE email = ? AND id != ? AND deleted_at IS NULL"
      ).bind(data.email, customerId).first();
      if (existingEmail) {
        return c.json({
          success: false,
          data: null,
          message: "Email \u0111\xE3 t\u1ED3n t\u1EA1i"
        }, 400);
      }
    }
    const updateFields = [];
    const updateParams = [];
    if (data.full_name !== void 0) {
      const nameParts = (data.full_name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      updateFields.push("full_name = ?", "first_name = ?", "last_name = ?");
      updateParams.push(data.full_name, firstName, lastName);
    }
    if (data.phone !== void 0) {
      updateFields.push("phone = ?");
      updateParams.push(data.phone);
    }
    if (data.email !== void 0) {
      updateFields.push("email = ?");
      updateParams.push(data.email);
    }
    if (data.address !== void 0) {
      updateFields.push("address_line1 = ?");
      updateParams.push(data.address);
    }
    if (data.birthday !== void 0) {
      updateFields.push("date_of_birth = ?");
      updateParams.push(data.birthday);
    }
    if (data.loyalty_points !== void 0) {
      updateFields.push("loyalty_points = ?");
      updateParams.push(data.loyalty_points);
    }
    if (data.notes !== void 0) {
      updateFields.push("notes = ?");
      updateParams.push(data.notes);
    }
    updateFields.push("updated_at = datetime('now')");
    updateParams.push(customerId);
    const updateQuery = `
      UPDATE customers 
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `;
    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();
    return c.json({
      success: true,
      data: {
        id: customerId,
        ...data
      },
      message: "C\u1EADp nh\u1EADt kh\xE1ch h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Update customer error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt kh\xE1ch h\xE0ng"
    }, 500);
  }
});
app11.delete("/:id", authenticate, async (c) => {
  try {
    const customerId = parseInt(c.req.param("id"));
    if (isNaN(customerId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID kh\xE1ch h\xE0ng kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    const existingCustomer = await c.env.DB.prepare(
      "SELECT id, full_name, deleted_at FROM customers WHERE id = ?"
    ).bind(customerId).first();
    if (!existingCustomer) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xE1ch h\xE0ng kh\xF4ng t\u1ED3n t\u1EA1i"
      }, 404);
    }
    if (existingCustomer.deleted_at) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xE1ch h\xE0ng \u0111\xE3 b\u1ECB x\xF3a tr\u01B0\u1EDBc \u0111\xF3"
      }, 404);
    }
    const deleteResult = await c.env.DB.prepare(`
      UPDATE customers
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `).bind(customerId).run();
    if (deleteResult.meta.changes === 0) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng th\u1EC3 x\xF3a kh\xE1ch h\xE0ng"
      }, 400);
    }
    return c.json({
      success: true,
      data: { id: customerId },
      message: "X\xF3a kh\xE1ch h\xE0ng th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi x\xF3a kh\xE1ch h\xE0ng"
    }, 500);
  }
});
var customers_default = app11;

// src/middleware/validation.ts
var validateBody = /* @__PURE__ */ __name((schema) => {
  return async (c, next) => {
    const startTime = Date.now();
    try {
      const contentType = c.req.header("content-type");
      let body;
      if (contentType?.includes("application/json")) {
        body = await c.req.json();
      } else if (contentType?.includes("application/x-www-form-urlencoded")) {
        const formData = await c.req.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        return c.json({
          success: false,
          data: null,
          message: "Content-Type kh\xF4ng \u0111\u01B0\u1EE3c h\u1ED7 tr\u1EE3"
        }, 400);
      }
      const processedBody = await applyBusinessLogicPreprocessing(body, c);
      const validatedBody = schema.parse(processedBody.data);
      c.set("validatedBody", validatedBody);
      c.set("validationWarnings", processedBody.warnings);
      c.set("validationMetadata", {
        validation_time: Date.now() - startTime,
        schema_version: "1.0",
        business_rules_applied: processedBody.businessRulesApplied
      });
      await next();
    } catch (error) {
      if (error instanceof external_exports.ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          code: err.code,
          message: getVietnameseErrorMessage(err),
          value: err.input,
          expected: err.expected
        }));
        return c.json({
          success: false,
          data: null,
          message: "D\u1EEF li\u1EC7u request kh\xF4ng h\u1EE3p l\u1EC7",
          errors: validationErrors
        }, 400);
      }
      console.error("Body validation error:", error);
      return c.json({
        success: false,
        data: null,
        message: "L\u1ED7i validate request body"
      }, 500);
    }
  };
}, "validateBody");
async function applyBusinessLogicPreprocessing(data, c) {
  const warnings = [];
  const businessRulesApplied = [];
  const processedData = { ...data };
  if (processedData.price !== void 0) {
    if (typeof processedData.price === "string") {
      processedData.price = parseFloat(processedData.price.replace(/[^\d.-]/g, ""));
    }
    if (processedData.price < 0) {
      warnings.push({
        field: "price",
        code: "NEGATIVE_PRICE",
        message: "Gi\xE1 kh\xF4ng th\u1EC3 \xE2m, \u0111\xE3 \u0111i\u1EC1u ch\u1EC9nh v\u1EC1 0",
        value: processedData.price,
        expected: 0,
        business_rule: "NON_NEGATIVE_PRICE"
      });
      processedData.price = 0;
      businessRulesApplied.push("NON_NEGATIVE_PRICE");
    }
  }
  if (processedData.quantity !== void 0) {
    if (processedData.quantity <= 0) {
      warnings.push({
        field: "quantity",
        code: "INVALID_QUANTITY",
        message: "S\u1ED1 l\u01B0\u1EE3ng ph\u1EA3i l\u1EDBn h\u01A1n 0",
        value: processedData.quantity,
        business_rule: "POSITIVE_QUANTITY"
      });
    }
    businessRulesApplied.push("POSITIVE_QUANTITY");
  }
  if (processedData.email) {
    processedData.email = processedData.email.toLowerCase().trim();
    businessRulesApplied.push("EMAIL_NORMALIZATION");
  }
  if (processedData.phone) {
    let phone = processedData.phone.replace(/\D/g, "");
    if (phone.startsWith("84")) {
      phone = "0" + phone.substring(2);
    }
    processedData.phone = phone;
    businessRulesApplied.push("PHONE_FORMATTING");
  }
  return {
    data: processedData,
    warnings,
    businessRulesApplied
  };
}
__name(applyBusinessLogicPreprocessing, "applyBusinessLogicPreprocessing");
function getValidated2(c) {
  const validatedBody = c.get("validatedBody");
  const validatedQuery = c.get("validatedQuery");
  const validatedParams = c.get("validatedParams");
  return validatedBody || validatedQuery || validatedParams;
}
__name(getValidated2, "getValidated");
function getVietnameseErrorMessage(error) {
  switch (error.code) {
    case external_exports.ZodIssueCode.invalid_type:
      return `Ki\u1EC3u d\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7. Mong \u0111\u1EE3i ${error.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${error.received}`;
    case external_exports.ZodIssueCode.too_small:
      if (error.type === "string") {
        return `Chu\u1ED7i qu\xE1 ng\u1EAFn. T\u1ED1i thi\u1EC3u ${error.minimum} k\xFD t\u1EF1`;
      } else if (error.type === "number") {
        return `S\u1ED1 qu\xE1 nh\u1ECF. T\u1ED1i thi\u1EC3u ${error.minimum}`;
      }
      return `Gi\xE1 tr\u1ECB qu\xE1 nh\u1ECF. T\u1ED1i thi\u1EC3u ${error.minimum}`;
    case external_exports.ZodIssueCode.too_big:
      if (error.type === "string") {
        return `Chu\u1ED7i qu\xE1 d\xE0i. T\u1ED1i \u0111a ${error.maximum} k\xFD t\u1EF1`;
      } else if (error.type === "number") {
        return `S\u1ED1 qu\xE1 l\u1EDBn. T\u1ED1i \u0111a ${error.maximum}`;
      }
      return `Gi\xE1 tr\u1ECB qu\xE1 l\u1EDBn. T\u1ED1i \u0111a ${error.maximum}`;
    case external_exports.ZodIssueCode.invalid_string:
      if (error.validation === "email") {
        return "\u0110\u1ECBnh d\u1EA1ng email kh\xF4ng h\u1EE3p l\u1EC7";
      } else if (error.validation === "url") {
        return "\u0110\u1ECBnh d\u1EA1ng URL kh\xF4ng h\u1EE3p l\u1EC7";
      }
      return "\u0110\u1ECBnh d\u1EA1ng chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7";
    case external_exports.ZodIssueCode.invalid_enum_value:
      return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7. C\xE1c gi\xE1 tr\u1ECB cho ph\xE9p: ${error.options.join(", ")}`;
    default:
      return error.message || "D\u1EEF li\u1EC7u kh\xF4ng h\u1EE3p l\u1EC7";
  }
}
__name(getVietnameseErrorMessage, "getVietnameseErrorMessage");

// src/routes/suppliers.ts
var app12 = new Hono2();
app12.get("/test", async (c) => {
  return c.json({
    success: true,
    message: "Suppliers route is working",
    data: null
  });
});
app12.get("/migrate", async (c) => {
  try {
    await runMigrations(c.env);
    return c.json({
      success: true,
      message: "Migrations completed successfully",
      data: null
    });
  } catch (error) {
    console.error("Migration error:", error);
    return c.json({
      success: false,
      message: "Migration failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app12.get("/create-table", async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `).run();
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO suppliers (name, contact_person, email, phone, address, is_active) VALUES
      ('C\xF4ng ty TNHH ABC', 'Nguy\u1EC5n V\u0103n A', 'contact@abc.com', '0123456789', '123 \u0110\u01B0\u1EDDng ABC, TP.HCM', 1),
      ('Nh\xE0 ph\xE2n ph\u1ED1i XYZ', 'Tr\u1EA7n Th\u1ECB B', 'info@xyz.com', '0987654321', '456 \u0110\u01B0\u1EDDng XYZ, H\xE0 N\u1ED9i', 1),
      ('C\xF4ng ty Linh ki\u1EC7n DEF', 'L\xEA V\u0103n C', 'sales@def.com', '0369852147', '789 \u0110\u01B0\u1EDDng DEF, \u0110\xE0 N\u1EB5ng', 1)
    `).run();
    return c.json({
      success: true,
      message: "Suppliers table created successfully",
      data: null
    });
  } catch (error) {
    console.error("Create table error:", error);
    return c.json({
      success: false,
      message: "Failed to create suppliers table",
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app12.get("/", async (c) => {
  try {
    const query = {
      page: parseInt(c.req.query("page") || "1"),
      limit: Math.min(parseInt(c.req.query("limit") || "10"), 100),
      search: c.req.query("search"),
      is_active: c.req.query("is_active") === "true" ? true : c.req.query("is_active") === "false" ? false : void 0
    };
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const offset = (page - 1) * limit;
    const search = query.search?.trim();
    const isActive = query.is_active;
    let whereClause = "WHERE 1=1";
    const params = [];
    if (search) {
      whereClause += " AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    if (isActive !== void 0) {
      whereClause += " AND is_active = ?";
      params.push(isActive ? 1 : 0);
    }
    const countQuery = `SELECT COUNT(*) as total FROM suppliers ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const dataQuery = `
      SELECT id, name, contact_person, email, phone, address, tax_number,
             is_active, notes, created_at, updated_at
      FROM suppliers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const result = await c.env.DB.prepare(dataQuery).bind(...params, limit, offset).all();
    const totalPages = Math.ceil(total / limit);
    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return c.json({
      success: false,
      message: "L\u1ED7i khi l\u1EA5y danh s\xE1ch nh\xE0 cung c\u1EA5p",
      data: null,
      error: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});
app12.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const supplier = await c.env.DB.prepare(`
      SELECT id, name, contact_person, email, phone, address, tax_number,
             is_active, notes, created_at, updated_at
      FROM suppliers
      WHERE id = ?
    `).bind(id).first();
    if (!supplier) {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y nh\xE0 cung c\u1EA5p",
        data: null
      }, 404);
    }
    return c.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return c.json({
      success: false,
      message: "L\u1ED7i khi l\u1EA5y th\xF4ng tin nh\xE0 cung c\u1EA5p",
      data: null
    }, 500);
  }
});
app12.post("/", async (c) => {
  try {
    const supplierData = await c.req.json();
    const result = await c.env.DB.prepare(`
      INSERT INTO suppliers (name, contact_person, email, phone, address, tax_number, notes, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      supplierData.name,
      supplierData.contact_person || null,
      supplierData.email || null,
      supplierData.phone || null,
      supplierData.address || null,
      supplierData.tax_number || null,
      supplierData.notes || null,
      supplierData.is_active !== false ? 1 : 0
    ).run();
    if (!result.success) {
      throw new Error("Failed to create supplier");
    }
    return c.json({
      success: true,
      message: "T\u1EA1o nh\xE0 cung c\u1EA5p th\xE0nh c\xF4ng",
      data: { id: result.meta.last_row_id }
    }, 201);
  } catch (error) {
    console.error("Error creating supplier:", error);
    return c.json({
      success: false,
      message: "L\u1ED7i khi t\u1EA1o nh\xE0 cung c\u1EA5p",
      data: null
    }, 500);
  }
});
app12.put("/:id", validateBody(supplierUpdateSchema), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const supplierData = getValidated2(c);
    const updateFields = [];
    const params = [];
    if (supplierData.name !== void 0) {
      updateFields.push("name = ?");
      params.push(supplierData.name);
    }
    if (supplierData.contact_person !== void 0) {
      updateFields.push("contact_person = ?");
      params.push(supplierData.contact_person);
    }
    if (supplierData.email !== void 0) {
      updateFields.push("email = ?");
      params.push(supplierData.email);
    }
    if (supplierData.phone !== void 0) {
      updateFields.push("phone = ?");
      params.push(supplierData.phone);
    }
    if (supplierData.address !== void 0) {
      updateFields.push("address = ?");
      params.push(supplierData.address);
    }
    if (supplierData.tax_number !== void 0) {
      updateFields.push("tax_number = ?");
      params.push(supplierData.tax_number);
    }
    if (supplierData.notes !== void 0) {
      updateFields.push("notes = ?");
      params.push(supplierData.notes);
    }
    if (supplierData.is_active !== void 0) {
      updateFields.push("is_active = ?");
      params.push(supplierData.is_active ? 1 : 0);
    }
    if (updateFields.length === 0) {
      return c.json({
        success: false,
        message: "Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u \u0111\u1EC3 c\u1EADp nh\u1EADt",
        data: null
      }, 400);
    }
    updateFields.push("updated_at = datetime('now')");
    params.push(id);
    const result = await c.env.DB.prepare(`
      UPDATE suppliers
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `).bind(...params).run();
    if (result.changes === 0) {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y nh\xE0 cung c\u1EA5p",
        data: null
      }, 404);
    }
    return c.json({
      success: true,
      message: "C\u1EADp nh\u1EADt nh\xE0 cung c\u1EA5p th\xE0nh c\xF4ng",
      data: null
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return c.json({
      success: false,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt nh\xE0 cung c\u1EA5p",
      data: null
    }, 500);
  }
});
app12.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const result = await c.env.DB.prepare(`
      DELETE FROM suppliers WHERE id = ?
    `).bind(id).run();
    if (result.changes === 0) {
      return c.json({
        success: false,
        message: "Kh\xF4ng t\xECm th\u1EA5y nh\xE0 cung c\u1EA5p",
        data: null
      }, 404);
    }
    return c.json({
      success: true,
      message: "X\xF3a nh\xE0 cung c\u1EA5p th\xE0nh c\xF4ng",
      data: null
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return c.json({
      success: false,
      message: "L\u1ED7i khi x\xF3a nh\xE0 cung c\u1EA5p",
      data: null
    }, 500);
  }
});
var suppliers_default = app12;

// src/routes/promotions.ts
var app13 = new Hono2();
async function initializePromotionsTables(env) {
  try {
    const tableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='promotions'
    `).first();
    if (!tableInfo) {
      console.log("Creating promotions tables...");
      await env.DB.prepare(`
        CREATE TABLE promotions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          promotion_type TEXT NOT NULL CHECK (promotion_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
          discount_value REAL NOT NULL DEFAULT 0,
          minimum_amount REAL DEFAULT 0,
          maximum_discount REAL DEFAULT 0,
          start_date DATETIME NOT NULL,
          end_date DATETIME NOT NULL,
          usage_limit INTEGER DEFAULT 0,
          usage_count INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'categories', 'products', 'customers')),
          conditions TEXT,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE promotion_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promotion_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE(promotion_id, product_id)
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE promotion_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promotion_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          UNIQUE(promotion_id, category_id)
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE promotion_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          promotion_id INTEGER NOT NULL,
          sale_id INTEGER NOT NULL,
          discount_amount REAL NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
          FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        )
      `).run();
      const samplePromotions = [
        {
          name: "Gi\u1EA3m gi\xE1 10%",
          description: "Gi\u1EA3m gi\xE1 10% cho t\u1EA5t c\u1EA3 s\u1EA3n ph\u1EA9m",
          promotion_type: "percentage",
          discount_value: 10,
          minimum_amount: 1e5,
          maximum_discount: 5e4,
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
          usage_limit: 100,
          is_active: 1,
          applies_to: "all"
        },
        {
          name: "Gi\u1EA3m 50k cho \u0111\u01A1n t\u1EEB 500k",
          description: "Gi\u1EA3m 50.000\u0111 cho \u0111\u01A1n h\xE0ng t\u1EEB 500.000\u0111",
          promotion_type: "fixed_amount",
          discount_value: 5e4,
          minimum_amount: 5e5,
          maximum_discount: 5e4,
          start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1e3).toISOString(),
          usage_limit: 200,
          is_active: 1,
          applies_to: "all"
        },
        {
          name: "Mua 2 t\u1EB7ng 1",
          description: "Mua 2 s\u1EA3n ph\u1EA9m t\u1EB7ng 1 s\u1EA3n ph\u1EA9m c\xF9ng lo\u1EA1i",
          promotion_type: "buy_x_get_y",
          discount_value: 0,
          minimum_amount: 0,
          maximum_discount: 0,
          start_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1e3).toISOString(),
          usage_limit: 50,
          is_active: 1,
          applies_to: "products"
        }
      ];
      for (const promotion of samplePromotions) {
        await env.DB.prepare(`
          INSERT INTO promotions (
            name, description, promotion_type, discount_value,
            minimum_amount, maximum_discount, start_date, end_date,
            usage_limit, is_active, applies_to
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          promotion.name,
          promotion.description,
          promotion.promotion_type,
          promotion.discount_value,
          promotion.minimum_amount,
          promotion.maximum_discount,
          promotion.start_date,
          promotion.end_date,
          promotion.usage_limit,
          promotion.is_active,
          promotion.applies_to
        ).run();
      }
      console.log("Promotions tables created and sample data inserted");
    }
    console.log("Promotions tables checked/initialized successfully");
  } catch (error) {
    console.log("Promotions tables initialization error:", error);
    throw error;
  }
}
__name(initializePromotionsTables, "initializePromotionsTables");
app13.get("/init-tables", async (c) => {
  try {
    await initializePromotionsTables(c.env);
    return c.json({
      success: true,
      data: null,
      message: "Promotions tables initialized"
    });
  } catch (error) {
    console.error("Init promotions tables error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Init error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app13.get("/test", async (c) => {
  try {
    await initializePromotionsTables(c.env);
    const promotions = await c.env.DB.prepare(`
      SELECT id, name, description, promotion_type, discount_value, 
             minimum_amount, is_active, start_date, end_date, usage_count, usage_limit
      FROM promotions
      ORDER BY created_at DESC
      LIMIT 5
    `).all();
    return c.json({
      success: true,
      data: promotions.results,
      message: "Test promotions query successful"
    });
  } catch (error) {
    console.error("Test promotions error:", error);
    return c.json({
      success: false,
      data: null,
      message: "Test error: " + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});
app13.get("/", async (c) => {
  try {
    await initializePromotionsTables(c.env);
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "10");
    const search = c.req.query("search") || "";
    const status = c.req.query("status") || "";
    const type = c.req.query("type") || "";
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === "active") {
      conditions.push('is_active = 1 AND start_date <= datetime("now") AND end_date >= datetime("now")');
    } else if (status === "inactive") {
      conditions.push("is_active = 0");
    } else if (status === "expired") {
      conditions.push('end_date < datetime("now")');
    } else if (status === "upcoming") {
      conditions.push('start_date > datetime("now")');
    }
    if (type) {
      conditions.push("promotion_type = ?");
      params.push(type);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countQuery = `SELECT COUNT(*) as total FROM promotions ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;
    const promotionsQuery = `
      SELECT
        id, name, description, promotion_type, discount_value,
        minimum_amount, maximum_discount, start_date, end_date,
        usage_limit, usage_count, is_active, applies_to,
        created_at, updated_at
      FROM promotions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const promotionsResult = await c.env.DB.prepare(promotionsQuery).bind(...params, limit, offset).all();
    return c.json({
      success: true,
      data: {
        data: promotionsResult.results || [],
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: "L\u1EA5y danh s\xE1ch khuy\u1EBFn m\xE3i th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get promotions error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y danh s\xE1ch khuy\u1EBFn m\xE3i"
    }, 500);
  }
});
app13.post("/", async (c) => {
  try {
    const data = await c.req.json();
    if (!data.name || !data.promotion_type || !data.start_date || !data.end_date) {
      return c.json({
        success: false,
        data: null,
        message: "Thi\u1EBFu th\xF4ng tin b\u1EAFt bu\u1ED9c"
      }, 400);
    }
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    if (startDate >= endDate) {
      return c.json({
        success: false,
        data: null,
        message: "Ng\xE0y k\u1EBFt th\xFAc ph\u1EA3i sau ng\xE0y b\u1EAFt \u0111\u1EA7u"
      }, 400);
    }
    await initializePromotionsTables(c.env);
    const result = await c.env.DB.prepare(`
      INSERT INTO promotions (
        name, description, promotion_type, discount_value,
        minimum_amount, maximum_discount, start_date, end_date,
        usage_limit, is_active, applies_to, conditions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.name,
      data.description || null,
      data.promotion_type,
      data.discount_value || 0,
      data.minimum_amount || 0,
      data.maximum_discount || 0,
      data.start_date,
      data.end_date,
      data.usage_limit || 0,
      data.is_active !== void 0 ? data.is_active : 1,
      data.applies_to || "all",
      data.conditions ? JSON.stringify(data.conditions) : null
    ).run();
    const promotionId = result.meta.last_row_id;
    if (data.applies_to === "products" && data.product_ids && Array.isArray(data.product_ids)) {
      for (const productId of data.product_ids) {
        await c.env.DB.prepare(`
          INSERT INTO promotion_products (promotion_id, product_id)
          VALUES (?, ?)
        `).bind(promotionId, productId).run();
      }
    }
    if (data.applies_to === "categories" && data.category_ids && Array.isArray(data.category_ids)) {
      for (const categoryId of data.category_ids) {
        await c.env.DB.prepare(`
          INSERT INTO promotion_categories (promotion_id, category_id)
          VALUES (?, ?)
        `).bind(promotionId, categoryId).run();
      }
    }
    return c.json({
      success: true,
      data: { id: promotionId },
      message: "T\u1EA1o khuy\u1EBFn m\xE3i th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Create promotion error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi t\u1EA1o khuy\u1EBFn m\xE3i"
    }, 500);
  }
});
app13.get("/:id", async (c) => {
  try {
    const promotionId = parseInt(c.req.param("id"));
    if (isNaN(promotionId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID khuy\u1EBFn m\xE3i kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    await initializePromotionsTables(c.env);
    const promotion = await c.env.DB.prepare(`
      SELECT * FROM promotions WHERE id = ?
    `).bind(promotionId).first();
    if (!promotion) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y khuy\u1EBFn m\xE3i"
      }, 404);
    }
    let products = [];
    if (promotion.applies_to === "products") {
      const productResult = await c.env.DB.prepare(`
        SELECT p.id, p.name, p.sku, p.price
        FROM promotion_products pp
        JOIN products p ON pp.product_id = p.id
        WHERE pp.promotion_id = ?
      `).bind(promotionId).all();
      products = productResult.results || [];
    }
    let categories = [];
    if (promotion.applies_to === "categories") {
      const categoryResult = await c.env.DB.prepare(`
        SELECT c.id, c.name
        FROM promotion_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.promotion_id = ?
      `).bind(promotionId).all();
      categories = categoryResult.results || [];
    }
    return c.json({
      success: true,
      data: {
        ...promotion,
        products,
        categories,
        conditions: promotion.conditions ? JSON.parse(promotion.conditions) : null
      },
      message: "L\u1EA5y chi ti\u1EBFt khuy\u1EBFn m\xE3i th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Get promotion details error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi l\u1EA5y chi ti\u1EBFt khuy\u1EBFn m\xE3i"
    }, 500);
  }
});
app13.put("/:id", async (c) => {
  try {
    const promotionId = parseInt(c.req.param("id"));
    const data = await c.req.json();
    if (isNaN(promotionId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID khuy\u1EBFn m\xE3i kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    await initializePromotionsTables(c.env);
    const existingPromotion = await c.env.DB.prepare(
      "SELECT id FROM promotions WHERE id = ?"
    ).bind(promotionId).first();
    if (!existingPromotion) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y khuy\u1EBFn m\xE3i"
      }, 404);
    }
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (startDate >= endDate) {
        return c.json({
          success: false,
          data: null,
          message: "Ng\xE0y k\u1EBFt th\xFAc ph\u1EA3i sau ng\xE0y b\u1EAFt \u0111\u1EA7u"
        }, 400);
      }
    }
    await c.env.DB.prepare(`
      UPDATE promotions SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        promotion_type = COALESCE(?, promotion_type),
        discount_value = COALESCE(?, discount_value),
        minimum_amount = COALESCE(?, minimum_amount),
        maximum_discount = COALESCE(?, maximum_discount),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        usage_limit = COALESCE(?, usage_limit),
        is_active = COALESCE(?, is_active),
        applies_to = COALESCE(?, applies_to),
        conditions = COALESCE(?, conditions),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name || null,
      data.description || null,
      data.promotion_type || null,
      data.discount_value !== void 0 ? data.discount_value : null,
      data.minimum_amount !== void 0 ? data.minimum_amount : null,
      data.maximum_discount !== void 0 ? data.maximum_discount : null,
      data.start_date || null,
      data.end_date || null,
      data.usage_limit !== void 0 ? data.usage_limit : null,
      data.is_active !== void 0 ? data.is_active : null,
      data.applies_to || null,
      data.conditions ? JSON.stringify(data.conditions) : null,
      promotionId
    ).run();
    if (data.product_ids !== void 0) {
      await c.env.DB.prepare(
        "DELETE FROM promotion_products WHERE promotion_id = ?"
      ).bind(promotionId).run();
      if (Array.isArray(data.product_ids)) {
        for (const productId of data.product_ids) {
          await c.env.DB.prepare(`
            INSERT INTO promotion_products (promotion_id, product_id)
            VALUES (?, ?)
          `).bind(promotionId, productId).run();
        }
      }
    }
    if (data.category_ids !== void 0) {
      await c.env.DB.prepare(
        "DELETE FROM promotion_categories WHERE promotion_id = ?"
      ).bind(promotionId).run();
      if (Array.isArray(data.category_ids)) {
        for (const categoryId of data.category_ids) {
          await c.env.DB.prepare(`
            INSERT INTO promotion_categories (promotion_id, category_id)
            VALUES (?, ?)
          `).bind(promotionId, categoryId).run();
        }
      }
    }
    return c.json({
      success: true,
      data: null,
      message: "C\u1EADp nh\u1EADt khuy\u1EBFn m\xE3i th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Update promotion error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt khuy\u1EBFn m\xE3i"
    }, 500);
  }
});
app13.delete("/:id", async (c) => {
  try {
    const promotionId = parseInt(c.req.param("id"));
    if (isNaN(promotionId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID khuy\u1EBFn m\xE3i kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    await initializePromotionsTables(c.env);
    const existingPromotion = await c.env.DB.prepare(
      "SELECT id, usage_count FROM promotions WHERE id = ?"
    ).bind(promotionId).first();
    if (!existingPromotion) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng t\xECm th\u1EA5y khuy\u1EBFn m\xE3i"
      }, 404);
    }
    if (existingPromotion.usage_count > 0) {
      return c.json({
        success: false,
        data: null,
        message: "Kh\xF4ng th\u1EC3 x\xF3a khuy\u1EBFn m\xE3i \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng"
      }, 400);
    }
    await c.env.DB.prepare("DELETE FROM promotions WHERE id = ?").bind(promotionId).run();
    return c.json({
      success: true,
      data: null,
      message: "X\xF3a khuy\u1EBFn m\xE3i th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Delete promotion error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi x\xF3a khuy\u1EBFn m\xE3i"
    }, 500);
  }
});
app13.put("/:id/toggle", async (c) => {
  try {
    const promotionId = parseInt(c.req.param("id"));
    if (isNaN(promotionId)) {
      return c.json({
        success: false,
        data: null,
        message: "ID khuy\u1EBFn m\xE3i kh\xF4ng h\u1EE3p l\u1EC7"
      }, 400);
    }
    await initializePromotionsTables(c.env);
    await c.env.DB.prepare(`
      UPDATE promotions
      SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(promotionId).run();
    return c.json({
      success: true,
      data: null,
      message: "C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i khuy\u1EBFn m\xE3i th\xE0nh c\xF4ng"
    });
  } catch (error) {
    console.error("Toggle promotion status error:", error);
    return c.json({
      success: false,
      data: null,
      message: "L\u1ED7i khi c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i khuy\u1EBFn m\xE3i"
    }, 500);
  }
});
var promotions_default = app13;

// src/index.ts
var app14 = new Hono2();
app14.use("*", corsSecurity);
app14.use("*", async (c, next) => {
  try {
    const workerInitKey = "worker_initialized";
    const initialized = await c.env.CACHE.get(workerInitKey);
    if (!initialized) {
      console.log("Initializing worker and checking migrations");
      await checkAndRunMigrations(c.env);
      await c.env.CACHE.put(workerInitKey, "true", { expirationTtl: 3600 });
      console.log("Worker initialization complete");
    }
  } catch (error) {
    console.error("Worker initialization error:", error);
  }
  await next();
});
app14.use("*", accessLogger);
app14.use("*", securityHeaders);
app14.use("*", sqlInjectionProtection);
var api = new Hono2();
api.use("/auth/*", rateLimit("auth"));
api.route("/auth", auth_default);
api.use("/products/*", rateLimit("default"));
api.route("/products", products_default);
api.use("/categories/*", rateLimit("default"));
api.route("/categories", categories_default);
api.use("/sales/*", rateLimit("default"));
api.route("/sales", sales_default);
api.use("/users/*", rateLimit("critical"));
api.route("/users", users_default);
api.use("/reports/*", rateLimit("default"));
api.route("/reports", reports_default);
api.use("/settings/*", rateLimit("critical"));
api.route("/settings", settings_default);
api.use("/stores/*", rateLimit("default"));
api.route("/stores", stores_default);
api.use("/inventory/*", rateLimit("default"));
api.route("/inventory", inventory_default);
api.use("/returns/*", rateLimit("default"));
api.route("/returns", returns_default);
api.use("/customers/*", rateLimit("default"));
api.route("/customers", customers_default);
api.use("/suppliers/*", rateLimit("default"));
api.route("/suppliers", suppliers_default);
api.use("/promotions/*", rateLimit("default"));
api.route("/promotions", promotions_default);
app14.route("/api/v1", api);
app14.get("/", (c) => c.text("SmartPOS API - S\u1EED d\u1EE5ng endpoint /api/v1 \u0111\u1EC3 truy c\u1EADp API"));
app14.notFound((c) => {
  return c.json({
    success: false,
    message: "Endpoint kh\xF4ng t\u1ED3n t\u1EA1i",
    error: "NOT_FOUND"
  }, 404);
});
app14.onError((err, c) => {
  console.error("Application error:", err);
  return c.json({
    success: false,
    message: "\u0110\xE3 x\u1EA3y ra l\u1ED7i t\u1EEB h\u1EC7 th\u1ED1ng",
    error: err.message
  }, 500);
});
var src_default = app14;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-5T0opL/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-5T0opL/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  InventorySyncObject,
  NotificationObject,
  POSSyncObject,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
