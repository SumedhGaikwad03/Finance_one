import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import type { Server } from "node:http";
import app from "../app";
import prisma from "../lib/prisma";
import { generateToken, verifyToken } from "../lib/jwt";

// Schemas
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { createUserSchema } from "../schemas/user.schema";

// Services & Repositories
import * as authService from "../services/auth.service";
import * as userService from "../services/user.service";
import * as userRepository from "../repositories/user.repository";

// Errors
import { ConflictError, UnauthorizedError, BadRequestError } from "../error/AppError";

describe("Authentication Email Normalization Suite", () => {
    let server: Server;
    let baseUrl: string;

    before(async () => {
        await new Promise<void>((resolve) => {
            server = app.listen(0, () => {
                const addr = server.address();
                if (addr && typeof addr === "object") {
                    baseUrl = `http://localhost:${addr.port}`;
                }
                resolve();
            });
        });
    });

    after(async () => {
        if (server) {
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
        await prisma.$disconnect();
    });

    // =========================================================================
    // 1. INPUT BOUNDARY SCHEMA NORMALIZATION
    // =========================================================================
    describe("1. Schema Normalization & Validation", () => {
        it("normalizes uppercase and mixed-case email to lowercase in registerSchema", () => {
            const parsed = registerSchema.parse({
                name: "John Doe",
                email: "John.Doe@EXAMPLE.COM",
                password: "SecurePassword123!",
            });

            assert.equal(parsed.email, "john.doe@example.com");
            assert.equal(parsed.name, "John Doe");
            // Verifies password is NOT modified or lowercased
            assert.equal(parsed.password, "SecurePassword123!");
        });

        it("trims surrounding whitespace from email in registerSchema", () => {
            const parsed = registerSchema.parse({
                name: "Spaced User",
                email: "   spaced.user@example.com   ",
                password: "Password12345",
            });

            assert.equal(parsed.email, "spaced.user@example.com");
        });

        it("normalizes casing and trims whitespace in loginSchema", () => {
            const parsed = loginSchema.parse({
                email: "   USER.LOGIN@Domain.Com   ",
                password: "Password12345",
            });

            assert.equal(parsed.email, "user.login@domain.com");
            assert.equal(parsed.password, "Password12345");
        });

        it("normalizes email in createUserSchema", () => {
            const parsed = createUserSchema.parse({
                name: "Admin Created",
                email: "  ADMIN.Created@Finance.One  ",
            });

            assert.equal(parsed.email, "admin.created@finance.one");
            assert.equal(parsed.name, "Admin Created");
        });

        it("rejects invalid email formats in registerSchema", () => {
            const invalidEmails = [
                "not-an-email",
                "missing-domain@",
                "@missing-local.com",
                "spaces in@domain.com",
                "   ",
                "",
            ];

            for (const email of invalidEmails) {
                assert.throws(
                    () => {
                        registerSchema.parse({
                            name: "Test",
                            email,
                            password: "ValidPassword123!",
                        });
                    },
                    (err: any) => {
                        assert.ok(err.name === "ZodError", `Expected ZodError for email: "${email}"`);
                        return true;
                    }
                );
            }
        });

        it("rejects invalid email formats in loginSchema", () => {
            const invalidEmails = ["not-an-email", "   ", ""];

            for (const email of invalidEmails) {
                assert.throws(
                    () => {
                        loginSchema.parse({
                            email,
                            password: "ValidPassword123!",
                        });
                    },
                    (err: any) => {
                        assert.ok(err.name === "ZodError", `Expected ZodError for email: "${email}"`);
                        return true;
                    }
                );
            }
        });
    });

    // =========================================================================
    // 2. REPOSITORY & DETERMINISTIC LOOKUP
    // =========================================================================
    describe("2. User Repository Case-Insensitive Lookup", () => {
        const testUserEmail = `repo_norm_test_${Date.now()}@example.com`;
        let createdUserId: number;

        before(async () => {
            const passwordHash = await bcrypt.hash("HashPass123!", 10);
            const user = await userRepository.addUser({
                name: "Repo Test User",
                email: testUserEmail,
                passwordHash,
            });
            createdUserId = user.id;
        });

        after(async () => {
            if (createdUserId) {
                await prisma.user.deleteMany({ where: { id: createdUserId } });
            }
        });

        it("finds user regardless of query casing", async () => {
            const variations = [
                testUserEmail.toUpperCase(),
                testUserEmail.toLowerCase(),
                testUserEmail,
                `  ${testUserEmail.toUpperCase()}  `,
                `  ${testUserEmail.toLowerCase()}  `,
            ];

            for (const emailVar of variations) {
                const found = await userRepository.findUserbyEmail(emailVar);
                assert.ok(found !== null, `Failed to find user with variation: ${emailVar}`);
                assert.equal(found?.id, createdUserId);
                assert.equal(found?.email, testUserEmail.toLowerCase());
            }
        });

        it("returns null safely for non-existent email", async () => {
            const found = await userRepository.findUserbyEmail("ghost_non_existent@example.com");
            assert.equal(found, null);
        });

        it("normalizes email when updating user data in repository", async () => {
            const updatedEmail = `repo_updated_${Date.now()}@EXAMPLE.COM`;
            const updated = await userRepository.updateUserdata(createdUserId, {
                email: updatedEmail,
            });

            assert.equal(updated.email, updatedEmail.toLowerCase());

            // Verify lookup by lowercase matches
            const reFound = await userRepository.findUserbyEmail(updatedEmail.toLowerCase());
            assert.equal(reFound?.id, createdUserId);
        });
    });

    // =========================================================================
    // 3. AUTH SERVICE REGISTRATION & LOGIN
    // =========================================================================
    describe("3. Authentication Service Registration & Login", () => {
        const baseEmail = `service_auth_${Date.now()}@example.com`;
        const testPassword = "OriginalPassword999!";
        let registeredUserId: number;

        after(async () => {
            if (registeredUserId) {
                await prisma.user.deleteMany({ where: { id: registeredUserId } });
            }
        });

        it("registers user with uppercase email and stores normalized lowercase email", async () => {
            const uppercaseInput = baseEmail.toUpperCase();
            const result = await authService.registerUser({
                name: "Upper Registrant",
                email: uppercaseInput,
                password: testPassword,
            });

            registeredUserId = result.id;
            assert.equal(result.email, baseEmail.toLowerCase());
            assert.equal(result.name, "Upper Registrant");
        });

        it("prevents duplicate registration with different casing (409 Conflict)", async () => {
            // Attempt 1: all lowercase
            await assert.rejects(
                async () => {
                    await authService.registerUser({
                        name: "Duplicate User",
                        email: baseEmail.toLowerCase(),
                        password: "DifferentPassword123!",
                    });
                },
                (err: any) => {
                    assert.ok(err instanceof ConflictError);
                    assert.equal(err.message, "email already exists");
                    return true;
                }
            );

            // Attempt 2: mixed case with whitespace
            await assert.rejects(
                async () => {
                    await authService.registerUser({
                        name: "Duplicate User 2",
                        email: `  ${baseEmail.toUpperCase()}  `,
                        password: "DifferentPassword123!",
                    });
                },
                (err: any) => {
                    assert.ok(err instanceof ConflictError);
                    assert.equal(err.message, "email already exists");
                    return true;
                }
            );
        });

        it("logs in successfully with uppercase email", async () => {
            const result = await authService.loginUser({
                email: baseEmail.toUpperCase(),
                password: testPassword,
            });

            assert.ok(result.token);
            assert.equal(result.user.id, registeredUserId);
            assert.equal(result.user.email, baseEmail.toLowerCase());
        });

        it("logs in successfully with leading and trailing whitespace", async () => {
            const result = await authService.loginUser({
                email: `   ${baseEmail}   `,
                password: testPassword,
            });

            assert.ok(result.token);
            assert.equal(result.user.id, registeredUserId);
        });

        it("rejects login with wrong password (401 Unauthorized)", async () => {
            await assert.rejects(
                async () => {
                    await authService.loginUser({
                        email: baseEmail,
                        password: "WrongPassword123!",
                    });
                },
                (err: any) => {
                    assert.ok(err instanceof UnauthorizedError);
                    assert.equal(err.message, "Invalid email or password");
                    return true;
                }
            );
        });

        it("rejects login with non-existent email (401 Unauthorized) without leaking existence", async () => {
            await assert.rejects(
                async () => {
                    await authService.loginUser({
                        email: "completely_fake_email_9999@example.com",
                        password: testPassword,
                    });
                },
                (err: any) => {
                    assert.ok(err instanceof UnauthorizedError);
                    assert.equal(err.message, "Invalid email or password");
                    return true;
                }
            );
        });
    });

    // =========================================================================
    // 4. HTTP API INTEGRATION (POST /api/auth/register & POST /api/auth/login)
    // =========================================================================
    describe("4. HTTP Authentication Endpoints", () => {
        const httpTestEmail = `http_auth_${Date.now()}@example.com`;
        const httpPassword = "HttpSecurePass123!";
        let httpUserId: number;

        after(async () => {
            if (httpUserId) {
                await prisma.user.deleteMany({ where: { id: httpUserId } });
            }
        });

        it("POST /api/auth/register normalizes email and returns 201 Created", async () => {
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "HTTP User",
                    email: `  ${httpTestEmail.toUpperCase()}  `,
                    password: httpPassword,
                }),
            });

            assert.equal(response.status, 201);
            const body = await response.json();
            httpUserId = body.id;
            assert.equal(body.email, httpTestEmail.toLowerCase());
            assert.equal(body.name, "HTTP User");
            // Ensures passwordHash is not returned
            assert.equal(body.passwordHash, undefined);
        });

        it("POST /api/auth/register rejects duplicate email regardless of case (409 Conflict)", async () => {
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Duplicate HTTP User",
                    email: httpTestEmail.toLowerCase(),
                    password: "AnotherPassword123!",
                }),
            });

            assert.equal(response.status, 409);
            const body = await response.json();
            assert.equal(body.message, "email already exists");
        });

        it("POST /api/auth/login succeeds with uppercase email and returns 200 with JWT token", async () => {
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: httpTestEmail.toUpperCase(),
                    password: httpPassword,
                }),
            });

            assert.equal(response.status, 200);
            const body = await response.json();
            assert.ok(body.token);
            assert.equal(body.user.email, httpTestEmail.toLowerCase());
            assert.equal(body.user.id, httpUserId);

            // Verify JWT token payload
            const payload = verifyToken(body.token);
            assert.equal(payload.userId, httpUserId);
        });

        it("POST /api/auth/login succeeds with leading/trailing whitespace", async () => {
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: `   ${httpTestEmail}   `,
                    password: httpPassword,
                }),
            });

            assert.equal(response.status, 200);
            const body = await response.json();
            assert.ok(body.token);
        });

        it("POST /api/auth/login rejects wrong password with 401 Unauthorized", async () => {
            const response = await fetch(`${baseUrl}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: httpTestEmail,
                    password: "WrongPassword999!",
                }),
            });

            assert.equal(response.status, 401);
            const body = await response.json();
            assert.equal(body.message, "Invalid email or password");
        });

        it("POST /api/auth/register rejects invalid email with 400 Bad Request", async () => {
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "Test",
                    email: "invalid-email-address",
                    password: "Password123!",
                }),
            });

            assert.equal(response.status, 400);
            const body = await response.json();
            assert.equal(body.message, "Validation failed");
        });
    });

    // =========================================================================
    // 5. PASSWORD INTEGRITY & SESSION REGRESSION
    // =========================================================================
    describe("5. Password Integrity & Session Regression", () => {
        it("strictly preserves password leading and trailing spaces (passwords are NOT trimmed)", async () => {
            const specialEmail = `password_space_${Date.now()}@example.com`;
            const spacedPassword = "  ExactSpacedPassword123!  ";
            let userId: number | undefined;

            try {
                // Register with exact password
                const user = await authService.registerUser({
                    name: "Spaced Password User",
                    email: specialEmail,
                    password: spacedPassword,
                });
                userId = user.id;

                // Login with exact password succeeds
                const loginSuccess = await authService.loginUser({
                    email: specialEmail.toUpperCase(),
                    password: spacedPassword,
                });
                assert.ok(loginSuccess.token);

                // Login with trimmed password FAILS (proves password is NOT trimmed)
                await assert.rejects(
                    async () => {
                        await authService.loginUser({
                            email: specialEmail,
                            password: spacedPassword.trim(),
                        });
                    },
                    (err: any) => {
                        assert.ok(err instanceof UnauthorizedError);
                        return true;
                    }
                );
            } finally {
                if (userId) {
                    await prisma.user.deleteMany({ where: { id: userId } });
                }
            }
        });

        it("authenticates session via GET /api/auth/me with Bearer token", async () => {
            const sessionEmail = `session_user_${Date.now()}@example.com`;
            let userId: number | undefined;

            try {
                const user = await authService.registerUser({
                    name: "Session User",
                    email: sessionEmail,
                    password: "SessionPassword123!",
                });
                userId = user.id;

                const token = generateToken(user.id);

                const response = await fetch(`${baseUrl}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                assert.equal(response.status, 200);
                const body = await response.json();
                assert.equal(body.user.id, user.id);
                assert.equal(body.user.email, sessionEmail.toLowerCase());
                assert.equal(body.user.passwordHash, undefined);
            } finally {
                if (userId) {
                    await prisma.user.deleteMany({ where: { id: userId } });
                }
            }
        });
    });
});
