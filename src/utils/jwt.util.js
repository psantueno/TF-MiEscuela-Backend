import jwt from 'jsonwebtoken';

const ACCESS_TOKEN = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN = process.env.JWT_REFRESH_SECRET;

export const generateAccessToken = (user) => {
    return jwt.sign({ id_usuario: user.id_usuario, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol, notificaciones: user.notificaciones }, ACCESS_TOKEN, { expiresIn: "1h" });
};

export const generateRefreshToken = (user) => {
    return jwt.sign({ id_usuario: user.id_usuario, nombre: user.nombre, apellido: user.apellido, email: user.email, rol: user.rol, notificaciones: user.notificaciones }, REFRESH_TOKEN, { expiresIn: "1d" });
};

export const verifyToken = (token, type) => {
    const secret = type === 'access' ? ACCESS_TOKEN : REFRESH_TOKEN;
    try{
        return jwt.verify(token, secret);
    }catch(error){
        const err = new Error('Token inválido o expirado');
        err.status = 403;
        throw err;
    }
}
