//basiclly and enum for budget periods and how they work 


export const BUDGET_PERIODS = [
    "WEEKLY",
    "MONTHLY",
    "QUARTERLY",
] as const; // treat these strings as the only truth values here unchageable exact strings 

export type BudgetPeriod =
    typeof BUDGET_PERIODS[number];// single sourec of thruth and also give some sort of intellesene 