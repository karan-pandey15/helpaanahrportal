import axios from "../../api/axios";

export const createStatus = async (statusData) => {
  const { data } = await axios.post("/status/create", statusData);
  return data;
};

export const getAllStatuses = async () => {
  const { data } = await axios.get("/status");
  return data;
};

export const updateStatus = async (statusId, statusData) => {
  const { data } = await axios.put(`/status/${statusId}`, statusData);
  return data;
};

export const deleteStatus = async (statusId) => {
  const { data } = await axios.delete(`/status/${statusId}`);
  return data;
};
