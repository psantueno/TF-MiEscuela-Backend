import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt.util.js';

export const authMiddleware = (req, res, next) => {
    const accessToken = req.cookies['access_token'];
    const csrfHeader = req.headers["x-csrf-token"];
    const csrfCookie = req.cookies.csrf_token;

    if (!accessToken) return res.status(401).json({ message: "No autorizado" });

    if (!csrfHeader || csrfHeader !== csrfCookie) return res.status(403).json({ message: "CSRF token inválido" });

    try{
        req.usuario = verifyToken(accessToken, 'access');
        next();
    }catch(error){
        return res.status(403).json({ message: "Token de acceso inválido o expirado" });
    }
}