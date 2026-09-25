import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Save, Shield, Database, Bell, Palette } from "lucide-react";
import { getAuthHeaders, getAuthHeadersWithContent } from "../../utils/auth";
import { toast } from "sonner";
import { apiUrl } from "../../utils/auth";

export default function ConfiguracionPage() {
  const [form, setForm] = useState({
    appName: "GessenApp",
    idioma: "es",
    zona: "GMT-5 Colombia",
    password: "",
    confirmPassword: "",
    notiUsuarios: true,
    notiRecetas: true,
  });

  const [loading, setLoading] = useState(false);
  const [tamanoBd, setTamanoBd] = useState<string>("—");

  // Cargar la configuración guardada en la base de datos
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch(apiUrl("/admin/configuracion"), { headers: getAuthHeaders() });
        if (!res.ok) return;
        const c = await res.json();
        setForm((prev) => ({
          ...prev,
          appName: c.app_name ?? prev.appName,
          idioma: c.idioma ?? prev.idioma,
          zona: c.zona_horaria ?? prev.zona,
          notiUsuarios: c.notificar_usuarios ? c.notificar_usuarios === "true" : prev.notiUsuarios,
          notiRecetas: c.notificar_recetas ? c.notificar_recetas === "true" : prev.notiRecetas,
        }));
        setTamanoBd(c.tamano_bd || "—");
      } catch (error) {
        console.error("Error cargando configuración:", error);
      }
    };
    cargar();
  }, []);

  const handleGuardar = async () => {
    // Validación básica
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl("/admin/configuracion"), {
        method: "POST",
        headers: getAuthHeadersWithContent(),
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Error al guardar la configuración");
        return;
      }

      toast.success("✅ Configuración guardada correctamente");
      
      // Limpiar contraseñas después de guardar
      setForm(prev => ({
        ...prev,
        password: "",
        confirmPassword: ""
      }));

    } catch (error) {
      console.error("ERROR FRONT:", error);
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra las preferencias del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 🌎 GENERAL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">
                Nombre de la Aplicación
              </label>
              <input
                value={form.appName}
                onChange={(e) => setForm({ ...form, appName: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Idioma</label>
                <select
                  value={form.idioma}
                  onChange={(e) => setForm({ ...form, idioma: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Zona Horaria</label>
                <select
                  value={form.zona}
                  onChange={(e) => setForm({ ...form, zona: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="GMT-5 Colombia">GMT-5 (Colombia 🇨🇴)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🔐 SEGURIDAD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              placeholder="Nueva contraseña del administrador"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </CardContent>
        </Card>

        {/* 🔔 NOTIFICACIONES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Nuevos usuarios</span>
              <input
                type="checkbox"
                checked={form.notiUsuarios}
                onChange={(e) => setForm({ ...form, notiUsuarios: e.target.checked })}
                className="w-5 h-5 accent-primary"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Nuevas recetas</span>
              <input
                type="checkbox"
                checked={form.notiRecetas}
                onChange={(e) => setForm({ ...form, notiRecetas: e.target.checked })}
                className="w-5 h-5 accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* 🗄️ BASE DE DATOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Tamaño de la base de datos</span>
                <span className="font-medium">{tamanoBd}</span>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Para crear una copia de seguridad ejecuta en el servidor:</p>
                <code className="block bg-muted/50 rounded-xl p-3 text-xs break-all">
                  pg_dump -h localhost -p 5433 -U postgres -d BD_gessenapp -f respaldo.sql
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 💾 BOTONES */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 border rounded-2xl hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>

        <button
          onClick={handleGuardar}
          disabled={loading}
          className="px-8 py-3 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-70"
        >
          <Save className="w-5 h-5" />
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}