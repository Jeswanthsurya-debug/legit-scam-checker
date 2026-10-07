import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { LinkFinding, SenderReport, Signal } from "@/lib/types";

export const checks = pgTable("checks", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  messageText: text("message_text").notNull(),
  excerpt: text("excerpt").notNull(),
  verdict: text("verdict").notNull(),
  trustScore: integer("trust_score").notNull(),
  category: text("category").notNull(),
  categorySlug: text("category_slug").notNull(),
  headline: text("headline").notNull(),
  confidence: integer("confidence").notNull(),
  mode: text("mode").notNull(),
  modelName: text("model_name").notNull(),
  latencyMs: integer("latency_ms"),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  reportedByUser: boolean("reported_by_user").default(false).notNull(),
  signals: jsonb("signals").$type<Signal[]>().default([]).notNull(),
  greenFlags: jsonb("green_flags").$type<string[]>().default([]).notNull(),
  nextSteps: jsonb("next_steps").$type<string[]>().default([]).notNull(),
  links: jsonb("links").$type<LinkFinding[]>().default([]).notNull(),
  sender: jsonb("sender").$type<SenderReport | null>(),
});

export type CheckRow = typeof checks.$inferSelect;
export type NewCheck = typeof checks.$inferInsert;
