// Ruta relativa: funciona en desarrollo (Vite redirige /api al backend) y cuando el backend
// sirve la página compilada, incluso desde un enlace público (túnel o servidor en la nube)
export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};