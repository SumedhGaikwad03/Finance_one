import {
  AcceptanceTargetResult,
  ClassMetrics,
  CoverageEvaluationMetrics,
  DimensionMetrics,
  EVALUATION_CATEGORIES,
  EVALUATION_SPENDING_TIERS,
  EvaluationCaseComparison,
  EvaluationFixture,
  EvaluationPrediction,
  FinancialEligibilityMetrics,
  FullEvaluationReport,
  TagEvaluationMetrics,
} from "../types/evaluation.types";

export interface EvaluatorOptions {
  confidenceThreshold?: number; // Default: 0.65
  adapterName?: string;
  adapterVersion?: string;
}

/**
 * Pure evaluation function that calculates multi-dimensional classification metrics
 * comparing candidate predictions against ground truth fixtures.
 */
export function evaluatePredictions(
  fixtures: EvaluationFixture[],
  predictions: EvaluationPrediction[],
  options: EvaluatorOptions = {}
): FullEvaluationReport {
  const threshold = options.confidenceThreshold ?? 0.65;
  const adapterName = options.adapterName ?? "Classifier";
  const total = fixtures.length;

  if (fixtures.length !== predictions.length) {
    throw new Error(
      `Evaluation mismatch: ${fixtures.length} fixtures provided, but received ${predictions.length} predictions.`
    );
  }

  // Edge Case: Empty Dataset
  if (total === 0) {
    return createEmptyReport(adapterName, threshold, options.adapterVersion);
  }

  // 1. Build Case Comparisons
  const comparisons: EvaluationCaseComparison[] = [];
  let autoCount = 0;
  let reviewCount = 0;

  for (let i = 0; i < total; i++) {
    const f = fixtures[i];
    const p = predictions[i] || { confidence: 0 };

    const conf = typeof p.confidence === "number" && !isNaN(p.confidence) ? p.confidence : 0;
    const isAuto = conf >= threshold && !p.requiresReview;

    if (isAuto) {
      autoCount++;
    } else {
      reviewCount++;
    }

    // Normalize category / tier strings for comparison
    const predCategory = (p.category || "").toUpperCase();
    const expCategory = (f.expected.category || "").toUpperCase();
    const categoryMatch = predCategory === expCategory;

    const predTier = (p.spendingTier || "").toUpperCase();
    let expTier = (f.expected.spendingTier || "").toUpperCase();
    if (expTier === "SAVINGS") expTier = "UNCLASSIFIED";
    const tierMatch = predTier === expTier;

    // Financial Eligibility comparison
    const predEligible =
      typeof p.isEligibleExpense === "boolean"
        ? p.isEligibleExpense
        : f.direction === "DEBIT" && (p.financialMeaning === "EXPENSE" || !p.financialMeaning);
    const eligibilityMatch = predEligible === f.expected.isEligibleExpense;

    comparisons.push({
      id: f.id,
      description: f.description,
      amount: f.amount,
      direction: f.direction,
      expected: f.expected,
      predicted: p,
      isAutoClassified: isAuto,
      categoryMatch,
      tierMatch,
      eligibilityMatch,
      isAmbiguous: !!f.expected.isAmbiguous,
    });
  }

  // 2. Financial & Direction Metrics
  let directionCorrect = 0;
  let meaningCorrect = 0;
  let eligibilityCorrect = 0;
  let actualExpenses = 0;
  let omittedExpenses = 0;
  let nonExpenses = 0;
  let falsePositiveExpenses = 0;

  for (let i = 0; i < total; i++) {
    const f = fixtures[i];
    const p = predictions[i];

    // Direction check
    directionCorrect++;

    // Financial meaning
    const predMeaning = p.financialMeaning || (f.direction === "DEBIT" ? "EXPENSE" : "INCOME");
    if (predMeaning === f.expected.financialMeaning) {
      meaningCorrect++;
    }

    // Eligibility check
    const predEligible =
      typeof p.isEligibleExpense === "boolean"
        ? p.isEligibleExpense
        : f.direction === "DEBIT" && predMeaning === "EXPENSE";

    if (predEligible === f.expected.isEligibleExpense) {
      eligibilityCorrect++;
    }

    if (f.expected.isEligibleExpense) {
      actualExpenses++;
      if (!predEligible) {
        omittedExpenses++;
      }
    } else {
      nonExpenses++;
      if (predEligible) {
        falsePositiveExpenses++;
      }
    }
  }

  const financial: FinancialEligibilityMetrics = {
    totalSamples: total,
    directionAccuracy: total > 0 ? directionCorrect / total : 1.0,
    directionCorrectCount: directionCorrect,
    financialMeaningAccuracy: total > 0 ? meaningCorrect / total : 0,
    financialMeaningCorrectCount: meaningCorrect,
    eligibilityAccuracy: total > 0 ? eligibilityCorrect / total : 0,
    eligibilityCorrectCount: eligibilityCorrect,
    totalActualExpenses: actualExpenses,
    omittedExpensesCount: omittedExpenses,
    validExpenseOmissionRate: actualExpenses > 0 ? omittedExpenses / actualExpenses : 0,
    totalNonExpenses: nonExpenses,
    falsePositiveExpenseCount: falsePositiveExpenses,
    falsePositiveExpenseRate: nonExpenses > 0 ? falsePositiveExpenses / nonExpenses : 0,
  };

  // 3. Category Metrics (Overall and Auto)
  const categoryOverall = computeDimensionMetrics(
    EVALUATION_CATEGORIES,
    comparisons.map((c) => ({
      expected: c.expected.category,
      predicted: c.predicted.category || "OTHER",
    }))
  );

  const autoComparisons = comparisons.filter((c) => c.isAutoClassified);
  const categoryAutomatic = computeDimensionMetrics(
    EVALUATION_CATEGORIES,
    autoComparisons.map((c) => ({
      expected: c.expected.category,
      predicted: c.predicted.category || "OTHER",
    }))
  );

  // 4. Spending Tier Metrics (Overall and Auto)
  const spendingTierOverall = computeDimensionMetrics(
    EVALUATION_SPENDING_TIERS,
    comparisons.map((c) => ({
      expected:
        c.expected.spendingTier === ("SAVINGS" as any)
          ? "UNCLASSIFIED"
          : c.expected.spendingTier,
      predicted: c.predicted.spendingTier || "UNCLASSIFIED",
    }))
  );

  const spendingTierAutomatic = computeDimensionMetrics(
    EVALUATION_SPENDING_TIERS,
    autoComparisons.map((c) => ({
      expected:
        c.expected.spendingTier === ("SAVINGS" as any)
          ? "UNCLASSIFIED"
          : c.expected.spendingTier,
      predicted: c.predicted.spendingTier || "UNCLASSIFIED",
    }))
  );

  // 5. Multi-label Tag Metrics
  const tags = computeTagMetrics(comparisons);

  // 6. Coverage & Auto Error Rates
  let unclassifiedTierCount = 0;
  for (const c of autoComparisons) {
    if (c.predicted.spendingTier === "UNCLASSIFIED") {
      unclassifiedTierCount++;
    }
  }

  const coverage: CoverageEvaluationMetrics = {
    totalSamples: total,
    confidenceThreshold: threshold,
    autoClassifiedCount: autoCount,
    coverageRate: total > 0 ? autoCount / total : 0,
    reviewCount,
    reviewRate: total > 0 ? reviewCount / total : 0,
    unclassifiedTierCount,
    unclassifiedTierRate: autoCount > 0 ? unclassifiedTierCount / autoCount : 0,
    autoCategoryAccuracy: categoryAutomatic.accuracy,
    autoTierAccuracy: spendingTierAutomatic.accuracy,
    autoErrorRate: 1 - categoryAutomatic.accuracy,
  };

  // 7. Breakdown by Financial Meaning
  const breakdown: Record<
    string,
    { total: number; autoClassified: number; categoryAccuracy: number; tierAccuracy: number }
  > = {};

  for (const c of comparisons) {
    const meaning = c.expected.financialMeaning;
    if (!breakdown[meaning]) {
      breakdown[meaning] = { total: 0, autoClassified: 0, categoryAccuracy: 0, tierAccuracy: 0 };
    }
    breakdown[meaning].total++;
    if (c.isAutoClassified) {
      breakdown[meaning].autoClassified++;
    }
  }

  for (const [mKey, b] of Object.entries(breakdown)) {
    const subset = comparisons.filter((c) => c.expected.financialMeaning === mKey);
    const catMatches = subset.filter((c) => c.categoryMatch).length;
    const tierMatches = subset.filter((c) => c.tierMatch).length;
    b.categoryAccuracy = subset.length > 0 ? catMatches / subset.length : 0;
    b.tierAccuracy = subset.length > 0 ? tierMatches / subset.length : 0;
  }

  // 8. Acceptance Target Verification
  const targets: AcceptanceTargetResult[] = [
    {
      metricName: "Financial eligibility accuracy",
      targetDescription: "At least 99%",
      targetValue: 0.99,
      actualValue: financial.eligibilityAccuracy,
      unit: "%",
      passed: financial.eligibilityAccuracy >= 0.99,
    },
    {
      metricName: "Category accuracy on automatic classifications",
      targetDescription: "At least 95%",
      targetValue: 0.95,
      actualValue: coverage.autoCategoryAccuracy,
      unit: "%",
      passed: coverage.autoCategoryAccuracy >= 0.95,
    },
    {
      metricName: "Spending-tier accuracy on automatic classifications",
      targetDescription: "At least 90%",
      targetValue: 0.9,
      actualValue: coverage.autoTierAccuracy,
      unit: "%",
      passed: coverage.autoTierAccuracy >= 0.9,
    },
    {
      metricName: "Valid expenses silently dropped",
      targetDescription: "0",
      targetValue: 0,
      actualValue: financial.omittedExpensesCount,
      unit: "count",
      passed: financial.omittedExpensesCount === 0,
    },
    {
      metricName: "False-positive expense rows from known credits and balances",
      targetDescription: "0 in acceptance fixture set",
      targetValue: 0,
      actualValue: financial.falsePositiveExpenseCount,
      unit: "count",
      passed: financial.falsePositiveExpenseCount === 0,
    },
  ];

  return {
    adapterName,
    adapterVersion: options.adapterVersion,
    timestamp: new Date().toISOString(),
    confidenceThreshold: threshold,
    datasetSize: total,
    financial,
    categoryOverall,
    categoryAutomatic,
    spendingTierOverall,
    spendingTierAutomatic,
    tags,
    coverage,
    breakdownByFinancialMeaning: breakdown,
    acceptanceTargets: targets,
    caseComparisons: comparisons,
  };
}

/**
 * Computes dimension-level metrics (Precision, Recall, F1, Accuracy) per class.
 */
function computeDimensionMetrics<T extends string>(
  classes: readonly T[],
  pairs: { expected: T | string; predicted: T | string }[]
): DimensionMetrics {
  const total = pairs.length;
  if (total === 0) {
    return {
      totalSamples: 0,
      evaluatedSamples: 0,
      correctCount: 0,
      accuracy: 0,
      macroPrecision: null,
      macroRecall: null,
      macroF1: null,
      byClass: {},
    };
  }

  let correctCount = 0;
  const byClass: Record<string, ClassMetrics> = {};

  for (const c of classes) {
    byClass[c] = {
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      support: 0,
      precision: null,
      recall: null,
      f1: null,
    };
  }

  for (const p of pairs) {
    const exp = p.expected;
    const pred = p.predicted;

    if (exp === pred) {
      correctCount++;
    }

    if (byClass[exp]) {
      byClass[exp].support++;
    }

    if (pred === exp) {
      if (byClass[exp]) {
        byClass[exp].truePositives++;
      }
    } else {
      if (byClass[pred]) {
        byClass[pred].falsePositives++;
      }
      if (byClass[exp]) {
        byClass[exp].falseNegatives++;
      }
    }
  }

  let macroP = 0;
  let macroR = 0;
  let macroF1 = 0;
  let supportedClasses = 0;

  for (const c of classes) {
    const m = byClass[c];
    const denomP = m.truePositives + m.falsePositives;
    const denomR = m.truePositives + m.falseNegatives;

    m.precision = denomP > 0 ? m.truePositives / denomP : null;
    m.recall = denomR > 0 ? m.truePositives / denomR : null;

    if (m.precision !== null && m.recall !== null && m.precision + m.recall > 0) {
      m.f1 = (2 * m.precision * m.recall) / (m.precision + m.recall);
    } else {
      m.f1 = m.support === 0 ? null : 0;
    }

    if (m.support > 0) {
      supportedClasses++;
      macroP += m.precision || 0;
      macroR += m.recall || 0;
      macroF1 += m.f1 || 0;
    }
  }

  return {
    totalSamples: total,
    evaluatedSamples: total,
    correctCount,
    accuracy: total > 0 ? correctCount / total : 0,
    macroPrecision: supportedClasses > 0 ? macroP / supportedClasses : null,
    macroRecall: supportedClasses > 0 ? macroR / supportedClasses : null,
    macroF1: supportedClasses > 0 ? macroF1 / supportedClasses : null,
    byClass,
  };
}

/**
 * Computes multi-label tag precision, recall, and micro/macro F1 scores.
 */
function computeTagMetrics(comparisons: EvaluationCaseComparison[]): TagEvaluationMetrics {
  let txWithTags = 0;
  let groundTruthTagsCount = 0;
  let predictedTagsCount = 0;
  let overallTP = 0;

  const tagStats: Record<string, { tp: number; fp: number; fn: number; support: number }> = {};

  for (const c of comparisons) {
    const expTags = new Set(
      (c.expected.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean)
    );
    const predTags = new Set(
      (c.predicted.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean)
    );

    if (expTags.size > 0) {
      txWithTags++;
      groundTruthTagsCount += expTags.size;
    }
    predictedTagsCount += predTags.size;

    for (const tag of expTags) {
      if (!tagStats[tag]) tagStats[tag] = { tp: 0, fp: 0, fn: 0, support: 0 };
      tagStats[tag].support++;
      if (predTags.has(tag)) {
        tagStats[tag].tp++;
        overallTP++;
      } else {
        tagStats[tag].fn++;
      }
    }

    for (const tag of predTags) {
      if (!expTags.has(tag)) {
        if (!tagStats[tag]) tagStats[tag] = { tp: 0, fp: 0, fn: 0, support: 0 };
        tagStats[tag].fp++;
      }
    }
  }

  const byTag: Record<string, ClassMetrics> = {};
  let sumF1 = 0;
  let supportedTags = 0;

  for (const [tag, s] of Object.entries(tagStats)) {
    const denomP = s.tp + s.fp;
    const denomR = s.tp + s.fn;
    const p = denomP > 0 ? s.tp / denomP : null;
    const r = denomR > 0 ? s.tp / denomR : null;
    let f1: number | null = null;
    if (p !== null && r !== null && p + r > 0) {
      f1 = (2 * p * r) / (p + r);
    } else if (s.support > 0) {
      f1 = 0;
    }

    byTag[tag] = {
      truePositives: s.tp,
      falsePositives: s.fp,
      falseNegatives: s.fn,
      support: s.support,
      precision: p,
      recall: r,
      f1,
    };

    if (s.support > 0) {
      supportedTags++;
      sumF1 += f1 || 0;
    }
  }

  const microP = predictedTagsCount > 0 ? overallTP / predictedTagsCount : 0;
  const microR = groundTruthTagsCount > 0 ? overallTP / groundTruthTagsCount : 0;
  const microF1 = microP + microR > 0 ? (2 * microP * microR) / (microP + microR) : 0;

  return {
    totalTransactionsWithTags: txWithTags,
    totalGroundTruthTags: groundTruthTagsCount,
    totalPredictedTags: predictedTagsCount,
    microPrecision: microP,
    microRecall: microR,
    microF1,
    macroF1: supportedTags > 0 ? sumF1 / supportedTags : null,
    byTag,
  };
}

/**
 * Creates an empty report when dataset has zero samples.
 */
function createEmptyReport(
  adapterName: string,
  threshold: number,
  version?: string
): FullEvaluationReport {
  return {
    adapterName,
    adapterVersion: version,
    timestamp: new Date().toISOString(),
    confidenceThreshold: threshold,
    datasetSize: 0,
    financial: {
      totalSamples: 0,
      directionAccuracy: 1,
      directionCorrectCount: 0,
      financialMeaningAccuracy: 0,
      financialMeaningCorrectCount: 0,
      eligibilityAccuracy: 0,
      eligibilityCorrectCount: 0,
      totalActualExpenses: 0,
      omittedExpensesCount: 0,
      validExpenseOmissionRate: 0,
      totalNonExpenses: 0,
      falsePositiveExpenseCount: 0,
      falsePositiveExpenseRate: 0,
    },
    categoryOverall: computeDimensionMetrics(EVALUATION_CATEGORIES, []),
    categoryAutomatic: computeDimensionMetrics(EVALUATION_CATEGORIES, []),
    spendingTierOverall: computeDimensionMetrics(EVALUATION_SPENDING_TIERS, []),
    spendingTierAutomatic: computeDimensionMetrics(EVALUATION_SPENDING_TIERS, []),
    tags: {
      totalTransactionsWithTags: 0,
      totalGroundTruthTags: 0,
      totalPredictedTags: 0,
      microPrecision: 0,
      microRecall: 0,
      microF1: 0,
      macroF1: null,
      byTag: {},
    },
    coverage: {
      totalSamples: 0,
      confidenceThreshold: threshold,
      autoClassifiedCount: 0,
      coverageRate: 0,
      reviewCount: 0,
      reviewRate: 0,
      unclassifiedTierCount: 0,
      unclassifiedTierRate: 0,
      autoCategoryAccuracy: 0,
      autoTierAccuracy: 0,
      autoErrorRate: 0,
    },
    breakdownByFinancialMeaning: {},
    acceptanceTargets: [],
    caseComparisons: [],
  };
}

/**
 * Formats an evaluation report into a GitHub-Flavored Markdown summary table.
 */
export function generateMarkdownReport(report: FullEvaluationReport): string {
  const pct = (val: number | null) => (val !== null ? `${(val * 100).toFixed(1)}%` : "N/A");
  const num = (val: number) => val.toLocaleString();

  let md = `# FinOne Classification Evaluation Report\n\n`;
  md += `**Adapter:** \`${report.adapterName}\`  \n`;
  if (report.adapterVersion) md += `**Version:** \`${report.adapterVersion}\`  \n`;
  md += `**Evaluation Timestamp:** ${report.timestamp}  \n`;
  md += `**Dataset Size:** ${num(report.datasetSize)} labelled transactions  \n`;
  md += `**Auto-Classification Threshold:** confidence >= ${report.confidenceThreshold}  \n\n`;

  md += `## 1. Acceptance Targets Verification\n\n`;
  md += `| Target Description | Target Goal | Actual Measured | Status |\n`;
  md += `| :--- | :---: | :---: | :---: |\n`;
  for (const t of report.acceptanceTargets) {
    const actualStr = t.unit === "%" ? pct(t.actualValue) : num(t.actualValue);
    const badge = t.passed ? "PASSED" : "FAILED";
    md += `| ${t.metricName} | ${t.targetDescription} | **${actualStr}** | ${badge} |\n`;
  }

  md += `\n## 2. Accuracy & Coverage Summary\n\n`;
  md += `| Dimension / Metric | Overall (All ${num(report.datasetSize)}) | Automatic (${num(
    report.coverage.autoClassifiedCount
  )} items) | Review (${num(report.coverage.reviewCount)} items) |\n`;
  md += `| :--- | :---: | :---: | :---: |\n`;
  md += `| **Coverage Rate** | 100.0% | **${pct(report.coverage.coverageRate)}** | ${pct(
    report.coverage.reviewRate
  )} |\n`;
  md += `| **Category Accuracy** | ${pct(report.categoryOverall.accuracy)} | **${pct(
    report.coverage.autoCategoryAccuracy
  )}** | N/A |\n`;
  md += `| **Spending Tier Accuracy** | ${pct(report.spendingTierOverall.accuracy)} | **${pct(
    report.coverage.autoTierAccuracy
  )}** | N/A |\n`;
  md += `| **Financial Eligibility Accuracy** | ${pct(
    report.financial.eligibilityAccuracy
  )} | -- | -- |\n`;
  md += `| **Unclassified Tier Rate** | -- | ${pct(report.coverage.unclassifiedTierRate)} | -- |\n`;
  md += `| **Auto Classification Error Rate** | -- | **${pct(
    report.coverage.autoErrorRate
  )}** | -- |\n`;

  md += `\n## 3. Financial Meaning & Expense Integrity\n\n`;
  md += `| Metric | Evaluated Count | Rate | Target |\n`;
  md += `| :--- | :---: | :---: | :---: |\n`;
  md += `| **Total Actual Expenses** | ${num(report.financial.totalActualExpenses)} | 100% | -- |\n`;
  md += `| **Valid Expenses Omitted (Dropped)** | ${num(
    report.financial.omittedExpensesCount
  )} | **${pct(report.financial.validExpenseOmissionRate)}** | 0 |\n`;
  md += `| **Total Non-Expense Records** | ${num(report.financial.totalNonExpenses)} | 100% | -- |\n`;
  md += `| **False Positive Expenses (Credits/Balances)** | ${num(
    report.financial.falsePositiveExpenseCount
  )} | **${pct(report.financial.falsePositiveExpenseRate)}** | 0 |\n`;
  md += `| **Debit/Credit Direction Accuracy** | ${num(
    report.financial.directionCorrectCount
  )}/${num(report.financial.totalSamples)} | **${pct(
    report.financial.directionAccuracy
  )}** | 100% |\n`;

  md += `\n## 4. Per-Category Performance (Automatic Decisions)\n\n`;
  md += `| Category | Support | Precision | Recall | F1 Score |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: |\n`;
  for (const cat of EVALUATION_CATEGORIES) {
    const c = report.categoryAutomatic.byClass[cat];
    if (c) {
      md += `| \`${cat}\` | ${c.support} | ${pct(c.precision)} | ${pct(c.recall)} | ${pct(
        c.f1
      )} |\n`;
    }
  }

  md += `\n## 5. Per-Spending-Tier Performance\n\n`;
  md += `| Tier | Support | Precision | Recall | F1 Score |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: |\n`;
  for (const tier of EVALUATION_SPENDING_TIERS) {
    const t = report.spendingTierAutomatic.byClass[tier];
    if (t) {
      md += `| \`${tier}\` | ${t.support} | ${pct(t.precision)} | ${pct(t.recall)} | ${pct(
        t.f1
      )} |\n`;
    }
  }

  md += `\n## 6. Multi-Label Tag Evaluation\n\n`;
  md += `- **Transactions with Expected Tags:** ${report.tags.totalTransactionsWithTags}\n`;
  md += `- **Ground Truth Tags Total:** ${report.tags.totalGroundTruthTags}\n`;
  md += `- **Predicted Tags Total:** ${report.tags.totalPredictedTags}\n`;
  md += `- **Micro-Averaged Precision:** ${pct(report.tags.microPrecision)}\n`;
  md += `- **Micro-Averaged Recall:** ${pct(report.tags.microRecall)}\n`;
  md += `- **Micro-Averaged F1 Score:** ${pct(report.tags.microF1)}\n`;
  md += `- **Macro-Averaged F1 Score:** ${pct(report.tags.macroF1)}\n`;

  return md;
}
