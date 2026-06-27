import api from "../../api/axios";

const addDeveloper = async (data) => {
  const res = await api.post("/developer/add-developer-email", data);
  return res.data;
};
// /api/v1/developer/add-developer-email
const fetchDeveloperData = async () => {
  const res = await api.get("/developer/fetch-developer-data");

  return res.data;
};

const resendDeveloper = async (id) => {
  const res = await api.post(`/developer/${id}/resend`);
  return res.data;
};

const deleteDeveloper = async (id) => {
  const res = await api.delete(`/developer/${id}`);
  return res.data;
};

const updateDeveloper = async (id, data) => {
  const res = await api.patch(`/developer/${id}`, data);
  return res.data;
};

const requestDeveloperEdit = async (id) => {
  const res = await api.post(`/developer/${id}/request-edit`);
  return res.data;
};

export {
  addDeveloper,
  fetchDeveloperData,
  resendDeveloper,
  deleteDeveloper,
  updateDeveloper,
  requestDeveloperEdit,
};

export default {
  addDeveloper,
  fetchDeveloperData,
  resendDeveloper,
  deleteDeveloper,
  updateDeveloper,
  requestDeveloperEdit,
};
