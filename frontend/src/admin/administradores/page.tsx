import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { apiUrl } from "../../utils/auth";
import { Edit, UserMinus, UserPlus } from "lucide-react";
import { getAuthHeaders, getAuthHeadersWithContent } from "../../utils/auth";
import { toast } from "sonner";

interface Admin {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  departamento: string | null;
  fecha_registro: string;
}


// Lee el mensaje de error que envía el backend ({ error: "..." })
const leerError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => null);
  return data?.error || porDefecto;
};

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [adminEditando, setAdminEditando] = useState<Admin | null>(null);

  const [openCrear, setOpenCrear] = useState(false);
  const [nuevoAdmin, setNuevoAdmin] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });

  // 🔄 OBTENER ADMINISTRADORES
  const fetchAdmins = async () => {
    try {
      const res = await fetch(
        apiUrl("/admin/administradores"),
        { headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error("Error al cargar administradores");

      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando administradores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 🗑️ ELIMINAR ADMIN
  const eliminarAdmin = async (id: number) => {
    if (!confirm("¿Quitar el rol de administrador? La cuenta no se elimina: pasará a ser una cuenta de paciente y perderá el acceso al panel.")) return;

    try {
      const res = await fetch(
        apiUrl(`/admin/administradores/${id}`),
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error(await leerError(res, "Error al quitar el rol de administrador"));

      toast.success("Permisos de administrador removidos");
      fetchAdmins();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // ✏️ GUARDAR EDICIÓN
  const guardarCambios = async () => {
    if (!adminEditando) return;

    try {
      const res = await fetch(
        apiUrl(`/admin/administradores/${adminEditando.id_usuario}`),
        {
          method: "PUT",
          headers: getAuthHeadersWithContent(),
          body: JSON.stringify(adminEditando),
        }
      );

      if (!res.ok) throw new Error(await leerError(res, "Error al actualizar administrador"));

      toast.success("Administrador actualizado correctamente");
      setOpenModal(false);
      fetchAdmins();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // ➕ CREAR NUEVO ADMIN
  const crearAdmin = async () => {
    if (!nuevoAdmin.nombre || !nuevoAdmin.apellido || !nuevoAdmin.email || !nuevoAdmin.password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      const res = await fetch(
        apiUrl("/admin/administradores"),
        {
          method: "POST",
          headers: getAuthHeadersWithContent(),
          body: JSON.stringify(nuevoAdmin),
        }
      );

      if (!res.ok) {
        toast.error(await leerError(res, "Error al crear administrador"));
        return;
      }

      toast.success("Administrador creado exitosamente");
      setOpenCrear(false);
      setNuevoAdmin({ nombre: "", apellido: "", email: "", password: "" });
      fetchAdmins();
    } catch (error) {
      console.error(error);
      toast.error("Error al crear administrador");
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando administradores...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Administradores</h1>
          <p className="text-muted-foreground">Administra permisos y accesos</p>
        </div>

        <button
          onClick={() => setOpenCrear(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Agregar Administrador
        </button>
      </div>

      {/* TABLA */}
      <Card>
        <CardHeader>
          <CardTitle>Administradores ({admins.length})</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Administrador</th>
                <th className="p-4 text-left">Correo</th>
                <th className="p-4 text-left">Departamento</th>
                <th className="p-4 text-left">Fecha</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => {
                const inicial = (admin.nombre?.[0] || "") + (admin.apellido?.[0] || "");
                return (
                  <tr key={admin.id_usuario} className="border-b hover:bg-gray-50">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">
                        {inicial}
                      </div>
                      {admin.nombre} {admin.apellido}
                    </td>
                    <td className="p-4">{admin.email}</td>
                    <td className="p-4">{admin.departamento || "—"}</td>
                    <td className="p-4">
                      {new Date(admin.fecha_registro).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setAdminEditando(admin);
                          setOpenModal(true);
                        }}
                        aria-label={`Editar a ${admin.nombre} ${admin.apellido}`}
                        title="Editar nombre"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => eliminarAdmin(admin.id_usuario)}
                        aria-label={`Quitar el rol de administrador a ${admin.nombre} ${admin.apellido}`}
                        title="Quitar rol de administrador (la cuenta pasa a ser de paciente)"
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      {/* MODALES (mantengo tu diseño pero con toast) */}
      {/* ... (los modales se mantienen casi igual, solo cambié los botones si quieres) */}

      {/* MODAL CREAR */}
      {openCrear && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96 space-y-4">
            <h2 className="text-xl font-bold">Nuevo Administrador</h2>
            
            <input className="w-full border p-3 rounded-xl" placeholder="Nombre" value={nuevoAdmin.nombre} onChange={(e) => setNuevoAdmin({...nuevoAdmin, nombre: e.target.value})} />
            <input className="w-full border p-3 rounded-xl" placeholder="Apellido" value={nuevoAdmin.apellido} onChange={(e) => setNuevoAdmin({...nuevoAdmin, apellido: e.target.value})} />
            <input className="w-full border p-3 rounded-xl" placeholder="Correo" value={nuevoAdmin.email} onChange={(e) => setNuevoAdmin({...nuevoAdmin, email: e.target.value})} />
            <input type="password" className="w-full border p-3 rounded-xl" placeholder="Contraseña" value={nuevoAdmin.password} onChange={(e) => setNuevoAdmin({...nuevoAdmin, password: e.target.value})} />

            <div className="flex gap-3 pt-4">
              <button onClick={() => setOpenCrear(false)} className="flex-1 border py-3 rounded-xl">Cancelar</button>
              <button onClick={crearAdmin} className="flex-1 bg-primary text-white py-3 rounded-xl">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {openModal && adminEditando && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-96 space-y-4">
            <h2 className="text-xl font-bold">Editar Administrador</h2>
            
            <input className="w-full border p-3 rounded-xl" value={adminEditando.nombre} onChange={(e) => setAdminEditando({...adminEditando, nombre: e.target.value})} />
            <input className="w-full border p-3 rounded-xl" value={adminEditando.apellido} onChange={(e) => setAdminEditando({...adminEditando, apellido: e.target.value})} />

            <div className="flex gap-3 pt-4">
              <button onClick={() => setOpenModal(false)} className="flex-1 border py-3 rounded-xl">Cancelar</button>
              <button onClick={guardarCambios} className="flex-1 bg-primary text-white py-3 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}