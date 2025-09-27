import { z } from "zod";

const loginSchema = z.object({
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "El email no es válido"),
    contrasenia: z.string("La contraseña debe ser una cadena de caracteres").min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const validateLogin = (req, res, next) => {
    try{
        if(!req.body) throw new Error("No se recibieron datos");

        loginSchema.parse(req.body);
        next();
    }catch(error){
        let err;
        if(error instanceof z.ZodError){
            err = new Error(error.issues.map(issue => issue.message).join(', '));
        }else{
            err = new Error(error.message);
        }
        err.status = 400;
        next(err);
    }
};

export const validateRefreshToken = (req, res, next) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
        const error = new Error('No autorizado');
        error.status = 401;
        throw error;
    }
    next();
};