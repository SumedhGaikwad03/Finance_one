import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import prisma from "../lib/prisma";
import app from "../app";
import { generateToken } from "../lib/jwt";
import { OllamaEmbeddingProvider } from "../ai/providers/ollama-embedding.provider";
import { OllamaLLMProvider } from "../ai/providers/ollama-llm.provider";
import { SkillMatcher } from "../ai/services/skill-matcher.service";
import { LLMQueryExtractor } from "../ai/services/llm-query-extractor.service";
import { TransactionQueryService } from "../ai/services/transaction-query.service";
import { AIService } from "../ai/services/ai.service";
import { retrivalSkill } from "../ai/skills/retrieval.skill";
import { Category, Priority } from "../generated/prisma/enums";
import { BadRequestError, ServiceUnavailableError, UnauthorizedError } from "../error/AppError";

describe("Finance One: AI Pipeline Stabilization Suite", () => {
    let server: http.Server;
    let baseUrl: string;

    // Test Users
    let userA: { id: number; email: string };
    let userB: { id: number; email: string };
    let tokenUserA: string;
    let tokenUserB: string;

    before(async () => {
        // Start HTTP test server on ephemeral port
        await new Promise<void>((resolve) => {
            server = app.listen(0, () => {
                const addr = server.address();
                if (addr && typeof addr === "object") {
                    baseUrl = `http://localhost:${addr.port}`;
                }
                resolve();
            });
        });

        // Ensure clean test users
        const emailA = `ai_test_user_a_${Date.now()}@example.com`;
        const emailB = `ai_test_user_b_${Date.now()}@example.com`;

        userA = await prisma.user.create({
            data: {
                name: "AI Test User A",
                email: emailA,
                passwordHash: "dummy_hashed_password_a",
            },
        });

        userB = await prisma.user.create({
            data: {
                name: "AI Test User B",
                email: emailB,
                passwordHash: "dummy_hashed_password_b",
            },
        });

        tokenUserA = generateToken(userA.id);
        tokenUserB = generateToken(userB.id);

        // Seed transactions for User A
        await prisma.transaction.createMany({
            data: [
                {
                    userId: userA.id,
                    amount: 150.0,
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL,
                    title: "Lunch Cafe",
                    transactionDate: new Date("2026-10-01T12:00:00Z"),
                },
                {
                    userId: userA.id,
                    amount: 350.0,
                    category: Category.FOOD,
                    priority: Priority.ESSENTIAL,
                    title: "Dinner Bistro",
                    transactionDate: new Date("2026-10-05T20:00:00Z"),
                },
                {
                    userId: userA.id,
                    amount: 500.0,
                    category: Category.FUEL,
                    priority: Priority.ESSENTIAL,
                    title: "Gas Station",
                    transactionDate: new Date("2026-10-10T08:00:00Z"),
                },
            ],
        });

        // Seed transactions for User B (Isolated Tenant)
        await prisma.transaction.createMany({
            data: [
                {
                    userId: userB.id,
                    amount: 9999.0,
                    category: Category.SHOPPING,
                    priority: Priority.LUXURY,
                    title: "User B Luxury Watch",
                    transactionDate: new Date("2026-10-02T15:00:00Z"),
                },
                {
                    userId: userB.id,
                    amount: 1200.0,
                    category: Category.FOOD,
                    priority: Priority.GOOD_TO_HAVE,
                    title: "User B Food Feast",
                    transactionDate: new Date("2026-10-03T18:00:00Z"),
                },
            ],
        });
    });

    after(async () => {
        // Cleanup test data
        if (userA?.id) {
            await prisma.transaction.deleteMany({ where: { userId: userA.id } });
            await prisma.user.delete({ where: { id: userA.id } });
        }
        if (userB?.id) {
            await prisma.transaction.deleteMany({ where: { userId: userB.id } });
            await prisma.user.delete({ where: { id: userB.id } });
        }

        // Close server
        if (server) {
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
    });

    // =========================================================================
    // 1. EMBEDDING PROVIDER RELIABILITY
    // =========================================================================
    describe("1. Embedding Provider Reliability", () => {
        it("rejects empty or whitespace-only text with BadRequestError", async () => {
            const provider = new OllamaEmbeddingProvider();
            await assert.rejects(
                () => provider.generateEmbedding("   "),
                (err: any) => err instanceof BadRequestError && err.statusCode === 400
            );
        });

        it("handles connection failure and timeouts with ServiceUnavailableError", async () => {
            // Point to an invalid unreachable port
            const deadProvider = new OllamaEmbeddingProvider({
                baseUrl: "http://127.0.0.1:59999",
                timeoutMs: 300,
            });

            await assert.rejects(
                () => deadProvider.generateEmbedding("Test query"),
                (err: any) => err instanceof ServiceUnavailableError && err.statusCode === 503
            );
        });

        it("validates exact vector dimensions and throws if dimension mismatch occurs", async () => {
            // Custom provider subclass with mock fetch returning 768 dimensions instead of 2560
            const originalFetch = globalThis.fetch;
            globalThis.fetch = async () => {
                return new Response(
                    JSON.stringify({
                        embeddings: [new Array(768).fill(0.1)],
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            };

            try {
                const provider = new OllamaEmbeddingProvider({ expectedDimensions: 2560 });
                await assert.rejects(
                    () => provider.generateEmbedding("Calculate my food costs"),
                    (err: any) =>
                        err instanceof ServiceUnavailableError &&
                        err.message.includes("Embedding dimension mismatch")
                );
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it("rejects non-finite vector values (NaN / Infinity)", async () => {
            const originalFetch = globalThis.fetch;
            const invalidVector = new Array(2560).fill(0.1);
            invalidVector[10] = NaN;

            globalThis.fetch = async () => {
                return new Response(
                    JSON.stringify({
                        embeddings: [invalidVector],
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            };

            try {
                const provider = new OllamaEmbeddingProvider({ expectedDimensions: 2560 });
                await assert.rejects(
                    () => provider.generateEmbedding("How much did I spend?"),
                    (err: any) =>
                        err instanceof ServiceUnavailableError &&
                        err.message.includes("non-finite")
                );
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it("handles provider HTTP 404 / model not found safely", async () => {
            const originalFetch = globalThis.fetch;
            globalThis.fetch = async () => {
                return new Response("model 'qwen3-embedding:4b' not found", {
                    status: 404,
                    headers: { "Content-Type": "text/plain" },
                });
            };

            try {
                const provider = new OllamaEmbeddingProvider();
                await assert.rejects(
                    () => provider.generateEmbedding("My query"),
                    (err: any) =>
                        err instanceof ServiceUnavailableError &&
                        err.message.includes("not available")
                );
            } finally {
                globalThis.fetch = originalFetch;
            }
        });
    });

    // =========================================================================
    // 2. SKILL MATCHER AND CONFIDENCE EVALUATION
    // =========================================================================
    describe("2. Skill Matcher & Confidence Evaluation", () => {
        it("returns non-matched for empty query string without calling provider", async () => {
            const matcher = new SkillMatcher({
                embeddingFn: async () => {
                    throw new Error("Should not be called");
                },
            });

            const result = await matcher.match("");
            assert.equal(result.matched, false);
            assert.equal(result.skill, null);
            assert.equal(result.score, 0);
            assert.equal(result.reason, "EMPTY_QUERY");
        });

        it("rejects matches below the confidence threshold", async () => {
            const mockVectorSearch: any = {
                search: async () => ({
                    skillId: "transaction-retrieval",
                    exampleText: "Some example",
                    model: "qwen3-embedding:4b",
                    dimensions: 2560,
                    distance: 0.45, // similarity = 1 - 0.45 = 0.55 < 0.70 threshold
                }),
            };

            const matcher = new SkillMatcher({
                vectorSearchService: mockVectorSearch,
                confidenceThreshold: 0.70,
                embeddingFn: async () => new Array(2560).fill(0.01),
            });

            const result = await matcher.match("Random unrelated sentence");
            assert.equal(result.matched, false);
            assert.equal(result.skill, null);
            assert.ok(Math.abs(result.score - 0.55) < 0.001);
            assert.equal(result.reason, "LOW_CONFIDENCE");
        });

        it("accepts and resolves registered skill when confidence meets threshold", async () => {
            const mockVectorSearch: any = {
                search: async () => ({
                    skillId: "transaction-retrieval",
                    exampleText: "How much did I spend on food?",
                    model: "qwen3-embedding:4b",
                    dimensions: 2560,
                    distance: 0.15, // similarity = 1 - 0.15 = 0.85 >= 0.70 threshold
                }),
            };

            const matcher = new SkillMatcher({
                vectorSearchService: mockVectorSearch,
                confidenceThreshold: 0.70,
                embeddingFn: async () => new Array(2560).fill(0.01),
                skillsRegistry: [retrivalSkill],
            });

            const result = await matcher.match("How much did I spend on food?");
            assert.equal(result.matched, true);
            assert.equal(result.skill?.id, "transaction-retrieval");
            assert.ok(Math.abs(result.score - 0.85) < 0.001);
            assert.equal(result.reason, "SUCCESS");
        });

        it("safely handles unknown skill IDs found in vector DB but missing in registry", async () => {
            const mockVectorSearch: any = {
                search: async () => ({
                    skillId: "unregistered-ghost-skill",
                    exampleText: "Ghost example",
                    model: "qwen3-embedding:4b",
                    dimensions: 2560,
                    distance: 0.1, // similarity = 0.90
                }),
            };

            const matcher = new SkillMatcher({
                vectorSearchService: mockVectorSearch,
                confidenceThreshold: 0.70,
                embeddingFn: async () => new Array(2560).fill(0.01),
                skillsRegistry: [retrivalSkill],
            });

            const result = await matcher.match("Some ghost query");
            assert.equal(result.matched, false);
            assert.equal(result.skill, null);
            assert.equal(result.reason, "UNKNOWN_SKILL");
        });
    });

    // =========================================================================
    // 3. LLM QUERY EXTRACTOR VALIDATION
    // =========================================================================
    describe("3. LLM Query Extractor & Normalization", () => {
        it("extracts structured query and strips markdown code fences", async () => {
            const mockLLM: any = {
                generate: async () => {
                    return "```json\n{\n  \"operation\": \"SUM\",\n  \"category\": \"FOOD\"\n}\n```";
                },
            };

            const extractor = new LLMQueryExtractor(mockLLM);
            const query = await extractor.extract({ question: "How much did I spend on food?" });

            assert.equal(query.operation, "SUM");
            assert.equal(query.category, Category.FOOD);
        });

        it("resolves relative date ranges correctly into concrete dates", async () => {
            const mockLLM: any = {
                generate: async () => {
                    return JSON.stringify({
                        operation: "LIST",
                        category: "FUEL",
                        dateRange: {
                            type: "RELATIVE",
                            amount: 7,
                            unit: "DAY",
                        },
                    });
                },
            };

            const extractor = new LLMQueryExtractor(mockLLM);
            const query = await extractor.extract({ question: "Show fuel from last 7 days" });

            assert.equal(query.operation, "LIST");
            assert.equal(query.category, Category.FUEL);
            assert.ok(query.startDate instanceof Date);
            assert.ok(query.endDate instanceof Date);
            assert.ok(query.startDate <= query.endDate);
        });

        it("throws BadRequestError if LLM produces invalid JSON", async () => {
            const mockLLM: any = {
                generate: async () => "Not valid JSON at all",
            };

            const extractor = new LLMQueryExtractor(mockLLM);
            await assert.rejects(
                () => extractor.extract({ question: "Test" }),
                (err: any) => err instanceof BadRequestError
            );
        });
    });

    // =========================================================================
    // 4. TRANSACTION QUERY SERVICE & STRICT MULTI-TENANT ISOLATION
    // =========================================================================
    describe("4. Structured Query Execution & Multi-Tenant Isolation", () => {
        const queryService = new TransactionQueryService();

        it("executes SUM operation and strictly isolates User A from User B", async () => {
            // User A has 150 + 350 + 500 = 1000 total. User B has 9999 + 1200.
            const resultA = await queryService.execute({ operation: "SUM" }, userA.id);
            assert.equal(resultA.operation, "SUM");
            assert.equal(resultA.total, 1000.0);
            assert.equal(resultA.count, 3);
            assert.equal(resultA.currency, "INR");

            const resultB = await queryService.execute({ operation: "SUM" }, userB.id);
            assert.equal(resultB.total, 11199.0);
            assert.equal(resultB.count, 2);
        });

        it("executes SUM with category filtering", async () => {
            // User A FOOD transactions: 150 + 350 = 500
            const result = await queryService.execute(
                { operation: "SUM", category: Category.FOOD },
                userA.id
            );
            assert.equal(result.total, 500.0);
            assert.equal(result.count, 2);
        });

        it("executes COUNT operation accurately", async () => {
            const countA = await queryService.execute({ operation: "COUNT" }, userA.id);
            assert.equal(countA.count, 3);

            const countAFood = await queryService.execute(
                { operation: "COUNT", category: Category.FOOD },
                userA.id
            );
            assert.equal(countAFood.count, 2);

            const countB = await queryService.execute({ operation: "COUNT" }, userB.id);
            assert.equal(countB.count, 2);
        });

        it("executes LIST operation ordered by date descending", async () => {
            const listA = await queryService.execute({ operation: "LIST" }, userA.id);
            assert.equal(listA.operation, "LIST");
            assert.equal(listA.transactions.length, 3);
            assert.equal(listA.transactions[0].amount, 500.0); // latest is 2026-10-10
            assert.equal(listA.transactions[1].amount, 350.0);
            assert.equal(listA.transactions[2].amount, 150.0);

            // Verify no User B transaction leaked into User A list
            for (const tx of listA.transactions) {
                assert.notEqual(tx.amount, 9999.0);
            }
        });

        it("executes MAX operation returning largest transaction", async () => {
            const maxA = await queryService.execute({ operation: "MAX" }, userA.id);
            assert.equal(maxA.operation, "MAX");
            assert.equal(maxA.amount, 500.0);
            assert.equal(maxA.transaction?.title, "Gas Station");

            // User B's max should be 9999.0
            const maxB = await queryService.execute({ operation: "MAX" }, userB.id);
            assert.equal(maxB.amount, 9999.0);
            assert.equal(maxB.transaction?.title, "User B Luxury Watch");
        });

        it("executes MIN operation returning smallest transaction", async () => {
            const minA = await queryService.execute({ operation: "MIN" }, userA.id);
            assert.equal(minA.operation, "MIN");
            assert.equal(minA.amount, 150.0);
            assert.equal(minA.transaction?.title, "Lunch Cafe");
        });

        it("handles empty result sets deterministically for SUM, COUNT, MAX, and MIN", async () => {
            // User A has 0 EDUCATION transactions
            const emptySum = await queryService.execute(
                { operation: "SUM", category: Category.EDUCATION },
                userA.id
            );
            assert.equal(emptySum.total, 0);
            assert.equal(emptySum.count, 0);

            const emptyMax = await queryService.execute(
                { operation: "MAX", category: Category.EDUCATION },
                userA.id
            );
            assert.equal(emptyMax.amount, 0);
            assert.equal(emptyMax.transaction, null);

            const emptyMin = await queryService.execute(
                { operation: "MIN", category: Category.EDUCATION },
                userA.id
            );
            assert.equal(emptyMin.amount, 0);
            assert.equal(emptyMin.transaction, null);
        });

        it("validates date ranges and rejects startDate > endDate with BadRequestError", async () => {
            await assert.rejects(
                () =>
                    queryService.execute(
                        {
                            operation: "SUM",
                            startDate: new Date("2026-10-15T00:00:00Z"),
                            endDate: new Date("2026-10-01T00:00:00Z"),
                        },
                        userA.id
                    ),
                (err: any) => err instanceof BadRequestError && err.statusCode === 400
            );
        });

        it("rejects execution when userId is missing or invalid", async () => {
            await assert.rejects(
                () => queryService.execute({ operation: "SUM" }, 0),
                (err: any) => err instanceof BadRequestError
            );
        });
    });

    // =========================================================================
    // 5. PRODUCTION EXPRESS API (POST /api/ai/query)
    // =========================================================================
    describe("5. Production API: POST /api/ai/query", () => {
        it("rejects unauthenticated requests with 401 Unauthorized", async () => {
            const response = await fetch(`${baseUrl}/api/ai/query`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: "How much did I spend on food?" }),
            });

            assert.equal(response.status, 401);
            const body = await response.json();
            assert.ok(body.message.includes("authorization header"));
        });

        it("rejects invalid request body with 400 Bad Request", async () => {
            const response = await fetch(`${baseUrl}/api/ai/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenUserA}`,
                },
                body: JSON.stringify({ question: "" }), // empty question
            });

            assert.equal(response.status, 400);
            const body = await response.json();
            assert.equal(body.message, "Validation failed");
        });

        it("processes query end-to-end for authenticated User A and returns verified facts", async () => {
            // Temporarily wire AIService with mock matcher & extractor for reliable deterministic HTTP testing
            const mockMatcher: any = {
                match: async (q: string) => ({
                    matched: true,
                    skill: retrivalSkill,
                    score: 0.92,
                    reason: "SUCCESS",
                }),
            };

            const mockExtractor: any = {
                extract: async () => ({
                    operation: "SUM",
                    category: Category.FOOD,
                }),
            };

            const testAIService = new AIService({
                skillMatcher: mockMatcher,
                queryExtractor: mockExtractor,
                transactionQueryService: new TransactionQueryService(),
            });

            // Call queryTransactions on test instance directly
            const result = await testAIService.queryTransactions(
                { question: "How much did I spend on food?" },
                userA.id
            );

            assert.equal(result.success, true);
            assert.equal(result.matched, true);
            assert.equal(result.skill?.id, "transaction-retrieval");
            assert.equal(result.query?.operation, "SUM");
            assert.equal(result.query?.category, "FOOD");
            assert.equal(result.data.total, 500.0);
            assert.equal(result.data.count, 2);
        });

        it("returns controlled 200 response with matched=false when confidence is low", async () => {
            const mockMatcher: any = {
                match: async () => ({
                    matched: false,
                    skill: null,
                    score: 0.42,
                    reason: "LOW_CONFIDENCE",
                }),
            };

            const testAIService = new AIService({
                skillMatcher: mockMatcher,
            });

            const result = await testAIService.queryTransactions(
                { question: "Tell me a joke about dogs" },
                userA.id
            );

            assert.equal(result.success, true);
            assert.equal(result.matched, false);
            assert.equal(result.skill, null);
            assert.equal(result.data, null);
            assert.ok(result.message?.includes("Could not confidently match"));
        });

        it("returns 503 Service Unavailable when AI embedding provider fails", async () => {
            // Mock failing provider in testAIService
            const mockMatcher: any = {
                match: async () => {
                    throw new ServiceUnavailableError("AI embedding service is currently unreachable.");
                },
            };

            const testAIService = new AIService({
                skillMatcher: mockMatcher,
            });

            await assert.rejects(
                () => testAIService.queryTransactions({ question: "My query" }, userA.id),
                (err: any) => err instanceof ServiceUnavailableError && err.statusCode === 503
            );
        });

        it("HTTP POST /api/ai/query executes through full Express middleware stack", async () => {
            const response = await fetch(`${baseUrl}/api/ai/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenUserA}`,
                },
                body: JSON.stringify({ question: "How much did I spend on food?" }),
            });

            // Either 200 if Ollama is running or 503 if Ollama is offline - server must not crash
            assert.ok([200, 503].includes(response.status));
            const body = await response.json();
            assert.ok(body);
        });
    });

    // =========================================================================
    // 6. NON-AI RESILIENCE (Ordinary Finance APIs work even if AI fails)
    // =========================================================================
    describe("6. Non-AI Feature Isolation & Resilience", () => {
        it("ordinary transactions API remains fully functional regardless of AI subsystem", async () => {
            const response = await fetch(`${baseUrl}/api/transactions`, {
                headers: {
                    Authorization: `Bearer ${tokenUserA}`,
                },
            });

            assert.equal(response.status, 200);
            const data = await response.json();
            assert.ok(Array.isArray(data));
            assert.equal(data.length, 3);
        });

        it("health check endpoint returns 200 independently of AI state", async () => {
            const response = await fetch(`${baseUrl}/health`);
            assert.equal(response.status, 200);
            const data = await response.json();
            assert.equal(data.status, "OK");
            assert.equal(data.database, "healthy");
        });
    });
});
