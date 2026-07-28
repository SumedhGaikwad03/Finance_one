import { Prisma } from "../generated/prisma/client";

export function isPrismaP2025(
    err: unknown
): err is Prisma.PrismaClientKnownRequestError {
    return (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
    );
}
// this file is used for handling prisma infra errors 