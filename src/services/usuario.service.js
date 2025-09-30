import { Usuario } from '../models/Usuario.js';
import { Rol } from '../models/Rol.js';
import { UsuarioRol } from '../models/UsuarioRol.js';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';

export const getUsuarios = async (limit, offset) => {
    const { rows: users, count: total } = await Usuario.findAndCountAll({
        limit,
        offset,
        order: [["id_usuario", "ASC"]],
        include: [
            {
                model: Rol,
                as: "roles",
                through: { attributes: [] },
                attributes: ["id_rol", "nombre_rol"]
            },
        ]
    });
    return { users, total };
}

export const createUsuario = async (data) => {
    const t = await sequelize.transaction();

    const hashedPassword = await bcrypt.hash(data.contrasenia, 10);

    const newUser = await Usuario.create({
        nombre_completo: data.nombre_completo,
        numero_documento: data.numero_documento,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero,
        contrasenia: hashedPassword
    }, { transaction: t });

    const rol = await Rol.findOne({ where: { id_rol: data.id_rol } });

    if(!rol){
        const error = new Error("Rol no encontrado");
        error.statusCode = 404;
        throw error;
    }

    await UsuarioRol.create({
        id_usuario: newUser.id_usuario,
        id_rol: rol.id_rol
    }, { transaction: t });

    await t.commit();

    const newUserWithRoles = await Usuario.findByPk(newUser.id_usuario, 
        { 
            include: [
                {
                    model: Rol,
                    as: "roles",
                    through: { attributes: [] },
                    attributes: ["id_rol", "nombre_rol"]
                },
            ],
            attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] }
        });

    return newUserWithRoles;
}

export const updateUsuario = async (id_usuario, data) => {
    const t = await sequelize.transaction();

    const user = await Usuario.findByPk(id_usuario);

    if(!user){
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    await user.update({
        nombre_completo: data.nombre_completo,
        numero_documento: data.numero_documento,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero,
        contrasenia: data.contrasenia
    }, { transaction: t });
    
    const rol = await Rol.findOne({ where: { id_rol: data.id_rol } });
    
    if(!rol){
        const error = new Error("Rol no encontrado");
        error.statusCode = 404;
        throw error;
    }
    
    //user.setRoles([rol]);

    await UsuarioRol.destroy({ where: { id_usuario: user.id_usuario } }, { transaction: t });

    await UsuarioRol.create({
        id_usuario: user.id_usuario,
        id_rol: rol.id_rol
    }, { transaction: t });

    await t.commit();
    
    const updatedUser = await Usuario.findByPk(id_usuario, { 
        include: [
            {
                model: Rol,
                as: "roles",
                through: { attributes: [] },
                attributes: ["id_rol", "nombre_rol"]
            },
        ] 
    });

    return updatedUser;
}

export const deleteUsuario = async (id_usuario) => {
    const t = await sequelize.transaction();

    const user = await Usuario.findByPk(id_usuario);
    
    if(!user){
        const error = new Error("Usuario no encontrado");
        error.statusCode = 404;
        throw error;
    }

    await UsuarioRol.destroy({ where: { id_usuario: user.id_usuario } }, { transaction: t });
    await user.destroy({ transaction: t });

    await t.commit();
}