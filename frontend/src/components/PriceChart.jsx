"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function PriceChart({ points }) {
  const data = points.map((point) => ({
    t: new Date(point.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    price: Number(point.price)
  }));

  return (
    <div className="h-64 w-full rounded-xl border border-gray-200 bg-white p-3">
      <ResponsiveContainer>
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis domain={["auto", "auto"]} width={40} />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#11b981" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
