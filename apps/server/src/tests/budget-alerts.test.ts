import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app";
import prisma from "../lib/prisma";
import { BudgetPeriod, Category, Priority, TransactionSource } from "../generated/prisma/enums";
import { clearDismissals } from "../services/budget-alert.service";

describe("FinOne PR 12: Budget Alerts and Spending Guardrails Test Suite", () => {
  let server: http.Server;
  let baseUrl: string;

  let userA: { id: number; email: string };
  let userB: { id: number; email: string };
  let tokenA: string;
  let tokenB: string;

  before(async () => {
    // Start HTTP server on ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === "object") {
          baseUrl = `http://localhost:${addr.port}`;
        }
        resolve();
      });
    });

    // Create User A
    const emailA = `budget_alerts_user_a_${Date.now()}@internal.test`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alerts Test User A",
        email: emailA,
        password: "Password123!",
      }),
    });
    const loginResA = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailA,
        password: "Password123!",
      }),
    });
    const dataA = await loginResA.json();
    userA = { id: dataA.user.id, email: emailA };
    tokenA = dataA.token;

    // Create User B
    const emailB = `budget_alerts_user_b_${Date.now()}@internal.test`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alerts Test User B",
        email: emailB,
        password: "Password123!",
      }),
    });
    const loginResB = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailB,
        password: "Password123!",
      }),
    });
    const dataB = await loginResB.json();
    userB = { id: dataB.user.id, email: emailB };
    tokenB = dataB.token;
  });

  after(async () => {
    // Cleanup
    if (userA?.id) {
      await prisma.transaction.deleteMany({ where: { userId: userA.id } });
      await prisma.budget.deleteMany({ where: { userId: userA.id } });
      await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB?.id) {
      await prisma.transaction.deleteMany({ where: { userId: userB.id } });
      await prisma.budget.deleteMany({ where: { userId: userB.id } });
      await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  beforeEach(async () => {
    clearDismissals();
    if (userA?.id) {
      await prisma.transaction.deleteMany({ where: { userId: userA.id } });
      await prisma.budget.deleteMany({ where: { userId: userA.id } });
    }
    if (userB?.id) {
      await prisma.transaction.deleteMany({ where: { userId: userB.id } });
      await prisma.budget.deleteMany({ where: { userId: userB.id } });
    }
  });

  // =========================================================================
  // 1. No Active Budget State
  // =========================================================================
  describe("1. No Active Budget Handling", () => {
    it("returns hasActiveBudget: false, empty alerts, and null remaining when no budget exists", async () => {
      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.hasActiveBudget, false);
      assert.equal(data.activeBudget, null);
      assert.equal(data.period, null);
      assert.equal(data.totalSpent, 0);
      assert.equal(data.remainingBudget, null);
      assert.equal(data.usagePercentage, null);
      assert.equal(data.isOverBudget, false);
      assert.deepEqual(data.alerts, []);
    });
  });

  // =========================================================================
  // 2. Threshold Boundaries (75%, 90%, 100%, and Over-Budget)
  // =========================================================================
  describe("2. Budget Threshold Boundaries & Over-Budget States", () => {
    it("generates no alert when spending is strictly below 75% (e.g. 74.9%)", async () => {
      // Create monthly budget of 10,000 starting 1st of current month
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // Spend 7,490 (74.9%)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 7490.0,
          category: Category.BILLS,
          priority: Priority.ESSENTIAL,
          title: "Electricity & Utilities",
          transactionDate: startDate,
          source: TransactionSource.MANUAL,
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.hasActiveBudget, true);
      assert.equal(data.totalSpent, 7490.0);
      assert.equal(data.remainingBudget, 2510.0);
      assert.equal(data.usagePercentage, 74.9);
      assert.equal(data.isOverBudget, false);
      assert.equal(data.alerts.length, 0); // below 75% threshold
    });

    it("triggers 75% alert at exact boundary (75.0%) and suppresses lower levels", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // Spend exactly 7,500 (75.0%)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 7500.0,
          category: Category.BILLS,
          priority: Priority.ESSENTIAL,
          title: "Rent and Maintenance",
          transactionDate: startDate,
          source: TransactionSource.MANUAL,
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.totalSpent, 7500.0);
      assert.equal(data.remainingBudget, 2500.0);
      assert.equal(data.usagePercentage, 75.0);
      assert.equal(data.isOverBudget, false);
      assert.equal(data.alerts.length, 1);

      const alert = data.alerts[0];
      assert.equal(alert.type, "BUDGET_THRESHOLD");
      assert.equal(alert.severity, "info");
      assert.equal(alert.metrics.thresholdPercentage, 75);
      assert.equal(alert.metrics.remainingBudget, 2500.0);
      assert.ok(alert.explanation.reason.includes("75%"));
    });

    it("triggers 90% alert at 90.0% and suppresses the 75% alert to prevent duplicate alert fatigue", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // Spend exactly 9,000 (90.0%)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 9000.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Monthly Groceries",
          transactionDate: startDate,
          source: TransactionSource.MANUAL,
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.totalSpent, 9000.0);
      assert.equal(data.remainingBudget, 1000.0);
      assert.equal(data.usagePercentage, 90.0);
      assert.equal(data.alerts.length, 1); // exactly 1 alert: 90% (75% suppressed)

      const alert = data.alerts[0];
      assert.equal(alert.type, "BUDGET_THRESHOLD");
      assert.equal(alert.severity, "warning");
      assert.equal(alert.metrics.thresholdPercentage, 90);
      assert.equal(alert.metrics.remainingBudget, 1000.0);
    });

    it("handles zero remaining budget (exact 100% spend) correctly", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // Spend exactly 10,000 (100.0%)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          category: Category.TRAVEL,
          priority: Priority.ESSENTIAL,
          title: "Flight Tickets",
          transactionDate: startDate,
          source: TransactionSource.MANUAL,
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.totalSpent, 10000.0);
      assert.equal(data.remainingBudget, 0.0); // Exact 0
      assert.equal(data.usagePercentage, 100.0);
      assert.equal(data.isOverBudget, false); // Exactly 100% is not strictly over-budget
      assert.equal(data.alerts.length, 1);
      assert.equal(alertSeverityOrType(data.alerts[0]), "warning");
    });

    it("handles negative remaining budget (> 100% spend) and triggers CRITICAL over-budget alert", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // Spend 12,450.50 (124.5% - over budget by 2,450.50)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 12450.5,
          category: Category.SHOPPING,
          priority: Priority.LUXURY,
          title: "Electronics Upgrade",
          transactionDate: startDate,
          source: TransactionSource.MANUAL,
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      assert.equal(data.totalSpent, 12450.5);
      assert.equal(data.remainingBudget, -2450.5); // Negative balance
      assert.equal(data.isOverBudget, true);
      assert.ok(data.usagePercentage > 120);

      assert.equal(data.alerts.length, 1);
      const alert = data.alerts[0];
      assert.equal(alert.type, "OVER_BUDGET");
      assert.equal(alert.severity, "critical");
      assert.ok(alert.message.includes("exceeding your ₹10000.00"));
      assert.ok(alert.explanation.reason.includes("exceeded"));
      assert.equal(alert.metrics.remainingBudget, -2450.5);
    });
  });

  // =========================================================================
  // 3. Date-Period Boundaries
  // =========================================================================
  describe("3. Date-Period Boundaries (Weekly, Monthly, Quarterly)", () => {
    it("strictly respects start and end boundaries for weekly budget", async () => {
      const now = new Date();
      const startOfToday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 5000.0,
          periodType: BudgetPeriod.WEEKLY,
          startDate: startOfToday,
        },
      });

      // Transaction 1: exactly on startDate -> included
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 4000.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Day 1 Spend",
          transactionDate: startOfToday,
        },
      });

      // Transaction 2: 1 day before startDate -> excluded
      const beforeDate = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 3000.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Prior Week Spend",
          transactionDate: beforeDate,
        },
      });

      // Transaction 3: exactly 7 days later (on endDate) -> excluded (half-open [start, end))
      const endDate = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 3000.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Next Week Spend",
          transactionDate: endDate,
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      // Only the 4,000 spend must be counted (4000 / 5000 = 80% -> 75% threshold)
      assert.equal(data.totalSpent, 4000.0);
      assert.equal(data.usagePercentage, 80.0);
      assert.equal(data.period.periodType, "WEEKLY");
      assert.equal(data.alerts.length, 1);
      assert.equal(data.alerts[0].metrics.thresholdPercentage, 75);
    });
  });

  // =========================================================================
  // 4. Category Surge Anomaly Detection & Baseline Requirements
  // =========================================================================
  describe("4. Category Surge Anomaly Detection", () => {
    it("detects unusual category surge when sufficient historical baseline data exists", async () => {
      const now = new Date();
      // Month start: 1st of current month
      const currentStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      // Previous month start: 1st of previous month
      const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevStart = new Date(Date.UTC(prevMonthYear, prevMonth, 1));

      // Active Budget for current month
      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 20000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate: currentStart,
        },
      });

      // Baseline Period Transactions: 3 transactions in FOOD totaling 2,000
      await prisma.transaction.createMany({
        data: [
          {
            userId: userA.id,
            amount: 700.0,
            category: Category.FOOD,
            priority: Priority.ESSENTIAL,
            title: "Supermarket 1",
            transactionDate: new Date(prevStart.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
          {
            userId: userA.id,
            amount: 600.0,
            category: Category.FOOD,
            priority: Priority.ESSENTIAL,
            title: "Supermarket 2",
            transactionDate: new Date(prevStart.getTime() + 10 * 24 * 60 * 60 * 1000),
          },
          {
            userId: userA.id,
            amount: 700.0,
            category: Category.FOOD,
            priority: Priority.ESSENTIAL,
            title: "Supermarket 3",
            transactionDate: new Date(prevStart.getTime() + 20 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      // Current Period Transactions: Spend in FOOD is 4,000 (100% increase over 2,000 baseline)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 4000.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Bulk Wholesale Food",
          transactionDate: new Date(currentStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      const surgeAlert = data.alerts.find((a: any) => a.type === "CATEGORY_SURGE");
      assert.ok(surgeAlert, "Expected CATEGORY_SURGE alert for FOOD");
      assert.equal(surgeAlert.severity, "warning");
      assert.equal(surgeAlert.metrics.category, "FOOD");
      assert.equal(surgeAlert.metrics.categorySpent, 4000.0);
      assert.equal(surgeAlert.metrics.baselineSpent, 2000.0);
      assert.equal(surgeAlert.metrics.surgePercentage, 100.0);
      assert.ok(surgeAlert.explanation.reason.includes("FOOD"));
      assert.ok(surgeAlert.explanation.source.includes("Historical"));
    });

    it("suppresses category surge alerts when historical baseline has insufficient data (< 3 transactions)", async () => {
      const now = new Date();
      const currentStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevStart = new Date(Date.UTC(prevMonthYear, prevMonth, 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 20000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate: currentStart,
        },
      });

      // Only 1 transaction in baseline period (insufficient sample size)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 500.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Single Grocery",
          transactionDate: new Date(prevStart.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      // Current period spend in FOOD is 2,000 (appears high, but baseline is insufficient)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 2000.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Current Groceries",
          transactionDate: new Date(currentStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      const surgeAlerts = data.alerts.filter((a: any) => a.type === "CATEGORY_SURGE");
      assert.equal(surgeAlerts.length, 0, "Must not trigger surge alert with insufficient baseline data");
    });

    it("suppresses category surge alerts when increase is small in absolute monetary terms (< ₹500)", async () => {
      const now = new Date();
      const currentStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
      const prevMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevStart = new Date(Date.UTC(prevMonthYear, prevMonth, 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 20000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate: currentStart,
        },
      });

      // Baseline: 3 transactions in SUBSCRIPTION totaling ₹150
      await prisma.transaction.createMany({
        data: [
          {
            userId: userA.id,
            amount: 50.0,
            category: Category.SUBSCRIPTION,
            priority: Priority.GOOD_TO_HAVE,
            title: "Sub 1",
            transactionDate: new Date(prevStart.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
          {
            userId: userA.id,
            amount: 50.0,
            category: Category.SUBSCRIPTION,
            priority: Priority.GOOD_TO_HAVE,
            title: "Sub 2",
            transactionDate: new Date(prevStart.getTime() + 10 * 24 * 60 * 60 * 1000),
          },
          {
            userId: userA.id,
            amount: 50.0,
            category: Category.SUBSCRIPTION,
            priority: Priority.GOOD_TO_HAVE,
            title: "Sub 3",
            transactionDate: new Date(prevStart.getTime() + 20 * 24 * 60 * 60 * 1000),
          },
        ],
      });

      // Current spend is ₹300 (100% increase, but difference is only ₹150 < ₹500)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 300.0,
          category: Category.SUBSCRIPTION,
          priority: Priority.GOOD_TO_HAVE,
          title: "New Sub",
          transactionDate: new Date(currentStart.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(res.status, 200);
      const data = await res.json();

      const surgeAlerts = data.alerts.filter((a: any) => a.type === "CATEGORY_SURGE");
      assert.equal(surgeAlerts.length, 0, "Must not trigger surge alert for tiny absolute spend changes");
    });
  });

  // =========================================================================
  // 5. Repeated Alert Suppression & Dismissal
  // =========================================================================
  describe("5. Repeated Alert Suppression & Dismissal", () => {
    it("dismisses an alert via POST /api/budgets/alerts/:id/dismiss and suppresses it from subsequent queries", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 10000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 9200.0,
          category: Category.SHOPPING,
          priority: Priority.LUXURY,
          title: "Gadget",
          transactionDate: startDate,
        },
      });

      // 1. Initial query: alert is present
      const res1 = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data1 = await res1.json();
      assert.equal(data1.alerts.length, 1);
      const alertId = data1.alerts[0].id;

      // 2. Dismiss the alert
      const dismissRes = await fetch(`${baseUrl}/api/budgets/alerts/${alertId}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      assert.equal(dismissRes.status, 200);
      const dismissData = await dismissRes.json();
      assert.equal(dismissData.success, true);
      assert.equal(dismissData.alertId, alertId);

      // 3. Second query: alert is now suppressed
      const res2 = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data2 = await res2.json();
      assert.equal(data2.alerts.length, 0, "Dismissed alert must be suppressed from default active list");

      // 4. Query with includeDismissed=true returns the alert flagged as dismissed: true
      const res3 = await fetch(`${baseUrl}/api/budgets/alerts?includeDismissed=true`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const data3 = await res3.json();
      assert.equal(data3.alerts.length, 1);
      assert.equal(data3.alerts[0].dismissed, true);
    });
  });

  // =========================================================================
  // 6. Multi-Tenant User Isolation
  // =========================================================================
  describe("6. User Isolation & Multi-Tenancy", () => {
    it("ensures User B cannot see User A's alerts or have their spending mixed", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      // User A budget: 5,000
      await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 5000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // User A spend: 4,800 (96% -> Warning alert)
      await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 4800.0,
          category: Category.BILLS,
          priority: Priority.ESSENTIAL,
          title: "User A Utility",
          transactionDate: startDate,
        },
      });

      // User B budget: 20,000
      await prisma.budget.create({
        data: {
          userId: userB.id,
          amount: 20000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      // User B spend: 2,000 (10% -> No alert)
      await prisma.transaction.create({
        data: {
          userId: userB.id,
          amount: 2000.0,
          category: Category.BILLS,
          priority: Priority.ESSENTIAL,
          title: "User B Utility",
          transactionDate: startDate,
        },
      });

      // Verify User A alerts
      const resA = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      const dataA = await resA.json();
      assert.equal(dataA.totalSpent, 4800.0);
      assert.equal(dataA.alerts.length, 1);
      assert.equal(dataA.alerts[0].metrics.budgetAmount, 5000.0);

      // Verify User B alerts
      const resB = await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      const dataB = await resB.json();
      assert.equal(dataB.totalSpent, 2000.0);
      assert.equal(dataB.alerts.length, 0); // 10% has no threshold alert
    });
  });

  // =========================================================================
  // 7. Immutability of Financial Ledger & Budget Amounts
  // =========================================================================
  describe("7. Ledger & Budget Immutability", () => {
    it("guarantees evaluating alerts never modifies transactions or budget records", async () => {
      const now = new Date();
      const startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

      const budget = await prisma.budget.create({
        data: {
          userId: userA.id,
          amount: 8000.0,
          periodType: BudgetPeriod.MONTHLY,
          startDate,
        },
      });

      const txn = await prisma.transaction.create({
        data: {
          userId: userA.id,
          amount: 7200.0,
          category: Category.FOOD,
          priority: Priority.ESSENTIAL,
          title: "Dining Out",
          transactionDate: startDate,
        },
      });

      // Call alert endpoint multiple times
      await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });
      await fetch(`${baseUrl}/api/budgets/alerts`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      // Assert DB records remain identical
      const budgetAfter = await prisma.budget.findUnique({ where: { id: budget.id } });
      assert.equal(Number(budgetAfter?.amount), 8000.0);
      assert.equal(budgetAfter?.isLocked, false);

      const txnAfter = await prisma.transaction.findUnique({ where: { id: txn.id } });
      assert.equal(Number(txnAfter?.amount), 7200.0);
      assert.equal(txnAfter?.category, Category.FOOD);
      assert.equal(txnAfter?.priority, Priority.ESSENTIAL);
    });
  });
});

function alertSeverityOrType(alert: any): string {
  return alert?.severity || alert?.type || "";
}
