// src/admin/layout.tsx
import { useState } from "react";
import { SidebarAdmin } from "../components/admin/SidebarAdmin";
import { HeaderAdmin } from "../components/admin/HeaderAdmin";
import { Outlet } from "react-router-dom";

export default function AdminLayout({ onLogout }: { onLogout: () => void }) {
  // Menú lateral desplegable en el teléfono
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarAdmin abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <HeaderAdmin onLogout={onLogout} onMenu={() => setMenuAbierto(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
