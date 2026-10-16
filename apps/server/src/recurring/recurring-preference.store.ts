import { RecurringPatternPreference, RecurringStatus } from "./recurring.types";

/**
 * Tenant-isolated in-memory store for user recurring payment preferences.
 * Stores confirmed and dismissed status overrides on detected patterns.
 */
class RecurringPreferenceStore {
    // Key format: `${userId}:${patternId}`
    private preferences = new Map<string, RecurringPatternPreference>();

    private buildKey(userId: number, patternId: string): string {
        return `${userId}:${patternId}`;
    }

    public getPreference(userId: number, patternId: string): RecurringPatternPreference | undefined {
        return this.preferences.get(this.buildKey(userId, patternId));
    }

    public getAllPreferencesForUser(userId: number): Map<string, RecurringPatternPreference> {
        const userPrefs = new Map<string, RecurringPatternPreference>();
        const prefix = `${userId}:`;

        for (const [key, value] of this.preferences.entries()) {
            if (key.startsWith(prefix)) {
                userPrefs.set(value.patternId, value);
            }
        }

        return userPrefs;
    }

    public confirmPattern(userId: number, patternId: string, userNotes?: string): RecurringPatternPreference {
        const pref: RecurringPatternPreference = {
            userId,
            patternId,
            status: "CONFIRMED",
            userNotes,
            updatedAt: new Date().toISOString(),
        };

        this.preferences.set(this.buildKey(userId, patternId), pref);
        return pref;
    }

    public dismissPattern(userId: number, patternId: string): RecurringPatternPreference {
        const pref: RecurringPatternPreference = {
            userId,
            patternId,
            status: "DISMISSED",
            updatedAt: new Date().toISOString(),
        };

        this.preferences.set(this.buildKey(userId, patternId), pref);
        return pref;
    }

    public resetPattern(userId: number, patternId: string): void {
        this.preferences.delete(this.buildKey(userId, patternId));
    }

    public clearPreferences(userId?: number): void {
        if (userId !== undefined) {
            const prefix = `${userId}:`;
            for (const key of this.preferences.keys()) {
                if (key.startsWith(prefix)) {
                    this.preferences.delete(key);
                }
            }
        } else {
            this.preferences.clear();
        }
    }
}

export const recurringPreferenceStore = new RecurringPreferenceStore();
