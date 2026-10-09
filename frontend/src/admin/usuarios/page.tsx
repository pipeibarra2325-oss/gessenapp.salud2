// src/admin/usuarios/page.tsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Edit, Trash2, UserPlus, TrendingUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface Departamento {
  id_departamento: number;
  nombre_departamento: string;
}

// Misma longitud mínima que el registro público y el servidor
const MIN_PASSWORD = 8;
const POR_PAGINA = 15;

// Lee el mensaje de error que envía el backend ({ error: "..." })
const leerError = async (res: Response, porDefecto: string) => {
  const data = await res.json().catch(() => null);
  return data?.error || porDefecto;
};

export default function UsuariosPage() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

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
    fetch(apiUrl("/departamentos"))
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDepartamentos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Búsqueda por nombre, apellido, correo o departamento (sin distinguir tildes) y paginación
  const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const filtrados = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return usuarios;
    return usuarios.filter((u) => normalizar(`${u.nombre} ${u.apellido} ${u.email} ${u.departamento || ""}`).includes(q));
  }, [usuarios, busqueda]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);

  // Formulario de creación y edición (reemplaza los cuadros de diálogo del navegador)
  const vacio = {
    nombre: "", apellido: "", email: "", password: "",
    genero: "", fecha_nacimiento: "", estatura: "", peso: "", id_departamento: "",
  };
  const [formulario, setFormulario] = useState<{ modo: "crear" | "editar"; id?: number } | null>(null);
  const [datos, setDatos] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const abrirCrear = () => {
    const narino = departamentos.find((d) => d.nombre_departamento.toLowerCase().startsWith("nari"));
    setDatos({ ...vacio, id_departamento: narino ? String(narino.id_departamento) : "" });
    setFormulario({ modo: "crear" });
  };

  const abrirEditar = (usuario: Usuario) => {
    setDatos({ ...vacio, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email });
    setFormulario({ modo: "editar", id: usuario.id_usuario });
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario) return;
    const crear = formulario.modo === "crear";
    if (!datos.nombre.trim() || !datos.apellido.trim() || (crear && (!datos.email.trim() || !datos.password))) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (crear && (!datos.genero || !datos.fecha_nacimiento || !datos.estatura || !datos.peso || !datos.id_departamento)) {
      toast.error("Completa los datos de salud: género, fecha de nacimiento, estatura, peso y departamento");
      return;
    }
    if ((crear || datos.password) && datos.password.length < MIN_PASSWORD) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`);
      return;
    }

    setGuardando(true);
    try {
      const res = crear
        ? await fetch(apiUrl("/usuarios"), {
            method: "POST",
            headers: getAuthHeadersWithContent(),
            body: JSON.stringify({
              ...datos,
              estatura: Number(datos.estatura),
              peso: Number(datos.peso),
              id_departamento: Number(datos.id_departamento),
            }),
          })
        : await fetch(apiUrl(`/admin/usuarios/${formulario.id}`), {
            method: "PUT",
            headers: getAuthHeadersWithContent(),
            body: JSON.stringify({ nombre: datos.nombre, apellido: datos.apellido, ...(datos.password ? { password: datos.password } : {}) }),
          });

      if (!res.ok) throw new Error(await leerError(res, "Error al guardar el usuario"));

      toast.success(crear ? "Usuario creado correctamente" : "Usuario actualizado correctamente");
      setFormulario(null);
      await fetchUsuarios();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar el usuario");
    } finally {
      setGuardando(false);
    }
  };

  // 🗑️ ELIMINAR USUARIO
  const eliminarUsuario = async (id: number) => {
    const confirmar = confirm("¿Seguro que deseas eliminar este usuario? Se borrará también su historial de consumos.");
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

  const campo = "w-full border p-2.5 rounded-xl";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios registrados
          </p>
        </div>

        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Agregar Usuario
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>
            Usuarios ({busqueda.trim() ? `${filtrados.length} de ${usuarios.length}` : usuarios.length})
          </CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              placeholder="Buscar por nombre, correo o departamento"
              aria-label="Buscar usuarios"
              className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
            />
          </div>
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
                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      {busqueda.trim() ? "Ningún usuario coincide con la búsqueda" : "Aún no hay usuarios registrados"}
                    </td>
                  </tr>
                )}
                {visibles.map((u) => (
                  <tr key={u.id_usuario} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium">{u.nombre} {u.apellido}</p>
                      <button
                        onClick={() => navigate(`/admin/progreso?usuario=${u.id_usuario}`)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Ver progreso y PDF
                      </button>
                    </td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.departamento || "No asignado"}</td>
                    <td className="p-4">{u.rol}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/admin/progreso?usuario=${u.id_usuario}`)}
                        title="Ver progreso y descargar el informe PDF"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-sm font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" /> Progreso y PDF
                      </button>
                      <button
                        onClick={() => abrirEditar(u)}
                        aria-label={`Editar a ${u.nombre} ${u.apellido}`}
                        title="Editar"
                        className="text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => eliminarUsuario(u.id_usuario)}
                        aria-label={`Eliminar a ${u.nombre} ${u.apellido}`}
                        title="Eliminar"
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

          {totalPaginas > 1 && (
            <div className="flex items-center justify-end gap-3 pt-4 text-sm">
              <button
                onClick={() => setPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                aria-label="Página anterior"
                className="p-2 border rounded-xl disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Página {paginaActual} de {totalPaginas}</span>
              <button
                onClick={() => setPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                aria-label="Página siguiente"
                className="p-2 border rounded-xl disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>
      {formulario && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <form onSubmit={guardarUsuario} className="bg-white p-6 rounded-2xl w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold">{formulario.modo === "crear" ? "Nuevo usuario" : "Editar usuario"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Nombre</span>
                <input className={campo} value={datos.nombre} maxLength={100}
                  onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
              </label>
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Apellido</span>
                <input className={campo} value={datos.apellido} maxLength={100}
                  onChange={(e) => setDatos({ ...datos, apellido: e.target.value })} />
              </label>
            </div>
            <label className="text-sm block">
              <span className="block mb-1 text-muted-foreground">Correo electrónico</span>
              <input type="email" className={`${campo} disabled:bg-gray-50`} value={datos.email} maxLength={150}
                disabled={formulario.modo === "editar"}
                onChange={(e) => setDatos({ ...datos, email: e.target.value })} />
            </label>

            {formulario.modo === "crear" && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Datos de salud</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    <span className="block mb-1 text-muted-foreground">Género</span>
                    <select className={campo} value={datos.genero} onChange={(e) => setDatos({ ...datos, genero: e.target.value })}>
                      <option value="">Selecciona...</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="block mb-1 text-muted-foreground">Fecha de nacimiento</span>
                    <input type="date" className={campo} value={datos.fecha_nacimiento}
                      max={new Date().toLocaleDateString("en-CA")} min="1900-01-01"
                      onChange={(e) => setDatos({ ...datos, fecha_nacimiento: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <span className="block mb-1 text-muted-foreground">Estatura (cm)</span>
                    <input type="number" min={50} max={250} className={campo} value={datos.estatura}
                      onChange={(e) => setDatos({ ...datos, estatura: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    <span className="block mb-1 text-muted-foreground">Peso (kg)</span>
                    <input type="number" min={20} max={300} step="0.1" className={campo} value={datos.peso}
                      onChange={(e) => setDatos({ ...datos, peso: e.target.value })} />
                  </label>
                </div>
                <label className="text-sm block">
                  <span className="block mb-1 text-muted-foreground">Departamento</span>
                  <select className={campo} value={datos.id_departamento} onChange={(e) => setDatos({ ...datos, id_departamento: e.target.value })}>
                    <option value="">Selecciona el departamento</option>
                    {departamentos.map((d) => (
                      <option key={d.id_departamento} value={d.id_departamento}>{d.nombre_departamento}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <label className="text-sm block">
              <span className="block mb-1 text-muted-foreground">
                {formulario.modo === "crear"
                  ? `Contraseña inicial (mínimo ${MIN_PASSWORD} caracteres)`
                  : "Nueva contraseña (opcional, para restablecer el acceso del paciente)"}
              </span>
              <input type="password" autoComplete="new-password" className={campo} value={datos.password} maxLength={128}
                placeholder={formulario.modo === "editar" ? "Déjala vacía para no cambiarla" : ""}
                onChange={(e) => setDatos({ ...datos, password: e.target.value })} />
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFormulario(null)} className="flex-1 border py-3 rounded-xl">Cancelar</button>
              <button type="submit" disabled={guardando} className="flex-1 bg-primary text-white py-3 rounded-xl disabled:opacity-70">
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
