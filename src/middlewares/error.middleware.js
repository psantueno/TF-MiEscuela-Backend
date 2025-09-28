export const errorHandler = (err, req, res, next) => {
    // Log del error (solo para desarrollo)
    console.error(err);

    // Extraer statusCode si existe, sino default 500
    const status = err.statusCode || 500;

    // Extraer mensaje del error
    const message = err.message || "Internal Server Error";

    res.status(status).json({
        message: message
    });
}