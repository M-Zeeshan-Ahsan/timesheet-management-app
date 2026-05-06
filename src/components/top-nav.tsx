"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/auth";

export function TopNav() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (e.target instanceof Node && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };
  return (
    <header className="border-b border-gray-200 bg-white h-16 flex items-center">
      <div className="mx-auto flex w-full items-center justify-between !px-4 py-4 sm:px-6">
        <div className="flex items-center gap-8">
          <h1 className="text-lg  text-gray-900 font-bold">ticktock</h1>
          <nav className="text-sm font-medium text-gray-600">
            <span className="text-gray-900">Timesheets</span>
          </nav>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 rounded-md px-2 py-1"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <span>{isLoading ? "Loading..." : (user?.name ?? "Guest")}</span>
            <span className="text-gray-400">▾</span>
          </button>

          {open ? (
            <div
              className="absolute right-0 mt-2 w-40 rounded-md border border-gray-200 bg-white shadow-lg"
              role="menu"
              aria-label="User menu"
            >
              <button
                type="button"
                className="w-full !px-3 !py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoggingOut}
                onClick={handleLogout}
                role="menuitem"
              >
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
