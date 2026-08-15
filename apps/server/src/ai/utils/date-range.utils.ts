// this file is used for transactions recording for users 
import { DateRangeIntent } from "../schemas/question.schema";


export const formatTransactionsDate = (

    date : Date

): string => {

    return date.toDateString();
};

//import { DateRangeIntent } from "../types/date-range.types";

export interface ResolvedDateRange {
    startDate: Date;
    endDate: Date;
}
/*
// this program basically resloves something like this {
    type: "RELATIVE",
    amount: 4,
    unit: "DAY"
} into  this
  Aug 10 00:00
     ↓
Aug 13 23:59

this is all that this function does 
/**
 * Returns the start of the given day.
 */
const startOfDay = (date: Date): Date => {
    const result = new Date(date);

    result.setHours(0, 0, 0, 0);

    return result;
};

/**
 * Returns the end of the given day.
 */
const endOfDay = (date: Date): Date => {
    const result = new Date(date);

    result.setHours(23, 59, 59, 999);

    return result;
};

/**
 * Returns the first day of the month.
 */
const startOfMonth = (date: Date): Date => {
    const result = new Date(date);

    result.setDate(1);
    result.setHours(0, 0, 0, 0);

    return result;
};

/**
 * Returns the last day of the month.
 */
const endOfMonth = (date: Date): Date => {
    const result = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    );

    return endOfDay(result);
};

/**
 * Returns the first day of the year.
 */
const startOfYear = (date: Date): Date => {
    const result = new Date(date);

    result.setMonth(0);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);

    return result;
};

/**
 * Returns the last day of the year.
 */
const endOfYear = (date: Date): Date => {
    const result = new Date(
        date.getFullYear(),
        11,
        31
    );

    return endOfDay(result);
};

/**
 * Returns the Monday of the week containing the given date.
 */
const startOfWeek = (date: Date): Date => {
    const result = startOfDay(date);

    const day = result.getDay();

    // JS: Sunday = 0, Monday = 1, ..., Saturday = 6
    const daysFromMonday = day === 0 ? 6 : day - 1;

    result.setDate(result.getDate() - daysFromMonday);

    return result;
};

/**
 * Returns the Sunday of the week containing the given date.
 */
const endOfWeek = (date: Date): Date => {
    const result = startOfWeek(date);

    result.setDate(result.getDate() + 6);

    return endOfDay(result);
};

/**
 * Resolves an NLP-derived date range into concrete dates.
 *
 * referenceDate exists so the function can be tested deterministically.
 */
export const resolveDateRange = (
    intent: DateRangeIntent,
    referenceDate: Date = new Date()
): ResolvedDateRange => {

    const reference = new Date(referenceDate);

    switch (intent.type) {

        case "RELATIVE": {
            const endDate = endOfDay(reference);
            const startDate = startOfDay(reference);

            switch (intent.unit) {

                case "DAY":
                    startDate.setDate(
                        startDate.getDate() - (intent.amount - 1)
                    );
                    break;

                case "WEEK":
                    startDate.setDate(
                        startDate.getDate() -
                        ((intent.amount * 7) - 1)
                    );
                    break;

                case "MONTH":
                    startDate.setMonth(
                        startDate.getMonth() - intent.amount
                    );
                    break;

                case "YEAR":
                    startDate.setFullYear(
                        startDate.getFullYear() - intent.amount
                    );
                    break;
            }

            return {
                startDate,
                endDate,
            };
        }

        case "CALENDAR_PERIOD": {

            switch (intent.period) {

                case "TODAY":
                    return {
                        startDate: startOfDay(reference),
                        endDate: endOfDay(reference),
                    };

                case "YESTERDAY": {
                    const yesterday = new Date(reference);

                    yesterday.setDate(
                        yesterday.getDate() - 1
                    );

                    return {
                        startDate: startOfDay(yesterday),
                        endDate: endOfDay(yesterday),
                    };
                }

                case "THIS_WEEK":
                    return {
                        startDate: startOfWeek(reference),
                        endDate: endOfWeek(reference),
                    };

                case "LAST_WEEK": {
                    const lastWeek = new Date(reference);

                    lastWeek.setDate(
                        lastWeek.getDate() - 7
                    );

                    return {
                        startDate: startOfWeek(lastWeek),
                        endDate: endOfWeek(lastWeek),
                    };
                }

                case "THIS_MONTH":
                    return {
                        startDate: startOfMonth(reference),
                        endDate: endOfMonth(reference),
                    };

                case "LAST_MONTH": {
                    const lastMonth = new Date(reference);

                    lastMonth.setMonth(
                        lastMonth.getMonth() - 1
                    );

                    return {
                        startDate: startOfMonth(lastMonth),
                        endDate: endOfMonth(lastMonth),
                    };
                }

                case "THIS_YEAR":
                    return {
                        startDate: startOfYear(reference),
                        endDate: endOfYear(reference),
                    };

                case "LAST_YEAR": {
                    const lastYear = new Date(reference);

                    lastYear.setFullYear(
                        lastYear.getFullYear() - 1
                    );

                    return {
                        startDate: startOfYear(lastYear),
                        endDate: endOfYear(lastYear),
                    };
                }
            }
        }

        case "ABSOLUTE": {
            const startDate = new Date(intent.startDate);
            const endDate = new Date(intent.endDate);

            if (
                Number.isNaN(startDate.getTime()) ||
                Number.isNaN(endDate.getTime())
            ) {
                throw new Error("Invalid absolute date range.");
            }

            if (startDate > endDate) {
                throw new Error(
                    "Start date cannot be after end date."
                );
            }

            return {
                startDate,
                endDate,
            };
        }
    }
};