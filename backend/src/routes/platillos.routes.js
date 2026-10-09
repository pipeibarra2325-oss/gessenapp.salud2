import express from "express";
import { obtenerPlatillos, registrarConsumo, toggleFavorito, obtenerFavoritos, obtenerMisConsumos, eliminarConsumo, obtenerRecomendacionesML, registrarInteraccion } from "../controllers/platillos.controller.js";
import { auth } from "../middlewares/auth.js";
import { validarParamId } from "../utils/validacion.js";

const router = express.Router();
// Los identificadores de las rutas deben ser números enteros positivos (400 en lugar de un error 500)
router.param("id", validarParamId);
router.param("userId", validarParamId);

router.get("/platillos", obtenerPlatillos);
router.get("/platillos/favoritos/:userId", auth, obtenerFavoritos);
router.post("/platillos/consumo", auth, registrarConsumo);
router.get("/platillos/consumos", auth, obtenerMisConsumos);
router.get("/platillos/recomendaciones-ml", auth, obtenerRecomendacionesML);
router.post("/platillos/interaccion", auth, registrarInteraccion);
router.delete("/platillos/consumo/:id", auth, eliminarConsumo);
router.post("/platillos/favorito/toggle", auth, toggleFavorito);

export default router;
