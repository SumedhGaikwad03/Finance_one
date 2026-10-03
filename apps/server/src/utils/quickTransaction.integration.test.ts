import { parseQuickTransaction } from "./transactionParser";
import { createTransactionSchema, quickTransactionSchema } from "../schemas/transaction.schema";
import { Category, Priority } from "../generated/prisma/enums";

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function runIntegrationTests() {
    console.log("Running Quick Transaction Integration & Schema Tests...");

    // 1. Schema Validation for Quick Input
    const validQuickInput = quickTransactionSchema.parse({
        text: "450 lunch"
    });
    assert(validQuickInput.text === "450 lunch", "Quick input parsing failed");

    // 2. Integration: Parsing -> Canonical Schema Validation
    const parsed1 = parseQuickTransaction(validQuickInput.text);
    const canonicalInput1 = createTransactionSchema.parse({
        amount: parsed1.amount!,
        category: parsed1.category,
        priority: parsed1.priority,
        title: parsed1.title,
        notes: parsed1.notes,
        transactionDate: parsed1.transactionDate
    });

    assert(canonicalInput1.amount === 450, "Amount mismatch in canonical validation");
    assert(canonicalInput1.category === Category.FOOD, "Category mismatch");
    assert(canonicalInput1.priority === Priority.ESSENTIAL, "Priority mismatch");
    assert(canonicalInput1.title === "Lunch", "Title mismatch");
    console.log("✓ Integration Test 1: '450 lunch' successfully validated through canonical schema");

    // 3. Integration: Manual Overrides taking precedence over natural language
    const overrideInput = quickTransactionSchema.parse({
        text: "450 lunch",
        category: Category.ENTERTAINMENT,
        priority: Priority.LUXURY,
        notes: "Team celebration"
    });
    const parsed2 = parseQuickTransaction(overrideInput.text);
    const canonicalInput2 = createTransactionSchema.parse({
        amount: overrideInput.amount ?? parsed2.amount!,
        category: overrideInput.category ?? parsed2.category,
        priority: overrideInput.priority ?? parsed2.priority,
        title: overrideInput.title ?? parsed2.title,
        notes: overrideInput.notes ?? parsed2.notes,
        transactionDate: overrideInput.transactionDate ?? parsed2.transactionDate
    });
    assert(canonicalInput2.amount === 450, "Amount failed");
    assert(canonicalInput2.category === Category.ENTERTAINMENT, "Override category failed");
    assert(canonicalInput2.priority === Priority.LUXURY, "Override priority failed");
    assert(canonicalInput2.notes === "Team celebration", "Notes failed");
    console.log("✓ Integration Test 2: Overrides properly respected with canonical schema");

    // 4. Validation: Rejection of missing amount
    const noAmountParsed = parseQuickTransaction("just some text with no numbers");
    assert(noAmountParsed.amount === null, "Expected null amount for text with no numbers");
    let errorThrown = false;
    try {
        createTransactionSchema.parse({
            amount: noAmountParsed.amount,
            category: noAmountParsed.category,
            priority: noAmountParsed.priority
        });
    } catch (e) {
        errorThrown = true;
    }
    assert(errorThrown, "Expected createTransactionSchema to reject null amount");
    console.log("✓ Integration Test 3: Server-side validation strictly enforces valid amount");

    console.log("\nAll Quick Transaction integration tests passed successfully! 🚀");
}

runIntegrationTests();
