import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const InformePedagogico = sequelize.define("InformePedagogico", {
    id_informe: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_alumno: {
        type: DataTypes.INTEGER,
        references: {
            model: "Alumnos",
            key: "id_alumno"
        },
        allowNull: false
    },
    id_asesor: {
        type: DataTypes.INTEGER,
        references: {
            model: "AsesorPedagogico",
            key: "id_asesor"
        },
        allowNull: false
    },
    id_materia_curso: {
        type: DataTypes.INTEGER,
        references: {
            model: "MateriaCurso",
            key: "id_materia_curso"
        },
        allowNull: false
    },
    id_docente: {
        type: DataTypes.INTEGER,
        references: {
            model: "Docente",
            key: "id_docente"
        },
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    contenido: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    tableName: "informes_pedagogicos",
    timestamps: false
});