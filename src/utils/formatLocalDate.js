export const formatLocalDate = (date, separator = "/") => {
    if (!date) return null;
    
    const [year, month, day] = date.split('-');

    return [day, month, year].join(separator);
}
