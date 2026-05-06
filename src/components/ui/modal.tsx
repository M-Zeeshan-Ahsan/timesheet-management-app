"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
};

export function Modal({ open, title, children, onClose, footer }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="absolute inset-0 bg-slate-700/70"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-lg bg-white shadow-xl",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="border-t border-gray-200 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
