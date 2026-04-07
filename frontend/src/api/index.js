import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

/* ─── Users ─── */
export const createUser = (data) => api.post("/users", data);
export const getUsers = (params) => api.get("/users", { params });
export const getUserById = (id) => api.get(`/users/${id}`);

/* ─── Applications ─── */
export const applyForLoan = (data) => api.post("/apply", data);
export const getApplications = (params) =>
  api.get("/applications", { params });
export const getApplicationById = (id) => api.get(`/application/${id}`);

/* ─── Prediction ─── */
export const predictLoan = (applicationId) =>
  api.post("/predict", { application_id: applicationId });

export default api;
