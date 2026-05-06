import { apiFetch } from "@/services/http";
import type { ListTimesheetsResponse, Timesheet, TimesheetStatus } from "@/types/timesheet";

type CreateBody = {
  startDate: string;
  endDate: string;
  status?: TimesheetStatus;
};

type CreateResponse = { item: Timesheet };
type PatchResponse = { item: Timesheet };
type GetResponse = { item: Timesheet };

export async function listTimesheets(): Promise<Timesheet[]> {
  const data = await apiFetch<ListTimesheetsResponse>("/api/timesheets");
  return data.items;
}

export async function getTimesheet(id: string): Promise<Timesheet> {
  const data = await apiFetch<GetResponse>(`/api/timesheets/${id}`);
  return data.item;
}

export async function createTimesheet(body: CreateBody): Promise<Timesheet> {
  const data = await apiFetch<CreateResponse>("/api/timesheets", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.item;
}

export async function patchTimesheet(
  id: string,
  patch: Partial<CreateBody>,
): Promise<Timesheet> {
  const data = await apiFetch<PatchResponse>(`/api/timesheets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.item;
}

export async function deleteTimesheet(id: string): Promise<void> {
  await apiFetch<{ ok: true }>(`/api/timesheets/${id}`, { method: "DELETE" });
}
