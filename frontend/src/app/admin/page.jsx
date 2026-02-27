"use client";

import { useState } from "react";
import { useAuthStore } from "../../context/useAuthStore";
import { apiFetch } from "../../lib/api";

export default function AdminPage() {
  const { token, user } = useAuthStore();
  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    creatorName: ""
  });
  const [message, setMessage] = useState("");

  if (!token || user?.role !== "admin") {
    return <p className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">Admin role required.</p>;
  }

  async function submit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const result = await apiFetch("/videos/admin/upload", {
        method: "POST",
        token,
        body: form
      });
      setMessage(`Created: ${result.video.title}`);
      setForm({ title: "", description: "", videoUrl: "", thumbnailUrl: "", creatorName: "" });
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <h1 className="text-lg font-semibold">Admin Upload</h1>
      {[
        ["title", "Title"],
        ["creatorName", "Creator Handle"],
        ["videoUrl", "Video URL"],
        ["thumbnailUrl", "Thumbnail URL"],
        ["description", "Description"]
      ].map(([key, label]) => (
        <input
          key={key}
          required={key === "title" || key === "creatorName" || key === "videoUrl"}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder={label}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ))}
      <button type="submit" className="w-full rounded bg-brand-500 px-3 py-2 font-semibold text-white">
        Upload video
      </button>
      {message ? <p className="text-sm text-gray-600">{message}</p> : null}
      <p className="text-xs text-gray-500">Seed admin login: admin@upnext.local / admin1234</p>
    </form>
  );
}
