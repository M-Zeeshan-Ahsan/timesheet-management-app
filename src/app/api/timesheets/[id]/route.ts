import { NextResponse } from "next/server";
import { getUserIdFromRequestCookies } from "@/lib/auth";
import {
  deleteTimesheet,
  listTimesheets,
  updateTimesheet,
} from "@/lib/timesheets-store";
import type { TimesheetStatus } from "@/types/timesheet";

type PatchBody = {
  startDate?: string;
  endDate?: string;
  status?: TimesheetStatus;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequestCookies();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params.id;

  const existing = listTimesheets(userId).find((t) => t.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item: existing });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequestCookies();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params.id;

  const existing = listTimesheets(userId).find((t) => t.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody = {};
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: PatchBody = {};
  if (typeof body.startDate === "string") {
    const startDate = body.startDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
    }
    patch.startDate = startDate;
  }
  if (typeof body.endDate === "string") {
    const endDate = body.endDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
    }
    patch.endDate = endDate;
  }
  if (typeof body.status === "string") {
    if (!["COMPLETED", "INCOMPLETE", "MISSING"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }

  const nextStartDate = patch.startDate ?? existing.startDate;
  const nextEndDate = patch.endDate ?? existing.endDate;
  if (nextStartDate > nextEndDate) {
    return NextResponse.json(
      { error: "startDate must be before endDate" },
      { status: 400 },
    );
  }

  const updated = updateTimesheet(userId, id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequestCookies();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const id = params.id;

  const ok = deleteTimesheet(userId, id);

  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
