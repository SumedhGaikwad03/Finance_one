import { Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "../../error/AppError";
import { importService } from "../services/import.service";
import { Category, Priority } from "../../generated/prisma/enums";

const ColumnMappingSchema = z.object({
  descriptionColumn: z.string().min(1, "Description column is required"),
  amountMode: z.enum(["single_amount", "debit_credit"]),
  amountColumn: z.string().optional(),
  debitColumn: z.string().optional(),
  creditColumn: z.string().optional(),
  dateColumn: z.string().min(1, "Date column is required"),
  externalIdColumn: z.string().optional(),
  categoryColumn: z.string().optional(),
  priorityColumn: z.string().optional(),
  notesColumn: z.string().optional(),
});

const ImportOptionsSchema = z.object({
  worksheet: z.string().optional(),
  hasHeader: z.boolean().optional(),
  dateFormat: z.string().optional(),
  amountConvention: z
    .enum(["negative_is_expense", "positive_is_expense", "all_positive"])
    .optional(),
  allowPotentialDuplicates: z.boolean().optional(),
});

export const RowCorrectionSchema = z.object({
  category: z.enum(Category, { error: "Invalid category" }).optional(),
  priority: z.enum(Priority, { error: "Invalid spending tier" }).optional(),
  title: z.string().trim().min(1, "Title cannot be empty").max(100, "Title is too long").optional(),
  transactionDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" })
    .optional(),
  notes: z.string().trim().max(200, "Notes cannot exceed 200 characters").nullable().optional(),
});

export const PreviewRequestSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
  mapping: ColumnMappingSchema,
  options: ImportOptionsSchema.optional(),
  rowCorrections: z.record(z.string(), RowCorrectionSchema).optional(),
});

export const ConfirmRequestSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
  mapping: ColumnMappingSchema,
  options: ImportOptionsSchema.optional(),
  importPotentialDuplicates: z.boolean().optional(),
  selectedRowIndices: z.array(z.number().int().positive()).optional(),
  rowCorrections: z.record(z.string(), RowCorrectionSchema).optional(),
});

const SwitchWorksheetSchema = z.object({
  fileId: z.string().min(1, "fileId is required"),
  worksheetName: z.string().min(1, "worksheetName is required"),
});

/**
 * Handles multipart file upload of CSV or XLSX statement.
 */
export async function uploadStatement(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId ? String(req.user.userId) : null;
  if (!userId) {
    throw new ValidationError("Authenticated user context required");
  }

  if (!req.file || !req.file.buffer) {
    throw new ValidationError("No file uploaded. Please upload a .csv or .xlsx file.");
  }

  const metadata = await importService.parseUploadedFile(
    userId,
    req.file.buffer,
    req.file.originalname,
    typeof req.body?.worksheet === "string" ? req.body.worksheet : undefined
  );

  res.status(200).json({
    success: true,
    message: "File uploaded and parsed successfully",
    data: metadata,
  });
}

/**
 * Handles switching the active worksheet for a multi-sheet Excel file.
 */
export async function switchWorksheet(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId ? String(req.user.userId) : null;
  if (!userId) {
    throw new ValidationError("Authenticated user context required");
  }

  const { fileId, worksheetName } = SwitchWorksheetSchema.parse(req.body);

  const metadata = await importService.switchWorksheet(userId, fileId, worksheetName);

  res.status(200).json({
    success: true,
    message: `Switched to worksheet '${worksheetName}'`,
    data: metadata,
  });
}

/**
 * Generates an import preview showing valid expenses, duplicates, and excluded rows.
 */
export async function previewStatement(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId ? String(req.user.userId) : null;
  if (!userId) {
    throw new ValidationError("Authenticated user context required");
  }

  const { fileId, mapping, options, rowCorrections } = PreviewRequestSchema.parse(req.body);

  const preview = await importService.generateImportPreview(
    userId,
    fileId,
    mapping,
    options,
    rowCorrections
  );

  res.status(200).json({
    success: true,
    message: "Preview generated successfully",
    data: preview,
  });
}

/**
 * Commits eligible expenses to the ledger through the Phase 2 canonical pipeline.
 */
export async function confirmImport(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId ? String(req.user.userId) : null;
  if (!userId) {
    throw new ValidationError("Authenticated user context required");
  }

  const payload = ConfirmRequestSchema.parse(req.body);

  const result = await importService.confirmAndCommitImport(userId, payload);

  res.status(201).json({
    success: true,
    message: `Successfully imported ${result.imported} expenses into your ledger`,
    data: result,
  });
}
