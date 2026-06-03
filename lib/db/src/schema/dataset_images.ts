import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const datasetImagesTable = pgTable("dataset_images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  originalName: text("original_name").notNull(),
  path: text("path").notNull(),
  category: text("category"),
  fileSize: integer("file_size"),
  hasFeatures: boolean("has_features").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDatasetImageSchema = createInsertSchema(datasetImagesTable).omit({
  id: true,
  uploadedAt: true,
});

export type InsertDatasetImage = z.infer<typeof insertDatasetImageSchema>;
export type DatasetImage = typeof datasetImagesTable.$inferSelect;
