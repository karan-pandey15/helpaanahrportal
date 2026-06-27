import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createStatus, getAllStatuses, updateStatus, deleteStatus } from "./statusService";
import { updateInterview } from "../interviews/interviewSlice";

export const fetchStatuses = createAsyncThunk(
  "status/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAllStatuses();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch statuses"
      );
    }
  }
);

export const addStatus = createAsyncThunk(
  "status/create",
  async (statusData, { rejectWithValue }) => {
    try {
      const response = await createStatus(statusData);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create status"
      );
    }
  }
);

export const editStatus = createAsyncThunk(
  "status/update",
  async ({ statusId, statusData }, { rejectWithValue }) => {
    try {
      const response = await updateStatus(statusId, statusData);
      return { statusId, ...response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);
export const editStatusAndSyncInterviews = createAsyncThunk(
  "status/editAndSyncInterviews",
  async ({ statusId, newStatus }, { dispatch, getState }) => {
    // 1️⃣ Update status
    const res = await updateStatus(statusId, { status: newStatus });

    // 2️⃣ Find old status value
    const { statuses } = getState().status;
    const oldStatus = statuses.find((s) => s._id === statusId)?.status;

    if (!oldStatus) return res;

    // 3️⃣ Update ALL interviews using old status
    const interviews = getState().interviews?.interviews || [];

    for (const interview of interviews) {
      if (interview.status === oldStatus) {
        await dispatch(
          updateInterview({
            id: interview._id,
            payload: { status: newStatus },
          })
        );
      }
    }

    return res;
  }
);
export const removeStatus = createAsyncThunk(
  "status/delete",
  async (statusId, { rejectWithValue }) => {
    try {
      const response = await deleteStatus(statusId);
      return { statusId, ...response };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete status"
      );
    }
  }
);

const statusSlice = createSlice({
  name: "status",
  initialState: {
    statuses: [],
    loading: false,
    fetchLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    resetStatus: (state) => {
      state.loading = false;
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch statuses
      .addCase(fetchStatuses.pending, (state) => {
        state.fetchLoading = true;
        state.error = null;
      })
      .addCase(fetchStatuses.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.statuses = action.payload.statuses || [];
      })
      .addCase(fetchStatuses.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.payload;
      })
      // Add status
      .addCase(addStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Status Added Successfully";
        if (action.payload.status) {
          state.statuses.push(action.payload.status);
        }
      })
      .addCase(addStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // // Update status
      // .addCase(editStatus.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(editStatus.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.success = "Status Updated Successfully";

      //   if (action.payload.status) {
      //     state.statuses = state.statuses.map((s) =>
      //       s._id === action.payload.statusId
      //         ? normalizeStatus(action.payload.status)
      //         : s,
      //     );
      //   }
      // })

      // .addCase(editStatus.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.payload;
      // })
      .addCase(editStatusAndSyncInterviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(editStatusAndSyncInterviews.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Status Updated Successfully";

        const updated = action.payload?.status;
        if (!updated) return;

        state.statuses = state.statuses.map((s) =>
          (s._id || s.id) === (updated._id || updated.id) ? updated : s,
        );
      })

      .addCase(editStatusAndSyncInterviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update status";
      })

      .addCase(removeStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Don't set success for delete - handled manually in component
        state.statuses = state.statuses.filter(
          (status) => status._id !== action.payload.statusId,
        );
      })
      .addCase(removeStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetStatus } = statusSlice.actions;
export default statusSlice.reducer;
