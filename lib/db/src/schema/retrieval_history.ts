import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const retrievalHistoryTable = pgTable("retrieval_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  queryImagePath: text("query_image_path").notNull(),
  topK: integer("top_k").notNull().default(10),
  metric: text("metric").notNull().default("cosine"),
  retrievalTimeMs: real("retrieval_time_ms").notNull(),
  resultCount: integer("result_count").notNull().default(0),
  precision: real("precision"),
  recall: real("recall"),
  f1Score: real("f1_score"),
  mAP: real("m_ap"),
  results: jsonb("results"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRetrievalHistorySchema = createInsertSchema(retrievalHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertRetrievalHistory = z.infer<typeof insertRetrievalHistorySchema>;
export type RetrievalHistory = typeof retrievalHistoryTable.$inferSelect;
