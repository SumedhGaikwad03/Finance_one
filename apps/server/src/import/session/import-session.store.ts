import crypto from "crypto";
import { ForbiddenError, NotFoundError } from "../../error/AppError";
import { ColumnMapping, FileMetadata, RawParsedSheet, RowCorrection, SupportedFileType } from "../types/import.types";

export interface ImportSession {
  fileId: string;
  userId: string;
  fileName: string;
  fileType: SupportedFileType;
  fileSize: number;
  worksheets: string[];
  activeWorksheet: string;
  rawBuffer?: Buffer; // Kept in memory only during session if needed for worksheet re-parsing
  parsedSheet: RawParsedSheet;
  suggestedMapping: ColumnMapping;
  rowCorrections?: Map<number, RowCorrection>;
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutes

class ImportSessionStore {
  private sessions = new Map<string, ImportSession>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public createSession(
    userId: string,
    fileName: string,
    fileType: SupportedFileType,
    fileSize: number,
    worksheets: string[],
    activeWorksheet: string,
    parsedSheet: RawParsedSheet,
    suggestedMapping: ColumnMapping,
    rawBuffer?: Buffer
  ): ImportSession {
    const fileId = `imp_${crypto.randomBytes(16).toString("hex")}`;
    const now = Date.now();

    const session: ImportSession = {
      fileId,
      userId,
      fileName,
      fileType,
      fileSize,
      worksheets,
      activeWorksheet,
      parsedSheet,
      suggestedMapping,
      rawBuffer,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };

    this.sessions.set(fileId, session);
    return session;
  }

  public getSession(fileId: string, userId: string): ImportSession {
    const session = this.sessions.get(fileId);
    if (!session) {
      throw new NotFoundError(
        "Import session not found or has expired. Please re-upload your statement."
      );
    }

    if (session.userId !== userId) {
      throw new ForbiddenError("You do not have access to this import session.");
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(fileId);
      throw new NotFoundError(
        "Import session has expired. Please re-upload your statement."
      );
    }

    // Refresh TTL on active access
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return session;
  }

  public updateSessionSheet(
    fileId: string,
    userId: string,
    activeWorksheet: string,
    parsedSheet: RawParsedSheet,
    suggestedMapping: ColumnMapping
  ): ImportSession {
    const session = this.getSession(fileId, userId);
    session.activeWorksheet = activeWorksheet;
    session.parsedSheet = parsedSheet;
    session.suggestedMapping = suggestedMapping;
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return session;
  }

  public updateRowCorrections(
    fileId: string,
    userId: string,
    corrections: Record<string | number, RowCorrection>
  ): ImportSession {
    const session = this.getSession(fileId, userId);
    if (!session.rowCorrections) {
      session.rowCorrections = new Map<number, RowCorrection>();
    }
    for (const [key, corr] of Object.entries(corrections)) {
      const rowIndex = Number(key);
      if (!isNaN(rowIndex) && rowIndex > 0) {
        const existing = session.rowCorrections.get(rowIndex) || {};
        session.rowCorrections.set(rowIndex, { ...existing, ...corr });
      }
    }
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    return session;
  }

  public deleteSession(fileId: string): void {
    this.sessions.delete(fileId);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(key);
      }
    }
  }

  public clearAllForTesting(): void {
    this.sessions.clear();
  }
}

export const importSessionStore = new ImportSessionStore();
