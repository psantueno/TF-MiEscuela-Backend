import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    pool: {
      max: 10,          // Máximo de conexiones en el pool
      min: 0,           // Mínimo de conexiones
      acquire: 30000,   // Tiempo máximo (ms) para adquirir conexión
      idle: 10000,      // Tiempo máximo (ms) que una conexión puede estar inactiva
    },
    port: process.env.DB_PORT,
    logging: false,
  }
);
