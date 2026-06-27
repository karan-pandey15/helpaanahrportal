import { createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";
import { clearTokens } from "../../utils/tokenStorage";

export const loginUser = createAsyncThunk(
  "auth/login",
  async (data, { rejectWithValue }) => {
    try {
      return await authService.login(data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.logout();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  },
);

export const refreshAuth = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      return await authService.refreshToken();
    } catch (err) {
      // Refresh token is gone/invalid — drop the stale tokens so we don't keep
      // retrying a dead session on every reload.
      clearTokens();
      return rejectWithValue(err.response?.data?.message);
    }
  },
);
