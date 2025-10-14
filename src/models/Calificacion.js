import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Calificacion = sequelize.define("Calificacion", {
    id_calificacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_alumno: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Alumno',
            key: 'id_alumno'
        }
    },
    id_materia: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Materia',
            key: 'id_materia'
        }
    },
    id_curso: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Curso',
            key: 'id_curso'
        }
    },
    id_docente: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Docente',
            key: 'id_docente'
        }
    },
    nota: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    ciclo_lectivo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    observaciones: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tipo:{
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    tableName: "calificaciones",
    timestamps: false
});