import { AsistenciaEstado } from "../models/index.js";


// Obtener todos los estados de asistencia
export const obtenerEstados = async (req, res) => {
  try {
    const estados = await AsistenciaEstado.findAll();
    res.json(estados);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener estados de asistencia",
      detalle: error.message
    });
  }
};
