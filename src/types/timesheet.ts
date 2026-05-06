export type TimesheetStatus = "COMPLETED" | "INCOMPLETE" | "MISSING";

export type Timesheet = {
  id: string;
  userId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: TimesheetStatus;
  createdAt: string;
  updatedAt: string;
};

export type ListTimesheetsResponse = {
  items: Timesheet[];
};
