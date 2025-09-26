import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { sequelize } from "./config/database.js";

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

// ──────────────── Rutas de prueba ────────────────
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a MiEscuela 4.0 Backend 🚀" });
});

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
