import { verifyToken } from '../utils/jwt.util.js';

export const authMiddleware = (req, res, next) => {
    /* 
    Autenticación mediante cookies y CSRF token -> PRODUCCION
    const accessToken = req.cookies['access_token'];
    const csrfHeader = req.headers["x-csrf-token"];
    const csrfCookie = req.cookies.csrf_token; 
    */
    const accessToken = req.headers['authorization']?.split(' ')[1];
    const csrfCookie = req.headers["x-csrf-token"]; // En este caso, el CSRF token se envía en el header

    /*
    Autenticación mediante cookies y CSRF token -> PRODUCCION
    if (!accessToken) return res.status(401).json({ message: "No autorizado" });

    if (!csrfHeader || csrfHeader !== csrfCookie) return res.status(403).json({ message: "CSRF token inválido" });
    */

    if(!accessToken) return res.status(401).json({ message: "No autorizado" });

    if(!csrfCookie) return res.status(403).json({ message: "CSRF token inválido" });
    
    try{
        req.usuario = verifyToken(accessToken, 'access');
        next();
    }catch(error){
        return res.status(403).json({ message: "Token de acceso inválido o expirado" });
    }
}