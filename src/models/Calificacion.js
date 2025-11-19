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
    id_materia_curso:{
        type: DataTypes.INTEGER,
        references: {
            model: 'MateriasCurso',
            key: 'id_materia_curso'
        }
    },
    id_docente: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Docente',
            key: 'id_docente'
        }
    },
    id_tipo_calificacion: {
        type: DataTypes.INTEGER,
        references: {
            model: 'TipoCalificacion',
            key: 'id_tipo_calificacion'
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
    publicado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
},{
    tableName: "calificaciones",
    timestamps: false
});
