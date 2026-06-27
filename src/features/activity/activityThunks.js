import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/api/axios";

/* ================= USER ACTIVITY ================= */
export const fetchUserActivity = createAsyncThunk(
  "activity/fetchUserActivity",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/activity/user/${userId}`);
      return res.data.activities;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load user activity"
      );
    }
  }
);

/* ================= INTERVIEW ACTIVITY ================= */
export const fetchInterviewActivity = createAsyncThunk(
  "activity/fetchInterviewActivity",
  async (interviewId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/activity/interview/${interviewId}`);
      return res.data.activities;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load interview activity"
      );
    }
  }
);
