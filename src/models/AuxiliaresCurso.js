import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const AuxiliaresCurso = sequelize.define("AuxiliaresCurso", {
    id_auxiliar: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Auxiliares",
            key: "id_auxiliar"
        },
        primaryKey: true
    },
    id_curso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Cursos",
            key: "id_curso" 
        },
        primaryKey: true
    },
    fecha_asignacion: {
        type: DataTypes.DATE,
        allowNull: false
    }
},{
    tableName: "auxiliares_cursos",
    timestamps: false
});