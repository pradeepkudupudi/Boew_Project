import { Router } from "express";
import { db, datasetImagesTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { datasetUpload } from "../lib/upload";
import { DeleteDatasetImageParams, ListDatasetImagesQueryParams } from "@workspace/api-zod";
import path from "path";
import fs from "fs";
import axios from "axios";
import { saveLocalIndexEntry } from "../lib/feature-extractor";

const router = Router();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://localhost:8000";

router.get("/dataset/images", async (req, res): Promise<void> => {
  const parsed = ListDatasetImagesQueryParams.safeParse(req.query);
  const page = parsed.success ? (parsed.data.page ?? 1) : 1;
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  const [images, totalResult] = await Promise.all([
    db.select().from(datasetImagesTable).orderBy(datasetImagesTable.uploadedAt).offset(offset).limit(limit),
    db.select({ count: count() }).from(datasetImagesTable),
  ]);

  res.json({
    images: images || [],
    total: totalResult?.[0]?.count ?? (images?.length || 0),
    page,
    limit,
  });
});

router.post("/dataset/upload", datasetUpload.array("images", 100), async (req, res): Promise<void> => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: "No image files provided" });
    return;
  }

  const category = typeof req.body.category === "string" ? req.body.category : null;
  const inserted: typeof datasetImagesTable.$inferSelect[] = [];
  let indexed = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const [img] = await db
        .insert(datasetImagesTable)
        .values({
          filename: file.filename,
          originalName: file.originalname,
          path: file.filename,
          category,
          fileSize: file.size,
          hasFeatures: false,
        })
        .returning();

      inserted.push(img);

      // Try indexing via ML service first
      let indexedSuccessfully = false;
      try {
        await axios.post(`${ML_SERVICE_URL}/index`, {
          image_path: file.path,
          image_id: img.id,
          category,
        }, { timeout: 3000 });
        indexedSuccessfully = true;
      } catch {
        // Fall back to built-in local vector indexing
        indexedSuccessfully = saveLocalIndexEntry(img.id, file.filename, file.path, category);
      }

      if (indexedSuccessfully) {
        await db.update(datasetImagesTable).set({ hasFeatures: true }).where(eq(datasetImagesTable.id, img.id));
        img.hasFeatures = true;
        indexed++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error("Image upload processing error:", err);
      failed++;
    }
  }

  res.status(201).json({ uploaded: inserted.length, indexed, failed, images: inserted });
});

router.delete("/dataset/images/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDatasetImageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }

  const [img] = await db.select().from(datasetImagesTable).where(eq(datasetImagesTable.id, params.data.id));
  if (!img) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  // Remove file
  const filePath = path.resolve(process.cwd(), "dataset", img.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await db.delete(datasetImagesTable).where(eq(datasetImagesTable.id, params.data.id));

  // Notify ML service / clean local index
  try {
    await axios.delete(`${ML_SERVICE_URL}/index/${params.data.id}`);
  } catch {
    // ML service may be down — continue anyway
  }

  res.sendStatus(204);
});

router.get("/dataset/stats", async (_req, res): Promise<void> => {
  const [totalResult] = await db.select({ count: count() }).from(datasetImagesTable);
  const [indexedResult] = await db
    .select({ count: count() })
    .from(datasetImagesTable)
    .where(eq(datasetImagesTable.hasFeatures, true));

  const categories = await db
    .select({ name: datasetImagesTable.category, count: count() })
    .from(datasetImagesTable)
    .where(sql`${datasetImagesTable.category} IS NOT NULL`)
    .groupBy(datasetImagesTable.category);

  const sizeResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${datasetImagesTable.fileSize}), 0)` })
    .from(datasetImagesTable);

  res.json({
    totalImages: totalResult?.count ?? 0,
    indexedImages: indexedResult?.count ?? 0,
    categories: (categories || []).map((c: any) => ({ name: c.name ?? "Uncategorized", count: c.count })),
    totalSizeMb: Math.round(((sizeResult?.[0]?.total ?? 0) / (1024 * 1024)) * 100) / 100,
  });
});

export default router;
