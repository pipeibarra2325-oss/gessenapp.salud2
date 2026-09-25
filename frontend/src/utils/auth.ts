import { API_URL } from "../config";

// URL base para todas las peticiones
export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${cleanEndpoint}`;
};

export const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No se encontró token en sessionStorage");
  }

  return headers;
};

export const getAuthHeadersWithContent = () => ({
  ...getAuthHeaders(),
  "Content-Type": "application/json",
});

export const isAdmin = (): boolean => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const role = Number(user?.role || user?.id_rol || 2);
  return role === 1;
};