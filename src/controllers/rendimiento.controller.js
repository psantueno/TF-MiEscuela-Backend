import {
  getCursoSummary,
  getMateriaSummary,
  getAlumnoSummary,
  getAlertas,
  getTutorHijos,
  buildInforme,
  buildInformeIA,
} from "../services/rendimiento.service.js";
import { requestInformeIA } from "../services/ia.service.js";
import { buildInformeIAPdf, buildInformeFileName } from "../utils/informeIaPdf.util.js";

const handleError = (res, error) => {
  console.error("[RENDIMIENTO]", error);
  const status = error.status || 500;
  const message = error.message || "Error interno del servidor";
  return res.status(status).json({ error: message });
};

const sanitizeIaText = (text = "") => {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\r/g, "")
    .trim();
};

export const getRendimiento = async (req, res) => {
  try {
    const scope = (req.query.scope || "").toLowerCase();
    const user = req.usuario;
    let data;

    switch (scope) {
      case "curso":
        data = await getCursoSummary(req.query, user);
        break;
      case "materia":
        data = await getMateriaSummary(req.query, user);
        break;
      case "alumno":
        data = await getAlumnoSummary(req.query, user);
        break;
      case "alertas":
        data = await getAlertas(req.query, user);
        break;
      case "hijos":
        data = await getTutorHijos(user);
        break;
      default:
        return res.status(400).json({ error: "scope inválido" });
    }

    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const generarInforme = async (req, res) => {
  try {
    const user = req.usuario;
    const data = await buildInforme(req.body, user);
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const generarInformeIA = async (req, res) => {
  try {
    const user = req.usuario;
    const formatParam = String(req.query?.formato || req.query?.format || "").toLowerCase();
    const wantsPdf = formatParam === "pdf";
    const previewOnly = !wantsPdf && String(req.query?.soloPayload || "").toLowerCase() === "true";
    const data = await buildInformeIA(req.body, user);
    let informeGenerado = null;
    if (!previewOnly) {
      informeGenerado = await requestInformeIA(data.prompt);
      if (informeGenerado?.texto) {
        informeGenerado.texto = sanitizeIaText(informeGenerado.texto);
      }
    }

    if (wantsPdf) {
      if (!informeGenerado?.texto) {
        const error = new Error("No se pudo generar el informe con IA");
        error.status = 502;
        throw error;
      }
      const pdf = await buildInformeIAPdf({
        payload: data.payload,
        informeText: sanitizeIaText(informeGenerado.texto),
      });
      const filename = buildInformeFileName(data.payload);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(pdf);
    }

    return res.json({
      ...data,
      informe_generado: informeGenerado,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
