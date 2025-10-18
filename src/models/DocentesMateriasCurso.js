import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const DocentesMateriasCurso = sequelize.define("DocentesMateriasCurso", {
    id_docente: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Docentes",
            key: "id_docente"
        },
        primaryKey: true
    },
    id_materia_curso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "MateriasCurso",
            key: "id_materia_curso"
        },
        primaryKey: true
    },
    rol_docente: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Titular'
    },
    fecha_inicio: {
        type: DataTypes.DATE,
        allowNull: false,
        primaryKey: true
    },
    fecha_fin: {
        type: DataTypes.DATE,
        allowNull: true
    }
},{
    tableName: "docentes_materias_curso",
    timestamps: false
});
