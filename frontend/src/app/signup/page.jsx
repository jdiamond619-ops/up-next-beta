"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../context/useAuthStore";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    try {
      const result = await apiFetch("/auth/signup", { method: "POST", body: form });
      login(result);
      router.push("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h1 className="text-lg font-semibold">Sign up</h1>
      <input
        required
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
      />
      <input
        required
        type="email"
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <input
        required
        type="password"
        className="w-full rounded border border-gray-300 px-3 py-2"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" className="w-full rounded bg-brand-500 px-3 py-2 font-semibold text-white">
        Create account
      </button>
      <p className="text-xs text-gray-500">Each account starts with 1000 UNC.</p>
    </form>
  );
}
