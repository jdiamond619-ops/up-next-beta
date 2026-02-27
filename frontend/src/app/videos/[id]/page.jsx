"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "../../../components/PriceChart";
import { useAuthStore } from "../../../context/useAuthStore";
import { apiFetch } from "../../../lib/api";

export default function VideoDetailPage() {
  const params = useParams();
  const { token } = useAuthStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) {
      return;
    }

    apiFetch(`/videos/${params.id}`, { token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [params.id, token]);

  if (error) {
    return <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-3">
        <h1 className="text-lg font-semibold">{data.video.title}</h1>
        <p className="text-sm text-gray-600">{data.video.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Current Price" value={`${Number(data.video.current_price).toFixed(4)} UNC`} />
          <Stat label="UNC Pool" value={`${Number(data.video.total_unc_backed).toFixed(1)} UNC`} />
          <Stat label="Backers" value={data.video.backers} />
          <Stat label="Your Units" value={data.myPosition ? Number(data.myPosition.units).toFixed(3) : "0"} />
        </div>
      </section>

      <PriceChart points={data.chart} />

      <section className="rounded-xl border border-gray-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold">Buy/Sell history</h2>
        <div className="space-y-2 text-xs">
          {data.history.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1.5">
              <span>
                {row.username} {row.action}
              </span>
              <span>{Number(row.unc_amount).toFixed(2)} UNC</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded bg-gray-50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}
