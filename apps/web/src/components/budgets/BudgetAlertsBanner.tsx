import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Calculator,
  Calendar,
} from "lucide-react";

import * as budgetService from "../../services/budget.service";
import type {
  BudgetAlert,
  AlertSeverity,
  BudgetAlertType,
  BudgetAlertsResponse,
} from "../../types/budget.types";
import { formatPercentage } from "../../utils/formatters";

interface BudgetAlertsBannerProps {
  /** Optional custom CSS classes */
  className?: string;
  /** Whether to show the guardrails-active reassuring status when 0 alerts exist */
  showHealthyState?: boolean;
}

const getSeverityStyles = (severity: AlertSeverity) => {
  switch (severity) {
    case "critical":
      return {
        cardBg: "bg-rose-50/90 border-rose-200/90 text-rose-950",
        badgeBg: "bg-rose-100 text-rose-800 border-rose-200",
        iconColor: "text-rose-600",
        buttonHover: "hover:bg-rose-100/80 text-rose-700",
        explainBg: "bg-white/80 border-rose-100",
      };
    case "warning":
      return {
        cardBg: "bg-amber-50/90 border-amber-200/90 text-amber-950",
        badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
        iconColor: "text-amber-600",
        buttonHover: "hover:bg-amber-100/80 text-amber-700",
        explainBg: "bg-white/80 border-amber-100",
      };
    case "info":
    default:
      return {
        cardBg: "bg-sky-50/90 border-sky-200/90 text-sky-950",
        badgeBg: "bg-sky-100 text-sky-800 border-sky-200",
        iconColor: "text-sky-600",
        buttonHover: "hover:bg-sky-100/80 text-sky-700",
        explainBg: "bg-white/80 border-sky-100",
      };
  }
};

const getAlertIcon = (type: BudgetAlertType, severity: AlertSeverity) => {
  if (severity === "critical" || type === "OVER_BUDGET") {
    return <AlertOctagon className="w-5 h-5 shrink-0" />;
  }
  if (type === "CATEGORY_SURGE") {
    return <TrendingUp className="w-5 h-5 shrink-0" />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="w-5 h-5 shrink-0" />;
  }
  return <Info className="w-5 h-5 shrink-0" />;
};

export const BudgetAlertsBanner = ({
  className = "",
  showHealthyState = true,
}: BudgetAlertsBannerProps) => {
  const queryClient = useQueryClient();
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["budget-alerts"],
    queryFn: () => budgetService.getBudgetAlerts(),
    staleTime: 15000,
  });

  const dismissMutation = useMutation({
    mutationFn: (alertId: string) => budgetService.dismissBudgetAlert(alertId),
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: ["budget-alerts"] });
      const previousData = queryClient.getQueryData<BudgetAlertsResponse>(["budget-alerts"]);
      if (previousData) {
        queryClient.setQueryData(["budget-alerts"], {
          ...previousData,
          alerts: previousData.alerts.filter((a) => a.id !== alertId),
        });
      }
      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["budget-alerts"], context.previousData);
      }
      toast.error("Failed to dismiss alert.");
    },
    onSuccess: () => {
      toast.success("Alert dismissed.");
    },
  });

  const toggleExpand = (alertId: string) => {
    setExpandedAlerts((prev) => ({
      ...prev,
      [alertId]: !prev[alertId],
    }));
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`} aria-label="Loading budget guardrails">
        <div className="h-16 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
      </div>
    );
  }

  // 2. Error State with Retry
  if (isError || !data) {
    return (
      <div
        className={`p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between text-xs sm:text-sm ${className}`}
        role="alert"
      >
        <div className="flex items-center gap-2.5">
          <AlertCircleIcon className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Unable to check budget alerts right now.</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium text-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  // 3. No active budget exists
  if (!data.hasActiveBudget) {
    return null;
  }

  const activeAlerts = data.alerts || [];

  // 4. Healthy state (Guardrails active, no alerts)
  if (activeAlerts.length === 0) {
    if (!showHealthyState) return null;

    const remainingVal = data.remainingBudget !== null ? data.remainingBudget : 0;
    const daysLeft = data.period?.daysRemaining ?? 0;

    return (
      <div
        className={`px-4 py-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm ${className}`}
        role="region"
        aria-label="Budget Guardrails Status"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-emerald-950">Spending Guardrails Active</span>
            <span className="text-emerald-700 ml-1.5 hidden sm:inline">
              — All budgets are within safe thresholds.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-emerald-800">
          <span className="font-medium">
            ₹{remainingVal.toLocaleString("en-IN")} remaining
          </span>
          <span className="text-emerald-300">•</span>
          <span>{daysLeft} days left in {data.period?.periodType?.toLowerCase() || "current"} period</span>
        </div>
      </div>
    );
  }

  // 5. Active Alerts List
  return (
    <section
      className={`space-y-3 ${className}`}
      aria-label="Budget Alerts and Spending Guardrails"
      role="region"
    >
      {activeAlerts.map((alert: BudgetAlert) => {
        const styles = getSeverityStyles(alert.severity);
        const isExpanded = Boolean(expandedAlerts[alert.id]);
        const daysLeft = alert.period.daysRemaining;

        return (
          <article
            key={alert.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-xs ${styles.cardBg}`}
          >
            {/* Top row: Badge, Title, Dismiss */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${styles.iconColor}`}>
                  {getAlertIcon(alert.type, alert.severity)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${styles.badgeBg}`}
                    >
                      {alert.severity}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {alert.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => dismissMutation.mutate(alert.id)}
                disabled={dismissMutation.isPending}
                className={`p-1.5 rounded-xl transition-colors shrink-0 cursor-pointer ${styles.buttonHover}`}
                title="Dismiss alert"
                aria-label={`Dismiss ${alert.title}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-700">
              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/50">
                <span className="text-slate-500 font-medium">Spent:</span>
                <span className="font-bold text-slate-900">
                  ₹{alert.metrics.totalSpent.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/50">
                <span className="text-slate-500 font-medium">Budget:</span>
                <span className="font-bold text-slate-900">
                  ₹{alert.metrics.budgetAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/50">
                <span className="text-slate-500 font-medium">Remaining:</span>
                <span
                  className={`font-bold ${
                    alert.metrics.remainingBudget < 0 ? "text-rose-600" : "text-slate-900"
                  }`}
                >
                  {alert.metrics.remainingBudget < 0
                    ? `-₹${Math.abs(alert.metrics.remainingBudget).toLocaleString("en-IN")}`
                    : `₹${alert.metrics.remainingBudget.toLocaleString("en-IN")}`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/50">
                <span className="text-slate-500 font-medium">Usage:</span>
                <span className="font-bold text-slate-900">
                  {formatPercentage(alert.metrics.usagePercentage)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/50">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-700">
                  {daysLeft} days remaining ({alert.period.periodType.toLowerCase()})
                </span>
              </div>

              {/* Explain Toggle */}
              <button
                type="button"
                onClick={() => toggleExpand(alert.id)}
                className={`ml-auto inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer text-xs ${styles.buttonHover} px-2 py-1 rounded-lg`}
                aria-expanded={isExpanded}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{isExpanded ? "Hide breakdown" : "Why am I seeing this?"}</span>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Expandable Explanation Breakdown */}
            {isExpanded && (
              <div
                className={`mt-3 p-3.5 rounded-xl border text-xs text-slate-700 space-y-2.5 animate-in fade-in-50 duration-150 ${styles.explainBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Alert Calculation Breakdown
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {alert.explanation.source}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  {alert.explanation.reason}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                    <span className="text-slate-500 font-medium">Evaluation Window:</span>
                    <p className="font-semibold text-slate-800">
                      {new Date(alert.period.startDate).toLocaleDateString()} to{" "}
                      {new Date(alert.period.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                    <span className="text-slate-500 font-medium">Trigger Rule:</span>
                    <p className="font-mono text-slate-800 break-all">
                      {alert.explanation.rule}
                    </p>
                  </div>

                  {alert.explanation.calculationBreakdown.baselinePeriod && (
                    <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 space-y-1 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Historical Baseline Comparison:</span>
                      <p className="text-slate-800">
                        Prior period spent:{" "}
                        <span className="font-bold">
                          ₹{(alert.explanation.calculationBreakdown.baselineAmount ?? 0).toLocaleString("en-IN")}
                        </span>{" "}
                        vs current period spent:{" "}
                        <span className="font-bold">
                          ₹{(alert.explanation.calculationBreakdown.currentAmount ?? 0).toLocaleString("en-IN")}
                        </span>{" "}
                        ({alert.metrics.surgePercentage}% surge)
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 italic pt-1">
                  Finance One guardrails strictly evaluate canonical database totals without altering transaction ledger states.
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default BudgetAlertsBanner;
