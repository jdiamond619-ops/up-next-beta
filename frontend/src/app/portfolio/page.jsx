"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../../context/useAuthStore";
import { apiFetch } from "../../lib/api";

export default function PortfolioPage() {
  const { token } = useAuthStore();
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    apiFetch("/portfolio/me", { token })
      .then(setPortfolio)
      .catch((err) => setError(err.message));
  }, [token]);

  if (!token) {
    return <p className="rounded bg-yellow-50 p-3 text-sm text-yellow-800">Login to view portfolio.</p>;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Portfolio</h1>
      {error ? <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {portfolio ? (
        <>
          <p className="rounded border border-gray-200 bg-white p-3 text-sm">
            Wallet balance: <span className="font-semibold">{Number(portfolio.user.unc_balance).toFixed(2)} UNC</span>
          </p>
          <div className="space-y-2">
            {portfolio.positions.map((pos) => (
              <article key={pos.video_id} className="rounded-xl border border-gray-200 bg-white p-3 text-sm">
                <h2 className="font-semibold">{pos.title}</h2>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <Stat label="Units" value={Number(pos.units).toFixed(3)} />
                  <Stat label="Entry" value={Number(pos.entry_price).toFixed(3)} />
                  <Stat label="Current" value={Number(pos.current_price).toFixed(3)} />
                  <Stat
                    label="Unrealized"
                    value={`${Number(pos.unrealized_pnl).toFixed(2)} UNC`}
                    className={Number(pos.unrealized_pnl) >= 0 ? "text-green-700" : "text-red-700"}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">Loading...</p>
      )}
    </div>
  );
}

function Stat({ label, value, className = "text-gray-900" }) {
  return (
    <div className="rounded bg-gray-50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`font-semibold ${className}`}>{value}</div>
    </div>
  );
}
