import express from "express";
import { obtenerDepartamentos, obtenerRegiones } from "../controllers/departamentos.controller.js";

const router = express.Router();

// GET /api/departamentos
router.get("/departamentos", obtenerDepartamentos);
// GET /api/regiones
router.get("/regiones", obtenerRegiones);


export default router;