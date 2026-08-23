import { Router } from "express";
import { db, retrievalHistoryTable } from "@workspace/db";
import { queryUpload } from "../lib/upload";
import axios from "axios";
import { logger } from "../lib/logger";

const router = Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

router.post("/retrieve", queryUpload.single("image"), async (req, res): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const topK = parseInt(req.body.topK as string ?? "10", 10);
  const metric = (req.body.metric as string) || "cosine";
  const startTime = Date.now();

  try {
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/retrieve`, {
      image_path: file.path,
      top_k: topK,
      metric,
    });

    const retrievalTimeMs = Date.now() - startTime;
    const mlData = mlResponse.data;

    // Compute simple metrics (precision is ratio of results with score > 0.5)
    const results = mlData.results ?? [];
    const highConfidence = results.filter((r: { similarity_score: number }) => r.similarity_score >= 0.5).length;
    const precision = results.length > 0 ? highConfidence / results.length : 0;
    const recall = results.length > 0 ? results.length / topK : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const mAP = results.reduce((sum: number, r: { similarity_score: number }, i: number) => sum + r.similarity_score / (i + 1), 0) / (results.length || 1);

    const formattedResults = results.map((r: {
      rank: number;
      image_id: number;
      filename: string;
      path: string;
      category: string | null;
      similarity_score: number;
      distance: number;
    }, idx: number) => ({
      rank: r.rank ?? idx + 1,
      imageId: r.image_id,
      filename: r.filename,
      path: r.path,
      category: r.category ?? null,
      similarityScore: r.similarity_score,
      distance: r.distance,
      metric,
    }));

    // Save to history
    const [history] = await db
      .insert(retrievalHistoryTable)
      .values({
        userId: req.user?.userId ?? null,
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

    res.json({
      historyId: history.id,
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
    logger.error({ err }, "ML service retrieval failed");
    res.status(503).json({ error: "ML service unavailable — please ensure the Python service is running" });
  }
});

export default router;
