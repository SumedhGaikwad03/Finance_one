import prisma from "../lib/prisma";
import { NotFoundError } from "../error/AppError";
import { recurringExpenseDetector } from "../recurring/recurring-detector";
import { recurringPreferenceStore } from "../recurring/recurring-preference.store";
import {
    RecurringDetectionOptions,
    RecurringPattern,
    RecurringPatternsResponse,
} from "../recurring/recurring.types";
import { RecurringQueryInput } from "../schemas/recurring.schema";

export class RecurringService {
    /**
     * Retrieves transactions for the authenticated user and detects recurring patterns.
     * Uses bounded time window to avoid expensive full-history scans on large ledgers.
     */
    public async getRecurringPatterns(
        userId: number,
        query: Partial<RecurringQueryInput> = {}
    ): Promise<RecurringPatternsResponse> {
        const lookbackMonths = query.lookbackMonths ?? 24; // Default 2 years lookback to capture annual renewals
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);

        // Bounded database query utilizing the [userId, transactionDate] index
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                transactionDate: {
                    gte: cutoffDate,
                },
            },
            orderBy: {
                transactionDate: "desc",
            },
            take: 1000, // Safe bound to protect memory and event loop
        });

        const options: RecurringDetectionOptions = {
            includeDismissed: query.includeDismissed,
            minConfidence: query.minConfidence,
            statusFilter: query.status,
            typeFilter: query.type,
            frequencyFilter: query.frequency,
        };

        return recurringExpenseDetector.detect(transactions, userId, options);
    }

    /**
     * Retrieves a single detected pattern by ID for the authenticated user.
     */
    public async getRecurringPatternById(userId: number, patternId: string): Promise<RecurringPattern> {
        const response = await this.getRecurringPatterns(userId, { includeDismissed: true });
        const pattern = response.patterns.find((p) => p.id === patternId);

        if (!pattern) {
            throw new NotFoundError(`Recurring payment pattern '${patternId}' not found for this user`);
        }

        return pattern;
    }

    /**
     * Confirms a recurring payment pattern for the user.
     */
    public async confirmRecurringPattern(
        userId: number,
        patternId: string,
        notes?: string
    ): Promise<RecurringPattern> {
        // Verify pattern exists for this user first
        await this.getRecurringPatternById(userId, patternId);

        recurringPreferenceStore.confirmPattern(userId, patternId, notes);
        return this.getRecurringPatternById(userId, patternId);
    }

    /**
     * Dismisses a recurring payment pattern for the user.
     */
    public async dismissRecurringPattern(
        userId: number,
        patternId: string
    ): Promise<RecurringPattern> {
        // Verify pattern exists for this user first
        await this.getRecurringPatternById(userId, patternId);

        recurringPreferenceStore.dismissPattern(userId, patternId);
        return this.getRecurringPatternById(userId, patternId);
    }

    /**
     * Resets a pattern's status back to POSSIBLE.
     */
    public async resetRecurringPattern(
        userId: number,
        patternId: string
    ): Promise<RecurringPattern> {
        // Verify pattern exists for this user first
        await this.getRecurringPatternById(userId, patternId);

        recurringPreferenceStore.resetPattern(userId, patternId);
        return this.getRecurringPatternById(userId, patternId);
    }
}

export const recurringService = new RecurringService();
