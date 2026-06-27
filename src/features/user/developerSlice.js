import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import addDeveloperService from "./addDeveloperService";

export const fetchDeveloperData = createAsyncThunk(
  "developer/fetchDeveloperData",
  async (_, { rejectWithValue }) => {
    try {
      return await addDeveloperService.fetchDeveloperData();
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  },
);

const developerSlice = createSlice({
  name: "developer",
  initialState: {
    developers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeveloperData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeveloperData.fulfilled, (state, { payload }) => {
        console.log("Fetched developer data:", payload?.developers);
        state.loading = false;
        state.developers = (payload?.developers || []).map((u) => ({
          ...u,
          _id: u._id || u.id,
          __justAdded: false,
        }));
      })
      .addCase(fetchDeveloperData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default developerSlice.reducer;
