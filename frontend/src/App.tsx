import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { RecipesSection } from './components/RecipesSection';
import { TipsSection } from './components/TipsSection';
import { DiabetesInfoSection } from './components/DiabetesInfoSection';
import { Footer } from './components/Footer';
import { Toaster } from "sonner";

import { apiUrl } from './utils/auth';
// El panel del profesional (con sus gráficas y el generador de PDF) se descarga solo cuando se abre:
// así la página de inicio carga mucho menos JavaScript, sobre todo en el celular
const AdminLayout = lazy(() => import('./admin/layout'));
const AdminDashboard = lazy(() => import("./admin/page"));
const UsuariosPage = lazy(() => import("./admin/usuarios/page"));
const PlatillosPage = lazy(() => import("./admin/platillos/page"));
const ProgresoPage = lazy(() => import("./admin/progreso/page"));
const AdministradoresPage = lazy(() => import("./admin/administradores/page"));
const ConfiguracionPage = lazy(() => import("./admin/configuracion/page"));
const LogsPage = lazy(() => import("./admin/logs/page"));
const Cargando = () => <div className="p-10 text-center text-gray-500">Cargando...</div>;
import { AdminRoute } from "./components/AdminRoute";

function AppContent() {
  // La sesión se restaura antes del primer dibujo: así la portada aparece de inmediato,
  // sin la pantalla intermedia de «Cargando aplicación...»
  const [sesionInicial] = useState(() => {
    try {
      const guardado = sessionStorage.getItem("user");
      if (!guardado) return null;
      const u = JSON.parse(guardado);
      const role = Number(u.id_rol || u.role || u.id_role || 2);
      return { ...u, id: u.id ?? u.id_usuario, role, id_rol: role };
    } catch {
      sessionStorage.clear();
      return null;
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(sesionInicial));
  const [user, setUser] = useState<any>(sesionInicial);
  const [departments, setDepartments] = useState<any[]>([]);
  const isLoading = false;

  const navigate = useNavigate();
  const location = useLocation();

  // Redirección inteligente según rol y ruta actual
  useEffect(() => {
    if (isLoading) return;

    const currentPath = location.pathname;
    const role = Number(user?.role || user?.id_rol || user?.id_role || 2);

    if (currentPath.startsWith('/admin') && role !== 1) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);

  const handleLogin = (userData: any) => {
    const roleValue = Number(userData.id_rol || userData.role || userData.id_role || 2);
    const fixedUser = { ...userData, id: userData.id ?? userData.id_usuario, role: roleValue, id_rol: roleValue };

    sessionStorage.setItem("user", JSON.stringify(fixedUser));
    setUser(fixedUser);
    setIsLoggedIn(true);

    if (roleValue === 1) {
      navigate("/admin", { replace: true });
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    setIsLoggedIn(false);
    navigate("/", { replace: true });
  };

  // La región llega con el inicio de sesión; si falta (sesiones antiguas), se busca por departamento
  const region = useMemo(() => {
    if (user?.region) return user.region;
    if (!user?.department) return null;
    const dept = departments.find(d => d.nombre_departamento === user.department);
    return dept?.region || null;
  }, [user?.region, user?.department, departments]);

  useEffect(() => {
    fetch(apiUrl('/departamentos'))
      .then(r => (r.ok ? r.json() : []))
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Cargando aplicación...</div>;
  }

  return (
    <Routes>
      {/* RUTAS ADMIN - Deben ir ANTES de la ruta catch-all */}
      <Route
        path="/admin"
        element={
          <AdminRoute user={user} loading={isLoading}>
            <Suspense fallback={<Cargando />}>
              <AdminLayout onLogout={handleLogout} />
            </Suspense>
          </AdminRoute>
        }
      >
        <Route index element={<Suspense fallback={<Cargando />}><AdminDashboard /></Suspense>} />
        <Route path="usuarios" element={<Suspense fallback={<Cargando />}><UsuariosPage /></Suspense>} />
        <Route path="platillos" element={<Suspense fallback={<Cargando />}><PlatillosPage /></Suspense>} />
        <Route path="progreso" element={<Suspense fallback={<Cargando />}><ProgresoPage /></Suspense>} />
        <Route path="administradores" element={<Suspense fallback={<Cargando />}><AdministradoresPage /></Suspense>} />
        <Route path="logs" element={<Suspense fallback={<Cargando />}><LogsPage /></Suspense>} />
        <Route path="configuracion" element={<Suspense fallback={<Cargando />}><ConfiguracionPage /></Suspense>} />
      </Route>

      {/* RUTAS PÚBLICAS */}
      <Route
        path="/*"
        element={
          <div className="min-h-screen bg-white">
            <Header
              isLoggedIn={isLoggedIn}
              user={user}
              onLogout={handleLogout}
              onLogin={handleLogin}
            />
            {/* Región principal de la página (accesibilidad: lectores de pantalla) */}
            <main>
              <HeroSection isLoggedIn={isLoggedIn} user={user} region={region} />
              <RecipesSection isLoggedIn={isLoggedIn} user={user} onLoginSuccess={handleLogin} />
              <TipsSection />
              <DiabetesInfoSection />
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-center" richColors />
      <AppContent />
    </Router>
  );
}