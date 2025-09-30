export const errorHandler = (error, zodInstance) => {
    let err;
    if(error instanceof zodInstance.ZodError){
        err = new Error(error.issues.map(issue => issue.message).join(', '));
    }else{
        err = new Error(error.message);
    }
    err.statusCode = 400;

    return err;
};


