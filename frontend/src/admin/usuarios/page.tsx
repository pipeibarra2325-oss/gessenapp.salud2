// src/admin/usuarios/page.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Edit, Trash2, UserPlus } from "lucide-react";
import { getAuthHeaders, getAuthHeadersWithContent } from "../../utils/auth";
import { toast } from "sonner";
import { apiUrl } from "../../utils/auth";

interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  departamento: string | null;
  rol: string;
  fecha_registro: string;
  estado: string;
}


// Lee el mensaje de error que envía el backend ({ error: "..." })
const leerError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => null);
  return data?.error || porDefecto;
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 OBTENER USUARIOS
  const fetchUsuarios = async () => {
    try {
      const res = await fetch(apiUrl("/admin/usuarios"), {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Error del servidor");

      const data = await res.json();

      if (Array.isArray(data)) {
        const soloUsuarios = data.filter(
          (u) => u.rol?.toLowerCase() !== "administrador"
        );
        setUsuarios(soloUsuarios);
      } else {
        setUsuarios([]);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios");
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // ➕ CREAR USUARIO (mejorado)
  const crearUsuario = async () => {
    const nombre = prompt("Nombre del usuario:");
    const apellido = prompt("Apellido:");
    const email = prompt("Email:");
    const password = prompt("Contraseña (mínimo 6 caracteres):");

    if (!nombre || !apellido || !email || !password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const res = await fetch(apiUrl("/usuarios"), {
        method: "POST",
        headers: getAuthHeadersWithContent(),
        body: JSON.stringify({ nombre, apellido, email, password }),
      });

      if (!res.ok) throw new Error(await leerError(res, "Error al crear usuario"));

      toast.success("Usuario creado correctamente");
      await fetchUsuarios();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al crear usuario");
    }
  };

  // ✏️ EDITAR USUARIO
  const editarUsuario = async (usuario: Usuario) => {
    const nuevoNombre = prompt("Nuevo nombre:", usuario.nombre);
    if (!nuevoNombre || nuevoNombre === usuario.nombre) return;

    try {
      const res = await fetch(
        apiUrl(`/admin/usuarios/${usuario.id_usuario}`),
        {
          method: "PUT",
          headers: getAuthHeadersWithContent(),
          body: JSON.stringify({ nombre: nuevoNombre }),
        }
      );

      if (!res.ok) throw new Error(await leerError(res, "Error al actualizar usuario"));

      toast.success("Usuario actualizado correctamente");
      await fetchUsuarios();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // 🗑️ ELIMINAR USUARIO
  const eliminarUsuario = async (id: number) => {
    const confirmar = confirm("¿Seguro que deseas eliminar este usuario?");
    if (!confirmar) return;

    try {
      const res = await fetch(
        apiUrl(`/admin/usuarios/${id}`),
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) throw new Error(await leerError(res, "Error al eliminar usuario"));

      toast.success("Usuario eliminado correctamente");
      setUsuarios((prev) => prev.filter((u) => u.id_usuario !== id));
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-lg">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios registrados
          </p>
        </div>

        <button
          onClick={crearUsuario}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Agregar Usuario
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios ({usuarios.length})</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Usuario</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Departamento</th>
                  <th className="text-left p-4">Rol</th>
                  <th className="text-left p-4">Estado</th>
                  <th className="text-right p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id_usuario} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.departamento || "No asignado"}</td>
                    <td className="p-4">{u.rol}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        {u.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      <button
                        onClick={() => editarUsuario(u)}
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => eliminarUsuario(u.id_usuario)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}