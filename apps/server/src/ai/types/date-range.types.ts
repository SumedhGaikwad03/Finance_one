// this is to  understand date time form nlp to a foramat that our db understsnads 
// as if user says "pull up  food trnasaction from last 4 days "
// we must be also to determine the range of trnasactions 

export type RelativeDateUnit =
    | "DAY"
    | "WEEK"
    | "MONTH"
    | "YEAR";

export type CalendarPeriod =
    | "TODAY"
    | "YESTERDAY"
    | "THIS_WEEK"
    | "LAST_WEEK"
    | "THIS_MONTH"
    | "LAST_MONTH"
    | "THIS_YEAR"
    | "LAST_YEAR";

export type DateRangeIntent =
    | {
        type: "RELATIVE";
        amount: number;
        unit: RelativeDateUnit;
    }
    | {
        type: "CALENDAR_PERIOD";
        period: CalendarPeriod;
    }
    | {
        type: "ABSOLUTE";
        startDate: string;
        endDate: string;
    };

    // this is technically a list of choices where each option is a object itself 