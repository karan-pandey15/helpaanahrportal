import axios from "axios";

// Relative base URL so the browser always talks to its OWN origin. Vite (dev)
// and Vercel rewrites (prod) forward /api/* to the backend, which keeps the
// auth cookie first-party. Falls back to VITE_API_URL only if explicitly set.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  withCredentials: true,
});

export default api;
