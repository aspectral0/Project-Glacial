import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===

// Initial glacier scenarios available for selection
export const glaciers = pgTable("glaciers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  // Initial Stats
  iceThickness: integer("ice_thickness").notNull(), // meters
  surfaceArea: integer("surface_area").notNull(), // sq km
  stability: integer("stability").notNull(), // 0-100%
  tempSensitivity: integer("temp_sensitivity").notNull(), // 1-10 scale
  // Hidden/Drillable Data
  drillData: jsonb("drill_data").$type<{
    historicalTemp: number[];
    co2Levels: number[];
    layerStrength: number[];
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leaderboard/History
export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  glacierName: text("glacier_name").notNull(),
  yearsSurvived: integer("years_survived").notNull(),
  finalIceVolume: integer("final_ice_volume").notNull(),
  finalStability: integer("final_stability").notNull(),
  finalThickness: integer("final_thickness").notNull(),
  score: integer("score").notNull(),
  playedAt: timestamp("played_at").defaultNow(),
});

// OpenAI Integration Tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === SCHEMAS ===

export const insertGlacierSchema = createInsertSchema(glaciers).omit({ id: true, createdAt: true });
export const insertScoreSchema = createInsertSchema(scores).omit({ id: true, playedAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// === TYPES ===

export type Glacier = typeof glaciers.$inferSelect;
export type InsertGlacier = z.infer<typeof insertGlacierSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Simulation State Types
export interface SimulationState {
  year: number;
  isRunning: boolean;
  isGameOver: boolean;
  health: number;
  glacierStats: {
    thickness: number;
    area: number;
    stability: number;
    volume: number;
  };
  environmentalFactors: {
    globalTemp: number;
    snowfall: number;
    emissions: number;
    oceanTemp: number;
  };
}
