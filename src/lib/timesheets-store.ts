import type { Timesheet, TimesheetStatus } from "@/types/timesheet";

type CreateTimesheetInput = {
  userId: string;
  startDate: string;
  endDate: string;
  status?: TimesheetStatus;
};

type UpdateTimesheetInput = Partial<
  Pick<Timesheet, "startDate" | "endDate" | "status">
>;

const timesheets: Timesheet[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function seedForUser(userId: string) {
  if (timesheets.some((e) => e.userId === userId)) return;

  const createdAt = nowIso();
  const seeded: Array<
    Pick<Timesheet, "weekNumber" | "startDate" | "endDate" | "status">
  > = [
    {
      weekNumber: 1,
      startDate: "2024-01-01",
      endDate: "2024-01-05",
      status: "COMPLETED",
    },
    {
      weekNumber: 2,
      startDate: "2024-01-08",
      endDate: "2024-01-12",
      status: "COMPLETED",
    },
    {
      weekNumber: 3,
      startDate: "2024-01-15",
      endDate: "2024-01-19",
      status: "INCOMPLETE",
    },
    {
      weekNumber: 4,
      startDate: "2024-01-22",
      endDate: "2024-01-26",
      status: "COMPLETED",
    },
    {
      weekNumber: 5,
      startDate: "2024-01-28",
      endDate: "2024-02-01",
      status: "MISSING",
    },
  ];

  for (const s of seeded) {
    timesheets.push({
      id: `ts_${crypto.randomUUID()}`,
      userId,
      weekNumber: s.weekNumber,
      startDate: s.startDate,
      endDate: s.endDate,
      status: s.status,
      createdAt,
      updatedAt: createdAt,
    });
  }
}

export function listTimesheets(userId: string): Timesheet[] {
  seedForUser(userId);
  return timesheets
    .filter((e) => e.userId === userId)
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

function nextWeekNumberForUser(userId: string): number {
  const max = timesheets
    .filter((t) => t.userId === userId)
    .reduce((m, t) => Math.max(m, t.weekNumber), 0);
  return max + 1;
}

export function createTimesheet(input: CreateTimesheetInput): Timesheet {
  seedForUser(input.userId);

  const createdAt = nowIso();
  const entry: Timesheet = {
    id: `ts_${crypto.randomUUID()}`,
    userId: input.userId,
    weekNumber: nextWeekNumberForUser(input.userId),
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status ?? "MISSING",
    createdAt,
    updatedAt: createdAt,
  };

  timesheets.push(entry);
  return entry;
}

export function updateTimesheet(
  userId: string,
  id: string,
  patch: UpdateTimesheetInput,
): Timesheet | null {
  const existing = timesheets.find((e) => e.id === id && e.userId === userId);
  if (!existing) return null;

  if (typeof patch.startDate === "string") existing.startDate = patch.startDate;
  if (typeof patch.endDate === "string") existing.endDate = patch.endDate;
  if (typeof patch.status === "string") existing.status = patch.status;
  existing.updatedAt = nowIso();

  return existing;
}

export function deleteTimesheet(userId: string, id: string): boolean {
  const index = timesheets.findIndex((e) => e.id === id && e.userId === userId);
  if (index === -1) return false;
  timesheets.splice(index, 1);
  return true;
}
