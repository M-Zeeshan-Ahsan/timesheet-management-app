"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { User } from "@/types/auth";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { fetchMe, login as loginThunk, logout as logoutThunk } from "@/store/slices/authSlice";

export type UseAuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

export function useAuth(): UseAuthState {
  const dispatch = useAppDispatch();
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  const refresh = useCallback(async () => {
    await dispatch(fetchMe()).unwrap();
  }, [dispatch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    return await dispatch(loginThunk({ email, password })).unwrap();
  }, [dispatch]);

  const logout = useCallback(async () => {
    await dispatch(logoutThunk()).unwrap();
  }, [dispatch]);

  return useMemo(
    () => ({ user, isLoading, error, refresh, login, logout }),
    [user, isLoading, error, refresh, login, logout],
  );
}
