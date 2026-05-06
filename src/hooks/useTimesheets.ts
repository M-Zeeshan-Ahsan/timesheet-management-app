"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { Timesheet, TimesheetStatus } from "@/types/timesheet";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  fetchTimesheets,
  createTimesheet as createTimesheetThunk,
  updateTimesheet as updateTimesheetThunk,
  deleteTimesheet as deleteTimesheetThunk,
  type CreateTimesheetDraft,
} from "@/store/slices/timesheetsSlice";

export type TimesheetsError = { message: string; status?: number } | null;

export type UseTimesheetsState = {
  items: Timesheet[];
  isLoading: boolean;
  error: TimesheetsError;
  refresh: () => Promise<void>;
  create: (draft: CreateTimesheetDraft) => Promise<void>;
  update: (id: string, patch: Partial<CreateTimesheetDraft>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useTimesheets(): UseTimesheetsState {
  const dispatch = useAppDispatch();
  const { items, isLoading, error } = useAppSelector(
    (state) => state.timesheets,
  );

  const refresh = useCallback(async () => {
    await dispatch(fetchTimesheets()).unwrap();
  }, [dispatch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (draft: CreateTimesheetDraft) => {
      await dispatch(createTimesheetThunk(draft)).unwrap();
    },
    [dispatch],
  );

  const update = useCallback(
    async (id: string, patch: Partial<CreateTimesheetDraft>) => {
      await dispatch(updateTimesheetThunk({ id, patch })).unwrap();
    },
    [dispatch],
  );

  const remove = useCallback(
    async (id: string) => {
      await dispatch(deleteTimesheetThunk(id)).unwrap();
    },
    [dispatch],
  );

  return useMemo(
    () => ({ items, isLoading, error, refresh, create, update, remove }),
    [items, isLoading, error, refresh, create, update, remove],
  );
}
