import {z} from "zod";
import {Category, Priority, TransactionSource} from "../generated/prisma/enums";

export const createTransactionSchema = z.object({ // the is the schem that client sends for the backend 

    amount : z.number().positive("amount must be a positive number"),
    category : z.enum(Category), // this is the category that the user will select from the frontend and we will validate it here
 
    priority : z.enum(Priority).optional().default(Priority.UNCLASSIFIED), // Defaults to UNCLASSIFIED if omitted
    title : z.string().trim().max(50 , "title is too long ").optional(),
    notes : z.string().trim().max(200 , "notes is too long ").optional(), // this is the notes that the user will enter from the frontend and we will validate it here
    transactionDate : z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional(), // this is the transaction date that the user will enter from the frontend and we will validate it here
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
})
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>; // this is the type that we will use in the service layer to validate the data that we get from the 
// controller and then we will pass it to the repository layer 


export const updateTransactionSchema = z.object({

   
    amount : z.number().positive("amount must be a positive number").optional(),
    category : z.enum(Category).optional(), // this is the category that the user will select from the frontend and we will validate it here
 
    priority : z.enum(Priority).optional(), // this is the priority that the user will select from the frontend and we will validate it here
    title : z.string().trim().max(50 , "title is too long ").optional(),
    notes : z.string().trim().max(200 , "notes is too long ").optional(), // this is the notes that the user will enter from the frontend and we will validate it here
    transactionDate : z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),

}).refine( // this is used for cross field validation 
    (data) => Object.keys(data).length > 0 , 
    {
        message : "At least one field is required for an update."
    }
)
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const parseTransactionSchema = z.object({
    text: z.string().trim().min(1, "Input text cannot be empty").max(200, "Input text is too long")
});
export type ParseTransactionInput = z.infer<typeof parseTransactionSchema>;

export const quickTransactionSchema = z.object({
    text: z.string().trim().min(1, "Input text cannot be empty").max(200, "Input text is too long"),
    amount: z.number().positive("amount must be a positive number").optional(),
    category: z.enum(Category).optional(),
    priority: z.enum(Priority).optional(),
    title: z.string().trim().max(50, "title is too long").optional(),
    notes: z.string().trim().max(200, "notes is too long").optional(),
    transactionDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional(),
    tags: z.array(z.string().trim().max(30)).max(10).optional(),
});
export type QuickTransactionInput = z.infer<typeof quickTransactionSchema>;

// Helper to preprocess comma-separated string or array into array of enum values
const stringToEnumArray = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.preprocess((val) => {
        if (val === undefined || val === null || val === "") return undefined;
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
            return val.includes(",") ? val.split(",").map((s) => s.trim()).filter(Boolean) : [val.trim()];
        }
        return val;
    }, z.array(itemSchema).optional());

export type SortField = "transactionDate" | "amount" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface TransactionQuery {
    categories?: Category[];
    priorities?: Priority[];
    tags?: string[];
    sources?: TransactionSource[];
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    limit?: number;
    offset?: number;
    page?: number;
    sortBy?: SortField;
    sortDirection?: SortDirection;
}

export const transactionQueryInputSchema = z
    .object({
        category: stringToEnumArray(z.enum(Category)),
        categories: stringToEnumArray(z.enum(Category)),
        priority: stringToEnumArray(z.enum(Priority)),
        priorities: stringToEnumArray(z.enum(Priority)),
        tag: stringToEnumArray(z.string().trim()),
        tags: stringToEnumArray(z.string().trim()),
        source: stringToEnumArray(z.enum(TransactionSource)),
        sources: stringToEnumArray(z.enum(TransactionSource)),
        startDate: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid startDate format" })
            .optional(),
        endDate: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid endDate format" })
            .optional(),
        minAmount: z.coerce.number().min(0, "minAmount must be non-negative").optional(),
        maxAmount: z.coerce.number().min(0, "maxAmount must be non-negative").optional(),
        search: z.string().trim().max(100, "Search query is too long").optional(),
        limit: z.coerce.number().int().min(1, "limit must be at least 1").max(100, "limit cannot exceed 100").default(50),
        offset: z.coerce.number().int().min(0, "offset cannot be negative").default(0),
        page: z.coerce.number().int().min(1, "page must be at least 1").optional(),
        paginate: z.preprocess(
            (val) => val === "true" || val === true || val === "1" || val === 1,
            z.boolean()
        ).optional(),
        sortBy: z.enum(["transactionDate", "amount", "createdAt"]).default("transactionDate"),
        sortDirection: z.enum(["asc", "desc"]).default("desc"),
    })
    .refine(
        (data) => {
            if (data.minAmount !== undefined && data.maxAmount !== undefined) {
                return data.minAmount <= data.maxAmount;
            }
            return true;
        },
        {
            message: "minAmount must be less than or equal to maxAmount",
            path: ["minAmount"],
        }
    )
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
            }
            return true;
        },
        {
            message: "startDate must be before or equal to endDate",
            path: ["startDate"],
        }
    );

export type TransactionQueryInput = z.infer<typeof transactionQueryInputSchema>;

export const idParamSchema = z.object({
    id: z.coerce.number().int().positive("ID must be a positive integer"),
});
export type IdParamInput = z.infer<typeof idParamSchema>;

const normalizeDateBoundary = (dateStr: string, isEnd: boolean): Date => {
    // If given as YYYY-MM-DD date without time, cover the full day boundary
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(`${dateStr}T${isEnd ? "23:59:59.999" : "00:00:00.000"}Z`);
    }
    return new Date(dateStr);
};

export function toCanonicalTransactionQuery(input: TransactionQueryInput): TransactionQuery {
    const categories = input.categories ?? input.category;
    const priorities = input.priorities ?? input.priority;
    const tags = input.tags ?? input.tag;
    const sources = input.sources ?? input.source;

    const limit = input.limit ?? 50;
    const offset = input.page ? (input.page - 1) * limit : input.offset;

    return {
        ...(categories && categories.length > 0 && { categories }),
        ...(priorities && priorities.length > 0 && { priorities }),
        ...(tags && tags.length > 0 && { tags }),
        ...(sources && sources.length > 0 && { sources }),
        ...(input.startDate && { startDate: normalizeDateBoundary(input.startDate, false) }),
        ...(input.endDate && { endDate: normalizeDateBoundary(input.endDate, true) }),
        ...(input.minAmount !== undefined && { minAmount: input.minAmount }),
        ...(input.maxAmount !== undefined && { maxAmount: input.maxAmount }),
        ...(input.search && { search: input.search }),
        limit,
        offset,
        ...(input.page && { page: input.page }),
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
    };
}

 