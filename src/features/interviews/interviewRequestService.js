import axios from "axios";
import api from "../../api/axios";

// Bare axios instance for the PUBLIC (candidate-facing) endpoints. The shared
// `api` instance must not be used here: its 401 interceptor tries a session
// refresh and redirects to /login, but the candidate has no account — an
// invalid/expired link should just show an error on the public page.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

// ----- Public (tokenized, no auth) -----

export const getPublicInterviewByToken = async (token) => {
  const { data } = await publicApi.get(
    `/interview-request/public/${encodeURIComponent(token)}`,
  );
  return data;
};

export const submitPublicInterviewRequest = async (token, payload) => {
  const { data } = await publicApi.post(
    `/interview-request/public/${encodeURIComponent(token)}/request`,
    payload,
  );
  return data;
};

// ----- Portal (HR & admin) -----

export const fetchInterviewRequests = async (params = {}) => {
  const { status, page = 1, limit = 20 } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (status) qs.set("status", status);
  const { data } = await api.get(`/interview-request/list?${qs.toString()}`);
  return data;
};

export const fetchPendingRequestCount = async () => {
  const { data } = await api.get("/interview-request/pending-count");
  return data;
};

export const resolveInterviewRequestService = async (id, action) => {
  const { data } = await api.patch(`/interview-request/${id}/resolve`, {
    action,
  });
  return data;
};
