"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface FormInputProps {
  label?: string;
  error?: string;
  className?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}

export function Input({ className, label, error, ...props }: FormInputProps) {
  return (
    <div className="w-full flex flex-col gap-1">
      {label ? (
        <label className="text-xs font-medium text-black">{label}</label>
      ) : null}

      <input
        className={cn(
          "h-9 w-full rounded-md border border-gray-300 bg-white !px-3 !py-4 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30",
          error && "border-red-500 focus-visible:ring-red-500/30",
          className,
        )}
        {...props}
      />

      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  );
}
