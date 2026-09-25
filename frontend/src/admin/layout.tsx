// src/admin/layout.tsx
import { SidebarAdmin } from "../components/admin/SidebarAdmin";
import { HeaderAdmin } from "../components/admin/HeaderAdmin";
import { Outlet } from "react-router-dom";

export default function AdminLayout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarAdmin />
      <div className="flex flex-col flex-1 overflow-hidden">
        <HeaderAdmin onLogout={onLogout} />
        <main className="flex-1 overflow-auto p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}