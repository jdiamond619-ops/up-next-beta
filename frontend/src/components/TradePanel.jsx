"use client";

import { useState } from "react";
import { apiFetch } from "../lib/api";

export default function TradePanel({ token, video, onTrade }) {
  const [buyAmount, setBuyAmount] = useState(50);
  const [sellUnits, setSellUnits] = useState(10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function runTrade(type) {
    setBusy(true);
    setMessage("");

    try {
      if (type === "buy") {
        await apiFetch(`/videos/${video.id}/buy`, {
          method: "POST",
          token,
          body: { uncAmount: Number(buyAmount), maxSlippagePct: 0.12 }
        });
      } else {
        await apiFetch(`/videos/${video.id}/sell`, {
          method: "POST",
          token,
          body: { units: Number(sellUnits), maxSlippagePct: 0.12 }
        });
      }
      setMessage(`${type.toUpperCase()} success`);
      onTrade();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="10"
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
          placeholder="Buy UNC"
        />
        <button
          type="button"
          onClick={() => runTrade("buy")}
          disabled={busy}
          className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Back This Video
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="0.001"
          step="0.001"
          value={sellUnits}
          onChange={(e) => setSellUnits(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
          placeholder="Sell units"
        />
        <button
          type="button"
          onClick={() => runTrade("sell")}
          disabled={busy}
          className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Sell Position
        </button>
      </div>
      {message ? <p className="text-xs text-gray-600">{message}</p> : null}
    </div>
  );
}
