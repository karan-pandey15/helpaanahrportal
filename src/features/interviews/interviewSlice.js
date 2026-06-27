import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";
import * as interviewService from "./interviewService";

export const createInterview = createAsyncThunk(
  "interviews/createInterview",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await interviewService.createInterviewService(payload);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to create interview";
      return rejectWithValue(msg);
    }
  }
);

export const fetchInterviews = createAsyncThunk(
  "interviews/fetchInterviews",
  async (params, { rejectWithValue }) => {
    try {
      const data = await interviewService.fetchInterviewsList(params);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to fetch interviews";
      return rejectWithValue(msg);
    }
  }
);

export const deleteInterview = createAsyncThunk(
  "interviews/deleteInterview",
  async (id, { rejectWithValue }) => {
    try {
      const data = await interviewService.deleteInterviewService(id);
      return { id, data };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to delete interview";
      return rejectWithValue(msg);
    }
  }
);

export const fetchUsersByRole = createAsyncThunk(
  "interviews/fetchUsersByRole",
  async (role, { rejectWithValue }) => {
    try {
      const data = await interviewService.getUsersByRole(role);
      return data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Failed to fetch users";
      return rejectWithValue(msg);
    }
  },
);

export const assignInterviewer = createAsyncThunk(
  "interviews/assignInterviewer",
  async ({ candidateId, interviewerId }, { rejectWithValue }) => {
    try {
      const data = await interviewService.assignInterviewer(
        candidateId,
        interviewerId
      );

      return {
        candidateId,
        interview: data.interview || data,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to assign interviewer"
      );
    }
  }
);

export const checkEmail = async (email) => {
  const { data } = await axios.post("/interview/check-email", {
    email,
  });
  return data;
};

export const checkPhone = async (phone) => {
  const { data } = await axios.post("/interview/check-phone", {
    phone,
  });
  return data;
};

export const updateInterview = createAsyncThunk(
  "interviews/updateInterview",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await interviewService.updateInterviewStatus(id, payload);
      return data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Failed to update interview"
      );
    }
  }
)


const initialState = {
  loading: false,
  fetchLoading: false,
  error: null,
  success: null,
  interviews: [],
  interviewers: [],
  usersByRole: [],
  roundCounts: {},
  currentPage: 1,
  totalPages: 1,
  count: 0,
  activeTab: "1st round",
  limit: 10,
};

const interviewsSlice = createSlice({
  name: "interviews",
  initialState,
  reducers: {
    reset(state) {
      state.loading = false;
      state.error = null;
      state.success = null;
    },
    setPagination(state, action) {
      const { page, activeTab, limit } = action.payload;
      if (page !== undefined) state.currentPage = page;
      if (activeTab !== undefined) state.activeTab = activeTab;
      if (limit !== undefined) state.limit = limit;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createInterview.fulfilled, (state, action) => {
        state.loading = false;
        const interview = action.payload?.interview;
        if (interview) {
          state.interviews.push({
            ...interview,
            __justAdded: true,
          });
        }
        state.success = "Interview Schedule Successfully";
      })
      .addCase(createInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInterviews.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.interviews = action.payload?.interviews || [];
        state.interviewers = action.payload?.interviewers || [];
        state.roundCounts = action.payload?.roundCounts || {};
        state.currentPage = action.payload?.currentPage || 1;
        state.totalPages = action.payload?.totalPages || 1;
        state.count = action.payload?.count || 0;
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInterview.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload?.id;
        if (id) {
          state.interviews = state.interviews.filter((i) => i._id !== id);
        }
        state.success = action.payload?.data;
      })
      .addCase(deleteInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUsersByRole.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.usersByRole = action.payload?.users || action.payload?.data || [];
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload;
      })
      .addCase(assignInterviewer.pending, (state) => {
        state.loading = true;
      })
      .addCase(assignInterviewer.fulfilled, (state, action) => {
        state.loading = false;

        const { candidateId, interview } = action.payload || {};
        if (!candidateId || !interview) return;

        const idx = state.interviews.findIndex((i) => i._id === candidateId);

        if (idx !== -1) {
          state.interviews[idx] = {
            ...state.interviews[idx],
            assignedInterviewer: interview.assignedInterviewer,
          };
        }

        state.success = "Interviewer Assigned Successfully";
      })

      .addCase(assignInterviewer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateInterview.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateInterview.fulfilled, (state, action) => {
        state.loading = false;

        const updated = action.payload?.interview;
        if (!updated) return;

        const index = state.interviews.findIndex((i) => i._id === updated._id);

        if (index === -1) return;

        const prev = state.interviews[index];

        const IGNORE_KEYS = ["updatedAt", "createdAt", "__v"];

        const changedKeys = Object.keys(updated).filter((key) => {
          if (IGNORE_KEYS.includes(key)) return false;
          return updated[key] !== prev[key];
        });

        const onlyStatusChanged =
          changedKeys.length === 1 && changedKeys[0] === "status";

        const normalizeAssignedInterviewer = (value) => {
          if (!value) return value;
          if (typeof value === "string") return value;
          return value._id;
        };

        state.interviews[index] = {
          ...prev,
          ...updated,
          assignedInterviewer: normalizeAssignedInterviewer(
            updated.assignedInterviewer ?? prev.assignedInterviewer,
          ),
        };


        state.success = onlyStatusChanged
          ? "Status Updated Successfully"
          : "Interview Updated Successfully";
      })

      .addCase(updateInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { reset, setPagination } = interviewsSlice.actions;
export default interviewsSlice.reducer;
