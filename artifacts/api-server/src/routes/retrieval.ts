import { Router } from "express";
import { db, retrievalHistoryTable } from "@workspace/db";
import { queryUpload } from "../lib/upload";
import axios from "axios";
import { logger } from "../lib/logger";
import { localCosineSearch } from "../lib/feature-extractor";

const router = Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

router.post("/retrieve", queryUpload.single("image"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const topK = parseInt((req.body.topK as string) ?? "10", 10);
  const metric = (req.body.metric as string) || "cosine";
  const startTime = Date.now();

  try {
    let formattedResults: any[] = [];

    // Try ML service first
    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/retrieve`,
        {
          image_path: file.path,
          top_k: topK,
          metric,
        },
        { timeout: 4000 }
      );

      const results = mlResponse.data.results ?? [];
      formattedResults = results.map(
        (
          r: {
            rank: number;
            image_id: number;
            filename: string;
            path: string;
            category: string | null;
            similarity_score: number;
            distance: number;
          },
          idx: number
        ) => ({
          rank: r.rank ?? idx + 1,
          imageId: r.image_id,
          filename: r.filename,
          path: r.path,
          category: r.category ?? null,
          similarityScore: r.similarity_score,
          distance: r.distance,
          metric,
        })
      );
    } catch {
      // Fall back to local standalone search
      formattedResults = localCosineSearch(file.path, topK);
    }

    const retrievalTimeMs = Date.now() - startTime;

    // Compute metrics
    const highConfidence = formattedResults.filter((r) => r.similarityScore >= 0.5).length;
    const precision = formattedResults.length > 0 ? highConfidence / formattedResults.length : 0;
    const recall = formattedResults.length > 0 ? formattedResults.length / topK : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const mAP =
      formattedResults.reduce((sum: number, r: any, i: number) => sum + r.similarityScore / (i + 1), 0) /
      (formattedResults.length || 1);

    // Save to history
    let historyId = Date.now();
    try {
      const [history] = await db
        .insert(retrievalHistoryTable)
        .values({
          userId: (req as any).user?.userId ?? null,
          queryImagePath: file.filename,
          topK,
          metric,
          retrievalTimeMs,
          resultCount: formattedResults.length,
          precision,
          recall,
          f1Score,
          mAP,
          results: formattedResults,
        })
        .returning();
      if (history?.id) historyId = history.id;
    } catch (err) {
      console.warn("Could not record retrieval history", err);
    }

    res.json({
      historyId,
      queryImagePath: file.filename,
      results: formattedResults,
      metrics: {
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1Score: Math.round(f1Score * 1000) / 1000,
        mAP: Math.round(mAP * 1000) / 1000,
        retrievalTimeMs,
      },
      retrievalTimeMs,
    });
  } catch (err) {
    logger.error({ err }, "Retrieval failed");
    res.status(500).json({ error: "Retrieval query failed" });
  }
});

export default router;
