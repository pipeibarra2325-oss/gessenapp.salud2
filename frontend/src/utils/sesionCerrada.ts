import { toast } from "sonner";

// Si el servidor responde 401 a una solicitud con sesión iniciada (contraseña cambiada en otro dispositivo,
// cuenta eliminada o token vencido), se cierra la sesión en el navegador y se explica el motivo.
export function vigilarSesionCerrada() {
  const fetchOriginal = window.fetch.bind(window);
  let avisado = false;
  window.fetch = async (entrada, opciones) => {
    const res = await fetchOriginal(entrada, opciones);
    const url = typeof entrada === "string" ? entrada : entrada instanceof URL ? entrada.href : entrada.url;
    if (res.status === 401 && url.includes("/api/") && !url.includes("/api/login") && sessionStorage.getItem("token")) {
      const datos = await res.clone().json().catch(() => null);
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      if (!avisado) {
        avisado = true;
        toast.error("Tu sesión se cerró", { description: datos?.error || "Inicia sesión de nuevo para continuar." });
        setTimeout(() => { window.location.href = "/"; }, 2500);
      }
    }
    return res;
  };
}
