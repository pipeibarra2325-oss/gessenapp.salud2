import { Navigate } from "react-router-dom";

interface AdminRouteProps {
  user: any;
  loading?: boolean;
  children: React.ReactNode;
}

export const AdminRoute = ({ user, loading = false, children }: AdminRouteProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando panel de administración...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const role = Number(user?.role || user?.id_rol || user?.id_role || user?.rol || 2);

  if (role !== 1) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};