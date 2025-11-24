import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Notificacion = sequelize.define("Notificacion", {
    id_notificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        references: {  
            model: "Usuarios",
            key: "id_usuario"
        },
    },
    titulo: {
        type: DataTypes.STRING
    },
    detalle: {
        type: DataTypes.TEXT
    },
    fecha: {
        type: DataTypes.DATE
    },
    leido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
},{
    tableName: "notificaciones",
    timestamps: false
});