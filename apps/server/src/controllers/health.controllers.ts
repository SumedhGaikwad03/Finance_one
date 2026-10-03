import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const getHealth = async (req: Request, res: Response): Promise<void> => {
  let dbStatus = "healthy";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "unreachable";
  }

  const isHealthy = dbStatus === "healthy";
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "OK" : "DEGRADED",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
};