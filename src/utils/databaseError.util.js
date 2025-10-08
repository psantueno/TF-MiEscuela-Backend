export class DatabaseError extends Error {
    constructor(message, statusCode = 500){
        super(message);
        this.name = "DatabaseError";
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}