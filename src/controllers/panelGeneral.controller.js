import { getPanelPorRol, getResumenPanelGeneral } from "../services/panelGeneral.service.js";

export const getResumen = async (req, res) => {
  try {
    const data = await getResumenPanelGeneral();
    res.json(data);
  } catch (error) {
    const status = error?.status || 500;
    const message =
      status === 500 ? "Error obteniendo resumen del panel general" : error.message;
    res.status(status).json({ error: message });
  }
};

export const getPanelPorRolController = async (req, res) => {
  try {
    const data = await getPanelPorRol(req.usuario);
    res.json(data);
  } catch (error) {
    const status = error?.status || 500;
    const message =
      status === 500 ? "Error obteniendo panel por rol" : error.message;
    res.status(status).json({ error: message });
  }
};
