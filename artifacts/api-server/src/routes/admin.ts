import { Router } from "express";
import { db, usersTable, datasetImagesTable, retrievalHistoryTable } from "@workspace/db";
import { count, avg, sql, eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import axios from "axios";
import { logger } from "../lib/logger";

const router = Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

router.get("/admin/stats", requireAuth, async (_req, res): Promise<void> => {
  const [userCount] = await db.select({ count: count() }).from(usersTable);
  const [totalImages] = await db.select({ count: count() }).from(datasetImagesTable);
  const [indexedImages] = await db
    .select({ count: count() })
    .from(datasetImagesTable)
    .where(eq(datasetImagesTable.hasFeatures, true));
  const [totalRetrievals] = await db.select({ count: count() }).from(retrievalHistoryTable);
  const [avgTime] = await db.select({ avg: avg(retrievalHistoryTable.retrievalTimeMs) }).from(retrievalHistoryTable);
  const [avgPrecision] = await db.select({ avg: avg(retrievalHistoryTable.precision) }).from(retrievalHistoryTable);
  const [avgRecall] = await db.select({ avg: avg(retrievalHistoryTable.recall) }).from(retrievalHistoryTable);

  // Recent activity (last 7 days by day)
  const recentActivity = await db
    .select({
      date: sql<string>`DATE(${retrievalHistoryTable.createdAt})::text`,
      retrievals: count(),
    })
    .from(retrievalHistoryTable)
    .where(sql`${retrievalHistoryTable.createdAt} > NOW() - INTERVAL '7 days'`)
    .groupBy(sql`DATE(${retrievalHistoryTable.createdAt})`)
    .orderBy(sql`DATE(${retrievalHistoryTable.createdAt})`);

  res.json({
    totalUsers: userCount?.count ?? 0,
    totalImages: totalImages?.count ?? 0,
    indexedImages: indexedImages?.count ?? 0,
    totalRetrievals: totalRetrievals?.count ?? 0,
    avgRetrievalTimeMs: parseFloat(avgTime?.avg?.toString() ?? "0") || 0,
    avgPrecision: parseFloat(avgPrecision?.avg?.toString() ?? "0") || 0,
    avgRecall: parseFloat(avgRecall?.avg?.toString() ?? "0") || 0,
    recentActivity,
  });
});

router.get("/admin/ml-status", requireAuth, async (_req, res): Promise<void> => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/status`, { timeout: 3000 });
    res.json({
      online: true,
      indexSize: response.data.index_size ?? 0,
      modelLoaded: response.data.model_loaded ?? false,
      encryptionEnabled: response.data.encryption_enabled ?? true,
      lastIndexedAt: response.data.last_indexed_at ?? null,
    });
  } catch {
    res.json({
      online: false,
      indexSize: 0,
      modelLoaded: false,
      encryptionEnabled: false,
      lastIndexedAt: null,
    });
  }
});

router.post("/admin/rebuild-index", requireAuth, async (_req, res): Promise<void> => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/rebuild-index`, {}, { timeout: 30000 });
    res.json({
      message: "Index rebuilt successfully",
      indexedCount: response.data.indexed_count ?? 0,
    });
  } catch (err) {
    logger.error({ err }, "Failed to rebuild index");
    res.status(503).json({ error: "ML service unavailable" });
  }
});

export default router;
