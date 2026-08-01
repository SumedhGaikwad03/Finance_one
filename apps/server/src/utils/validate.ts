export function validate(schema: any, data: any) {

    try {
        schema.parse(data); // this will throw an error if the data is invalid
    } catch (error) {   
        throw new ValidationError(error.errors[0].message); // this will throw a validation error with the message of the first error
}