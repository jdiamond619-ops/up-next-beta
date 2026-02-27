"use client";

import { useEffect } from "react";
import NavBar from "./NavBar";
import { useAuthStore } from "../context/useAuthStore";

export default function AppShell({ children }) {
  const { hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <main className="mx-auto min-h-screen w-full max-w-md p-4 text-sm text-gray-500">Loading...</main>;
  }

  return (
    <>
      <NavBar />
      <main className="mx-auto min-h-screen w-full max-w-md p-4">{children}</main>
    </>
  );
}
