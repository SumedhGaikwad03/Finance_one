import { DeterministicBaselineAdapter } from "./adapters/deterministic-baseline.adapter";
import { ProductionTaxonomyAdapter } from "./adapters/production-taxonomy.adapter";
import { EVALUATION_DATASET } from "./dataset/evaluation.dataset";
import { generateMarkdownReport } from "./metrics/evaluator";
import { runEvaluation } from "./runner";

async function main() {
  const args = process.argv.slice(2);
  let threshold = 0.65;
  let useProduction = false;
  let asJson = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--threshold" && args[i + 1]) {
      threshold = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === "--production") {
      useProduction = true;
    } else if (args[i] === "--json") {
      asJson = true;
    }
  }

  const prodAdapter = new ProductionTaxonomyAdapter();
  const adapter =
    useProduction && prodAdapter.isProductionAvailable
      ? prodAdapter
      : new DeterministicBaselineAdapter();

  console.log(`[FinOne Evaluation] Running evaluation with ${adapter.name}...`);
  console.log(`[FinOne Evaluation] Dataset: ${EVALUATION_DATASET.length} labelled fixtures.`);
  console.log(`[FinOne Evaluation] Confidence Threshold: ${threshold}\n`);

  const report = await runEvaluation({
    adapter,
    dataset: EVALUATION_DATASET,
    confidenceThreshold: threshold,
  });

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(generateMarkdownReport(report));
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Evaluation failed:", err);
    process.exit(1);
  });
}
