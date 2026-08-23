import { Router } from "express";
import { db, retrievalHistoryTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { GetHistoryItemParams, ListHistoryQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/history", async (req, res): Promise<void> => {
  const parsed = ListHistoryQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;
  const offset = (page - 1) * limit;

  const [history, totalResult] = await Promise.all([
    db
      .select({
        id: retrievalHistoryTable.id,
        queryImagePath: retrievalHistoryTable.queryImagePath,
        topK: retrievalHistoryTable.topK,
        metric: retrievalHistoryTable.metric,
        retrievalTimeMs: retrievalHistoryTable.retrievalTimeMs,
        createdAt: retrievalHistoryTable.createdAt,
        resultCount: retrievalHistoryTable.resultCount,
        precision: retrievalHistoryTable.precision,
        recall: retrievalHistoryTable.recall,
        f1Score: retrievalHistoryTable.f1Score,
        mAP: retrievalHistoryTable.mAP,
      })
      .from(retrievalHistoryTable)
      .orderBy(desc(retrievalHistoryTable.createdAt))
      .offset(offset)
      .limit(limit),
    db
      .select({ count: count() })
      .from(retrievalHistoryTable)
      ,
  ]);

  res.json({
    history,
    total: totalResult[0]?.count ?? 0,
    page,
    limit,
  });
});

router.get("/history/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetHistoryItemParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid history ID" });
    return;
  }

  const [item] = await db
    .select()
    .from(retrievalHistoryTable)
    .where(eq(retrievalHistoryTable.id, params.data.id));

  if (!item) {
    res.status(404).json({ error: "History item not found" });
    return;
  }

  const results = (item.results as object[] | null) ?? [];

  res.json({
    id: item.id,
    queryImagePath: item.queryImagePath,
    topK: item.topK,
    metric: item.metric,
    retrievalTimeMs: item.retrievalTimeMs,
    createdAt: item.createdAt,
    results,
    metrics: {
      precision: item.precision ?? 0,
      recall: item.recall ?? 0,
      f1Score: item.f1Score ?? 0,
      mAP: item.mAP ?? 0,
      retrievalTimeMs: item.retrievalTimeMs,
    },
  });
});

export default router;
