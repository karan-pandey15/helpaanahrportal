import axios from "axios";

// Bare axios instance for the PUBLIC (developer-facing) onboarding endpoints.
// The shared `api` instance must not be used here: its 401 interceptor tries a
// session refresh and redirects to /login, but the developer has no portal
// account — an invalid/expired link should just show an error on the public
// page. No interceptors, no withCredentials.
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

export const getDeveloperByToken = async (token) => {
  const { data } = await publicApi.get(
    `/developer/public/${encodeURIComponent(token)}`,
  );
  return data;
};

export const submitDeveloperForm = async (token, formData) => {
  // Let axios set the multipart boundary — do NOT set Content-Type manually.
  const { data } = await publicApi.post(
    `/developer/public/${encodeURIComponent(token)}/submit`,
    formData,
  );
  return data;
};
