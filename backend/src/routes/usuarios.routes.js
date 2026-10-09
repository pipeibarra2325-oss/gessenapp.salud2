import express from "express";
import { obtenerUsuarios, crearUsuario, loginUsuario, actualizarMiPerfil, cambiarMiPassword,
  obtenerMiSeguimiento, registrarMiSeguimiento, eliminarMiSeguimiento } from "../controllers/usuarios.controller.js";
import { authAdmin } from "../middlewares/authAdmin.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/usuarios", authAdmin, obtenerUsuarios);
router.post("/usuarios", crearUsuario);
router.post("/login", loginUsuario);
router.put("/usuarios/me", auth, actualizarMiPerfil);
router.put("/usuarios/me/password", auth, cambiarMiPassword);
router.get("/usuarios/me/seguimiento", auth, obtenerMiSeguimiento);
router.post("/usuarios/me/seguimiento", auth, registrarMiSeguimiento);
router.delete("/usuarios/me/seguimiento/:idSeg", auth, eliminarMiSeguimiento);

export default router;
