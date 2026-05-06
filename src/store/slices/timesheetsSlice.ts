import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as timesheetService from "@/services/timesheets";
import type { Timesheet, TimesheetStatus } from "@/types/timesheet";
import { showToast } from "@/lib/toastUtils";

export type CreateTimesheetDraft = {
  startDate: string;
  endDate: string;
  status?: TimesheetStatus;
};

export interface TimesheetsState {
  items: Timesheet[];
  isLoading: boolean;
  error: { message: string; status?: number } | null;
}

const initialState: TimesheetsState = {
  items: [],
  isLoading: false,
  error: null,
};

export const fetchTimesheets = createAsyncThunk(
  "timesheets/fetchTimesheets",
  async (_, { rejectWithValue }) => {
    try {
      return await timesheetService.listTimesheets();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load timesheets";
      const status =
        err && typeof err === "object" && "status" in err
          ? (err as { status: number }).status
          : undefined;
      return rejectWithValue({ message, status });
    }
  }
);

export const createTimesheet = createAsyncThunk(
  "timesheets/createTimesheet",
  async (draft: CreateTimesheetDraft, { rejectWithValue }) => {
    try {
      const created = await timesheetService.createTimesheet(draft);
      showToast("Timesheet created successfully!", "success");
      return created;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create timesheet";
      showToast(message, "error");
      return rejectWithValue({ message });
    }
  }
);

export const updateTimesheet = createAsyncThunk(
  "timesheets/updateTimesheet",
  async (
    { id, patch }: { id: string; patch: Partial<CreateTimesheetDraft> },
    { rejectWithValue }
  ) => {
    try {
      const updated = await timesheetService.patchTimesheet(id, patch);
      showToast("Timesheet updated successfully!", "success");
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update timesheet";
      showToast(message, "error");
      return rejectWithValue({ message });
    }
  }
);

export const deleteTimesheet = createAsyncThunk(
  "timesheets/deleteTimesheet",
  async (id: string, { rejectWithValue }) => {
    try {
      await timesheetService.deleteTimesheet(id);
      showToast("Timesheet deleted successfully!", "success");
      return id;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete timesheet";
      showToast(message, "error");
      return rejectWithValue({ message });
    }
  }
);

const timesheetsSlice = createSlice({
  name: "timesheets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimesheets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimesheets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchTimesheets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as { message: string; status?: number };
      })
      .addCase(createTimesheet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTimesheet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = [...state.items, action.payload].sort(
          (a, b) => a.weekNumber - b.weekNumber
        );
      })
      .addCase(createTimesheet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as { message: string };
      })
      .addCase(updateTimesheet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTimesheet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.map((x) =>
          x.id === action.payload.id ? action.payload : x
        );
      })
      .addCase(updateTimesheet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as { message: string };
      })
      .addCase(deleteTimesheet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTimesheet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = state.items.filter((x) => x.id !== action.payload);
      })
      .addCase(deleteTimesheet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as { message: string };
      });
  },
});

export default timesheetsSlice.reducer;
