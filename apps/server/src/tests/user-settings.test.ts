import { describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { updateProfileSchema, changePasswordSchema } from "../schemas/user.schema";
import prisma from "../lib/prisma";
import * as userService from "../services/user.service";
import { BadRequestError, NotFoundError } from "../error/AppError";

describe("Account Settings & Security", () => {
    describe("Schema Validation", () => {
        it("validates valid profile update payload", () => {
            const parsed = updateProfileSchema.parse({ name: "Jane Doe" });
            assert.equal(parsed.name, "Jane Doe");
        });

        it("rejects empty or whitespace-only name", () => {
            assert.throws(() => {
                updateProfileSchema.parse({ name: "   " });
            });
        });

        it("validates valid password change payload", () => {
            const parsed = changePasswordSchema.parse({
                currentPassword: "OldPassword123",
                newPassword: "NewSecurePassword456",
            });
            assert.equal(parsed.currentPassword, "OldPassword123");
            assert.equal(parsed.newPassword, "NewSecurePassword456");
        });

        it("rejects new password shorter than 8 characters", () => {
            assert.throws(() => {
                changePasswordSchema.parse({
                    currentPassword: "OldPassword123",
                    newPassword: "short",
                });
            });
        });

        it("rejects missing current password", () => {
            assert.throws(() => {
                changePasswordSchema.parse({
                    currentPassword: "",
                    newPassword: "NewSecurePassword456",
                });
            });
        });
    });

    describe("Password Security & Service Operations", () => {
        it("rejects password change if current password is wrong", async () => {
            const mockPasswordHash = await bcrypt.hash("CorrectOldPassword123", 10);
            const originalFindUnique = prisma.user.findUnique;

            (prisma.user as any).findUnique = async ({ where }: any) => {
                if (where.id === 999) {
                    return {
                        id: 999,
                        name: "Test User",
                        email: "test@example.com",
                        passwordHash: mockPasswordHash,
                    };
                }
                return null;
            };

            try {
                await assert.rejects(
                    async () => {
                        await userService.changeUserPassword(999, {
                            currentPassword: "WrongPassword999",
                            newPassword: "NewValidPassword123",
                        });
                    },
                    (err: any) => {
                        assert.ok(err instanceof BadRequestError);
                        assert.equal(err.message, "Incorrect current password");
                        return true;
                    }
                );
            } finally {
                prisma.user.findUnique = originalFindUnique;
            }
        });

        it("successfully updates password with correct current password and hashes new password", async () => {
            const mockPasswordHash = await bcrypt.hash("CorrectOldPassword123", 10);
            let updatedHash = "";

            const originalFindUnique = prisma.user.findUnique;
            const originalUpdate = prisma.user.update;

            (prisma.user as any).findUnique = async ({ where }: any) => {
                if (where.id === 999) {
                    return {
                        id: 999,
                        name: "Test User",
                        email: "test@example.com",
                        passwordHash: mockPasswordHash,
                    };
                }
                return null;
            };

            (prisma.user as any).update = async ({ where, data }: any) => {
                if (data.passwordHash) {
                    updatedHash = data.passwordHash;
                }
                return { id: where.id, passwordHash: data.passwordHash };
            };

            try {
                const result = await userService.changeUserPassword(999, {
                    currentPassword: "CorrectOldPassword123",
                    newPassword: "BrandNewSecurePassword123",
                });

                assert.equal(result.success, true);
                assert.ok(updatedHash.length > 0);
                // Verify new hash matches the new password
                const isNewMatch = await bcrypt.compare("BrandNewSecurePassword123", updatedHash);
                assert.equal(isNewMatch, true);
                // Verify new hash does NOT match old password
                const isOldMatch = await bcrypt.compare("CorrectOldPassword123", updatedHash);
                assert.equal(isOldMatch, false);
            } finally {
                prisma.user.findUnique = originalFindUnique;
                prisma.user.update = originalUpdate;
            }
        });

        it("updates user profile name safely without leaking passwordHash", async () => {
            const originalFindUnique = prisma.user.findUnique;
            const originalUpdate = prisma.user.update;

            (prisma.user as any).findUnique = async () => {
                return { id: 999, name: "Old Name", email: "user@example.com", passwordHash: "secret" };
            };

            (prisma.user as any).update = async ({ data }: any) => {
                return { id: 999, name: data.name, email: "user@example.com" };
            };

            try {
                const updated = await userService.updateProfile(999, { name: "New Name" });
                assert.equal(updated.name, "New Name");
                assert.equal(updated.email, "user@example.com");
                assert.equal((updated as any).passwordHash, undefined);
            } finally {
                prisma.user.findUnique = originalFindUnique;
                prisma.user.update = originalUpdate;
            }
        });

        it("throws NotFoundError when updating non-existent user", async () => {
            const originalFindUnique = prisma.user.findUnique;
            (prisma.user as any).findUnique = async () => null;

            try {
                await assert.rejects(
                    async () => {
                        await userService.updateProfile(9999, { name: "Ghost" });
                    },
                    (err: any) => {
                        assert.ok(err instanceof NotFoundError);
                        return true;
                    }
                );
            } finally {
                prisma.user.findUnique = originalFindUnique;
            }
        });
    });
});
