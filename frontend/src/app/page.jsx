"use client";

import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import { useAuthStore } from "../context/useAuthStore";
import { apiFetch } from "../lib/api";

export default function HomePage() {
  const { token, user, setUser } = useAuthStore();
  const [videos, setVideos] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [feed, board] = await Promise.all([
        apiFetch("/videos"),
        apiFetch("/leaderboard")
      ]);
      setVideos(feed.videos);
      setLeaderboard(board.leaderboard);

      if (token) {
        const me = await apiFetch("/auth/me", { token });
        setUser(me.user);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
        <p className="font-semibold">Closed-loop beta economy</p>
        <p>No withdrawals, no real-money rails, no securities exposure. UNC is in-app only.</p>
        {user ? <p className="mt-1">Welcome back, {user.username}.</p> : null}
      </section>

      {error ? <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-4">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} token={token} onTrade={load} />
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Top performers</h3>
        <div className="space-y-2 text-sm">
          {leaderboard.map((row, index) => (
            <div key={row.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1.5">
              <span>
                #{index + 1} {row.username}
              </span>
              <span className={Number(row.unrealized_pnl) >= 0 ? "text-green-700" : "text-red-700"}>
                {Number(row.unrealized_pnl).toFixed(2)} UNC
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
