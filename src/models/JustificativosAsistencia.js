import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const JustificativosAsistencia = sequelize.define("JustificativosAsistencia", {
    id_justificativo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_asistencia: {
        type: DataTypes.INTEGER,
        references: {
            model: "Asistencias",
            key: "id_asistencia"
        },
        allowNull: false
    },
    id_tutor: {
        type: DataTypes.INTEGER,
        references: {
            model: "Tutor",
            key: "id_tutor"
        },
        allowNull: false
    },
    id_auxiliar: {
        type: DataTypes.INTEGER,
        references: {
            model: "Auxiliar",
            key: "id_auxiliar"
        },
        allowNull: true
    },
    image_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    detalle_justificativo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    motivo_rechazo:{
        type: DataTypes.TEXT,
        allowNull: true
    }
},{
    tableName: "justificativos_asistencia",
    timestamps: false
});