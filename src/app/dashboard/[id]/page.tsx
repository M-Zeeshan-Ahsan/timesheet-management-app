"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import * as authService from "@/services/auth";
import * as timesheetService from "@/services/timesheets";
import type { Timesheet } from "@/types/timesheet";

type Mode = "view" | "create" | "update";

type TimesheetEntry = {
  id: string;
  date: string;
  projectName: string;
  taskName: string;
  typeOfWork: string;
  hours: number;
};

function normalizeMode(value: string | null): Mode {
  if (value === "create" || value === "update" || value === "view")
    return value;
  return "view";
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  const startDay = start.getDate();
  const endDay = end.getDate();
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
  const startMonth = monthFormatter.format(start);
  const endMonth = monthFormatter.format(end);
  const year = start.getFullYear();

  if (sameMonth) {
    return `${startDay} - ${endDay} ${startMonth}, ${year}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${year}`;
}

function buildIsoDays(startDate: string, endDate: string): string[] {
  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) return [];
  if (startDate > endDate) return [];

  const result: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    result.push(toIsoDate(d));
  }
  return result;
}

function newId(): string {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return `entry_${(globalThis.crypto as Crypto).randomUUID()}`;
  }
  return `entry_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeEntry(value: unknown): TimesheetEntry | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;

  const id = typeof obj.id === "string" ? obj.id : "";
  const date = typeof obj.date === "string" ? obj.date : "";
  const projectName =
    typeof obj.projectName === "string" ? obj.projectName : "";
  const hours = typeof obj.hours === "number" ? obj.hours : Number(obj.hours);

  const taskName =
    typeof obj.taskName === "string"
      ? obj.taskName
      : typeof obj.description === "string"
        ? obj.description
        : "";

  const typeOfWork = typeof obj.typeOfWork === "string" ? obj.typeOfWork : "";

  if (!id || !isValidIsoDate(date)) return null;
  if (!Number.isFinite(hours) || hours <= 0) return null;

  return {
    id,
    date,
    projectName,
    taskName,
    typeOfWork,
    hours,
  };
}

export default function TimesheetDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const mode = normalizeMode(searchParams.get("mode"));
  console.log("mode", mode);
  const timesheetId = String(params.id);

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `timesheet_entries_${timesheetId}`;
  const [entries, setEntries] = useState<TimesheetEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeEntry).filter((x): x is TimesheetEntry => !!x);
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [typeOfWork, setTypeOfWork] = useState("");
  const [hours, setHours] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const item = await timesheetService.getTimesheet(timesheetId);
        if (cancelled) return;
        setTimesheet(item);
      } catch (e) {
        if (cancelled) return;
        const status =
          typeof e === "object" && e && "status" in e
            ? Number((e as { status: unknown }).status)
            : undefined;
        if (status === 401) {
          try {
            await authService.logout();
          } catch {}
          if (cancelled) return;
          router.replace(`/login?next=/dashboard/${timesheetId}`);
          return;
        }
        const message =
          typeof e === "object" && e && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load timesheet";
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router, timesheetId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {
      return;
    }
  }, [entries, storageKey]);

  const totalHours = useMemo(
    () =>
      entries.reduce(
        (sum, e) => sum + (Number.isFinite(e.hours) ? e.hours : 0),
        0,
      ),
    [entries],
  );
  const percent = Math.max(
    0,
    Math.min(100, Math.round((totalHours / 40) * 100)),
  );

  const days = useMemo(() => {
    if (!timesheet) return [];
    return buildIsoDays(timesheet.startDate, timesheet.endDate);
  }, [timesheet]);

  const hasAnyEntriesInWeek = useMemo(() => {
    if (days.length === 0) return false;
    const visible = new Set(days);
    return entries.some((e) => visible.has(e.date));
  }, [days, entries]);

  const openAdd = (date: string) => {
    if (totalHours >= 40) {
      return;
    }
    setActiveDate(date);
    setEditingId(null);
    setProjectName("");
    setTaskName("");
    setTypeOfWork("");
    setHours(Math.min(1, 40 - totalHours));
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (entry: TimesheetEntry) => {
    setActiveDate(entry.date);
    setEditingId(entry.id);
    setProjectName(entry.projectName);
    setTaskName(entry.taskName);
    setTypeOfWork(entry.typeOfWork);
    setHours(entry.hours);
    setFormError(null);
    setOpen(true);
  };

  const saveEntry = () => {
    setFormError(null);
    if (!activeDate || !isValidIsoDate(activeDate)) {
      setFormError("Select a day first");
      return;
    }
    if (!projectName.trim()) {
      setFormError("Project is required");
      return;
    }
    if (!typeOfWork.trim()) {
      setFormError("Type of work is required");
      return;
    }
    if (!taskName.trim()) {
      setFormError("Task name is required");
      return;
    }
    if (!Number.isFinite(hours) || hours <= 0) {
      setFormError("Hours must be greater than 0");
      return;
    }

    let currentTotal = totalHours;
    if (editingId) {
      const existingEntry = entries.find((e) => e.id === editingId);
      if (existingEntry) {
        currentTotal -= existingEntry.hours;
      }
    }
    if (currentTotal + hours > 40) {
      setFormError(
        `Cannot add ${hours} hours. Total would exceed 40 hours (current total: ${currentTotal}, max allowed: ${40 - currentTotal})`,
      );
      return;
    }

    if (editingId) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                date: activeDate,
                projectName: projectName.trim(),
                typeOfWork: typeOfWork.trim(),
                taskName: taskName.trim(),
                hours,
              }
            : e,
        ),
      );
    } else {
      setEntries((prev) => [
        ...prev,
        {
          id: newId(),
          date: activeDate,
          projectName: projectName.trim(),
          typeOfWork: typeOfWork.trim(),
          taskName: taskName.trim(),
          hours,
        },
      ]);
    }

    setOpen(false);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="!mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-md border border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Button
                variant="link"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                Back
              </Button>
              <h1 className="mt-1 text-base font-semibold text-gray-900">
                This week&apos;s timesheet
              </h1>
              {timesheet ? (
                <div className="mt-1 text-xs text-gray-600">
                  {formatDateRange(timesheet.startDate, timesheet.endDate)}
                </div>
              ) : null}
            </div>

            <div className="min-w-[120px] text-right">
              <div className="text-xs text-gray-600">{totalHours}/40 hrs</div>
              <div className="mt-2 h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-gray-500">{percent}%</div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-gray-200 bg-white px-6 py-5">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading...
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : !timesheet ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Timesheet not found.
            </div>
          ) : (
            <div className="grid gap-6">
              {mode !== "view" && !hasAnyEntriesInWeek && totalHours < 40 ? (
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-center rounded-md border border-dashed border-blue-300 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  onClick={() => openAdd(days[0] ?? timesheet.startDate)}
                >
                  + Add new task
                </button>
              ) : null}
              {days.map((day) => {
                const date = new Date(`${day}T00:00:00`);
                const label = new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(date);
                const weekday = new Intl.DateTimeFormat("en-US", {
                  weekday: "short",
                }).format(date);

                const dayEntries = entries
                  .filter((e) => e.date === day)
                  .slice()
                  .sort((a, b) => a.id.localeCompare(b.id));

                const isEmpty = dayEntries.length === 0;

                return (
                  <div key={day} className="flex gap-4">
                    <div className="w-20 pt-3">
                      <div className="text-sm font-semibold text-gray-900">
                        {label}
                      </div>
                      <div className="text-xs text-gray-500">{weekday}</div>
                    </div>

                    <div className="flex-1 rounded-md border border-gray-200 bg-white p-3">
                      <div className="grid gap-2">
                        {dayEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2"
                          >
                            <div className="flex-1">
                              <div className="text-sm text-gray-900">
                                {entry.taskName}
                              </div>
                              {entry.typeOfWork && (
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                  {entry.typeOfWork}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.hours} hrs
                            </div>
                            <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                              {entry.projectName}
                            </span>

                            {mode !== "view" ? (
                              <details className="relative">
                                <summary className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 [&::-webkit-details-marker]:hidden">
                                  …
                                </summary>
                                <div className="absolute right-0 top-9 w-32 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                    onClick={(e) => {
                                      const details = (
                                        e.currentTarget as HTMLElement
                                      ).closest("details");
                                      if (details)
                                        details.removeAttribute("open");
                                      openEdit(entry);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                    onClick={(e) => {
                                      const details = (
                                        e.currentTarget as HTMLElement
                                      ).closest("details");
                                      if (details)
                                        details.removeAttribute("open");
                                      removeEntry(entry.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </details>
                            ) : null}
                          </div>
                        ))}

                        {mode !== "view" && totalHours < 40 ? (
                          <button
                            type="button"
                            className={
                              isEmpty
                                ? "mt-1 flex h-10 w-full items-center justify-center rounded-md border border-dashed border-blue-300 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100"
                                : "mt-1 flex h-10 w-full items-center justify-center rounded-md border border-dashed border-gray-300 text-sm font-medium text-blue-600 hover:bg-blue-50"
                            }
                            onClick={() => openAdd(day)}
                          >
                            + Add new task
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white px-6 py-4 text-center text-xs text-gray-500">
          © 2024 tentwenty. All rights reserved.
        </div>
      </main>

      <Modal
        open={open}
        title={editingId ? "Edit Entry" : "Add New Entry"}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEntry}>
              {editingId ? "Save changes" : "Add entry"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4">
          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-xs font-medium text-gray-600">
              Select Project *
            </label>
            <select
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            >
              <option value="" disabled>
                Project Name
              </option>
              <option value="Project Name">Project Name</option>
              <option value="Internal">Internal</option>
              <option value="Client Work">Client Work</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-gray-600">
              Type of Work *
            </label>
            <select
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
              value={typeOfWork}
              onChange={(e) => setTypeOfWork(e.target.value)}
            >
              <option value="" disabled>
                Bug fixes
              </option>
              <option value="Bug fixes">Bug fixes</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Testing">Testing</option>
              <option value="Meeting">Meeting</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-gray-600">
              Task description *
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 resize-none"
              placeholder="Write text here ..."
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-gray-600">Hours *</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setHours((h) => Math.max(1, h - 1))}
              >
                −
              </button>
              <input
                className="h-9 w-20 rounded-md border border-gray-300 bg-white px-3 text-center text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                value={String(hours)}
                readOnly
              />
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  let currentTotal = totalHours;
                  if (editingId) {
                    const existingEntry = entries.find(
                      (e) => e.id === editingId,
                    );
                    if (existingEntry) {
                      currentTotal -= existingEntry.hours;
                    }
                  }
                  const maxAllowed = Math.min(24, 40 - currentTotal);
                  setHours((h) => Math.min(maxAllowed, h + 1));
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
