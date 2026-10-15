import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  Table,
  Check,
  RefreshCw,
  Info,
} from "lucide-react";
import * as importService from "../../services/import.service";
import type {
  ColumnMapping,
  FileMetadata,
  ImportExecutionResult,
  ImportOptions,
  ImportPreviewResult,
  PreviewRowItem,
  RowClassificationStatus,
} from "../../services/import.service";

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "upload" | "mapping" | "preview" | "complete";

const StatementImportModal = ({ isOpen, onClose }: StatementImportModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Workflow step
  const [currentStep, setCurrentStep] = useState<Step>("upload");

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data from server
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    dateFormat: "AUTO",
    amountConvention: "negative_is_expense",
    allowPotentialDuplicates: false,
  });
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);

  // Filter in preview table
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  if (!isOpen) return null;

  const resetState = () => {
    setCurrentStep("upload");
    setMetadata(null);
    setMapping(null);
    setPreviewResult(null);
    setExecutionResult(null);
    setErrorMessage(null);
    setIsUploading(false);
    setIsPreviewing(false);
    setIsCommitting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ============================================================
  // STEP 1: UPLOAD
  // ============================================================
  const handleFileSelect = async (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xlsx") {
      setErrorMessage("Please select a valid CSV (.csv) or Excel (.xlsx) file.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMessage("File exceeds 5MB limit. Please upload a smaller statement.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const meta = await importService.uploadStatement(selectedFile);
      setMetadata(meta);
      setMapping(meta.suggestedMapping);
      setCurrentStep("mapping");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to parse file.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleWorksheetChange = async (worksheetName: string) => {
    if (!metadata) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const updatedMeta = await importService.switchWorksheet(metadata.fileId, worksheetName);
      setMetadata(updatedMeta);
      setMapping(updatedMeta.suggestedMapping);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to switch worksheet.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // ============================================================
  // STEP 2: MAPPING TO PREVIEW
  // ============================================================
  const handleProceedToPreview = async () => {
    if (!metadata || !mapping) return;

    if (!mapping.descriptionColumn) {
      setErrorMessage("Please select a Description column.");
      return;
    }

    if (!mapping.dateColumn) {
      setErrorMessage("Please select a Date column.");
      return;
    }

    if (mapping.amountMode === "single_amount" && !mapping.amountColumn) {
      setErrorMessage("Please select an Amount column.");
      return;
    }

    if (mapping.amountMode === "debit_credit" && !mapping.debitColumn) {
      setErrorMessage("Please select a Debit/Withdrawal column.");
      return;
    }

    setErrorMessage(null);
    setIsPreviewing(true);

    try {
      const preview = await importService.previewStatement(metadata.fileId, mapping, options);
      setPreviewResult(preview);
      setCurrentStep("preview");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to generate preview.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsPreviewing(false);
    }
  };

  // ============================================================
  // STEP 3: COMMIT IMPORT
  // ============================================================
  const handleConfirmImport = async () => {
    if (!metadata || !mapping || !previewResult) return;

    setIsCommitting(true);
    setErrorMessage(null);

    try {
      const result = await importService.confirmImport({
        fileId: metadata.fileId,
        mapping,
        options,
        importPotentialDuplicates: options.allowPotentialDuplicates,
      });

      setExecutionResult(result);
      setCurrentStep("complete");

      // Invalidate relevant queries across the app
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });

      toast.success(`Imported ${result.imported} expenses successfully.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to commit import.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  // Helper for status badge styling
  const getStatusBadge = (status: RowClassificationStatus) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" /> Ready to Import
          </span>
        );
      case "CONFIRMED_DUPLICATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Already in Ledger
          </span>
        );
      case "POTENTIAL_DUPLICATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertTriangle className="w-3 h-3" /> Potential Duplicate
          </span>
        );
      case "DUPLICATE_IN_FILE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <AlertCircle className="w-3 h-3" /> Duplicate in File
          </span>
        );
      case "EXCLUDED_NON_EXPENSE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Excluded (Credit/Deposit)
          </span>
        );
      case "INVALID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3 h-3" /> Invalid
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Import Bank Statement or Spreadsheet
              </h2>
              <p className="text-xs text-slate-500">
                Upload CSV or Excel files directly into your Finance One expense ledger.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === "upload"
                  ? "text-purple-700 font-bold"
                  : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-purple-100 text-purple-700 font-bold">
                1
              </span>
              Upload
            </span>
            <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === "mapping"
                  ? "text-purple-700 font-bold"
                  : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-purple-100 text-purple-700 font-bold">
                2
              </span>
              Map Columns
            </span>
            <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === "preview"
                  ? "text-purple-700 font-bold"
                  : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-purple-100 text-purple-700 font-bold">
                3
              </span>
              Review & Preview
            </span>
            <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === "complete"
                  ? "text-emerald-700 font-bold"
                  : "text-slate-500"
              }`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                4
              </span>
              Done
            </span>
          </div>
          {metadata && (
            <span className="hidden sm:inline-block text-[11px] text-slate-500 truncate max-w-[200px]">
              {metadata.fileName} ({metadata.totalRows} rows)
            </span>
          )}
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Body content based on step */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ======================================================== */}
          {/* STEP 1: UPLOAD */}
          {/* ======================================================== */}
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-purple-400 bg-slate-50/50 hover:bg-purple-50/20 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  {isUploading ? (
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  {isUploading ? "Uploading and inspecting file..." : "Click or drag statement file here"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Supports CSV (.csv) and Microsoft Excel (.xlsx) files up to 5MB.
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-600">
                    .CSV
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-600">
                    .XLSX
                  </span>
                  <span className="text-[11px] text-slate-400">Max 5,000 rows</span>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start gap-3 text-xs text-purple-900 leading-relaxed">
                <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-purple-950">
                    Expense ledger integrity & non-expense exclusions:
                  </p>
                  <p className="text-purple-800/90">
                    Finance One tracks <strong>expenses</strong> against your budgets. Salary credits,
                    incoming transfers, opening balances, and deposit entries will be automatically
                    identified and excluded from your expense ledger.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: COLUMN MAPPING */}
          {/* ======================================================== */}
          {currentStep === "mapping" && metadata && mapping && (
            <div className="space-y-6">
              {/* Multi-worksheet switcher for Excel */}
              {metadata.worksheets.length > 1 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">
                      Select Worksheet:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {metadata.worksheets.map((sheet) => (
                      <button
                        key={sheet}
                        type="button"
                        onClick={() => handleWorksheetChange(sheet)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          metadata.activeWorksheet === sheet
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {sheet}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Column Mapping Selectors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Map Statement Columns to Finance One
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Auto-suggested from detected headers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Description Column */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Description / Merchant *</span>
                      <span className="text-[10px] text-purple-600 font-normal">Required</span>
                    </label>
                    <select
                      value={mapping.descriptionColumn}
                      onChange={(e) =>
                        setMapping({ ...mapping, descriptionColumn: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- Select Column --</option>
                      {metadata.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Column and Format */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Transaction Date *</span>
                      <span className="text-[10px] text-purple-600 font-normal">Required</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        aria-label="Transaction Date Column"
                        value={mapping.dateColumn}
                        onChange={(e) =>
                          setMapping({ ...mapping, dateColumn: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                      >
                        <option value="">-- Select Column --</option>
                        {metadata.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Date Format Convention"
                        value={options.dateFormat || "AUTO"}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            dateFormat: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                        title="Date format convention"
                      >
                        <option value="AUTO">Auto-detect Date Format</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Day first)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (Month first)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                      </select>
                    </div>
                  </div>

                  {/* Amount Mode Selector */}
                  <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Amount Representation:
                      </span>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setMapping({ ...mapping, amountMode: "debit_credit" })}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            mapping.amountMode === "debit_credit"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Separate Debit & Credit Columns
                        </button>
                        <button
                          type="button"
                          onClick={() => setMapping({ ...mapping, amountMode: "single_amount" })}
                          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            mapping.amountMode === "single_amount"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Single Amount Column
                        </button>
                      </div>
                    </div>

                    {mapping.amountMode === "debit_credit" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700">
                            Debit / Withdrawal Column (Expenses) *
                          </label>
                          <select
                            value={mapping.debitColumn || ""}
                            onChange={(e) =>
                              setMapping({ ...mapping, debitColumn: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                          >
                            <option value="">-- Select Debit Column --</option>
                            {metadata.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700">
                            Credit / Deposit Column (To Exclude)
                          </label>
                          <select
                            value={mapping.creditColumn || ""}
                            onChange={(e) =>
                              setMapping({ ...mapping, creditColumn: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                          >
                            <option value="">-- Select Credit Column --</option>
                            {metadata.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700">
                            Amount Column *
                          </label>
                          <select
                            value={mapping.amountColumn || ""}
                            onChange={(e) =>
                              setMapping({ ...mapping, amountColumn: e.target.value })
                            }
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                          >
                            <option value="">-- Select Amount Column --</option>
                            {metadata.headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-700">
                            Expense Sign Convention
                          </label>
                          <select
                            value={options.amountConvention || "negative_is_expense"}
                            onChange={(e) =>
                              setOptions({
                                ...options,
                                amountConvention: e.target.value as any,
                              })
                            }
                            className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                          >
                            <option value="negative_is_expense">
                              Negative amounts are expenses (-50.00)
                            </option>
                            <option value="positive_is_expense">
                              Positive amounts are expenses (+50.00)
                            </option>
                            <option value="all_positive">
                              All amounts are expenses
                            </option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional External Reference ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Transaction / Reference ID</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <select
                      value={mapping.externalIdColumn || ""}
                      onChange={(e) =>
                        setMapping({ ...mapping, externalIdColumn: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- None (Auto-detect duplicates) --</option>
                      {metadata.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Category Column</span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    </label>
                    <select
                      value={mapping.categoryColumn || ""}
                      onChange={(e) =>
                        setMapping({ ...mapping, categoryColumn: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- None (Default: OTHER) --</option>
                      {metadata.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sample Data Preview Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-purple-600" />
                    First 5 Rows from File:
                  </span>
                  <span className="text-[11px] text-slate-400">Read-only preview</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
                        <th className="px-3 py-2">#</th>
                        {metadata.headers.slice(0, 6).map((h) => (
                          <th key={h} className="px-3 py-2 truncate max-w-[150px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 text-slate-700 bg-white">
                      {metadata.previewRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-slate-400 font-mono">{idx + 1}</td>
                          {metadata.headers.slice(0, 6).map((h) => (
                            <td key={h} className="px-3 py-2 truncate max-w-[150px]">
                              {row[h] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: PREVIEW & REVIEW */}
          {/* ======================================================== */}
          {currentStep === "preview" && previewResult && (
            <div className="space-y-6">
              {/* Summary Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                  <span className="text-[11px] font-semibold text-purple-700 block">
                    Total Rows
                  </span>
                  <span className="text-xl font-bold text-purple-900">
                    {previewResult.summary.totalRows}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block">
                    Ready to Import
                  </span>
                  <span className="text-xl font-bold text-emerald-900">
                    {previewResult.summary.validExpenseCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-100/60 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Excluded (Credits)
                  </span>
                  <span className="text-xl font-bold text-slate-800">
                    {previewResult.summary.excludedNonExpenseCount}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] font-semibold text-amber-700 block">
                    Duplicates
                  </span>
                  <span className="text-xl font-bold text-amber-900">
                    {previewResult.summary.confirmedDuplicateCount +
                      previewResult.summary.duplicateInFileCount}
                  </span>
                </div>
              </div>

              {/* Potential Duplicate Banner with Toggle */}
              {previewResult.summary.potentialDuplicateCount > 0 && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {previewResult.summary.potentialDuplicateCount} Potential Duplicates Detected
                      </p>
                      <p className="text-blue-800/80">
                        These transactions have matching amounts and dates with existing ledger entries.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0 font-semibold">
                    <input
                      type="checkbox"
                      checked={options.allowPotentialDuplicates || false}
                      onChange={(e) =>
                        setOptions({ ...options, allowPotentialDuplicates: e.target.checked })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Import Potential Duplicates</span>
                  </label>
                </div>
              )}

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-semibold mr-1">Filter:</span>
                {[
                  { id: "ALL", label: `All (${previewResult.summary.totalRows})` },
                  { id: "READY", label: `Ready (${previewResult.summary.validExpenseCount})` },
                  {
                    id: "DUPLICATES",
                    label: `Duplicates (${
                      previewResult.summary.confirmedDuplicateCount +
                      previewResult.summary.potentialDuplicateCount +
                      previewResult.summary.duplicateInFileCount
                    })`,
                  },
                  {
                    id: "EXCLUDED",
                    label: `Excluded (${previewResult.summary.excludedNonExpenseCount})`,
                  },
                  { id: "INVALID", label: `Invalid (${previewResult.summary.invalidRowCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                      statusFilter === f.id
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Rows List */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">Row</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Description</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                      <th className="px-3 py-2.5">Notes / Reasons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewResult.sampleRows
                      .filter((row: PreviewRowItem) => {
                        if (statusFilter === "ALL") return true;
                        if (statusFilter === "READY") return row.status === "READY";
                        if (statusFilter === "DUPLICATES")
                          return (
                            row.status === "CONFIRMED_DUPLICATE" ||
                            row.status === "POTENTIAL_DUPLICATE" ||
                            row.status === "DUPLICATE_IN_FILE"
                          );
                        if (statusFilter === "EXCLUDED")
                          return row.status === "EXCLUDED_NON_EXPENSE";
                        if (statusFilter === "INVALID") return row.status === "INVALID";
                        return true;
                      })
                      .map((row: PreviewRowItem) => (
                        <tr key={row.rowIndex} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">
                            {row.rowIndex}
                          </td>
                          <td className="px-3 py-2.5">{getStatusBadge(row.status)}</td>
                          <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                            {row.mapped.transactionDate
                              ? row.mapped.transactionDate.slice(0, 10)
                              : "-"}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900 truncate max-w-[200px]">
                            {row.mapped.title || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                            {row.mapped.amount !== null
                              ? `₹${row.mapped.amount.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500 truncate max-w-[200px]">
                            {row.reasons.length > 0 ? row.reasons.join("; ") : "Valid expense candidate"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 4: COMPLETE */}
          {/* ======================================================== */}
          {currentStep === "complete" && executionResult && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Import Completed Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  Your transactions, budgets, and dashboard metrics have been updated.
                </p>
              </div>

              {/* Outcome Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 block">
                    Imported
                  </span>
                  <span className="text-2xl font-bold text-emerald-900">
                    {executionResult.imported}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Already in Ledger
                  </span>
                  <span className="text-2xl font-bold text-slate-800">
                    {executionResult.alreadyExisting}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Non-Expenses Excluded
                  </span>
                  <span className="text-2xl font-bold text-slate-800">
                    {executionResult.excludedNonExpense}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Duplicates Skipped
                  </span>
                  <span className="text-2xl font-bold text-slate-800">
                    {executionResult.potentialDuplicatesSkipped}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          {currentStep === "upload" && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <div />
            </>
          )}

          {currentStep === "mapping" && (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep("upload")}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
              </button>
              <button
                type="button"
                onClick={handleProceedToPreview}
                disabled={isPreviewing}
                className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isPreviewing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Previewing...
                  </>
                ) : (
                  <>
                    Review Statement <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === "preview" && previewResult && (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep("mapping")}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Adjust Mapping
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isCommitting || (previewResult.summary.validExpenseCount === 0 && !options.allowPotentialDuplicates)}
                className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-sm shadow-purple-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Importing Expenses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Import {options.allowPotentialDuplicates ? previewResult.summary.validExpenseCount + previewResult.summary.potentialDuplicateCount : previewResult.summary.validExpenseCount} Expenses
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === "complete" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-sm shadow-purple-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatementImportModal;
