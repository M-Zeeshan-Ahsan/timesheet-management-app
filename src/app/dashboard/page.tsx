"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useTimesheets } from "@/hooks/useTimesheets";
import type { TimesheetStatus } from "@/types/timesheet";
import type { Timesheet } from "@/types/timesheet";

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

function deriveTimesheetStatus(
  timesheetId: string,
  startDate: string,
  endDate: string,
  fallback: TimesheetStatus,
): TimesheetStatus {
  const days = buildIsoDays(startDate, endDate);
  if (days.length === 0) return fallback;
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(`timesheet_entries_${timesheetId}`);
    if (!raw) return "MISSING";
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return "MISSING";

    let totalHours = 0;
    for (const it of parsed) {
      if (!it || typeof it !== "object") continue;
      const hours =
        "hours" in it ? Number((it as { hours: unknown }).hours) : 0;
      if (Number.isFinite(hours) && hours > 0) totalHours += hours;
    }

    if (totalHours === 0) return "MISSING";
    if (totalHours >= 40) return "COMPLETED";
    return "INCOMPLETE";
  } catch {
    return fallback;
  }
}

type TimesheetEntry = {
  id: string;
  date: string;
  projectName: string;
  taskName: string;
  typeOfWork: string;
  hours: number;
};

function seedEntriesForTimesheet(timesheet: Timesheet): TimesheetEntry[] {
  const days = buildIsoDays(timesheet.startDate, timesheet.endDate);
  if (days.length === 0) return [];

  if (timesheet.status === "MISSING") return [];
  if (timesheet.status === "INCOMPLETE") {
    const sampleDays = days.slice(0, Math.min(2, days.length));
    return sampleDays.map((d, idx) => ({
      id: `seed_${timesheet.id}_${d}_${idx}`,
      date: d,
      projectName: idx % 2 === 0 ? "Project Name" : "Client Work",
      typeOfWork: idx % 2 === 0 ? "Development" : "Bug fixes",
      taskName: idx % 2 === 0 ? "Homepage Development" : "Bug fixes",
      hours: 4,
    }));
  }

  return days.map((d, idx) => ({
    id: `seed_${timesheet.id}_${d}_${idx}`,
    date: d,
    projectName:
      idx % 3 === 0
        ? "Project Name"
        : idx % 3 === 1
          ? "Internal"
          : "Client Work",
    typeOfWork:
      idx % 3 === 0 ? "Development" : idx % 3 === 1 ? "Design" : "Bug fixes",
    taskName:
      idx % 3 === 0
        ? "Homepage Development"
        : idx % 3 === 1
          ? "UI Polish"
          : "Bug fixes",
    hours: 4,
  }));
}

function ensureSeedEntries(timesheet: Timesheet): void {
  if (typeof window === "undefined") return;
  const key = `timesheet_entries_${timesheet.id}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return;
    }
    const seeded = seedEntriesForTimesheet(timesheet);
    if (seeded.length === 0) return;
    localStorage.setItem(key, JSON.stringify(seeded));
  } catch {
    return;
  }
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

function StatusPill({ status }: { status: TimesheetStatus }) {
  const styles: Record<TimesheetStatus, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    INCOMPLETE: "bg-amber-50 text-amber-700 border-amber-200",
    MISSING: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-[10px] font-semibold uppercase border ${styles[status]}`}
    >
      {status}
    </span>
  );
}

type PaginationItem = number | "ellipsis";

function buildPagination(current: number, total: number): PaginationItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3)
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export default function DashboardPage() {
  const router = useRouter();
  const { items, isLoading, error, create, update, remove } = useTimesheets();

  const [statusFilter, setStatusFilter] = useState<"ALL" | TimesheetStatus>(
    "ALL",
  );
  const [dateRangeStart, setDateRangeStart] = useState<string>("");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | "new" | null>(null);

  useEffect(() => {
    if (items.length > 0) {
      for (const t of items) {
        ensureSeedEntries(t);
      }
    }
  }, [items]);

  const statusById = useMemo(() => {
    const next: Record<string, TimesheetStatus> = {};
    for (const t of items) {
      next[t.id] = deriveTimesheetStatus(
        t.id,
        t.startDate,
        t.endDate,
        t.status,
      );
    }
    return next;
  }, [items]);

  useEffect(() => {
    if (error?.status === 401) {
      router.replace("/login?next=/dashboard");
    }
  }, [error, router]);

  const filtered = useMemo(() => {
    let result = items;

    if (statusFilter !== "ALL") {
      result = result.filter(
        (t) => (statusById[t.id] ?? t.status) === statusFilter,
      );
    }

    if (dateRangeStart && dateRangeEnd) {
      result = result.filter((t) => {
        const timesheetStart = new Date(`${t.startDate}T00:00:00`);
        const timesheetEnd = new Date(`${t.endDate}T00:00:00`);
        const filterStart = new Date(`${dateRangeStart}T00:00:00`);
        const filterEnd = new Date(`${dateRangeEnd}T00:00:00`);

        return timesheetStart <= filterEnd && timesheetEnd >= filterStart;
      });
    }

    return result;
  }, [items, statusFilter, statusById, dateRangeStart, dateRangeEnd]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const startIndex = (clampedPage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="!mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-md border border-gray-200 bg-white">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold text-gray-900">
                Your Timesheets
              </h1>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <details className="relative">
                <summary className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-600 flex items-center justify-between cursor-pointer hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 sm:w-56 [&::-webkit-details-marker]:hidden">
                  <span>
                    {dateRangeStart && dateRangeEnd
                      ? `${formatDateRange(dateRangeStart, dateRangeEnd)}`
                      : "Date Range"}
                  </span>
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="absolute left-0 top-11 z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-gray-700">
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={dateRangeStart}
                        onChange={(e) => {
                          setDateRangeStart(e.target.value);
                          setPage(1);
                        }}
                        className="h-9 w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-gray-700">
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={dateRangeEnd}
                        onChange={(e) => {
                          setDateRangeEnd(e.target.value);
                          setPage(1);
                        }}
                        className="h-9 w-full"
                      />
                    </div>
                    {(dateRangeStart || dateRangeEnd) && (
                      <button
                        type="button"
                        className="h-9 w-full rounded-md border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        onClick={(e) => {
                          const details = (
                            e.currentTarget as HTMLElement
                          ).closest("details");
                          if (details) details.removeAttribute("open");
                          setDateRangeStart("");
                          setDateRangeEnd("");
                          setPage(1);
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </details>
              <select
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30 sm:w-32"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "ALL" | TimesheetStatus);
                  setPage(1);
                }}
                aria-label="Status"
              >
                <option value="ALL">Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="INCOMPLETE">Incomplete</option>
                <option value="MISSING">Missing</option>
              </select>
            </div>
          </div>

          <div className="px-6 pb-5">
            {error && error.status !== 401 ? (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error.message}
              </div>
            ) : null}

            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH className="w-24">
                    <span className="inline-flex items-center gap-1">
                      Week #<span className="text-gray-400">↓</span>
                    </span>
                  </TH>
                  <TH>
                    <span className="inline-flex items-center gap-1">
                      Date
                      <span className="text-gray-400">↓</span>
                    </span>
                  </TH>
                  <TH>
                    <span className="inline-flex items-center gap-1">
                      Status
                      <span className="text-gray-400">↓</span>
                    </span>
                  </TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {isLoading ? (
                  <TR className="hover:bg-transparent">
                    <TD colSpan={4} className="py-10 text-center text-gray-500">
                      Loading...
                    </TD>
                  </TR>
                ) : pageItems.length === 0 ? (
                  <TR className="hover:bg-transparent">
                    <TD colSpan={4} className="py-10 text-center text-gray-500">
                      No timesheets found.
                    </TD>
                  </TR>
                ) : (
                  pageItems.map((t) => (
                    <TR key={t.id}>
                      <TD className="text-sm text-gray-900">{t.weekNumber}</TD>
                      <TD className="text-sm text-gray-700">
                        {formatDateRange(t.startDate, t.endDate)}
                      </TD>
                      <TD>
                        <StatusPill status={statusById[t.id] ?? t.status} />
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              ensureSeedEntries(t);
                              const derived = statusById[t.id] ?? t.status;
                              const action =
                                derived === "COMPLETED"
                                  ? "view"
                                  : derived === "INCOMPLETE"
                                    ? "update"
                                    : "create";
                              router.push(`/dashboard/${t.id}?mode=${action}`);
                            }}
                          >
                            {(statusById[t.id] ?? t.status) === "COMPLETED"
                              ? "View"
                              : (statusById[t.id] ?? t.status) === "INCOMPLETE"
                                ? "Update"
                                : "Create"}
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <select
                  className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Rows per page"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={clampedPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {buildPagination(clampedPage, pageCount).map((it, idx) =>
                    it === "ellipsis" ? (
                      <span
                        key={`e_${idx}`}
                        className="px-1 text-sm text-gray-500"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={it}
                        type="button"
                        className={
                          it === clampedPage
                            ? "h-8 min-w-8 rounded-md border border-gray-300 bg-gray-100 px-2 text-sm text-gray-900"
                            : "h-8 min-w-8 rounded-md border border-transparent bg-white px-2 text-sm text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                        }
                        onClick={() => setPage(it)}
                      >
                        {it}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={clampedPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-md border border-gray-200 bg-white px-6 py-4 text-center text-xs text-gray-500">
          © 2024 tentwenty. All rights reserved.
        </div>
      </main>

      <Modal
        open={open}
        title={editingTimesheet ? "Edit Timesheet" : "Add Timesheet"}
        onClose={() => {
          if (savingId) return;
          setOpen(false);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              disabled={!!savingId}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!!savingId}
              onClick={async () => {
                setFormError(null);

                const s = startDate.trim();
                const e = endDate.trim();
                if (!isValidIsoDate(s)) {
                  setFormError("Start date is required");
                  return;
                }
                if (!isValidIsoDate(e)) {
                  setFormError("End date is required");
                  return;
                }
                if (s > e) {
                  setFormError("Start date must be before end date");
                  return;
                }

                setSavingId(editingTimesheet ? editingTimesheet.id : "new");
                try {
                  if (editingTimesheet) {
                    await update(editingTimesheet.id, {
                      startDate: s,
                      endDate: e,
                    });
                  } else {
                    await create({ startDate: s, endDate: e });
                  }
                  setOpen(false);
                } catch (err) {
                  const message =
                    typeof err === "object" && err && "message" in err
                      ? String((err as { message: unknown }).message)
                      : "Failed to save timesheet";
                  setFormError(message);
                } finally {
                  setSavingId(null);
                }
              }}
            >
              {savingId ? "Saving..." : "Save"}
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
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-gray-600">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <div className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 shadow-sm grid items-center">
              Calculated from tasks
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
