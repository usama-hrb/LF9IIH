import { apiFetch } from "./api";

export async function login({ code }) {
  // POST /login { code }
  return apiFetch("/login", {
    method: "POST",
    body: { code },
  });
}

export async function signup(payload) {
  // payload: { first_name, last_name, phone_number, email, password }
  return apiFetch("/signup", {
    method: "POST",
    body: payload,
  });
}

export async function me() {
  return apiFetch("/me", { method: "GET" });
}

// Simple helper to persist the logged-in doctor profile using a cookie
// Note: Auth tokens are already managed via HttpOnly cookies by the backend.
// This cookie is only for lightweight UI state (e.g., showing name without refetch).
const COOKIE_NAME = "doctor_profile";

function setCookie(name, value, days = 7) {
  try {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    // Encode value to ensure safe storage in cookie
    const encoded = encodeURIComponent(value);
    document.cookie = `${name}=${encoded}; Expires=${expires}; Path=/; SameSite=Lax`;
  } catch {
    // ignore cookie set errors
  }
}

function getCookie(name) {
  try {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (const c of cookies) {
      const eqIdx = c.indexOf("=");
      const key = c.substring(0, eqIdx);
      if (key === name) {
        const val = c.substring(eqIdx + 1);
        try {
          return decodeURIComponent(val);
        } catch {
          return val;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function deleteCookie(name) {
  try {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
  } catch {
    // ignore cookie delete errors
  }
}

export function saveDoctorProfile(profile) {
  try {
    setCookie(COOKIE_NAME, JSON.stringify(profile));
  } catch {
    // ignore serialization errors
  }
}

export function loadDoctorProfile() {
  try {
    const raw = getCookie(COOKIE_NAME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDoctorProfile() {
  deleteCookie(COOKIE_NAME);
}
