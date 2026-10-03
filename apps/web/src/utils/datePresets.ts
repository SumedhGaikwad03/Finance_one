export type DatePresetKey = "all" | "this-week" | "this-month" | "last-month" | "custom";

export interface ResolvedDateRange {
    startDate?: string;
    endDate?: string;
    label: string;
}

export const resolveDatePreset = (preset: DatePresetKey, customStart?: string, customEnd?: string): ResolvedDateRange => {
    const now = new Date();

    switch (preset) {
        case "this-week": {
            // Find start of current week (Monday)
            const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
            const distanceToMonday = (dayOfWeek + 6) % 7;
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - distanceToMonday);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            return {
                startDate: startOfWeek.toISOString(),
                endDate: endOfWeek.toISOString(),
                label: "This Week",
            };
        }

        case "this-month": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            return {
                startDate: startOfMonth.toISOString(),
                endDate: endOfMonth.toISOString(),
                label: "This Month",
            };
        }

        case "last-month": {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const lastMonthName = monthNames[startOfLastMonth.getMonth()];

            return {
                startDate: startOfLastMonth.toISOString(),
                endDate: endOfLastMonth.toISOString(),
                label: `Last Month (${lastMonthName})`,
            };
        }

        case "custom": {
            const start = customStart ? new Date(customStart).toISOString() : undefined;
            const end = customEnd ? new Date(customEnd).toISOString() : undefined;
            return {
                startDate: start,
                endDate: end,
                label: customStart && customEnd ? `${customStart} to ${customEnd}` : "Custom Date Range",
            };
        }

        case "all":
        default:
            return {
                startDate: undefined,
                endDate: undefined,
                label: "Any Time",
            };
    }
};
