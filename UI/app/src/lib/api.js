// Lightweight fetch wrapper for the API
// - Respects cookies (credentials: 'include')
// - Applies base URL from Vite env or defaults to localhost
// - Auto JSON encode/decode

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api/v1";

export async function apiFetch(
  path,
  { method = "GET", headers = {}, body, params, signal } = {},
  _internal = { __retried: false }
) {
  const raw = path.startsWith("http")
    ? path
    : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const url = raw.startsWith("http")
    ? new URL(raw)
    : new URL(raw, window.location.origin);

  if (params && typeof params === "object") {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const init = {
    method,
    credentials: "include", // send/receive http-only cookies
    headers: {
      Accept: "application/json",
      ...headers,
    },
    signal,
  };

  if (body !== undefined) {
    if (typeof body === "object" && !(body instanceof FormData)) {
      init.headers["Content-Type"] =
        init.headers["Content-Type"] || "application/json";
      init.body = JSON.stringify(body);
    } else {
      init.body = body;
    }
  }

  const res = await fetch(url.toString(), init);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    // Attempt silent re-auth once on 401/403 if we have a saved code
    if ((res.status === 401 || res.status === 403) && !_internal.__retried) {
      try {
        const mod = await import("./auth.js");
        const saved = mod.loadDoctorProfile?.();
        const savedCode = saved?.code ? String(saved.code) : null;
        if (savedCode) {
          await mod.login({ code: savedCode });
          // Retry the original request once
          return apiFetch(
            path,
            { method, headers, body, params, signal },
            { __retried: true }
          );
        }
      } catch {
        // fall through to error throw
      }
    }

    const message =
      (isJson && data && (data.detail || data.message)) ||
      res.statusText ||
      "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function getBaseUrl() {
  return BASE_URL;
}
