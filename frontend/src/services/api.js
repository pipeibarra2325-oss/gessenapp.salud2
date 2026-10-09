import { getAuthHeaders } from "../utils/auth";
import { API_URL } from '../config';

export const crearUsuario = async (data) => {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error en el registro');
    error.response = { status: response.status, data: errorData };
    throw error;
  }

  return await response.json();
};

// Regiones alimentarias (Andina, Pacífica, ...) para que el usuario elija la suya
export const obtenerRegiones = async () => {
  const res = await fetch(`${API_URL}/regiones`);
  if (!res.ok) throw new Error("Error al obtener regiones");
  return res.json();
};

export const obtenerDepartamentos = async () => {
  try {
    const response = await fetch(`${API_URL}/departamentos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json(); // Esperamos: [{ id_departamento: 1, nombre: "Amazonas" }, ...]
  } catch (error) {
    console.error('E al obtener departamentos:', error);
    throw error;
  }
};

export const obtenerPlatillos = async () => {
  try {
    const response = await fetch(`${API_URL}/platillos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener platillos:', error);
    throw error;
  }
};

// ==================== CONSUMO Y FAVORITOS ====================
export const registrarConsumo = async (consumptionData) => {
  const response = await fetch(`${API_URL}/platillos/consumo`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(consumptionData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al registrar consumo');
    error.response = { status: response.status, data: errorData };
    throw error;
  }

  return await response.json();
};

// CAMBIO: Nueva función para toggle de favoritos
export const toggleFavorito = async (userId, platilloId) => {
  const response = await fetch(`${API_URL}/platillos/favorito/toggle`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, platilloId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Error al actualizar favorito');
    error.response = { status: response.status, data: errorData };
    throw error;
  }

  return await response.json();
};
// Consumos del usuario autenticado en una fecha (AAAA-MM-DD, por defecto hoy)
export const obtenerMisConsumos = async (fecha) => {
  const f = fecha || new Date().toLocaleDateString("en-CA");
  const response = await fetch(`${API_URL}/platillos/consumos?fecha=${f}`, { headers: getAuthHeaders() });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener los consumos');
  }
  return await response.json();
};

// Todo el historial de consumos del usuario autenticado, del más reciente al más antiguo
export const obtenerHistorialConsumos = async () => {
  const response = await fetch(`${API_URL}/platillos/consumos?todos=1`, { headers: getAuthHeaders() });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener el historial de consumos');
  }
  return await response.json();
};

// Sugerencias del modelo de aprendizaje automático para el usuario autenticado
export const obtenerRecomendacionesML = async (limite = 6) => {
  const response = await fetch(`${API_URL}/platillos/recomendaciones-ml?limite=${limite}`, { headers: getAuthHeaders() });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener las recomendaciones');
  }
  return await response.json();
};

// Registra que el usuario abrió el detalle de un platillo (retroalimentación implícita para el modelo)
export const registrarInteraccion = async (platilloId) => {
  const response = await fetch(`${API_URL}/platillos/interaccion`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ platilloId: Number(platilloId) }),
  });
  if (!response.ok) throw new Error('No se pudo registrar la interacción');
  return await response.json();
};

export const eliminarConsumo = async (id) => {
  const response = await fetch(`${API_URL}/platillos/consumo/${id}`, { method: "DELETE", headers: getAuthHeaders() });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al eliminar el consumo');
  }
  return await response.json();
};
