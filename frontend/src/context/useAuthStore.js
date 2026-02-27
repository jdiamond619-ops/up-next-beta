"use client";

import { create } from "zustand";

const TOKEN_KEY = "upnext_token";
const USER_KEY = "upnext_user";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate() {
    if (typeof window === "undefined") {
      return;
    }

    const token = window.localStorage.getItem(TOKEN_KEY);
    const user = safeJsonParse(window.localStorage.getItem(USER_KEY), null);
    set({ token, user, hydrated: true });
  },
  login({ token, user }) {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
  setUser(user) {
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  }
}));
