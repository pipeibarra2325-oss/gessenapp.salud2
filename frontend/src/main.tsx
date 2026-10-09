import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Clases de Tailwind que no estaban en el CSS precompilado (ver scripts/generar-utilidades-extra.mjs)
import "./styles/utilidades-extra.css";
import { vigilarSesionCerrada } from "./utils/sesionCerrada";

vigilarSesionCerrada();

createRoot(document.getElementById("root")!).render(<App />);
  