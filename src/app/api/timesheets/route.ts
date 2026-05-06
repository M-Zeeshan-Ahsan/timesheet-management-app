import { NextResponse } from "next/server";
import { getUserIdFromRequestCookies } from "@/lib/auth";
import { createTimesheet, listTimesheets } from "@/lib/timesheets-store";
import type { TimesheetStatus } from "@/types/timesheet";

type CreateBody = {
  startDate?: string;
  endDate?: string;
  status?: TimesheetStatus;
};

export async function GET() {
  const userId = await getUserIdFromRequestCookies();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ items: listTimesheets(userId) });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequestCookies();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody = {};
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const startDate =
    typeof body.startDate === "string" ? body.startDate.trim() : "";
  const endDate = typeof body.endDate === "string" ? body.endDate.trim() : "";
  const status = typeof body.status === "string" ? body.status : undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: "Invalid endDate" }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json(
      { error: "startDate must be before endDate" },
      { status: 400 },
    );
  }
  if (status && !["COMPLETED", "INCOMPLETE", "MISSING"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const created = createTimesheet({
    userId,
    startDate,
    endDate,
    status,
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
