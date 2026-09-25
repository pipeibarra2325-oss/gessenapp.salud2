export const API_URL = "http://127.0.0.1:5000/api";

export const getAuthHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};