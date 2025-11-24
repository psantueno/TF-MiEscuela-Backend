import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const FechasCuatrimestrales = sequelize.define("FechasCuatrimestrales", {
    id_fechas_cuatrimestrales: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inicio_primer_cuatrimestre: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cierre_primer_cuatrimestre: {
        type: DataTypes.DATE,
        allowNull: true
    },
    inicio_segundo_cuatrimestre: {
        type: DataTypes.DATE,
        allowNull: true
    },
    cierre_segundo_cuatrimestre: {
        type: DataTypes.DATE,
        allowNull: true
    },
    id_ciclo: {
        type: DataTypes.INTEGER,
        references: {  
            model: "CiclosLectivos",
            key: "id_ciclo",
        },
    },
},{
    tableName: "fechas_cuatrimestrales",
    timestamps: false
});
