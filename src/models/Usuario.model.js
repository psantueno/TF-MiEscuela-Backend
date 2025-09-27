import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from 'bcrypt';

export const Usuario = sequelize.define("Usuario", {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_completo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notNull: { msg: "El nombre completo es requerido" },
            len: {
                args: [5, 100],
                msg: "El nombre completo debe tener entre 5 y 100 caracteres"
            }
        }
    },
    numero_documento: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notNull: { msg: "El número de documento es requerido" },
            len: {
                args: [7, 50],
                msg: "El número de documento debe tener entre 7 y 50 caracteres"
            }
        }
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: { msg: "Debe ser un email válido" },
            notNull: { msg: "El email es requerido" },
        },
    },
    contrasenia: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: "La contraseña es requerida" },
            len: {
                args: [8, 100],
                msg: "La contraseña debe tener entre 8 y 100 caracteres"
            }
        }
    },
    telefono: {
        type: DataTypes.STRING(30),
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING(),
        allowNull: true
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    genero: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    tableName: "usuarios",
    timestamps: false,
    hooks: {
        beforeCreate: async (usuario) => {
            const salt = await bcrypt.genSalt(10);
            usuario.contrasenia = await bcrypt.hash(usuario.contrasenia, salt);
        },
        beforeUpdate: async (usuario) => {
            if(usuario.changed('contrasenia')){
                const salt = await bcrypt.genSalt(10);
                usuario.contrasenia = await bcrypt.hash(usuario.contrasenia, salt);
            }
        }
    }
});

// Método de instancia para validar contraseña
Usuario.prototype.validPassword = function (contrasenia) {
    return bcrypt.compareSync(contrasenia, this.contrasenia);
};