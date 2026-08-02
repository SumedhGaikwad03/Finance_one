import jwt from "jsonwebtoken";


const JWT_SECRET  = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}

export function generateToken(userId: number): string {
    const payload = { userId };

   return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "10h",
});
}

export function verifyToken(token : string) : { userId: number } {

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }; 

    return decoded ; 


}