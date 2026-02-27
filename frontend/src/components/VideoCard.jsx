"use client";

import Link from "next/link";
import TradePanel from "./TradePanel";

export default function VideoCard({ video, onTrade, token }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-[9/16] w-full bg-black">
        <video className="h-full w-full object-cover" src={video.video_url} controls muted playsInline />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{video.title}</h2>
          <span className="text-xs text-gray-500">{video.creator_name}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat label="Price" value={`${Number(video.current_price).toFixed(3)} UNC`} />
          <Stat label="Pool" value={`${Number(video.total_unc_backed).toFixed(1)} UNC`} />
          <Stat label="Backers" value={video.backers} />
        </div>
        {token ? <TradePanel token={token} video={video} onTrade={onTrade} /> : null}
        <Link href={`/videos/${video.id}`} className="block text-center text-sm font-medium text-brand-700">
          View details
        </Link>
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 font-semibold text-gray-900">{value}</div>
    </div>
  );
}
