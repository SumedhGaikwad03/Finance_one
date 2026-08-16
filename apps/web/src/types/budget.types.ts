// this is the file that has our interface for budgets 

import type { BudgetPeriod } from "../constants/budget.constants"; // we use "type " for a complir time code as this is mostly static 
// we use this for oue sake and also this is complete erased during complation 

export interface BudgetCreationRequest {
    amount: number;
    periodType: BudgetPeriod;
    startDate: string;
    isLocked?: boolean;
} 

export interface Budget {
    id: number;
    amount: string;
    periodType: BudgetPeriod;
    startDate: string;
    isLocked: boolean;
}