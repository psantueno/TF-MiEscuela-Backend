import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { sequelize } from "./config/database.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";

// ====================== Rutas ===================
import authRoutes from "./routes/auth.routes.js";
import asistenciaRoutes from "./routes/asistencia.routes.js";
import asistenciaEstadoRoutes from "./routes/asistenciaEstado.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import rolRoutes from "./routes/roles.routes.js";
import cursoRoutes from "./routes/curso.routes.js";
import alumnoRoutes from "./routes/alumno.routes.js"

const app = express();

// ──────────────── Middlewares globales ────────────────

app.use(helmet()); // Seguridad HTTP headers
app.use(cors({ origin: "http://localhost:5173", credentials: true })); //  Cambiár la URL por la del frontend en producción

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev")); // Logs de peticiones

// Limitador de requests (anti fuerza bruta/DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: "⚠️ Demasiadas solicitudes, intenta más tarde."
});
app.use("/api", limiter);

app.use(cookieParser()); // Parseo de cookies

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
