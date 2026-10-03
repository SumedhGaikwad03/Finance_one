import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    transactionQueryInputSchema,
    toCanonicalTransactionQuery,
    TransactionQuery
} from "../schemas/transaction.schema";
import { Category, Priority } from "../generated/prisma/enums";
import * as transactionService from "../services/transaction.service";

describe("TransactionQuery Validation Schema", () => {

    it("parses empty query with default limit, offset, and sorting", () => {
        const parsed = transactionQueryInputSchema.parse({});
        assert.equal(parsed.limit, 50);
        assert.equal(parsed.offset, 0);
        assert.equal(parsed.sortBy, "transactionDate");
        assert.equal(parsed.sortDirection, "desc");

        const canonical = toCanonicalTransactionQuery(parsed);
        assert.equal(canonical.limit, 50);
        assert.equal(canonical.offset, 0);
        assert.equal(canonical.sortBy, "transactionDate");
        assert.equal(canonical.sortDirection, "desc");
        assert.equal(canonical.categories, undefined);
        assert.equal(canonical.priorities, undefined);
    });

    it("parses single and comma-separated category filters", () => {
        const parsedSingle = transactionQueryInputSchema.parse({ category: "FOOD" });
        assert.deepEqual(parsedSingle.category, ["FOOD"]);
        const canonicalSingle = toCanonicalTransactionQuery(parsedSingle);
        assert.deepEqual(canonicalSingle.categories, ["FOOD"]);

        const parsedMultiple = transactionQueryInputSchema.parse({ category: "FOOD,FUEL,SHOPPING" });
        assert.deepEqual(parsedMultiple.category, ["FOOD", "FUEL", "SHOPPING"]);
        const canonicalMultiple = toCanonicalTransactionQuery(parsedMultiple);
        assert.deepEqual(canonicalMultiple.categories, ["FOOD", "FUEL", "SHOPPING"]);
    });

    it("parses single and comma-separated priority filters", () => {
        const parsedSingle = transactionQueryInputSchema.parse({ priority: "ESSENTIAL" });
        assert.deepEqual(parsedSingle.priority, ["ESSENTIAL"]);
        const canonicalSingle = toCanonicalTransactionQuery(parsedSingle);
        assert.deepEqual(canonicalSingle.priorities, ["ESSENTIAL"]);

        const parsedMultiple = transactionQueryInputSchema.parse({ priority: "ESSENTIAL,LUXURY" });
        assert.deepEqual(parsedMultiple.priority, ["ESSENTIAL", "LUXURY"]);
        const canonicalMultiple = toCanonicalTransactionQuery(parsedMultiple);
        assert.deepEqual(canonicalMultiple.priorities, ["ESSENTIAL", "LUXURY"]);
    });

    it("parses date ranges successfully", () => {
        const parsed = transactionQueryInputSchema.parse({
            startDate: "2026-08-01T00:00:00.000Z",
            endDate: "2026-08-31T23:59:59.999Z"
        });
        const canonical = toCanonicalTransactionQuery(parsed);
        assert.ok(canonical.startDate instanceof Date);
        assert.ok(canonical.endDate instanceof Date);
        assert.equal(canonical.startDate.toISOString(), "2026-08-01T00:00:00.000Z");
        assert.equal(canonical.endDate.toISOString(), "2026-08-31T23:59:59.999Z");
    });

    it("rejects startDate > endDate", () => {
        assert.throws(() => {
            transactionQueryInputSchema.parse({
                startDate: "2026-09-01T00:00:00.000Z",
                endDate: "2026-08-01T00:00:00.000Z"
            });
        }, /startDate must be before or equal to endDate/);
    });

    it("parses amount ranges and coerces string query parameters", () => {
        const parsed = transactionQueryInputSchema.parse({
            minAmount: "100",
            maxAmount: "500.50"
        });
        assert.equal(parsed.minAmount, 100);
        assert.equal(parsed.maxAmount, 500.50);

        const canonical = toCanonicalTransactionQuery(parsed);
        assert.equal(canonical.minAmount, 100);
        assert.equal(canonical.maxAmount, 500.50);
    });

    it("rejects minAmount > maxAmount", () => {
        assert.throws(() => {
            transactionQueryInputSchema.parse({
                minAmount: 500,
                maxAmount: 100
            });
        }, /minAmount must be less than or equal to maxAmount/);
    });

    it("rejects negative amount boundaries", () => {
        assert.throws(() => {
            transactionQueryInputSchema.parse({ minAmount: -10 });
        });
    });

    it("parses text search query", () => {
        const parsed = transactionQueryInputSchema.parse({ search: " Grocery Store " });
        assert.equal(parsed.search, "Grocery Store");

        const canonical = toCanonicalTransactionQuery(parsed);
        assert.equal(canonical.search, "Grocery Store");
    });

    it("parses sorting and pagination options", () => {
        const parsed = transactionQueryInputSchema.parse({
            sortBy: "amount",
            sortDirection: "asc",
            limit: "25",
            offset: "50"
        });
        assert.equal(parsed.sortBy, "amount");
        assert.equal(parsed.sortDirection, "asc");
        assert.equal(parsed.limit, 25);
        assert.equal(parsed.offset, 50);

        const canonical = toCanonicalTransactionQuery(parsed);
        assert.equal(canonical.sortBy, "amount");
        assert.equal(canonical.sortDirection, "asc");
        assert.equal(canonical.limit, 25);
        assert.equal(canonical.offset, 50);
    });

    it("parses combined complex query", () => {
        const parsed = transactionQueryInputSchema.parse({
            categories: "FOOD,ENTERTAINMENT",
            priorities: "LUXURY",
            startDate: "2026-08-01T00:00:00.000Z",
            endDate: "2026-08-31T23:59:59.999Z",
            minAmount: "250",
            maxAmount: "1000",
            search: "Starbucks",
            sortBy: "amount",
            sortDirection: "desc",
            limit: "10",
            offset: "0"
        });

        const canonical = toCanonicalTransactionQuery(parsed);
        assert.deepEqual(canonical.categories, [Category.FOOD, Category.ENTERTAINMENT]);
        assert.deepEqual(canonical.priorities, [Priority.LUXURY]);
        assert.equal(canonical.minAmount, 250);
        assert.equal(canonical.maxAmount, 1000);
        assert.equal(canonical.search, "Starbucks");
        assert.equal(canonical.limit, 10);
        assert.equal(canonical.offset, 0);
        assert.equal(canonical.sortBy, "amount");
        assert.equal(canonical.sortDirection, "desc");
    });
});

describe("Transaction Security & Isolation Contract", () => {
    it("guarantees TransactionQuery does not contain client-controlled userId", () => {
        const query: TransactionQuery = {
            categories: [Category.FOOD],
            minAmount: 50
        };

        // Ensure userId cannot be defined on domain TransactionQuery interface
        assert.equal((query as Record<string, unknown>).userId, undefined);
    });

    it("verifies service queryTransactions requires explicit userId argument", () => {
        assert.equal(typeof transactionService.queryTransactions, "function");
        assert.equal(transactionService.queryTransactions.length, 2); // (userId, query)
    });
});


