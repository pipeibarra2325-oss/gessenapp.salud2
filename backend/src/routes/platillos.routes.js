import express from "express";
import { obtenerPlatillos, registrarConsumo, toggleFavorito, obtenerFavoritos, obtenerMisConsumos, eliminarConsumo } from "../controllers/platillos.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/platillos", obtenerPlatillos);
router.get("/platillos/favoritos/:userId", auth, obtenerFavoritos);
router.post("/platillos/consumo", auth, registrarConsumo);
router.get("/platillos/consumos", auth, obtenerMisConsumos);
router.delete("/platillos/consumo/:id", auth, eliminarConsumo);
router.post("/platillos/favorito/toggle", auth, toggleFavorito);

export default router;
