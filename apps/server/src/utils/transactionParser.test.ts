import { parseQuickTransaction } from "./transactionParser";
import { Category, Priority } from "../generated/prisma/enums";

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function runTests() {
    console.log("Running transactionParser tests...");

    // Test 1: "450 lunch"
    const t1 = parseQuickTransaction("450 lunch");
    assert(t1.amount === 450, `Expected amount 450, got ${t1.amount}`);
    assert(t1.category === Category.FOOD, `Expected category FOOD, got ${t1.category}`);
    assert(t1.title === "Lunch", `Expected title Lunch, got ${t1.title}`);
    console.log("✓ Test 1: '450 lunch' passed");

    // Test 2: "spent 800 on dinner"
    const t2 = parseQuickTransaction("spent 800 on dinner");
    assert(t2.amount === 800, `Expected amount 800, got ${t2.amount}`);
    assert(t2.category === Category.FOOD, `Expected category FOOD, got ${t2.category}`);
    assert(t2.title === "Dinner", `Expected title Dinner, got ${t2.title}`);
    console.log("✓ Test 2: 'spent 800 on dinner' passed");

    // Test 3: "₹120 coffee"
    const t3 = parseQuickTransaction("₹120 coffee");
    assert(t3.amount === 120, `Expected amount 120, got ${t3.amount}`);
    assert(t3.category === Category.FOOD, `Expected category FOOD, got ${t3.category}`);
    console.log("✓ Test 3: '₹120 coffee' passed");

    // Test 4: "uber 350"
    const t4 = parseQuickTransaction("uber 350");
    assert(t4.amount === 350, `Expected amount 350, got ${t4.amount}`);
    assert(t4.category === Category.TRAVEL, `Expected category TRAVEL, got ${t4.category}`);
    console.log("✓ Test 4: 'uber 350' passed");

    // Test 5: "salary 75000"
    const t5 = parseQuickTransaction("salary 75000");
    assert(t5.amount === 75000, `Expected amount 75000, got ${t5.amount}`);
    assert(t5.category === Category.OTHER, `Expected category OTHER, got ${t5.category}`);
    console.log("✓ Test 5: 'salary 75000' passed");

    // Test 6: "450 groceries"
    const t6 = parseQuickTransaction("450 groceries");
    assert(t6.amount === 450, `Expected amount 450, got ${t6.amount}`);
    assert(t6.category === Category.FOOD, `Expected category FOOD, got ${t6.category}`);
    console.log("✓ Test 6: '450 groceries' passed");

    // Test 7: "netflix 649"
    const t7 = parseQuickTransaction("netflix 649");
    assert(t7.amount === 649, `Expected amount 649, got ${t7.amount}`);
    assert(t7.category === Category.SUBSCRIPTION, `Expected category SUBSCRIPTION, got ${t7.category}`);
    console.log("✓ Test 7: 'netflix 649' passed");

    // Test 8: "electricity bill 1500"
    const t8 = parseQuickTransaction("electricity bill 1500");
    assert(t8.amount === 1500, `Expected amount 1500, got ${t8.amount}`);
    assert(t8.category === Category.BILLS, `Expected category BILLS, got ${t8.category}`);
    assert(t8.priority === Priority.ESSENTIAL, `Expected priority ESSENTIAL, got ${t8.priority}`);
    console.log("✓ Test 8: 'electricity bill 1500' passed");

    // Test 9: "yesterday 500 petrol"
    const t9 = parseQuickTransaction("yesterday 500 petrol");
    assert(t9.amount === 500, `Expected amount 500, got ${t9.amount}`);
    assert(t9.category === Category.FUEL, `Expected category FUEL, got ${t9.category}`);
    assert(t9.extractedFields.dateDetected === true, `Expected dateDetected true`);
    console.log("✓ Test 9: 'yesterday 500 petrol' passed");

    // Test 10: "450" (amount only)
    const t10 = parseQuickTransaction("450");
    assert(t10.amount === 450, `Expected amount 450, got ${t10.amount}`);
    assert(t10.category === Category.OTHER, `Expected category OTHER, got ${t10.category}`);
    console.log("✓ Test 10: '450' (amount only) passed");

    console.log("\nAll 10 parser tests passed successfully! 🎉");
}

runTests();
