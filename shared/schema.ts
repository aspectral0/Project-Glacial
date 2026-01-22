import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// === SCHEMAS ===

export const insertGlacierSchema = createInsertSchema(glaciers).omit({ id: true, createdAt: true });
export const insertScoreSchema = createInsertSchema(scores).omit({ id: true, playedAt: true });

// === TYPES ===

export type Glacier = typeof glaciers.$inferSelect;
export type InsertGlacier = z.infer<typeof insertGlacierSchema>;
export type Score = typeof scores.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;

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
