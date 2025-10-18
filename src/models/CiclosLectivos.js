import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const CiclosLectivos = sequelize.define("CiclosLectivos", {
    id_ciclo:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    anio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'Abierto'
    }
},{
    tableName: "ciclos_lectivos",
    timestamps: false
})