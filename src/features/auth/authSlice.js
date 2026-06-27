import { createSlice } from "@reduxjs/toolkit";
import { loginUser, logoutUser, refreshAuth } from "./authThunks";

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
  initialized: false,
  lastLoginAt: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuth: () => initialState,
    clearMessages: (state) => {
      state.message = null;
      state.error = null;
    },
    // Mark the app's auth bootstrap as done without a network call — used on a
    // fresh visit when there's no stored refresh token to validate.
    markInitialized: (state) => {
      state.initialized = true;
    },
    // Update just the access token (used by the silent-refresh interceptor and
    // when the server hands back a renewed token via X-New-Access-Token).
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      if (action.payload) state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.error = null;
        state.message = action.payload.message || null;
        state.initialized = true;
        state.lastLoginAt = Date.now();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.log(action);
        state.message = action.payload || null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.message = null;
      })
      .addCase(refreshAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
      })
      .addCase(refreshAuth.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
      });
  },
});

export const { clearAuth, clearMessages, setAccessToken, markInitialized } =
  authSlice.actions;
export default authSlice.reducer;
