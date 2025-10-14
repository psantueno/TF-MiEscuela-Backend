import { Usuario } from '../models/Usuario.js';
import { Rol } from '../models/Rol.js';
import { UsuarioRol } from '../models/UsuarioRol.js';
import { Administrador } from "../models/Administrador.js";
import { Director } from "../models/Director.js";
import { Docente } from "../models/Docente.js";
import { Auxiliar } from "../models/Auxiliar.js";
import { AsesorPedagogico } from "../models/AsesorPedagogico.js";
import { Alumno } from "../models/Alumno.js";
import { Tutor } from "../models/Tutor.js";
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { DatabaseError } from '../utils/databaseError.util.js';

const createUserInRoleTable = async (roleId, userId, transaction) => {
    console.log("Creating user in role table:", { roleId, userId });
    switch(roleId){
        case 1: // Admin
            await Administrador.create({ id_usuario: userId }, { transaction });
            break;
        case 2: // Director
            await Director.create({ id_usuario: userId }, { transaction });
            break;
        case 3: // Docente
            await Docente.create({ id_usuario: userId }, { transaction });
            break;
        case 4: // Auxiliar
            await Auxiliar.create({ id_usuario: userId }, { transaction });
            break;
        case 5: // Asesor Pedagógico
            await AsesorPedagogico.create({ id_usuario: userId }, { transaction });
            break;
        case 6: // Alumno
            await Alumno.create({ id_usuario: userId }, { transaction });
            break;
        case 7: // Tutor
            await Tutor.create({ id_usuario: userId }, { transaction });
            break;
    }
}

const deleteUserInRoleTable = async (oldRole, userId, transaction) => {
    console.log("Deleting user in role table:", { oldRole, userId });
    switch(oldRole){
        case 1: // Admin
            await Administrador.destroy({ where: { id_usuario: userId }, transaction });
            break;
        case 2: // Director
            await Director.destroy({ where: { id_usuario: userId }, transaction });
            break;
        case 3: // Docente
            await Docente.destroy({ where: { id_usuario: userId }, transaction });
            break;
        case 4: // Auxiliar
            await Auxiliar.destroy({ where: { id_usuario: userId }, transaction });
            break;
        case 5: // Asesor Pedagógico
            await AsesorPedagogico.destroy({ where: { id_usuario: userId }, transaction });
            break;
        case 6: // Alumno
            await Alumno.destroy({ where: { id_usuario: userId }, transaction });
            break;
        case 7: // Tutor
            await Tutor.destroy({ where: { id_usuario: userId }, transaction });
            break;
    }
}


export const getUsuarios = async (limit, offset, filters) => {
    const whereClause = {};
    if(filters.nombre_completo) whereClause.nombre_completo = { [Op.iLike]: `%${filters.nombre_completo}%` };

    if(filters.id_rol){
        const usuariosConRol = await UsuarioRol.findAll({ where: { id_rol: filters.id_rol }, attributes: ['id_usuario'] });
        const idsUsuarios = usuariosConRol.map(ur => ur.id_usuario);
        whereClause.id_usuario = { [Op.in]: idsUsuarios };
    }

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
        ],
        attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] },
        where: { ...whereClause }
    });
    return { users, total };
}

export const getUsuario = async (id_usuario) => {
    const user = await Usuario.findByPk(id_usuario, { 
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

    return user;
}

export const createUsuario = async (data) => {
    const t = await sequelize.transaction();
    try{
        const hashedPassword = await bcrypt.hash(data.contrasenia, 10);

        const newUser = await Usuario.create({
            nombre_completo: data.nombre_completo,
            numero_documento: data.numero_documento,
            legajo: data.legajo,
            email: data.email,
            telefono: data.telefono ? data.telefono : null,
            direccion: data.direccion ? data.direccion : null,
            fecha_nacimiento: data.fecha_nacimiento ? data.fecha_nacimiento : null,
            genero: data.genero ? data.genero : null,
            contrasenia: hashedPassword
        }, { transaction: t });
        // Rol assignment removed: users are created without a role from this endpoint

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
    }catch(error){
        await t.rollback();
        throw new DatabaseError(error.message);
    }
}

export const getUsuariosSinRol = async (limit, offset, filters = {}) => {
    const whereClause = {};
    if (filters.nombre_completo) whereClause.nombre_completo = { [Op.iLike]: `%${filters.nombre_completo}%` };

    const usuariosConRol = await UsuarioRol.findAll({ attributes: ['id_usuario'] });
    const idsUsuariosConRol = usuariosConRol.map(ur => ur.id_usuario);
    if (idsUsuariosConRol.length > 0) {
        whereClause.id_usuario = { [Op.notIn]: idsUsuariosConRol };
    }

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
        ],
        attributes: { include: ["numero_documento"], exclude: ["contrasenia", "creado_el", "actualizado_el"] },
        where: { ...whereClause }
    });

    return { users, total };
}

export const assignRolUsuario = async (id_usuario, id_rol) => {
    const t = await sequelize.transaction();
    try {
        const user = await Usuario.findByPk(id_usuario, { transaction: t });
        const role = await Rol.findByPk(id_rol, { transaction: t });
        if (!user) throw new DatabaseError("El usuario no existe");
        if (!role) throw new DatabaseError("El rol no existe");

        const currentRoles = await UsuarioRol.findAll({ where: { id_usuario }, transaction: t });

        // Idempotencia: si ya tiene exactamente ese rol, no hacer cambios
        if (currentRoles.length === 1 && currentRoles[0].id_rol === id_rol) {
            await t.commit();
            const updatedUser = await Usuario.findByPk(id_usuario, {
                include: [{ model: Rol, as: "roles", through: { attributes: [] }, attributes: ["id_rol", "nombre_rol"] }],
                attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] }
            });
            return updatedUser;
        }

        // Limpiar roles anteriores y tablas específicas
        if (currentRoles.length > 0) {
            for (const cr of currentRoles) {
                await deleteUserInRoleTable(cr.id_rol, id_usuario, t);
            }
            await UsuarioRol.destroy({ where: { id_usuario }, transaction: t });
        }

        // Asignar nuevo rol y crear en tabla específica
        await UsuarioRol.create({ id_usuario, id_rol }, { transaction: t });
        await createUserInRoleTable(id_rol, id_usuario, t);

        await t.commit();

        const updatedUser = await Usuario.findByPk(id_usuario, {
            include: [{ model: Rol, as: "roles", through: { attributes: [] }, attributes: ["id_rol", "nombre_rol"] }],
            attributes: { exclude: ["contrasenia", "creado_el", "actualizado_el"] }
        });
        return updatedUser;
    } catch (error) {
        await t.rollback();
        throw new DatabaseError(error.message);
    }
}

export const unassignRolUsuario = async (id_usuario) => {
    const t = await sequelize.transaction();
    try {
        const user = await Usuario.findByPk(id_usuario, {
            include: [{ model: Rol, as: "roles", through: { attributes: [] }, attributes: ["id_rol", "nombre_rol"] }],
            transaction: t
        });
        if (!user) throw new DatabaseError("El usuario no existe");

        // Eliminar relaciones en intermedia y tablas específicas
        await UsuarioRol.destroy({ where: { id_usuario }, transaction: t });
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            for (const role of user.roles) {
                await deleteUserInRoleTable(role.id_rol, id_usuario, t);
            }
        }

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw new DatabaseError(error.message);
    }
}

export const updateUsuario = async (id_usuario, data) => {
    const t = await sequelize.transaction();
    try{
        const user = await Usuario.findByPk(id_usuario, { 
            include: [
                {
                    model: Rol,
                    as: "roles",
                    through: { attributes: [] },
                    attributes: ["id_rol", "nombre_rol"]
                },
            ]
        });

        await user.update({
            nombre_completo: data.nombre_completo,
            numero_documento: data.numero_documento,
            legajo: data.legajo,
            email: data.email,
            telefono: data.telefono,
            direccion: data.direccion,
            fecha_nacimiento: data.fecha_nacimiento,
            genero: data.genero
        }, { transaction: t });
        // Role changes removed: this endpoint no longer updates roles
        
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
    }catch(error){
        await t.rollback();
        throw new DatabaseError(error.message);
    }
}

export const deleteUsuario = async (id_usuario) => {
    const t = await sequelize.transaction();
    try {
        const user = await Usuario.findByPk(id_usuario, { 
            include: [
                {
                    model: Rol,
                    as: "roles",
                    through: { attributes: [] },
                    attributes: ["id_rol", "nombre_rol"]
                },
            ]
        });

        // Clean up role relations if any exist
        await UsuarioRol.destroy({ where: { id_usuario: user.id_usuario }, transaction: t });
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            for (const role of user.roles) {
                await deleteUserInRoleTable(role.id_rol, user.id_usuario, t);
            }
        }
        await user.destroy({ transaction: t });

        await t.commit();
    } catch (error) {
        await t.rollback();
        throw new DatabaseError(error.message);
    }
}
