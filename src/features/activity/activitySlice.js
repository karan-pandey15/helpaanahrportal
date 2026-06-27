import { createSlice } from "@reduxjs/toolkit";
import {
  fetchUserActivity,
  fetchInterviewActivity,
} from "./activityThunks";

const activitySlice = createSlice({
  name: "activity",
  initialState: {
    activities: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearActivity: (state) => {
      state.activities = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ========== USER ACTIVITY ========== */
      .addCase(fetchUserActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchUserActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ========== INTERVIEW ACTIVITY ========== */
      .addCase(fetchInterviewActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviewActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchInterviewActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearActivity } = activitySlice.actions;
export default activitySlice.reducer;
