import axios from "../../api/axios";

export const fetchInterviewsList = async (params = {}) => {
  const {
    round,
    status,
    search,
    scope,
    dateFilter,
    date,
    sort,
    sortBy,
    sortDir,
    page = 1,
    limit = 10,
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (round && round !== "any" && round !== "all")
    qs.set("round", round);
  if (status && status !== "all") qs.set("status", status);
  if (search && search.trim()) qs.set("search", search.trim());
  if (scope) qs.set("scope", scope);
  if (date) qs.set("date", date);
  else if (dateFilter && dateFilter !== "all") qs.set("dateFilter", dateFilter);
  if (sortBy) {
    qs.set("sortBy", sortBy);
    qs.set("sortDir", sortDir === "asc" ? "asc" : "desc");
  } else if (sort) {
    qs.set("sort", sort);
  }

  const { data } = await axios.get(`/interview/list?${qs.toString()}`);
  return data;
};

export const createInterviewService = async (payload) => {
  const { data } = await axios.post("/interview/create", payload);
  return data;
};

// A single candidate/interview record by id. Returns { interview }.
export const getInterviewByIdService = async (id) => {
  const { data } = await axios.get(`/interview/${id}`);
  return data;
};

// Full activity/change timeline for a candidate. Reused for both the round
// history (round-change entries) and the raw updates feed. Returns
// { activities, candidateName, count }.
export const fetchInterviewActivityService = async (id) => {
  const { data } = await axios.get(`/activity/interview/${id}`);
  return data;
};

export const updateInterviewStatus = async (id, payload) => {
  const { data } = await axios.patch(`/interview/${id}`, payload);
  return data;
};

export const deleteInterviewService = async (id) => {
  const { data } = await axios.delete(`/interview/${id}`);
  return data;
};

export const getUsersByRole = async (role) => {
  const { data } = await axios.get(`/user/get-user-by-role?role=${role}`);
  return data;
};

export const assignInterviewer = async (candidateId, interviewerId) => {
  const { data } = await axios.patch(`/interview/${candidateId}`, {
    assignedInterviewer: interviewerId,
  });
  return data;
};

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
