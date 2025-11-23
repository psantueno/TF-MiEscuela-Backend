import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";

import { sequelize } from "./config/database.js";
import "./jobs/publicarCalificaciones.js";

// Inicializa asociaciones entre modelos
import "./models/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// ====================== Rutas ===================
import authRoutes from "./routes/auth.routes.js";
import asistenciaRoutes from "./routes/asistencia.routes.js";
import asistenciaEstadoRoutes from "./routes/asistenciaEstado.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import rolRoutes from "./routes/roles.routes.js";
import cursoRoutes from "./routes/curso.routes.js";
import alumnoRoutes from "./routes/alumno.routes.js"
import materiaRoutes from "./routes/materia.routes.js";
import calificacionRoutes from "./routes/calificacion.routes.js";
import tutorRoutes from "./routes/tutor.routes.js";
import cicloLectivoRoutes from "./routes/cicloLectivo.routes.js";
import informePedagogicoRoutes from "./routes/informePedagogico.js";
import asesorPedagogicoRoutes from "./routes/asesorPedagogico.routes.js";
import docenteMateriaRoutes from "./routes/docenteMateria.routes.js";
import materiasCursoRoutes from "./routes/materiasCurso.routes.js";
import docenteRoutes from "./routes/docente.routes.js";
import justificativosRoutes from "./routes/justificativoAsistencia.routes.js";
import rendimientoRoutes from "./routes/rendimiento.routes.js";
import auxiliaresRoutes from "./routes/auxiliares.routes.js";
import auxiliaresCursoRoutes from "./routes/auxiliaresCurso.routes.js";
import tutorHijosRoutes from "./routes/tutoresHijos.routes.js";
import panelGeneralRoutes from "./routes/panelGeneral.routes.js";
// =================================================

const app = express();

// ──────────────── Middlewares globales ────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // 👈 Permite que otros orígenes usen los recursos
    crossOriginOpenerPolicy: false, // 👈 Desactiva el bloqueo de apertura
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http://localhost:5173"], // 👈 Permite imágenes desde tu frontend
      },
    },
  })
);
app.use(cors({ origin: "http://localhost:5173", credentials: true , methods: ["GET", "POST", "PUT", "DELETE"] })); //  Cambiár la URL por la del frontend en producción

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev")); // Logs de peticiones

// Limitador de requests (anti fuerza bruta/DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 100 requests por IP
  message: "⚠️ Demasiadas solicitudes, intenta más tarde."
});
app.use("/api", limiter);

app.use(cookieParser()); // Parseo de cookies

// ──────────────── Visualizacion de images ────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Desactivar cache para desarrollo

// ──────────────── ROUTER ────────────────
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a MiEscuela 4.0 Backend 🚀" });
});

app.use("/api/asistencias", asistenciaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/asistencia-estados", asistenciaEstadoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/roles", rolRoutes);
app.use("/api/cursos", cursoRoutes);
app.use("/api/alumnos", alumnoRoutes )
app.use("/api/materias", materiaRoutes);
app.use("/api/calificaciones", calificacionRoutes);
app.use("/api/tutores", tutorRoutes);
app.use("/api/ciclos-lectivos", cicloLectivoRoutes);
app.use("/api/informes-pedagogicos", informePedagogicoRoutes);
app.use("/api/asesores-pedagogicos", asesorPedagogicoRoutes);
app.use("/api/docentes-materias-curso", docenteMateriaRoutes);
app.use("/api/materias-curso", materiasCursoRoutes);
app.use("/api/docentes", docenteRoutes);
app.use("/api/justificativos", justificativosRoutes);
app.use("/api/rendimiento", rendimientoRoutes);
app.use("/api/auxiliares", auxiliaresRoutes);
app.use("/api/auxiliares-curso", auxiliaresCursoRoutes);
app.use("/api/tutores-hijos", tutorHijosRoutes);
app.use("/api/panelGeneral", panelGeneralRoutes);
// ──────────────── Manejo de errores ────────────────
app.use(errorHandler);

// ──────────────── Arranque del servidor ────────────────
const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  try {
    await sequelize.authenticate(); 
    console.log("Conexión a la base de datos exitosa ✅");
  } catch (error) {
    console.error("Error al conectar DB ❌:", error);
  }
});
