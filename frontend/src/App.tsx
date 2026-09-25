import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { RecipesSection } from './components/RecipesSection';
import { TipsSection } from './components/TipsSection';
import { DiabetesInfoSection } from './components/DiabetesInfoSection';
import { Footer } from './components/Footer';
import { Toaster } from "sonner";

import { apiUrl } from './utils/auth';
import AdminLayout from './admin/layout';
import AdminDashboard from "./admin/page";
import UsuariosPage from "./admin/usuarios/page";
import PlatillosPage from "./admin/platillos/page";
import ProgresoPage from "./admin/progreso/page";
import AdministradoresPage from "./admin/administradores/page";
import ConfiguracionPage from "./admin/configuracion/page";
import LogsPage from "./admin/logs/page";
import { AdminRoute } from "./components/AdminRoute";

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Restaurar sesión desde sessionStorage al cargar la aplicación
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const role = Number(parsedUser.id_rol || parsedUser.role || parsedUser.id_role || 2);
        const fixedUser = { ...parsedUser, id: parsedUser.id ?? parsedUser.id_usuario, role, id_rol: role };

        setUser(fixedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error al restaurar usuario:", e);
        sessionStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

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
            <AdminLayout onLogout={handleLogout} />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="platillos" element={<PlatillosPage />} />
        <Route path="progreso" element={<ProgresoPage />} />
        <Route path="administradores" element={<AdministradoresPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
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
            <HeroSection isLoggedIn={isLoggedIn} user={user} region={region} />
            <RecipesSection isLoggedIn={isLoggedIn} user={user} onLoginSuccess={handleLogin} />
            <TipsSection />
            <DiabetesInfoSection />
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