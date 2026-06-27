import api from "@/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import addUserService from "./addUserService";

// ADD USER
export const addUser = createAsyncThunk(
  "users/add",
  async (data, { rejectWithValue }) => {
    try {
      return await addUserService.addUser(data); // { message, user }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// GET USERS
export const getAllUsers = createAsyncThunk(
  "users/getAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/user/users");
      return res.data.users;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/user/updateuser/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/user/deleteuser/${id}`);
      return { userId: id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const approveUser = createAsyncThunk(
  "users/approve",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/user/approve/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

export const rejectUser = createAsyncThunk(
  "users/reject",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/user/reject/${id}`, { reason });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);
