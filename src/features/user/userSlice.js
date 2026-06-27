import { createSlice } from "@reduxjs/toolkit";
import {
  addUser,
  getAllUsers,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
} from "./userThunks";

const initialState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUserState: () => initialState,
  },
  extraReducers: (builder) => {
    builder

      .addCase(getAllUsers.pending, (s) => {
        s.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.users = payload.map((u) => ({
          ...u,
          _id: u._id || u.id,
          __justAdded: false,
        }));
      })

      .addCase(getAllUsers.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })

      .addCase(addUser.pending, (s) => {
        s.loading = true;
      })
      .addCase(addUser.fulfilled, (s, { payload }) => {
        s.loading = false;
        s.lastAddedUser = payload.user;
      })
      .addCase(addUser.rejected, (s, { payload }) => {
        s.loading = false;
        s.error = payload;
      })

      .addCase(updateUser.fulfilled, (s, { payload }) => {
        s.loading = false;

        const updatedUser = payload.user || payload.updatedUser || payload;

        if (updatedUser?._id) {
          const index = s.users.findIndex((u) => u._id === updatedUser._id);
          if (index !== -1) {
            s.users[index] = updatedUser;
          }
        }
      })

      .addCase(deleteUser.fulfilled, (s, { payload }) => {
        s.users = s.users.filter((u) => u._id !== payload.userId);
      })

      .addCase(approveUser.fulfilled, (s, { payload }) => {
        const approvedUser = payload.user;
        const index = s.users.findIndex((u) => u._id === approvedUser?._id);
        if (index !== -1) {
          s.users[index] = approvedUser;
        }
      })

      .addCase(rejectUser.fulfilled, (s, { payload }) => {
        const rejectedUser = payload.user;
        const index = s.users.findIndex((u) => u._id === rejectedUser?._id);
        if (index !== -1) {
          s.users[index] = rejectedUser;
        }
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
