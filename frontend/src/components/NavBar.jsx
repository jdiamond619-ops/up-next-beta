"use client";

import Link from "next/link";
import { useAuthStore } from "../context/useAuthStore";

export default function NavBar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand-900">
          Up Next
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="rounded bg-brand-50 px-2 py-1 font-medium text-brand-900">
                {Number(user.unc_balance).toFixed(1)} UNC
              </span>
              <Link href="/portfolio" className="text-gray-700">
                Portfolio
              </Link>
              {user.role === "admin" ? (
                <Link href="/admin" className="text-gray-700">
                  Admin
                </Link>
              ) : null}
              <button type="button" className="text-red-600" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700">
                Login
              </Link>
              <Link href="/signup" className="rounded bg-brand-500 px-3 py-1.5 font-medium text-white">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
